const Comment = require("../models/Comment");
const Project = require("../models/Project");
const { Task } = require("../models/Task");
const activityService = require("./activity.service");
const ApiError = require("../utils/ApiError");
const { assertPermission, canComment, canReadProject } = require("../utils/permissions");

const populateComment = [{ path: "author", select: "name email role" }];

async function loadTaskAndProject(taskId, user, write = false) {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  const project = await Project.findById(task.project);
  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  assertPermission(write ? canComment(project, user) : canReadProject(project, user));
  return { task, project };
}

async function listComments(taskId, user) {
  await loadTaskAndProject(taskId, user, false);
  return Comment.find({ task: taskId }).populate(populateComment).sort({ createdAt: 1 });
}

async function createComment(taskId, payload, user) {
  const { task, project } = await loadTaskAndProject(taskId, user, true);

  const comment = await Comment.create({
    task: task._id,
    project: project._id,
    author: user._id,
    body: payload.body
  });

  await activityService.recordCommentAdded(task._id, project._id, user._id, payload.body || "");

  return Comment.findById(comment._id).populate(populateComment);
}

module.exports = {
  listComments,
  createComment
};

