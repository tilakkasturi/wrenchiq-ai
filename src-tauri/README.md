# WrenchIQ Desktop (Tauri v2 scaffold)

## Status: scaffold only — NOT built, NOT run

This directory was generated **without a local Rust toolchain**. No `cargo build`,
`tauri dev`, or `tauri build` has been attempted or verified. The config files
(`Cargo.toml`, `tauri.conf.json`) have only been checked for syntactic validity
(TOML/JSON parse), not compiled or exercised.

Before this is usable, someone with a Mac + Rust installed needs to:

1. Install Rust via [rustup](https://rustup.rs/): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. From the repo root: `npm install` (pulls in `@tauri-apps/cli`)
3. Build the web bundle once so `../dist` exists: `npm run build`
4. Run the desktop shell in dev mode: `npm run tauri:dev`
5. Produce a signed `.app` / `.dmg`: `npm run tauri:build`

You will also need to generate real app icons before `tauri build` will succeed —
`tauri.conf.json` references `icons/32x32.png`, `icons/128x128.png`,
`icons/128x128@2x.png`, and `icons/icon.icns`, none of which exist yet. Generate
them with `npx tauri icon <path-to-a-1024x1024-png>` once the CLI is installed.

## What this wraps

This scaffold wraps the existing **Surface B** web build — the "main" Vite entry
(`index.html` → `dist/index.html`, i.e. `WrenchIQApp.jsx`) — as a native desktop
window via Tauri's WebView. `tauri.conf.json` points `build.frontendDist` at
`../dist` (the existing `npm run build` output) and `build.devUrl` at the Vite
dev server (`http://localhost:5173`) for `tauri:dev`.

## Platform targets

- **macOS — v1 target.** `bundle.targets` is currently restricted to
  `dmg` and `app`.
- **Windows — confirmed next target.** Not implemented in this scaffold. When
  picked up, expect to: add `msi`/`nsis` to `bundle.targets`, swap any Keychain
  usage for Windows Credential Manager (see sidecar note below), and set up
  Windows code-signing.
- **Linux — not planned.** No Linux bundle targets configured, no plans to add.

## Explicit non-goal (follow-on work)

**The Tauri sidecar is a FOLLOW-ON build and is intentionally NOT implemented
here.** Per the architecture spec, the sidecar is meant to provide:

- A local data-feed cache (so the desktop app can work with cached/synced data
  rather than depending on a full server round-trip for every read)
- An auth relay (handling token storage/refresh locally, e.g. via OS keychain —
  Keychain on macOS, Credential Manager on Windows)

This scaffold does **not** bundle a full Express server, does not implement any
sidecar binary, and does not wire up any Tauri commands/IPC for the above. That
is deliberate scope-cutting for this task — the sidecar design and
implementation should be picked up as a separate follow-on effort.

## Files in this directory

| File | Purpose |
|---|---|
| `Cargo.toml` | Rust package manifest — `tauri` + `tauri-build` deps, `wrenchiq_lib` lib target, `wrenchiq` bin target |
| `build.rs` | Standard Tauri build script (`tauri_build::build()`) |
| `src/lib.rs` | App bootstrap (`tauri::Builder::default().run(...)`) |
| `src/main.rs` | Bin entry point, calls into `wrenchiq_lib::run()` |
| `tauri.conf.json` | Window config, frontend dist path, bundle targets |
| `.gitignore` | Ignores `target/` |
