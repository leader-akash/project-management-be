const Project = require("../models/Project");
const { Task, DEFAULT_TASK_STATUSES } = require("../models/Task");
const activityService = require("./activity.service");
const ApiError = require("../utils/ApiError");
const {
  assertPermission,
  canReadProject,
  canWriteTasks,
  getMembership
} = require("../utils/permissions");

const populateTask = [
  { path: "assignee", select: "name email role" },
  { path: "reporter", select: "name email role" }
];

async function loadProject(projectId, user, write = false) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  assertPermission(write ? canWriteTasks(project, user) : canReadProject(project, user));
  return project;
}

function ensureAssignable(project, assigneeId) {
  if (!assigneeId) return;
  const membership = getMembership(project, assigneeId);
  if (!membership) {
    throw new ApiError(400, "Assignee must be a member of this project.");
  }
}

function allowedTaskStatuses(project) {
  const custom = (project.customLanes || []).map((lane) => lane.id).filter(Boolean);
  return new Set([...DEFAULT_TASK_STATUSES, ...custom]);
}

function assertValidTaskStatus(project, status) {
  if (!status) return;
  if (!allowedTaskStatuses(project).has(status)) {
    throw new ApiError(
      400,
      "That column does not exist on this board. Refresh the page, or ask a project manager to add it under custom columns."
    );
  }
}

async function nextPosition(projectId, status) {
  const lastTask = await Task.findOne({ project: projectId, status }).sort({ position: -1 }).select("position");
  return lastTask ? lastTask.position + 1000 : 1000;
}

async function listTasks(projectId, query, user) {
  const project = await loadProject(projectId, user, false);

  const filter = { project: projectId };
  if (query.status) {
    assertValidTaskStatus(project, query.status);
    filter.status = query.status;
  }
  if (query.assignee) filter.assignee = query.assignee;

  return Task.find(filter).populate(populateTask).sort({ status: 1, position: 1, updatedAt: -1 });
}

async function getTaskById(taskId, user, write = false) {
  const task = await Task.findById(taskId).populate(populateTask);
  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  await loadProject(task.project, user, write);
  return task;
}

async function createTask(projectId, payload, user) {
  const project = await loadProject(projectId, user, true);
  ensureAssignable(project, payload.assignee);

  const status = payload.status || "todo";
  assertValidTaskStatus(project, status);
  const position = payload.position || (await nextPosition(projectId, status));

  const counterDoc = await Project.findByIdAndUpdate(projectId, { $inc: { issueCounter: 1 } }, { new: true }).select("issueCounter");
  if (!counterDoc) {
    throw new ApiError(404, "Project not found.");
  }
  const issueNumber = counterDoc.issueCounter;

  let task;
  try {
    task = await Task.create({
      project: projectId,
      title: payload.title,
      description: payload.description || "",
      status,
      priority: payload.priority || "medium",
      assignee: payload.assignee || null,
      reporter: user._id,
      dueDate: payload.dueDate || null,
      position,
      issueNumber
    });
  } catch (error) {
    await Project.findByIdAndUpdate(projectId, { $inc: { issueCounter: -1 } });
    throw error;
  }

  const populated = await Task.findById(task._id).populate(populateTask);
  await activityService.recordTaskCreated(populated._id, populated.project, user._id);
  return populated;
}

async function updateTask(taskId, payload, user) {
  const existingTask = await Task.findById(taskId);
  if (!existingTask) {
    throw new ApiError(404, "Task not found.");
  }

  const project = await loadProject(existingTask.project, user, true);
  ensureAssignable(project, payload.assignee);

  if (payload.expectedVersion !== undefined && payload.expectedVersion !== existingTask.version) {
    throw new ApiError(409, "Task has changed since you loaded it. Refresh and try again.", {
      currentVersion: existingTask.version
    });
  }

  const nextStatus = payload.status || existingTask.status;
  assertValidTaskStatus(project, nextStatus);
  const update = {};

  for (const field of ["title", "description", "status", "priority", "assignee", "dueDate", "position"]) {
    if (payload[field] !== undefined) {
      update[field] = payload[field];
    }
  }

  if (payload.status && payload.status !== existingTask.status && payload.position === undefined) {
    update.position = await nextPosition(existingTask.project, nextStatus);
  }

  const query = { _id: existingTask._id };
  if (payload.expectedVersion !== undefined) {
    query.version = payload.expectedVersion;
  }

  const updatedTask = await Task.findOneAndUpdate(
    query,
    {
      $set: update,
      $inc: { version: 1 }
    },
    { new: true }
  ).populate(populateTask);

  if (!updatedTask) {
    throw new ApiError(409, "Task was updated by another user. Refresh and try again.");
  }

  const prevPlain = {
    _id: existingTask._id,
    project: existingTask.project,
    status: existingTask.status,
    position: existingTask.position,
    title: existingTask.title,
    description: existingTask.description,
    priority: existingTask.priority,
    assignee: existingTask.assignee,
    dueDate: existingTask.dueDate
  };
  const nextPlain = {
    _id: updatedTask._id,
    project: updatedTask.project,
    status: updatedTask.status,
    position: updatedTask.position,
    title: updatedTask.title,
    description: updatedTask.description,
    priority: updatedTask.priority,
    assignee: updatedTask.assignee?._id ?? updatedTask.assignee,
    dueDate: updatedTask.dueDate
  };
  await activityService.recordTaskChanges(prevPlain, nextPlain, user._id, payload);

  return updatedTask;
}

async function deleteTask(taskId, user) {
  const task = await getTaskById(taskId, user, true);
  await Task.deleteOne({ _id: task._id });
  return task;
}

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTask,
  deleteTask,
  populateTask
};

