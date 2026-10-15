# Test Report: Minimal Persistent Todo App

- **Run ID:** `2026-10-15-todo-demo`
- **Tester:** actual independent Codex subagents `/root/tester` (initial) and `/root/tester_recheck` (repair re-test)
- **Tested branch:** `factory/todo-demo`
- **Tested commit:** `6f72c799a750ddb6ae1b59139a58bfdace4658ab` (latest re-test; initial-commit evidence is retained below)
- **Environment:** Windows PowerShell, Node.js `v22.19.0`, npm `10.9.3`
- **Verdict:** **partial** — all automated, live-loopback, syntax, dependency, and static inspections passed; real-browser interaction, assistive-technology behavior, and the 320-pixel visual layout were not exercised

## Independence and scope

The Tester read the approved `01-spec.md` and Builder's `02-build.md`, then tested the exact commit above without consulting the Reviewer's conclusions. No product code, dependencies, Git history, branches, external networks, merge state, or deployment state were changed. The only repository file written by the Tester is this report.

The checkout was at the requested commit before testing. A concurrent untracked `03-review.md` appeared near the end of the test run; it belongs to the independent Reviewer and was not read or used for this verdict.

## Commands and results

| Command | Exit code | Result |
| --- | ---: | --- |
| `git rev-parse --show-toplevel; git status --short --branch; git rev-parse HEAD; git diff --exit-code 36b3ee0f411f5c1936c6c06e9670dba551bf4c11 -- .` | 0 | Repository root was the requested repository, branch was `factory/todo-demo`, `HEAD` matched the tested commit, and tracked content matched that commit before testing. |
| `npm test` | 0 | TAP reported 14 tests, 14 passed, 0 failed, 0 skipped, and 0 cancelled. This covered model add/blank/toggle/delete/serialization validation and server root/404/traversal/network-path behavior. |
| `$env:PORT='0'; npm start` | 1 after intentional teardown | The actual npm start entry point launched successfully and printed `Todo app available at http://127.0.0.1:57315`. It remained live for the loopback checks below. After those passed, the verified `node scripts/server.mjs` test process was intentionally stopped; the long-running npm command therefore ended with status 1 rather than exiting naturally. This is not a startup or application failure. |
| Live loopback smoke script in the first command block below | 0 | Against the running `npm start` process, `/`, `/index.html`, `/styles.css`, `/app.js`, and `/todo-model.js` returned expected content; `/unknown`, `/%2e%2e/package.json`, and `/..%2Fpackage.json` returned 404. HTML content type and Content Security Policy were present. |
| Static UI/accessibility/security audit in the second command block below | 0 | Verified the heading, labeled input, submit button, alert region, named list, module script, `textContent` rendering, lack of `innerHTML`, form-submit/reset/focus wiring, local-storage wiring, item control labels, textual completion state, focus style, narrow-screen rule, long-title wrapping, and line-through completed style. |
| `node --check app/app.js` | 0 | Browser controller syntax passed. |
| `node --check app/todo-model.js` | 0 | Todo model syntax passed. |
| `node --check scripts/server.mjs` | 0 | Server syntax passed. |
| `node --input-type=module -e "import p from './package.json' with { type: 'json' }; if ('dependencies' in p \|\| 'devDependencies' in p) process.exit(1); console.log('No dependencies or devDependencies declared.');"` | 0 | Neither dependency field is declared. |
| `Get-NetTCPConnection -State Listen -LocalAddress 127.0.0.1 -LocalPort 57315 \| Select-Object LocalAddress, LocalPort, OwningProcess` | 0 | Identified the temporary loopback listener as PID `31448`. |
| `$serverProcess = Get-CimInstance Win32_Process -Filter "ProcessId = 31448"; $serverProcess \| Select-Object ProcessId, ParentProcessId, Name, CommandLine; if ($serverProcess.Name -eq 'node.exe' -and $serverProcess.CommandLine -like '*scripts/server.mjs*') { Stop-Process -Id 31448 } else { throw 'Refusing to stop an unverified process.' }` | 0 | Verified the exact temporary process as `node scripts/server.mjs`, then stopped only that test server after the checks. |
| `node --version; npm --version; git branch --show-current; git rev-parse HEAD; git status --short` | 0 | Confirmed the versions, branch, and commit recorded above. The only then-visible untracked file was the concurrent Reviewer's `03-review.md`. |

