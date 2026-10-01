import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const source = fileURLToPath(new URL("../", import.meta.url));
const files = ["package.json", "src-tauri/tauri.conf.json", "src-tauri/Cargo.toml", "src-tauri/src/main.rs", "index.html", "scripts/rename-app.mjs"];
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rename-app-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const file of files) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.copyFileSync(path.join(source, file), path.join(root, file));
  }
  return { root, read: (file) => fs.readFileSync(path.join(root, file), "utf8"),
    run: (name, id = "dev.example.tool") => spawnSync(process.execPath, [path.join(root, "scripts/rename-app.mjs"), "--", "--name", name, "--identifier", id], { cwd: os.tmpdir(), encoding: "utf8" }) };
}
test("別ディレクトリから再実行しても全ての名称が一致する", (t) => {
  const f = fixture(t);
  assert.equal(f.run("First Tool").status, 0);
  assert.equal(f.run("123 Tool").status, 0);
  assert.equal(JSON.parse(f.read("package.json")).name, "123-tool");
  assert.equal(JSON.parse(f.read("src-tauri/tauri.conf.json")).productName, "123 Tool");
  assert.match(f.read("src-tauri/Cargo.toml"), /name = "app_123_tool_lib"/);
  assert.match(f.read("src-tauri/src/main.rs"), /app_123_tool_lib::run\(\);/);
  assert.match(f.read("index.html"), /<title>123 Tool<\/title>/);
});
test("日本語と置換用の特殊文字を安全に扱う", (t) => {
  const f = fixture(t);
  assert.equal(f.run("家計簿 & $&").status, 0);
  assert.equal(JSON.parse(f.read("src-tauri/tauri.conf.json")).productName, "家計簿 & $&");
  assert.match(f.read("index.html"), /<title>家計簿 &amp; \$&amp;<\/title>/);
  assert.match(f.read("src-tauri/src/main.rs"), /app_desktop_app_lib::run\(\);/);
});
test("不正な名前と識別子はファイルを変更せず拒否する", (t) => {
  const f = fixture(t);
  const before = files.map(f.read);
  for (const name of [" ", 'Bad"Name', "CON", "nul.txt", "name.", "Bad\\Path"]) {
    assert.notEqual(f.run(name).status, 0);
  }
  for (const id of ["dev..tool", ".dev.tool", "dev.tool.", "dev.123tool"]) {
    assert.notEqual(f.run("Good Tool", id).status, 0);
  }
  assert.deepEqual(files.map(f.read), before);
});
