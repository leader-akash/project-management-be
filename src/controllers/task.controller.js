const taskService = require("../services/task.service");
const socketService = require("../services/socket.service");
const asyncHandler = require("../utils/asyncHandler");

const listTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasks(req.params.projectId, req.query, req.user);
  res.json({ items: tasks });
});

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.params.projectId, req.body, req.user);
  socketService.emitToProject(task.project.toString(), "task:created", { task });
  res.status(201).json({ task });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.taskId, req.user, false);
  res.json({ task });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.params.taskId, req.body, req.user);
  socketService.emitToProject(task.project.toString(), "task:updated", { task });
  res.json({ task });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await taskService.deleteTask(req.params.taskId, req.user);
  socketService.emitToProject(task.project.toString(), "task:deleted", { taskId: task._id, projectId: task.project });
  res.status(204).send();
});

module.exports = {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask
};