The first attempted single-line form of the live smoke script exited 1 before making any request because Windows PowerShell removed JavaScript string quotes. The same assertions were immediately rerun using the literal here-string below and passed with exit 0. This was a test-harness invocation error, not a product failure.

PowerShell emitted a non-fatal `Set-PSReadLineOption` warning at shell startup because captured output does not support predictive suggestions. It did not affect any command exit code.

### Exact live loopback smoke command

```powershell
$smokeScript = @'
import assert from "node:assert/strict";
const base = "http://127.0.0.1:57315";
const cases = [
  ["/", 200, "<h1>Todo</h1>"],
  ["/index.html", 200, "<h1>Todo</h1>"],
  ["/styles.css", 200, ".todo-app"],
  ["/app.js", 200, "textContent"],
  ["/todo-model.js", 200, "software-factory.todo.v1"],
  ["/unknown", 404, "Not found"],
  ["/%2e%2e/package.json", 404, "Not found"],
  ["/..%2Fpackage.json", 404, "Not found"],
];
for (const [path, status, needle] of cases) {
  const response = await fetch(base + path);
  const body = await response.text();
  assert.equal(response.status, status, path);
  assert.ok(body.includes(needle), path);
  console.log(`${path} -> ${status}`);
}
const root = await fetch(base + "/");
assert.match(root.headers.get("content-type"), /^text\/html/);
assert.match(root.headers.get("content-security-policy"), /default-src 'self'/);
console.log("live npm-start smoke checks passed");
'@
$smokeScript | node --input-type=module -
```

### Exact static audit command

```powershell
$staticAudit = @'
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const [html, app, css] = await Promise.all([
  readFile("app/index.html", "utf8"),
  readFile("app/app.js", "utf8"),
  readFile("app/styles.css", "utf8"),
]);
assert.match(html, /<h1>Todo<\/h1>/);
assert.match(html, /<label for="todo-title">/);
assert.match(html, /<button type="submit">Add<\/button>/);
assert.match(html, /id="validation-message"[^>]*role="alert"/);
assert.match(html, /id="todo-list"[^>]*aria-label="Todo items"/);
assert.match(html, /<script type="module" src="\/app\.js"><\/script>/);
assert.doesNotMatch(app, /innerHTML/);
assert.match(app, /title\.textContent = todo\.title/);
assert.match(app, /form\.addEventListener\("submit"/);
assert.match(app, /form\.reset\(\)/);
assert.match(app, /titleInput\.focus\(\)/);
assert.match(app, /localStorage\.getItem\(STORAGE_KEY\)/);
assert.match(app, /localStorage\.setItem\(STORAGE_KEY/);
assert.match(app, /checkbox\.setAttribute\("aria-label"/);
assert.match(app, /deleteButton\.setAttribute\("aria-label"/);
assert.match(app, /state\.textContent = todo\.completed \? "Completed" : "Not completed"/);
assert.match(css, /@media \(max-width: 24rem\)/);
assert.match(css, /\.todo-item--completed \.todo-title[\s\S]*text-decoration: line-through/);
assert.match(css, /overflow-wrap: anywhere/);
assert.match(css, /:focus-visible/);
console.log("static UI/accessibility/security audit passed");
'@
$staticAudit | node --input-type=module -
```

## Acceptance-criteria coverage

