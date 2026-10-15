# Review Report: Minimal Persistent Todo App

- **Run ID:** `2026-10-15-todo-demo`
- **Reviewer:** actual Codex subagent `/root/reviewer`
- **Inspected commit/diff:** `a42dbd2ecd8602eba021146cfd48542dd7551ce2..36b3ee0f411f5c1936c6c06e9670dba551bf4c11`
- **Verdict:** pass after repair re-review at `6f72c799a750ddb6ae1b59139a58bfdace4658ab` (original findings retained below for history)

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

## Re-review — Repair iteration 1 — 2026-10-15

- **Reviewer:** actual Codex subagent `/root/reviewer`
- **Repair diff inspected:** `8405636866913a2f7eb1a65a1df0eec9cd072686..6f72c799a750ddb6ae1b59139a58bfdace4658ab`
- **Tested commit:** `6f72c799a750ddb6ae1b59139a58bfdace4658ab`
- **Re-review verdict:** pass

### Finding dispositions

#### R-01 — RESOLVED

- `app/app.js:41-53` now passes an explicit focus target through a successful commit and restores it after the replacement controls are in the document.
- `app/app.js:70-75` targets the replacement checkbox after a toggle, including rerendering and refocusing the authoritative prior state when persistence fails.
- `app/app.js:92-95` and `app/focus-policy.js:5-15` move focus after deletion to the next Todo's Delete button, then the previous Todo's Delete button, and finally the title input when no Todo remains. A failed delete write performs no render, so the existing focused button remains in place.
- `app/app.js:97-115` records newly created controls by Todo ID and restores focus only after `replaceChildren()` completes. Stored IDs remain data keys in a `Map`; they are not interpreted as selectors or markup.
- The new policy tests cover the focus target choices and direct focus calls. An independent in-memory DOM wiring check also exercised the actual `app.js` handlers for successful toggle, middle/final deletion, failed toggle persistence, and failed delete persistence; all focus assertions passed.

R-01's keyboard-focus defect is no longer present in the reviewed code.

#### R-02 — RESOLVED

- `app/styles.css:6-7` and `app/styles.css:39-44` replace the low-contrast orange outline with a three-pixel `#111827` ring and a two-pixel white halo.
- The outer ring measures approximately `17.74:1` against white and `15.78:1` against the `#eef2f7` page background. The halo measures approximately `6.47:1` against the Add button and `7.52:1` against the Delete button.
- The checked-in accessibility tests calculate these ratios from the CSS custom properties and require at least `3:1` against the relevant adjacent surfaces.

R-02's focus-indicator contrast defect is no longer present in the reviewed code.

### Regression, maintainability, and security review

- No new `BLOCKER`, `HIGH`, `MEDIUM`, or `LOW` finding was identified in the repair diff.
- The extracted `focus-policy.js` is small, deterministic, independently testable, and keeps focus destination rules out of DOM construction. Its fallback to the title input is safe if a requested replacement control is unexpectedly absent.
- The server adds only the exact `/focus-policy.js` pathname to its existing static allowlist. Request data still cannot select a filesystem path, and traversal protection and response security headers are unchanged.
- The repair introduces no new user-data sink. Todo titles continue to reach `textContent` and DOM `setAttribute` only; IDs are used solely as `Map` keys in the new path.
- Storage authority remains unchanged: in-memory state advances only after serialization and `localStorage.setItem()` succeed. The new failed-toggle rerender restores both persisted visual state and keyboard focus.
- The added tests materially improve coverage of the original findings. They do not instantiate a real browser rendering or accessibility tree, so final visual and assistive-technology behavior remains within the independent Tester's verification boundary rather than an unresolved review finding.

### Re-review evidence

| Check | Result |
| --- | --- |
| Inspected exact repair diff and surrounding application/server code | Completed |
| `npm test` | Exit `0`; 21 passed, 0 failed |
| `node --check app/app.js`, `node --check app/focus-policy.js`, and `node --check scripts/server.mjs` | Exit `0` |
| `git diff --check 8405636866913a2f7eb1a65a1df0eec9cd072686..6f72c799a750ddb6ae1b59139a58bfdace4658ab` | Exit `0` |
| Independent in-memory DOM exercise of actual `app.js` success and failed-storage focus paths | Exit `0`; all assertions passed |
| Static security regression trace of DOM sinks, storage authority, `Map` key use, and the server allowlist | No regression found |

The re-review changed only this report. It did not modify product code, coordinate conclusions with the Tester, stage or commit files, merge, deploy, or run destructive commands.
