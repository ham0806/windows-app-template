import fs from "node:fs";

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

const name = get("--name");
const identifier = get("--identifier");
if (!name || !identifier) {
  console.error('Usage: pnpm rename-app -- --name "My Tool" --identifier "dev.example.mytool"');
  process.exit(1);
}

if (!/^[A-Za-z0-9][A-Za-z0-9.-]+$/.test(identifier) || !identifier.includes(".")) {
  console.error('Identifier must look like a reverse-DNS id, e.g. "dev.example.mytool".');
  process.exit(1);
}

const kebab = name
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "") || "desktop-app";
const rustName = kebab.replace(/-/g, "_");

const pkgPath = "package.json";
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
pkg.name = kebab;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

const confPath = "src-tauri/tauri.conf.json";
const conf = JSON.parse(fs.readFileSync(confPath, "utf8"));
conf.productName = name;
conf.identifier = identifier;
conf.app.windows[0].title = name;
fs.writeFileSync(confPath, JSON.stringify(conf, null, 2) + "\n");

const cargoPath = "src-tauri/Cargo.toml";
let cargo = fs.readFileSync(cargoPath, "utf8")
  .replace('name = "windows-app-template"', `name = "${kebab}"`)
  .replace('name = "windows_app_template_lib"', `name = "${rustName}_lib"`);
fs.writeFileSync(cargoPath, cargo);

const mainPath = "src-tauri/src/main.rs";
let main = fs.readFileSync(mainPath, "utf8")
  .replace("windows_app_template_lib::run();", `${rustName}_lib::run();`);
fs.writeFileSync(mainPath, main);

const htmlPath = "index.html";
let html = fs.readFileSync(htmlPath, "utf8").replace("<title>Windows App Template</title>", `<title>${name}</title>`);
fs.writeFileSync(htmlPath, html);

for (const file of ["src/App.tsx", "src-tauri/src/lib.rs"]) {
  const source = fs.readFileSync(file, "utf8").replaceAll("Windows App Template", name);
  fs.writeFileSync(file, source);
}

console.log(`Renamed template to ${name} (${identifier}).`);
console.log("Next: replace the starter UI, then run pnpm desktop.");