| Criterion | Status | Evidence |
| --- | --- | --- |
| **AC-01** | **PASS** | `npm test` exited 0 with 14/14 passing tests using the checked-in dependency-free test setup. |
| **AC-02** | **PASS** | The actual `npm start` command bound to `127.0.0.1` on an ephemeral port; a live request to `/` returned 200 and the Todo page. |
| **AC-03** | **PARTIAL — browser interaction unverified** | Automated model test proved trimming ` Buy milk ` to `Buy milk` and creating one valid item. Static inspection proved the submit handler renders from the resulting collection, calls `form.reset()`, and returns focus with `titleInput.focus()`. Actual display and focus movement were not exercised in a real browser. |
| **AC-04** | **PARTIAL — browser/AT behavior unverified** | Automated model test proved blank input is rejected without mutating the original collection. Static inspection found the `role="alert"` message, `aria-invalid` update, and focus return. A browser and assistive technology did not verify announcement behavior. |
| **AC-05** | **PARTIAL — browser interaction unverified** | Automated tests proved only the matching Todo is toggled. Static inspection found checkbox change wiring, checked state, completed class, line-through, and explicit `Completed`/`Not completed` text. A real checkbox activation was not performed. |
| **AC-06** | **PARTIAL — browser interaction unverified** | Automated tests proved deletion removes only the matching Todo, and static inspection found the per-item Delete handler. A real button activation was not performed. |
| **AC-07** | **PARTIAL — browser reload unverified** | Automated serialization round-trip passed. Static inspection proved initial `localStorage.getItem` parsing and successful add/toggle/delete writes through one `commit` function. Persistence across an actual browser reload was not exercised. |
| **AC-08** | **PASS** | Automated tests covered missing, malformed, and structurally invalid stored values returning an empty collection. Inspection confirmed storage reads are caught and parsed before initial render, so these inputs do not escape as uncaught errors. |
| **AC-09** | **PASS (code-level security evidence)** | Static audit confirmed user titles are assigned only through `textContent` and `app.js` contains no `innerHTML`; the server also supplies a self-only CSP. Literal rendering was not visually inspected, but the audited sink does not parse the title as markup. |
| **AC-10** | **PARTIAL — key press unverified** | The input is inside a form with an Add submit button, and the application handles the form's `submit` event, which is the native Enter path. An actual Enter key event was not run in a browser. |
| **AC-11** | **PASS (static accessibility evidence)** | The input has an explicit `<label>`; generated checkboxes and Delete buttons receive title-specific `aria-label` values; completion is communicated by visible text and line-through rather than color alone; focus-visible styles are present. No screen-reader session was run. |
| **AC-12** | **UNVERIFIED — manual visual check required** | CSS inspection found a viewport meta tag, global border-box sizing, `min-width: 0`, long-title wrapping, and a single-column `@media (max-width: 24rem)` layout. Usability at an actual 320-pixel viewport was not visually exercised. |
| **AC-13** | **PASS** | Checked-in tests and the independent live smoke check both observed 404 for unknown and encoded traversal paths. The server uses an explicit URL-to-file allowlist, and no arbitrary path is joined to the filesystem. |
| **AC-14** | **PASS** | Direct manifest inspection and an executable assertion confirmed that `package.json` declares neither `dependencies` nor `devDependencies`. |

## Failures and untested areas

- **Observed product failures:** none.
- **Automated test failures:** none.
- **Blocking findings from this test stage:** none.
- **Manual-only follow-up:** in a real browser, add ` Buy milk ` with the button and Enter; submit whitespace; toggle and delete among at least two items; reload after each state type; enter `<img src=x onerror=alert(1)>`; confirm focus movement and accessible announcements; and inspect keyboard use and wrapping at a 320-pixel viewport.
- **Reason for partial verdict:** the repository has no checked-in browser automation dependency or harness, none was added under the approved zero-dependency scope, and the available test interface did not provide an interactive browser or accessibility tree. Static inspection is recorded as such and is not presented as a visual/manual result.

No merge, deployment, external network request, dependency installation, destructive repository command, or product-code edit occurred.

## Re-test — Repair iteration 1 — 2026-10-15

- **Re-test Tester:** actual independent Codex subagent `/root/tester_recheck`
- **Repair diff inspected:** `8405636866913a2f7eb1a65a1df0eec9cd072686..6f72c799a750ddb6ae1b59139a58bfdace4658ab`
- **Tested branch:** `factory/todo-demo`
- **Tested commit:** `6f72c799a750ddb6ae1b59139a58bfdace4658ab`
- **Re-test verdict:** **partial** — every automated, focused, syntax, dependency, live-loopback, and static accessibility check passed; real-browser interaction, rendering, accessibility-tree behavior, and 320-pixel visual usability remain manual boundaries

