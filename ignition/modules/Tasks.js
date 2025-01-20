const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const TodoListModule = buildModule("TodoListModule", (m) => {
  const todoList = m.contract("TodoList");

  return { todoList };
});

module.exports = TodoListModule;
