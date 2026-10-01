import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import ts from "typescript";

// 実際の関数を読み込み、OSを変更しないプラグイン代替で失敗経路を検証する。
const code = ts.transpileModule(fs.readFileSync(new URL("../src/lib/desktop.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;
function load(overrides = {}, desktop = true) {
  const modules = {
    "@tauri-apps/plugin-autostart": { enable: async () => {}, disable: async () => {}, isEnabled: async () => false },
    "@tauri-apps/plugin-clipboard-manager": { writeText: async () => {} },
    "@tauri-apps/plugin-notification": { isPermissionGranted: async () => false, requestPermission: async () => "denied", sendNotification: () => {} },
    "@tauri-apps/plugin-opener": { openUrl: async () => {} },
    "@tauri-apps/plugin-sql": { load: async () => ({ execute: async () => {}, close: async () => {} }) },
    "@tauri-apps/plugin-store": { LazyStore: class { async set() {} async save() {} } },
    ...overrides,
  };
  const exports = {};
  new Function("require", "exports", "window", code)((id) => modules[id], exports, desktop ? { __TAURI_INTERNALS__: {} } : {});
  return exports;
}
test("通知が拒否された場合に成功扱いにしない", async () => {
  await assert.rejects(load().notify("テスト", "通知"), /通知の許可/);
});
test("設定の書き込み失敗を呼び出し元へ伝える", async () => {
  const api = load({ "@tauri-apps/plugin-store": { LazyStore: class { async set() {} async save() { throw new Error("disk full"); } } } });
  await assert.rejects(api.saveExampleSetting("value"), /disk full/);
});
test("SQLが失敗しても対象DBだけを閉じる", async () => {
  const closed = [];
  const api = load({ "@tauri-apps/plugin-sql": { load: async () => ({ execute: async () => { throw new Error("SQL failed"); }, close: async (db) => closed.push(db) }) } });
  await assert.rejects(api.initDatabase(), /SQL failed/);
  assert.deepEqual(closed, ["sqlite:app.db"]);
});
test("自動起動の変更失敗を呼び出し元へ伝える", async () => {
  const api = load({ "@tauri-apps/plugin-autostart": { enable: async () => { throw new Error("access denied"); } } });
  await assert.rejects(api.setLaunchAtStartup(true), /access denied/);
});
test("危険なURLをプラグインに渡さず拒否する", async () => {
  const opened = [];
  const api = load({ "@tauri-apps/plugin-opener": { openUrl: async (url) => opened.push(url) } });
  for (const url of ["javascript:alert(1)", "file:///C:/Windows", "mailto:user@example.com"]) await assert.rejects(api.openExternal(url), /http/);
  await api.openExternal("https://v2.tauri.app/");
  assert.deepEqual(opened, ["https://v2.tauri.app/"]);
});
test("ブラウザプレビューではネイティブ処理を行わない", async () => {
  const fail = async () => { throw new Error("native called"); };
  const api = load({ "@tauri-apps/plugin-autostart": { enable: fail }, "@tauri-apps/plugin-sql": { load: fail } }, false);
  await api.setLaunchAtStartup(true);
  await api.initDatabase();
  assert.equal(await api.getLaunchAtStartup(), false);
});