### Independence and scope

The re-test read `AGENTS.md`, the approved `01-spec.md`, Builder `02-build.md`, and the existing `04-test.md`. It did not intentionally open `03-review.md` or coordinate conclusions with the Reviewer. The repair was evaluated from its diff, the specification, source code, tests, and independently executed checks.

After all test execution and the initial acceptance mapping were complete, a broad checkout-integrity command unexpectedly emitted a concurrent modification to `03-review.md`. That incidental post-test output was not used to select checks, change expectations, or alter the re-test verdict. It is disclosed here rather than represented as a clean separation that did not occur.

No product code, dependency, Git history, branch, merge state, deployment state, or file outside this report was changed by the re-test. Network activity was limited to the temporary loopback Todo server. No destructive repository command was run.

### Commands and results

| Command | Exit code | Result |
| --- | ---: | --- |
| `git rev-parse --show-toplevel; git status --short --branch; git rev-parse HEAD` | 0 | Confirmed the requested repository, `factory/todo-demo`, a clean initial tree, and exact commit `6f72c799a750ddb6ae1b59139a58bfdace4658ab`. |
| `git diff --unified=80 8405636866913a2f7eb1a65a1df0eec9cd072686..6f72c799a750ddb6ae1b59139a58bfdace4658ab -- app/app.js app/focus-policy.js app/styles.css scripts/server.mjs test/accessibility.test.js test/focus-policy.test.js test/server.test.js` | 0 | Inspected only the repair's product and test changes: focus destination/restoration, focus-ring contrast, server allowlisting, and their tests. |
| `npm test` | 0 | TAP reported 21 tests, 21 passed, 0 failed, 0 skipped, and 0 cancelled. |
| `node --test test/focus-policy.test.js test/accessibility.test.js test/server.test.js` | 0 | Focused repair/server suite reported 11 tests, 11 passed, and 0 failed. |
| `node --check app/app.js; ...; node --check app/focus-policy.js; ...; node --check app/todo-model.js; ...; node --check scripts/server.mjs` | 0 | All four JavaScript files passed syntax checking. The omitted separators were PowerShell exit guards: `if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }`. |
| `node --input-type=module -e "import p from './package.json' with { type: 'json' }; if ('dependencies' in p \|\| 'devDependencies' in p) process.exit(1); console.log('No dependencies or devDependencies declared.');"` | 0 | Confirmed neither dependency field is declared. |
| `$env:PORT='0'; npm start` | 1 after intentional teardown | The actual start entry point launched successfully at `http://127.0.0.1:55854` and remained live through all smoke requests. The verified child server was stopped after testing, so the long-running npm process did not exit naturally. |
| Live loopback smoke script below | 0 | `/`, `/index.html`, `/styles.css`, `/app.js`, `/focus-policy.js`, and `/todo-model.js` returned 200 with expected content. Unknown and two encoded traversal paths returned 404. Content type, CSP, `nosniff`, `HEAD`, and 405/`Allow` behavior passed. |
| Static UI/accessibility/repair audit below | 0 | Verified semantic labels/status wiring, safe text rendering, form/storage behavior, focus-policy wiring, responsive rules, server allowlisting, and the two-color focus indicator. Calculated ratios were `17.74:1`, `15.78:1`, `6.47:1`, and `7.52:1` for the tested adjacent surfaces. |
| `Get-NetTCPConnection ... -LocalPort 55854` plus verified `Get-CimInstance`/`Stop-Process -Id 17092` guard | 0 | Identified PID `17092` as exactly `node scripts/server.mjs` and stopped only that temporary test server after the checks. |
| `node --version; npm --version; git branch --show-current; git rev-parse HEAD` | 0 | Confirmed Node.js `v22.19.0`, npm `10.9.3`, branch `factory/todo-demo`, and the requested commit. |

PowerShell emitted its pre-existing, non-fatal `Set-PSReadLineOption` warning in captured shells. It did not affect command exit codes or test behavior.

### Exact live loopback smoke command

