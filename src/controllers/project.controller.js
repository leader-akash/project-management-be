const projectService = require("../services/project.service");
const socketService = require("../services/socket.service");
const asyncHandler = require("../utils/asyncHandler");

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user);
  res.status(201).json({ project });
});

const listProjects = asyncHandler(async (req, res) => {
  const result = await projectService.listProjects(req.query, req.user);
  res.json(result);
});

const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId, req.user);
  res.json({ project });
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.projectId, req.body, req.user);
  socketService.emitToProject(project._id.toString(), "project:updated", { project });
  res.json({ project });
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await projectService.deleteProject(req.params.projectId, req.user);
  socketService.emitToProject(project._id.toString(), "project:deleted", { projectId: project._id });
  res.status(204).send();
});

module.exports = {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject
};

