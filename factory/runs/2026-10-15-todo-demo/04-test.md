# Test Report: Minimal Persistent Todo App

- **Run ID:** `2026-10-15-todo-demo`
- **Tester:** actual independent Codex subagent `/root/tester`
- **Tested branch:** `factory/todo-demo`
- **Tested commit:** `36b3ee0f411f5c1936c6c06e9670dba551bf4c11`
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
