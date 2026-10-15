# Build Report: Minimal Persistent Todo App

- **Run ID:** `2026-10-15-todo-demo`
- **Builder:** actual Codex subagent `/root/builder`
- **Branch/worktree:** `factory/todo-demo` in the repository working tree
- **Base commit:** `a42dbd2ecd8602eba021146cfd48542dd7551ce2`
- **Implemented commit:** `factory/todo-demo` `HEAD` at Builder handoff; the exact hash is recorded in the Builder-to-Orchestrator handoff because this report is part of that commit
- **Specification revision:** `a42dbd2ecd8602eba021146cfd48542dd7551ce2:factory/runs/2026-10-15-todo-demo/01-spec.md`
- **Approval evidence:** the user's 2026-10-15 request explicitly authorized creating the repository files, running a small test, and demonstrating a small Todo application; the implementation does not expand the approved specification

## Changes

- `package.json` defines dependency-free `npm start` and `npm test` scripts and requires Node.js 20 or newer.
- `app/todo-model.js` provides immutable add, toggle, delete, validation, serialization, and defensive parsing functions, with injectable ID and clock providers.
- `app/app.js` renders state with DOM APIs, validates blank input, persists successful changes to `localStorage`, restores UI state after a failed write, and exposes keyboard-native form behavior.
- `app/index.html` supplies the labeled form, validation/status regions, empty state, count, and Todo list.
- `app/styles.css` supplies visible focus, non-color completed state, touch-sized controls, and a single-column layout below 384 pixels.
- `scripts/server.mjs` serves only five explicitly allowed app URLs over loopback by default and applies restrictive response headers.
- `test/todo-model.test.js` covers add validation, title trimming, unique IDs, targeted toggle/delete behavior, round trips, malformed JSON, and invalid structures.
- `test/server.test.js` covers the root response, security header, unknown route, encoded traversal attempts, and network-path request rejection.

## Decisions and security notes

- User titles are assigned with `textContent`; no user-derived HTML is parsed or assigned to `innerHTML`.
- State changes are written to `localStorage` before becoming authoritative UI state. A write failure is reported and does not leave a checkbox showing unpersisted state.
- Parsed storage must be an array of fully valid Todos with unique, non-empty IDs and canonical ISO timestamps; malformed or invalid data becomes an empty collection.
- The server maps known URL paths directly to known app files. It does not join request paths to filesystem paths, so encoded traversal cannot select repository or machine files.
- The default listener is `127.0.0.1:4173`. The application makes no remote requests and includes no telemetry or third-party code.
- Content Security Policy, MIME sniffing protection, frame denial, and a no-referrer policy are sent with responses.
- No dependencies were added. No merge, rebase, push, deployment, branch deletion, cleanup, or history rewrite was performed.

## Checks run

| Command | Exit code | Result |
| --- | ---: | --- |
| `git rev-parse --show-toplevel; git branch --show-current; git rev-parse HEAD; git status --short` | 0 | Root was this repository, branch was `factory/todo-demo`, `HEAD` was the approved baseline, and status was clean before implementation. |
| `node --version` | 0 | `v22.19.0`. |
| `npm test` (initial implementation) | 0 | 13 tests passed; 0 failed. |
| `npm test` (final implementation) | 0 | 14 tests passed; 0 failed. |
| `npm start` | interrupted after smoke check | Server reported `Todo app available at http://127.0.0.1:4173`; it was intentionally stopped with Ctrl+C after the request below, so the long-running process returned exit code 1. |
| `Invoke-WebRequest -Uri 'http://127.0.0.1:4173/' -UseBasicParsing` with status/content assertions | 0 | Returned `200`, `text/html; charset=utf-8`, and contained `<h1>Todo</h1>`. |
| `node --check app/app.js` | 0 | Syntax check passed. |
| `node --check app/todo-model.js` | 0 | Syntax check passed. |
| `node --check scripts/server.mjs` | 0 | Syntax check passed. |
| `node -e "const p=require('./package.json'); if (p.dependencies || p.devDependencies) process.exit(1); console.log('No dependencies or devDependencies declared.');"` | 0 | Confirmed neither dependency field is declared. |
| `git diff --cached --check` | 0 | No whitespace errors in the staged product changes. |

The PowerShell profile emitted a non-fatal `Set-PSReadLineOption` warning before shell commands because the captured terminal does not support predictive suggestions. It did not change any command exit code or result.

## Open items

- Interactive browser checks (button and Enter submission, focus return, reload persistence, literal rendering of the markup-like title, keyboard labels, and 320-pixel layout) remain for the independent Tester. The implementation and automated checks provide code-level evidence but this Builder did not claim a visual browser result.
- Independent Reviewer and Tester results are not yet available. Any accepted findings must return to this Builder on the same branch.

