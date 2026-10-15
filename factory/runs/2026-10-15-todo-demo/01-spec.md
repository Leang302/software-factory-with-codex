# Feature Specification: Minimal Persistent Todo App

- **Run ID:** `2026-10-15-todo-demo`
- **Planner:** actual Codex subagent `/root/planner`
- **Status:** approved for this demonstration
- **Approval evidence:** the user's 2026-10-15 request explicitly asks to create the files, run a small test, and demonstrate with a small Todo application feature
- **Approved revision:** this file as committed on the `main` baseline used to create `factory/todo-demo`

## Goal

Deliver a small, zero-dependency browser Todo application that demonstrates the Software Factory workflow while remaining easy to review and test.

## Scope

Users can:

- Add a Todo with a non-empty title.
- Mark a Todo complete or incomplete.
- Delete a Todo.
- Reload the page without losing valid saved Todos.
- Use the primary workflow with keyboard controls.

Expected project layout:

```text
app/
  index.html
  styles.css
  app.js
  todo-model.js
scripts/
  server.mjs
test/
  todo-model.test.js
  server.test.js
package.json
```

The implementation may adjust filenames while preserving separation between domain logic, browser rendering, and the development server.

## User-visible behavior

1. The page initially shows a “Todo” heading, labeled text input, Add button, and an empty-state message.
2. Submitting a title trims surrounding whitespace and adds the item.
3. Blank or whitespace-only input is rejected without changing stored state.
4. Each item exposes a labeled checkbox and Delete button.
5. Checking an item marks it complete; unchecking it restores it.
6. Deleting an item removes only that item.
7. Every successful state change is persisted in browser `localStorage`.
8. Corrupt or structurally invalid saved data does not prevent the application from loading.

## Data model

Each Todo contains:

```js
{
  id: "unique-string",
  title: "Non-empty trimmed string",
  completed: false,
  createdAt: "ISO-8601 timestamp"
}
```

Use the storage key `software-factory.todo.v1`. Core add, toggle, delete, validation, and persistence parsing behavior must be implemented as testable functions without depending on the DOM.

## Technical constraints

- Use HTML, CSS, browser JavaScript modules, and Node.js built-ins only.
- Add no runtime or development package dependencies.
- Provide `npm start` to serve the application locally and `npm test` to run automated tests with `node:test`.
- Bind the server to `127.0.0.1` by default and serve only an explicit set of application files.
- Render user-provided titles through safe text APIs such as `textContent`; never interpolate them through `innerHTML`.
- Derive UI state from the persisted Todo collection.
- Make no network requests and collect no telemetry.
- Keep all implementation and reports inside this repository.
- Do not merge, deploy, delete branches/worktrees, run `git clean`, or rewrite history automatically.

## Acceptance criteria

- **AC-01:** `npm test` exits with status 0 using only checked-in code and Node.js built-ins.
- **AC-02:** `npm start` starts a local server, and requesting `/` returns the Todo page successfully.
- **AC-03:** Submitting ` Buy milk ` creates exactly one item displayed as `Buy milk`, clears the input, and returns focus to it.
- **AC-04:** Submitting an empty or whitespace-only value creates no item and presents an accessible validation message.
- **AC-05:** Activating an item's checkbox toggles only that item's `completed` value and updates its visible completed state.
- **AC-06:** Activating an item's Delete button removes only that item.
- **AC-07:** Added, toggled, and deleted state survives a page reload through `localStorage`.
- **AC-08:** Missing, malformed, or invalid saved JSON is treated as an empty list without an uncaught error.
- **AC-09:** A title such as `<img src=x onerror=alert(1)>` is displayed literally and never executed as markup or script.
- **AC-10:** The add workflow works by pressing Enter while focused in the input.
- **AC-11:** Input, checkbox, and delete controls have accessible names; completed state is not communicated by color alone.
- **AC-12:** The layout remains usable at a 320-pixel viewport width.
- **AC-13:** Unknown server paths return `404`; path traversal attempts cannot read arbitrary repository or machine files.
- **AC-14:** `package.json` declares no third-party dependencies or dev dependencies.

## Automated test plan

Use `node:test` and `node:assert/strict` to cover:

- adding a valid Todo trims its title and produces the required initial fields;
- adding a blank title is rejected and leaves state unchanged;
- toggling a known ID changes only the matching item;
- toggling an unknown ID leaves state unchanged;
- deleting a known ID removes only the matching item;
- deleting an unknown ID leaves state unchanged;
- valid serialized state round-trips correctly;
- malformed JSON returns an empty collection;
- structurally invalid stored values return an empty collection;
- generated IDs are unique under a deterministic ID provider or fixture setup;
- `/` returns `200`, an unknown path returns `404`, and an encoded traversal path exposes no file.

## Manual verification

- Start the app with `npm start`.
- Add, toggle, delete, and reload Todos.
- Submit with both the Add button and Enter.
- Try a whitespace-only title.
- Add the markup-like title from AC-09 and confirm it appears as text.
- Check keyboard focus and control labels.
- Inspect the page at approximately 320 pixels wide.

## Non-goals

- User accounts, authentication, or multi-user synchronization.
- Remote APIs, databases, or cloud storage.
- Editing titles, due dates, tags, priorities, filters, drag-and-drop, or reordering.
- Offline service workers or installable PWA behavior.
- Production hosting, deployment, or automatic merging.
- Compatibility with obsolete browsers.

## Risks and mitigations

- **DOM injection:** create DOM nodes and use `textContent`, never user-derived HTML strings.
- **Corrupt local data:** validate parsed storage data and fall back safely to an empty collection.
- **Path traversal:** serve an explicit URL-to-file allowlist rather than arbitrary filesystem paths.
- **Unstable time/ID tests:** inject ID and clock providers.
- **Concurrent checkout edits:** run build and repair sequentially; review and test only after a stable Builder commit.
- **Repository damage:** require human approval before destructive commands and never auto-merge, deploy, clean, reset, or delete branches/worktrees.
