import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { openUrl } from "@tauri-apps/plugin-opener";
import Database from "@tauri-apps/plugin-sql";
import { LazyStore } from "@tauri-apps/plugin-store";

export const isTauri = () => "__TAURI_INTERNALS__" in window;

const settings = new LazyStore("settings.json", {
  defaults: {},
  autoSave: false,
});

export async function getLaunchAtStartup() {
  if (!isTauri()) return false;
  return isEnabled();
}

export async function setLaunchAtStartup(value: boolean) {
  if (!isTauri()) return;
  if (value) await enable();
  else await disable();
}

export async function saveExampleSetting(value: string) {
  if (!isTauri()) return;
  await settings.set("example", value);
  await settings.save();
}

export async function initDatabase() {
  if (!isTauri()) return;
  const db = await Database.load("sqlite:app.db");
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS app_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.execute(
      "INSERT OR REPLACE INTO app_meta (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)",
      ["last_initialized", new Date().toISOString()],
    );
  } finally {
    await db.close("sqlite:app.db");
  }
}

export async function copyText(value: string) {
  if (!isTauri()) return;
  await writeText(value);
}

export async function notify(title: string, body: string) {
  if (!isTauri()) return;
  let granted = await isPermissionGranted();
  if (!granted) granted = (await requestPermission()) === "granted";
  if (!granted) throw new Error("通知の許可がありません。Windowsの通知設定を確認してください。");
  sendNotification({ title, body });
}

export async function openExternal(url: string) {
  const parsed = new URL(url);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("外部リンクにはhttpまたはhttpsのURLを指定してください。");
  }
  if (isTauri()) await openUrl(parsed.href);
  else window.open(parsed.href, "_blank", "noopener,noreferrer");
}
