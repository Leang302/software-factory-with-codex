export const STORAGE_KEY = "software-factory.todo.v1";

export class TodoValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "TodoValidationError";
  }
}

function defaultIdProvider() {
  return globalThis.crypto.randomUUID();
}

function defaultClock() {
  return new Date();
}

function isIsoTimestamp(value) {
  if (typeof value !== "string") {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

export function isTodo(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.title === "string" &&
    value.title.length > 0 &&
    value.title.trim() === value.title &&
    typeof value.completed === "boolean" &&
    isIsoTimestamp(value.createdAt)
  );
}

export function isTodoCollection(value) {
  if (!Array.isArray(value) || !value.every(isTodo)) {
    return false;
  }

  return new Set(value.map((todo) => todo.id)).size === value.length;
}

function requireTodoCollection(todos) {
  if (!isTodoCollection(todos)) {
    throw new TypeError("Expected a valid Todo collection.");
  }
}

function nextUniqueId(todos, idProvider) {
  const existingIds = new Set(todos.map((todo) => todo.id));

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const id = idProvider();
    if (typeof id === "string" && id.length > 0 && !existingIds.has(id)) {
      return id;
    }
  }

  throw new Error("Unable to generate a unique Todo ID.");
}

function timestampFrom(clock) {
  const value = clock();
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.valueOf())) {
    throw new TypeError("Clock must return a valid date.");
  }

  return date.toISOString();
}

export function addTodo(
  todos,
  rawTitle,
  { idProvider = defaultIdProvider, clock = defaultClock } = {},
) {
  requireTodoCollection(todos);

  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  if (title.length === 0) {
    throw new TodoValidationError("Enter a todo title.");
  }

  return [
    ...todos,
    {
      id: nextUniqueId(todos, idProvider),
      title,
      completed: false,
      createdAt: timestampFrom(clock),
    },
  ];
}

export function toggleTodo(todos, id) {
  requireTodoCollection(todos);

  let found = false;
  const updated = todos.map((todo) => {
    if (todo.id !== id) {
      return todo;
    }

    found = true;
    return { ...todo, completed: !todo.completed };
  });

  return found ? updated : todos;
}

export function deleteTodo(todos, id) {
  requireTodoCollection(todos);

  const updated = todos.filter((todo) => todo.id !== id);
  return updated.length === todos.length ? todos : updated;
}

export function parseTodos(serialized) {
  if (typeof serialized !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(serialized);
    return isTodoCollection(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeTodos(todos) {
  requireTodoCollection(todos);
  return JSON.stringify(todos);
}
