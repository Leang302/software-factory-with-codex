import assert from "node:assert/strict";
import test from "node:test";

import {
  focusAfterDelete,
  focusAfterToggle,
  restoreFocus,
} from "../app/focus-policy.js";

const todos = [
  { id: "first" },
  { id: "second" },
  { id: "third" },
];

test("toggle focus returns to the replacement checkbox", () => {
  assert.deepEqual(focusAfterToggle("second"), {
    control: "toggle",
    todoId: "second",
  });
});

test("delete focus chooses the next item, then the previous item", () => {
  assert.deepEqual(focusAfterDelete(todos, "second"), {
    control: "delete",
    todoId: "third",
  });
  assert.deepEqual(focusAfterDelete(todos, "third"), {
    control: "delete",
    todoId: "second",
  });
});

test("delete focus returns to the input when the final item is removed", () => {
  assert.deepEqual(focusAfterDelete([{ id: "only" }], "only"), {
    control: "input",
  });
});

test("focus restoration focuses the requested control", () => {
  const calls = [];
  const input = { focus: () => calls.push("input") };
  const toggle = { focus: () => calls.push("toggle") };
  const deleteButton = { focus: () => calls.push("delete") };
  const controls = new Map([
    ["second", { toggle, delete: deleteButton }],
  ]);

  restoreFocus(focusAfterToggle("second"), controls, input);
  restoreFocus({ control: "delete", todoId: "second" }, controls, input);
  restoreFocus({ control: "delete", todoId: "missing" }, controls, input);

  assert.deepEqual(calls, ["toggle", "delete", "input"]);
});
