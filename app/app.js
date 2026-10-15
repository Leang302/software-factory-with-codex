import {
  STORAGE_KEY,
  TodoValidationError,
  addTodo,
  deleteTodo,
  parseTodos,
  serializeTodos,
  toggleTodo,
} from "./todo-model.js";

const form = document.querySelector("#todo-form");
const titleInput = document.querySelector("#todo-title");
const validationMessage = document.querySelector("#validation-message");
const storageMessage = document.querySelector("#storage-message");
const todoList = document.querySelector("#todo-list");
const emptyState = document.querySelector("#empty-state");
const todoCount = document.querySelector("#todo-count");

function loadTodos() {
  try {
    return parseTodos(localStorage.getItem(STORAGE_KEY));
  } catch {
    storageMessage.textContent =
      "Saved todos are unavailable in this browser. Changes cannot be saved.";
    return [];
  }
}

let todos = loadTodos();

function showValidation(message = "") {
  validationMessage.textContent = message;
  titleInput.setAttribute("aria-invalid", String(message.length > 0));
}

function commit(nextTodos) {
  try {
    localStorage.setItem(STORAGE_KEY, serializeTodos(nextTodos));
    storageMessage.textContent = "";
  } catch {
    storageMessage.textContent =
      "The change was not saved because browser storage is unavailable.";
    return false;
  }

  todos = nextTodos;
  render();
  return true;
}

function createTodoItem(todo) {
  const item = document.createElement("li");
  item.className = "todo-item";
  if (todo.completed) {
    item.classList.add("todo-item--completed");
  }

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "todo-toggle";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `Mark ${todo.title} as ${todo.completed ? "incomplete" : "complete"}`);
  checkbox.addEventListener("change", () => {
    if (!commit(toggleTodo(todos, todo.id))) {
      render();
    }
  });

  const title = document.createElement("span");
  title.className = "todo-title";
  title.textContent = todo.title;

  toggleLabel.append(checkbox, title);

  const state = document.createElement("span");
  state.className = "todo-state";
  state.textContent = todo.completed ? "Completed" : "Not completed";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete ${todo.title}`);
  deleteButton.addEventListener("click", () => {
    commit(deleteTodo(todos, todo.id));
  });

  item.append(toggleLabel, state, deleteButton);
  return item;
}

function render() {
  todoList.replaceChildren(...todos.map(createTodoItem));
  emptyState.hidden = todos.length > 0;

  const remaining = todos.filter((todo) => !todo.completed).length;
  todoCount.textContent = `${remaining} ${remaining === 1 ? "item" : "items"} remaining`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  showValidation();

  try {
    const nextTodos = addTodo(todos, titleInput.value);
    if (commit(nextTodos)) {
      form.reset();
      titleInput.focus();
    }
  } catch (error) {
    if (!(error instanceof TodoValidationError)) {
      throw error;
    }

    showValidation(error.message);
    titleInput.focus();
  }
});

titleInput.addEventListener("input", () => {
  if (titleInput.value.trim().length > 0) {
    showValidation();
  }
});

render();
