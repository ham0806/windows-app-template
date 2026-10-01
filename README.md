# Windows App Template

Codexで小さなWindowsツールを量産するための、Tauri 2ベースのスターターです。

**狙い:** ReactでWebアプリ感覚に作り、完成品はブラウザやブックマーク不要のWindowsアプリとして配布する。

## Stack

- Tauri 2
- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui conventions
- Tauri Store for settings
- SQLite for structured local data
- System tray + close-to-tray
- Optional Windows autostart
- Notifications
- Clipboard write
- Safe external URL opening via Tauri Opener
- Windows CI build
- Production CSP enabled (development CSP disabled for Vite HMR)

Production builds load static assets bundled into the app. `localhost:1420` is development-only.

## Requirements on Windows 11

- Node.js 22+
- pnpm 10+
- Rust stable
- Microsoft C++ Build Tools / Visual Studio Build Tools required by Tauri
- WebView2 Runtime (normally already available on Windows 11)

## Start from the template

After creating a repository from this template:

```powershell
pnpm rename-app -- --name "My Tool" --identifier "dev.example.mytool"
pnpm install
pnpm desktop
```

`rename-app` changes the package name, Tauri product/window name, bundle identifier, Rust crate name, entrypoint reference, starter UI branding, and tray tooltip.

## Commands

```powershell
pnpm dev          # Browser-only UI preview; desktop APIs are disabled
pnpm desktop      # Tauri dev window
pnpm typecheck    # TypeScript check
pnpm build:web    # Static frontend build
pnpm build        # Windows MSI + NSIS installer
```

## Built-in desktop capabilities

The starter enables only a small default set in `src-tauri/capabilities/default.json`:

- Tauri core defaults
- settings Store
- SQLite read/write
- safe external URL open via Tauri Opener
- notifications
- clipboard text write
- autostart control

Arbitrary process/shell execution is intentionally disabled. If a generated tool needs to launch `ffmpeg`, Python, a local LLM, ComfyUI, etc., add the Shell plugin with a narrowly scoped command/sidecar allowlist rather than allowing arbitrary commands.

## Project layout

```text
src/
  components/ui/       shadcn-style local UI components
  lib/desktop.ts       frontend wrappers for Tauri plugins
src-tauri/
  capabilities/        desktop security permissions
  src/lib.rs           plugins, tray, lifecycle
  tauri.conf.json      window + packaging configuration
scripts/
  rename-app.mjs       initialize a new app from the template
AGENTS.md               instructions for Codex
```

## Suggested Codex prompt

```text
Read AGENTS.md first.
Build this feature as a Windows desktop application inside the existing Tauri template.
Do not introduce a production localhost server.
Keep Tauri capabilities minimal and explicitly scoped.
Use React/shadcn for UI and Rust/Tauri only for native or privileged operations.
Before finishing, run the checks described in AGENTS.md.
```

## GitHub template repository

After the first push, open repository **Settings → General** and enable **Template repository**. New tools can then be created with **Use this template** without carrying over commit history.