```powershell
$smokeScript = @'
import assert from "node:assert/strict";
const base = "http://127.0.0.1:55854";
const cases = [
  ["/", 200, "<h1>Todo</h1>"],
  ["/index.html", 200, "<h1>Todo</h1>"],
  ["/styles.css", 200, "--focus-ring: #111827"],
  ["/app.js", 200, "./focus-policy.js"],
  ["/focus-policy.js", 200, "export function restoreFocus"],
  ["/todo-model.js", 200, "software-factory.todo.v1"],
  ["/unknown", 404, "Not found"],
  ["/%2e%2e/package.json", 404, "Not found"],
  ["/..%2Fpackage.json", 404, "Not found"],
];
for (const [path, status, needle] of cases) {
  const response = await fetch(base + path);
  const body = await response.text();
  assert.equal(response.status, status, path);
  assert.ok(body.includes(needle), path);
  console.log(`${path} -> ${status}`);
}
const root = await fetch(base + "/");
assert.match(root.headers.get("content-type"), /^text\/html/);
assert.match(root.headers.get("content-security-policy"), /default-src 'self'/);
assert.equal(root.headers.get("x-content-type-options"), "nosniff");
const focusModule = await fetch(base + "/focus-policy.js");
assert.match(focusModule.headers.get("content-type"), /^text\/javascript/);
const head = await fetch(base + "/", { method: "HEAD" });
assert.equal(head.status, 200);
assert.equal(await head.text(), "");
const post = await fetch(base + "/", { method: "POST" });
assert.equal(post.status, 405);
assert.equal(post.headers.get("allow"), "GET, HEAD");
console.log("live npm-start smoke checks passed");
'@
$smokeScript | node --input-type=module -
```

### Exact static UI/accessibility/repair audit

```powershell
$auditScript = @'
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const [html, app, focus, css, server] = await Promise.all([
  readFile("app/index.html", "utf8"),
  readFile("app/app.js", "utf8"),
  readFile("app/focus-policy.js", "utf8"),
  readFile("app/styles.css", "utf8"),
  readFile("scripts/server.mjs", "utf8"),
]);
assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
assert.match(html, /<label for="todo-title">/);
assert.match(html, /<button type="submit">Add<\/button>/);
assert.match(html, /id="validation-message"[^>]*role="alert"/);
assert.match(html, /id="todo-list"[^>]*aria-label="Todo items"/);
assert.doesNotMatch(app, /innerHTML/);
assert.match(app, /title\.textContent = todo\.title/);
assert.match(app, /form\.addEventListener\("submit"/);
assert.match(app, /form\.reset\(\)/);
assert.match(app, /titleInput\.focus\(\)/);
assert.match(app, /localStorage\.getItem\(STORAGE_KEY\)/);
assert.match(app, /localStorage\.setItem\(STORAGE_KEY/);
assert.match(app, /checkbox\.setAttribute\("aria-label"/);
assert.match(app, /deleteButton\.setAttribute\("aria-label"/);
assert.match(app, /state\.textContent = todo\.completed \? "Completed" : "Not completed"/);
assert.match(app, /focusAfterToggle\(todo\.id\)/);
assert.match(app, /focusAfterDelete\(todos, todo\.id\)/);
assert.match(app, /restoreFocus\(focusTarget, controlsByTodoId, titleInput\)/);
assert.match(focus, /neighbor = todos\[deletedIndex \+ 1\] \?\? todos\[deletedIndex - 1\]/);
assert.match(focus, /\(control \?\? titleInput\)\.focus\(\)/);
assert.match(css, /@media \(max-width: 24rem\)/);
assert.match(css, /overflow-wrap: anywhere/);
assert.match(css, /:focus-visible/);
assert.match(css, /outline:\s*3px solid var\(--focus-ring\)/);
assert.match(css, /box-shadow:\s*0 0 0 2px var\(--focus-halo\)/);
assert.match(server, /\["\/focus-policy\.js"/);
function luminance(hex) {
  const values = hex.slice(1).match(/.{2}/g)
    .map((part) => Number.parseInt(part, 16) / 255)
    .map((value) => value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
function contrast(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const ratios = {
  ringWhite: contrast("#111827", "#ffffff"),
  ringPage: contrast("#111827", "#eef2f7"),
  haloPrimary: contrast("#ffffff", "#2457c5"),
  haloDelete: contrast("#ffffff", "#a61b1b"),
};
for (const value of Object.values(ratios)) assert.ok(value >= 3);
console.log(Object.fromEntries(
  Object.entries(ratios).map(([key, value]) => [key, value.toFixed(2)]),
));
console.log("static UI/accessibility/repair audit passed");
'@
$auditScript | node --input-type=module -
```

