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
