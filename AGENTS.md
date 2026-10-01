# AGENTS.md — Codex instructions

This repository is a reusable Windows desktop application template. The product goal is: **keep web-development ergonomics, ship a real desktop app, and require no localhost server in production**.

## Architecture contract

- Tauri 2 is the desktop shell.
- React + TypeScript + Vite is the UI stack.
- shadcn/ui conventions + Tailwind CSS are the default UI approach.
- pnpm is the package manager.
- Rust is for native integration, lifecycle, tray, privileged operations, and logic that should not live in the WebView.
- SQLite is the default structured local database.
- Tauri Store is the default simple settings store.
- Do not introduce Electron, Next.js, an Express/Fastify server, or a production localhost dependency unless the user explicitly asks for it.

## Desktop behavior

- `pnpm desktop` starts development mode.
- `pnpm build` must create Windows installers through Tauri.
- The close button hides the app to the system tray by default. Tray > Quit exits.
- Keep the app useful with keyboard + mouse and at normal Windows DPI scaling.
- Prefer Windows-friendly window sizes and avoid mobile-first layouts unless the task requires them.

## Security contract

- Tauri capabilities are deny-by-default. Add only the specific permissions needed for the requested feature.
- Shell process execution is **not** enabled by default. External URLs use the focused Tauri Opener plugin. If command execution is required, add the Shell plugin deliberately and define a narrow allowlist; never enable arbitrary shell strings.
- Clipboard read access is not enabled by default. Write-text is enabled only for the starter smoke test.
- Do not put secrets in frontend source, Vite environment variables, localStorage, or committed config.
- Validate paths, URLs, command arguments, and data crossing the JS/Rust boundary.

## Data

- Use Tauri Store for preferences and lightweight configuration.
- Use SQLite for entities, history, searchable records, relationships, or data that may grow.
- Put schema initialization/migrations in a dedicated module once the application gains real tables.
- Never silently delete user data during migrations.

## UI rules

- Keep the application visually restrained and desktop-oriented.
- Use shadcn/ui-style components under `src/components/ui`.
- Prefer a small number of clear surfaces over dashboard-card overload.
- Support dark mode via system preference by default.
- Avoid gradients, excessive animation, giant headings, and marketing-site patterns unless requested.
- Keep important actions visible without requiring a browser bookmark or URL navigation.

## Dependency rules

- Prefer official Tauri plugins for desktop capabilities.
- Avoid adding a dependency when the platform/API already provides the feature cleanly.
- Keep React/Rust concerns separated; do not reimplement the same state on both sides without a reason.

## Before finishing a change

1. Run `pnpm typecheck`.
2. Run `pnpm build:web` for UI-only changes.
3. Run `pnpm build` for Tauri/Rust/config/capability changes when the environment supports Rust + Windows packaging.
4. Verify no new production HTTP server was introduced.
5. Review `src-tauri/capabilities/default.json` for unnecessary permissions.
6. Update README when setup, scripts, persistence, packaging, or architecture changed.

## When starting a new app from this template

Run:

```powershell
pnpm rename-app -- --name "My Tool" --identifier "dev.example.mytool"
pnpm install
pnpm desktop
```

Then replace the starter smoke-test UI with the requested product while preserving the architecture/security contract unless the task explicitly requires otherwise.