## Repair iteration 1 — 2026-10-15

- **Trigger:** independent review findings R-01 (`MEDIUM`) and R-02 (`LOW`) recorded in `03-review.md` at report-only commit `8405636866913a2f7eb1a65a1df0eec9cd072686`
- **Repair Builder:** actual Codex subagent `/root/builder`
- **Repair branch:** `factory/todo-demo`
- **Repair commit:** `factory/todo-demo` `HEAD` at repair handoff; the exact hash is recorded in the Builder-to-Orchestrator handoff because this report is part of that commit

### Finding dispositions

- **R-01 — resolved in code, with Node-level regression coverage:** `app/focus-policy.js` now defines the focus destination separately from rendering. A successful toggle refocuses that Todo's replacement checkbox. A successful deletion focuses the next Todo's Delete button, falls back to the previous Todo's Delete button when the last item was removed, and focuses the title input when the list becomes empty. `render()` builds a map of the newly inserted controls and calls the tested `restoreFocus()` helper after `replaceChildren()`. A failed toggle persistence attempt rerenders the authoritative state and restores checkbox focus; a failed delete persistence attempt does not rerender, so its existing Delete button retains focus.
- **R-02 — resolved:** the former `#f0a202` outline was replaced by a three-pixel `#111827` outer ring and a two-pixel white halo. The ring has `17.74:1` contrast against white and `15.78:1` against the `#eef2f7` page background. The white halo has `6.47:1` contrast against the primary button and `7.52:1` against the Delete button, keeping the outer ring visually separated from both colored controls.

### Repair changes

- Added `app/focus-policy.js` and allowlisted `/focus-policy.js` in the local server because it is imported by the browser controller.
- Updated `app/app.js` to preserve or relocate focus after toggle/delete rendering.
- Updated `app/styles.css` with the two-color focus indicator.
- Added `test/focus-policy.test.js` for toggle, next/previous/empty-list delete targets, direct focus calls, and fallback behavior.
- Added `test/accessibility.test.js` to calculate WCAG contrast ratios from the checked-in CSS colors and require at least `3:1` against the relevant adjacent surfaces.
- Extended `test/server.test.js` to prove the newly imported focus-policy module is served successfully.
- Did not modify the independent `03-review.md` or `04-test.md` reports.

### Repair checks

| Command | Exit code | Result |
| --- | ---: | --- |
| `git rev-parse --show-toplevel; git branch --show-current; git rev-parse HEAD; git status --short` | 0 | Confirmed this repository, `factory/todo-demo`, report-only commit `8405636866913a2f7eb1a65a1df0eec9cd072686`, and a clean pre-repair tree. |
| `npm test` (first repair run) | 0 | 20 tests passed; 0 failed. |
| `npm test` (final repair run before staging) | 0 | 21 tests passed; 0 failed. |
| `npm test` (staged repair) | 0 | 21 tests passed; 0 failed. |
| `node --check app/app.js; node --check app/focus-policy.js; node --check scripts/server.mjs; git diff --check` | 0 | All syntax checks and the unstaged whitespace check passed. |
| `$env:PORT='4173'; npm start` | interrupted after smoke check | The server started on `127.0.0.1:4173`; it was intentionally stopped with Ctrl+C after the checks below, so the long-running npm process returned exit code 1. |
| Loopback `Invoke-WebRequest` assertions for `/`, `/app.js`, `/focus-policy.js`, and `/styles.css` | 0 | All four returned HTTP 200 and contained the expected Todo heading, focus helper import/export, and focus-ring CSS. |
| First contrast-report `node -e` one-liner | 1 | PowerShell removed JavaScript string quotes, producing a JavaScript syntax error before calculations ran. This was a command-quoting failure, not a product or test failure. |
| Literal here-string contrast calculation piped to `node --input-type=module -` | 0 | Reported `17.74:1`, `15.78:1`, `6.47:1`, and `7.52:1` for the four ring/halo surface pairs above. |

### Remaining verification boundary

Node.js has no built-in browser DOM, rendering engine, or accessibility tree. The regression tests execute the exact focus-target and focus-call helpers used by `app/app.js`, and static wiring plus live module delivery are verified, but this Builder does not claim a real-browser Tab/Space/Delete traversal or visual focus-ring observation. Independent Reviewer and Tester re-checks should inspect that browser-facing boundary. No dependency was added merely to remove this limitation.

No merge, rebase, push, deployment, network access outside loopback, destructive command, or history rewrite occurred during this repair.
