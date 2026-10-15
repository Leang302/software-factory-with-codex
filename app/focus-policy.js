export function focusAfterToggle(todoId) {
  return { control: "toggle", todoId };
}

export function focusAfterDelete(todos, deletedId) {
  const deletedIndex = todos.findIndex((todo) => todo.id === deletedId);
  if (deletedIndex === -1) {
    return null;
  }

  const neighbor = todos[deletedIndex + 1] ?? todos[deletedIndex - 1];
  return neighbor
    ? { control: "delete", todoId: neighbor.id }
    : { control: "input" };
}

export function restoreFocus(target, controlsByTodoId, titleInput) {
  if (target === null || target === undefined) {
    return;
  }

  if (target.control === "input") {
    titleInput.focus();
    return;
  }

  const control = controlsByTodoId.get(target.todoId)?.[target.control];
  (control ?? titleInput).focus();
}
