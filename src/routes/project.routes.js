const express = require("express");
const projectController = require("../controllers/project.controller");
const taskController = require("../controllers/task.controller");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createProjectSchema,
  listProjectsQuerySchema,
  projectParamsSchema,
  updateProjectSchema
} = require("../validations/project.validation");
const {
  createTaskSchema,
  listTasksQuerySchema,
  projectTaskParamsSchema
} = require("../validations/task.validation");

const router = express.Router();

router.use(requireAuth);

router
  .route("/")
  .get(validate({ query: listProjectsQuerySchema }), projectController.listProjects)
  .post(validate({ body: createProjectSchema }), projectController.createProject);

router
  .route("/:projectId")
  .get(validate({ params: projectParamsSchema }), projectController.getProject)
  .patch(validate({ params: projectParamsSchema, body: updateProjectSchema }), projectController.updateProject)
  .delete(validate({ params: projectParamsSchema }), projectController.deleteProject);

router
  .route("/:projectId/tasks")
  .get(validate({ params: projectTaskParamsSchema, query: listTasksQuerySchema }), taskController.listTasks)
  .post(validate({ params: projectTaskParamsSchema, body: createTaskSchema }), taskController.createTask);

module.exports = router;

