import assert from "node:assert/strict";
import test from "node:test";

import {
  TodoValidationError,
  addTodo,
  deleteTodo,
  parseTodos,
  serializeTodos,
  toggleTodo,
} from "../app/todo-model.js";

const timestamp = "2026-10-15T01:02:03.000Z";

function makeTodo(overrides = {}) {
  return {
    id: "todo-1",
    title: "First task",
    completed: false,
    createdAt: timestamp,
    ...overrides,
  };
}

test("addTodo trims a title and creates the required fields", () => {
  const result = addTodo([], "  Buy milk  ", {
    idProvider: () => "todo-1",
    clock: () => new Date(timestamp),
  });

  assert.deepEqual(result, [makeTodo({ title: "Buy milk" })]);
});

test("addTodo rejects a blank title without changing the collection", () => {
  const original = [makeTodo()];

  assert.throws(
    () => addTodo(original, " \t "),
    (error) =>
      error instanceof TodoValidationError && error.message === "Enter a todo title.",
  );
  assert.deepEqual(original, [makeTodo()]);
});

test("addTodo retries duplicate IDs and keeps generated IDs unique", () => {
  const ids = ["todo-1", "todo-2"];
  const result = addTodo([makeTodo()], "Second task", {
    idProvider: () => ids.shift(),
    clock: () => timestamp,
  });

  assert.deepEqual(result.map((todo) => todo.id), ["todo-1", "todo-2"]);
});

test("toggleTodo changes only the matching Todo", () => {
  const first = makeTodo();
  const second = makeTodo({ id: "todo-2", title: "Second task" });
  const result = toggleTodo([first, second], "todo-2");

  assert.equal(result[0], first);
  assert.deepEqual(result[1], { ...second, completed: true });
});

test("toggleTodo returns the unchanged collection for an unknown ID", () => {
  const original = [makeTodo()];
  assert.equal(toggleTodo(original, "missing"), original);
});

test("deleteTodo removes only the matching Todo", () => {
  const first = makeTodo();
  const second = makeTodo({ id: "todo-2", title: "Second task" });

  assert.deepEqual(deleteTodo([first, second], "todo-1"), [second]);
});

test("deleteTodo returns the unchanged collection for an unknown ID", () => {
  const original = [makeTodo()];
  assert.equal(deleteTodo(original, "missing"), original);
});

test("valid serialized state round-trips", () => {
  const todos = [makeTodo(), makeTodo({ id: "todo-2", completed: true })];
  assert.deepEqual(parseTodos(serializeTodos(todos)), todos);
});

test("missing and malformed serialized state produce an empty collection", () => {
  assert.deepEqual(parseTodos(null), []);
  assert.deepEqual(parseTodos("not json"), []);
});

test("structurally invalid saved values produce an empty collection", () => {
  const invalidValues = [
    {},
    [makeTodo({ title: " untrimmed " })],
    [makeTodo({ completed: "false" })],
    [makeTodo(), makeTodo()],
  ];

  for (const value of invalidValues) {
    assert.deepEqual(parseTodos(JSON.stringify(value)), []);
  }
});
