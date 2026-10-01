import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { openUrl } from "@tauri-apps/plugin-opener";
import Database from "@tauri-apps/plugin-sql";
import { LazyStore } from "@tauri-apps/plugin-store";

export const isTauri = () => "__TAURI_INTERNALS__" in window;

const settings = new LazyStore("settings.json", {
  defaults: { launchAtStartup: false },
  autoSave: 100,
});

export async function getLaunchAtStartup() {
  if (!isTauri()) return false;
  return isEnabled();
}

export async function setLaunchAtStartup(value: boolean) {
  if (!isTauri()) return;
  if (value) await enable();
  else await disable();
  await settings.set("launchAtStartup", value);
}

export async function saveExampleSetting(value: string) {
  if (!isTauri()) return;
  await settings.set("example", value);
}

export async function initDatabase() {
  if (!isTauri()) return;
  const db = await Database.load("sqlite:app.db");
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
}

export async function copyText(value: string) {
  if (!isTauri()) return;
  await writeText(value);
}

export async function notify(title: string, body: string) {
  if (!isTauri()) return;
  let granted = await isPermissionGranted();
  if (!granted) granted = (await requestPermission()) === "granted";
  if (granted) sendNotification({ title, body });
}

export async function openExternal(url: string) {
  if (isTauri()) await openUrl(url);
  else window.open(url, "_blank", "noopener,noreferrer");
}
