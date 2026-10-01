import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 呼び出し元の作業ディレクトリに依存せず、このリポジトリを更新する。
const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const options = new Map();
for (let i = 0; i < args.length; i += 2) {
  if (!["--name", "--identifier"].includes(args[i]) || !args[i + 1] || options.has(args[i])) {
    console.error('使い方: pnpm rename-app -- --name "マイツール" --identifier "dev.example.mytool"');
    process.exit(1);
  }
  options.set(args[i], args[i + 1]);
}
const name = options.get("--name")?.trim();
const identifier = options.get("--identifier");
if (!name || /[\x00-\x1f\x7f<>:"/\\|?*]/.test(name) || /[. ]$/.test(name)
    || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) {
  console.error("アプリ名にはWindowsのファイル名に使用できる空でない名前を指定してください。");
  process.exit(1);
}
if (!identifier || !/^[A-Za-z][A-Za-z0-9-]*(?:\.[A-Za-z][A-Za-z0-9-]*)+$/.test(identifier)) {
  console.error('識別子は逆DNS形式で指定してください。例: "dev.example.mytool"');
  process.exit(1);
}
const kebab = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "desktop-app";
// 数字で始まる名前やRustの予約語でも有効なクレート識別子にする。
const rustName = `app_${kebab.replace(/-/g, "_")}_lib`;
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const pkg = JSON.parse(read("package.json"));
const conf = JSON.parse(read("src-tauri/tauri.conf.json"));
let cargo = read("src-tauri/Cargo.toml");
const oldLib = cargo.match(/\[lib\]\s*\r?\nname\s*=\s*"([^"]+)"/)?.[1];
if (!oldLib) throw new Error("Cargo.tomlのライブラリ名を取得できません。");
const main = read("src-tauri/src/main.rs");
if (!main.includes(`${oldLib}::run();`)) throw new Error("Rustの起動処理を取得できません。");
pkg.name = kebab;
conf.productName = name;
conf.identifier = identifier;
conf.app.windows[0].title = name;
cargo = cargo.replace(/(\[package\]\s*\r?\nname\s*=\s*)"[^"]+"/, `$1"${kebab}"`)
  .replace(/(\[lib\]\s*\r?\nname\s*=\s*)"[^"]+"/, `$1"${rustName}"`);
const escapedName = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// 読み込みと検証をすべて終えてから書き込む。
const changes = new Map([
  ["package.json", JSON.stringify(pkg, null, 2) + "\n"],
  ["src-tauri/tauri.conf.json", JSON.stringify(conf, null, 2) + "\n"],
  ["src-tauri/Cargo.toml", cargo],
  ["src-tauri/src/main.rs", main.replace(`${oldLib}::run();`, `${rustName}::run();`)],
  ["index.html", read("index.html").replace(/<title>[^<]*<\/title>/, () => `<title>${escapedName}</title>`)],
]);
for (const [file, source] of changes) fs.writeFileSync(path.join(root, file), source);
console.log(`アプリ名を「${name}」、識別子を「${identifier}」に変更しました。`);
console.log("次にスターター画面を置き換え、pnpm desktopを実行してください。");