### Re-test acceptance-criteria coverage

| Criterion | Re-test status | Evidence at `6f72c799a750ddb6ae1b59139a58bfdace4658ab` |
| --- | --- | --- |
| **AC-01** | **PASS** | Full `npm test` run exited 0 with 21/21 passing tests, using checked-in code and Node.js built-ins. |
| **AC-02** | **PASS** | The actual `npm start` entry point bound to `127.0.0.1` on an ephemeral port; a live request to `/` returned 200 and the Todo page. |
| **AC-03** | **PARTIAL — browser interaction unverified** | Model coverage proves one trimmed `Buy milk` item; static wiring proves render, reset, and input focus calls. Actual rendering and focus movement were not exercised in a browser. |
| **AC-04** | **PARTIAL — browser/AT behavior unverified** | Tests prove blank rejection without collection mutation; static checks found `role="alert"`, `aria-invalid`, and focus wiring. Announcement behavior was not observed with a browser or assistive technology. |
| **AC-05** | **PARTIAL — browser interaction unverified** | Model tests prove targeted toggling. Repair tests prove the intended replacement-checkbox focus target and focus call; static checks verify the actual handler wiring and non-color completed state. A real checkbox activation/render cycle was not performed. |
| **AC-06** | **PARTIAL — browser interaction unverified** | Model tests prove targeted deletion. Repair tests prove next/previous/input focus destinations and focus calls; static checks verify handler wiring. A real Delete activation/render cycle was not performed. |
| **AC-07** | **PARTIAL — browser reload unverified** | Serialization tests and static `localStorage` read/write wiring passed. State survival across a real browser reload was not exercised. |
| **AC-08** | **PASS** | Tests cover missing, malformed, and structurally invalid storage as an empty collection; source inspection confirms caught reads and defensive parsing. |
| **AC-09** | **PASS (code-level security evidence)** | Static inspection confirms titles flow to `textContent` and not `innerHTML`; CSP remains self-only. The markup-like title was not visually entered in a real browser. |
| **AC-10** | **PARTIAL — key press unverified** | The labeled input remains in a form handled through the native `submit` event. An actual Enter key event was not generated in a browser. |
| **AC-11** | **PASS (static/code-level accessibility evidence)** | Input, checkbox, and Delete names are present; completion uses text and line-through; focus restoration policy tests pass; focus ring/halo contrasts exceed 3:1. No screen-reader or real-browser keyboard session was run. |
| **AC-12** | **UNVERIFIED — manual visual check required** | Viewport metadata, border-box sizing, wrapping, and the `max-width: 24rem` single-column rule remain present. An actual 320-pixel rendered viewport was not inspected. |
| **AC-13** | **PASS** | Both the full suite and live smoke checks returned 404 for unknown and encoded traversal paths. The new module is a single explicit allowlist entry rather than a dynamic filesystem path. |
| **AC-14** | **PASS** | Executable manifest inspection confirms no `dependencies` or `devDependencies` fields. |

### Failures, repair status, and manual boundary

- **Observed product failures:** none.
- **Automated or focused test failures:** none.
- **Blocking Tester findings:** none.
- **Repair-specific result:** focus destination/restoration logic, module delivery, and focus-indicator contrast all passed their focused checks.
- **Manual browser boundary preserved:** button/Enter submission, actual focus after DOM replacement, failed-storage focus behavior in a browser, live-region announcements, reload persistence, literal markup-like title rendering, complete keyboard traversal, focus-ring appearance, and 320-pixel layout usability were not directly exercised.

The re-test does not claim a real-browser or assistive-technology result. It performed no merge, rebase, push, deployment, dependency installation, external-network request, destructive repository operation, or product-code edit.
