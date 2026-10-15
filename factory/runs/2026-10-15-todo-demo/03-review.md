# Review Report: Minimal Persistent Todo App

- **Run ID:** `2026-10-15-todo-demo`
- **Reviewer:** actual Codex subagent `/root/reviewer`
- **Inspected commit/diff:** `a42dbd2ecd8602eba021146cfd48542dd7551ce2..36b3ee0f411f5c1936c6c06e9670dba551bf4c11`
- **Verdict:** changes requested

## Findings

### R-01 — MEDIUM — Keyboard focus is discarded after list actions

- **Location:** `app/app.js:47`, `app/app.js:65-69`, `app/app.js:86-88`, and `app/app.js:94-95`
- **Impact:** Every successful toggle and delete calls `render()`, which uses `replaceChildren()` to remove all current list controls. The focused checkbox is therefore removed after a keyboard toggle; a focused Delete button is likewise removed after deletion. Unlike the add path, neither handler restores focus. A keyboard user is dropped out of the Todo list and must re-enter its tab sequence after each action. This is a material accessibility defect in the specified keyboard workflow, even though the replacement controls have accessible names.
- **Recommendation:** Preserve focus across rendering. At minimum, record the action and Todo ID before committing, then focus the replacement checkbox after a toggle and a predictable next target (next item, previous item, or the title input) after deletion. Alternatively, update the affected DOM node without replacing unrelated controls. Add a focused browser regression check for both actions.

### R-02 — LOW — The custom focus indicator has insufficient contrast on light surfaces

- **Location:** `app/styles.css:37-41`
- **Impact:** The `#f0a202` outline has approximately `2.13:1` contrast against white and `1.89:1` against the page background. Because the outline is offset onto those light surfaces, it can be difficult to identify for low-vision keyboard users and does not reach the commonly used `3:1` focus-indicator contrast threshold.
- **Recommendation:** Use a darker focus-ring color that reaches at least `3:1` against both adjacent light backgrounds (and remains distinct around the buttons), then verify the input, checkbox, Add button, and Delete button in keyboard navigation.

No `BLOCKER` or `HIGH` findings were identified.

## Acceptance and maintainability notes

- The review run of `npm test` exited `0`: all 14 model and server tests passed.
- The model implementation supports the required trimmed add, targeted toggle/delete, unique IDs, canonical timestamps, defensive parsing, and dependency-free serialization behavior.
- The form and native controls support Enter submission and accessible naming at code level. The add path explicitly resets and refocuses the title input. R-01 remains the keyboard-focus gap for toggle and delete actions.
- The responsive rules switch both the add row and Todo item to one column below `24rem`; long titles use `overflow-wrap: anywhere`. No code-level blocker to the 320-pixel layout was found, but this review does not claim a rendered browser measurement.
- The automated suite does not load `app/app.js` in a DOM or exercise `localStorage`. It therefore does not directly detect regressions in focus handling, literal title rendering, storage-write rollback, form reset/focus, or live validation. Those acceptance criteria still need independent browser evidence; this is a coverage limitation, not an additional finding because the approved plan explicitly assigns them to manual verification.
- The implementation is small and separated cleanly into model, browser controller, styles, and an allowlisted server. The full-list render is easy to understand but should carry explicit focus management as described in R-01.

## Security notes

- **DOM injection:** User titles are assigned through `textContent`; derived accessible labels use `setAttribute`. No `innerHTML`, HTML parsing, selector construction, or script evaluation receives stored title data. The markup-like AC-09 payload remains text by construction.
- **Storage validation and failures:** `parseTodos()` catches malformed JSON and accepts only an array whose entries have non-empty unique string IDs, non-empty trimmed string titles, boolean completion state, and canonical ISO timestamps. `localStorage.getItem()` and serialization/write failures are caught. Failed writes do not replace authoritative in-memory state; checkbox changes are rerendered from the prior state.
- **Server paths:** The server selects from a fixed pathname-to-file map. It never decodes, joins, or resolves a requester-controlled path into the filesystem, so traversal variants can only miss the allowlist; they cannot select repository or machine files.
- **Server exposure and headers:** The default bind address is `127.0.0.1`. Responses include a restrictive Content Security Policy, `nosniff`, frame denial, and a no-referrer policy. Only `GET` and `HEAD` are accepted. No server-side security defect was found in the reviewed scope.
- `package.json` declares no dependencies or development dependencies, and the application makes no remote requests.

## Review evidence

| Check | Result |
| --- | --- |
| Read approved `01-spec.md` and Builder `02-build.md` | Completed |
| Inspected exact diff `a42dbd2..36b3ee0` and surrounding implementation | Completed |
| `npm test` | Exit `0`; 14 passed, 0 failed |
| Static trace of DOM title sinks, storage read/write paths, URL allowlist, and response headers | Completed |
| Focus-ring contrast calculation against `#ffffff`, `#eef2f7`, and `#2457c5` | `2.13:1`, `1.89:1`, and `3.04:1`, respectively |

This review did not modify product code, stage or commit changes, merge, deploy, or run destructive commands.
