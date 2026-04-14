# Repository Guidelines

## Project Structure & Module Organization
This repository is a Thunderbird MailExtension (Manifest V3) with source files at the repo root. Core runtime logic is in `background.js` and shared helpers in `functions.js`. UI entry points are `action.html/js`, `popup.html/js`, `options.html/js`, and `tabAnalyze.html/js`. Styling is in `css/`, static icons/assets are in `images/`, and translations are in `_locales/en` and `_locales/sk`. Build artifacts (`*.xpi`) are stored in `build/thunderbird/`.

`popup.html/js` contains the message popup, including the move-to-folder flow and quick folder choices rendered from `localStorage` (`quick_move_folders`).

Manifests are split by edition:
- `manifest-basic.json` for Antispam
- `manifest-plus.json` for AntispamPlus (includes `experiment.js` + `schema.json`)
- `manifest.json` is the active manifest used during packaging

## Build, Test, and Development Commands
- `.\run.bat build` builds BASIC and PLUS packages and writes `.xpi` files to `build/thunderbird/`.
- `.\run.bat basic` copies `manifest-basic.json` to `manifest.json`.
- `.\run.bat plus` copies `manifest-plus.json` to `manifest.json`.

No npm/make workflow is defined. Validate by loading the extension in Thunderbird and exercising message display action, popup, options, and move-folder flow.

## Coding Style & Naming Conventions
Follow the existing style:
- Use tabs for indentation in JS/JSON/HTML files.
- Keep semicolons and double-quoted strings consistent with current code.
- Prefer `const`/`let`; use `var` only when matching surrounding legacy code.
- Use lowerCamelCase for functions/variables (`webserviceEndpoint`, `isReloadPopupEnabled`).
- Keep file names descriptive and aligned to UI context (`popup.js`, `options.js`).
- For user-facing strings in HTML, use `__MSG_...__`; for runtime strings in JavaScript, use `browser.i18n.getMessage(...)`.
- When adding or renaming UI text, update both `_locales/en/messages.json` and `_locales/sk/messages.json` in the same change.

## Testing Guidelines
Automated tests are not currently present. Use manual regression checks before PR:
1. Load BASIC and PLUS variants.
2. Verify API calls (endpoint/token), sender/recipient extraction, folder move behavior, and quick move choices in the popup.
3. Confirm locale strings render in UI and no console errors appear.

## Commit & Pull Request Guidelines
Recent history uses short, lowercase, action-first subjects (for example: `added ...`, `removed ...`, `release v1.17`). Keep commits focused and scoped to one change.  
PRs should include:
- What changed and why
- Edition impact (BASIC, PLUS, or both)
- Manual test notes (Thunderbird version, scenarios)
- UI screenshots when popup/options/action views changed

## Security & Configuration Tips
Do not commit real API endpoints, tokens, or private debugging data. Treat `optional_host_permissions` changes as sensitive and justify them in the PR.
