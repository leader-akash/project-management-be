const express = require("express");
const activityController = require("../controllers/activity.controller");
const commentController = require("../controllers/comment.controller");
const taskController = require("../controllers/task.controller");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createCommentSchema, taskCommentParamsSchema } = require("../validations/comment.validation");
const { taskParamsSchema, updateTaskSchema } = require("../validations/task.validation");

const router = express.Router();

router.use(requireAuth);

router.get("/:taskId/activities", validate({ params: taskParamsSchema }), activityController.listTaskActivities);

router
  .route("/:taskId")
  .get(validate({ params: taskParamsSchema }), taskController.getTask)
  .patch(validate({ params: taskParamsSchema, body: updateTaskSchema }), taskController.updateTask)
  .delete(validate({ params: taskParamsSchema }), taskController.deleteTask);

router
  .route("/:taskId/comments")
  .get(validate({ params: taskCommentParamsSchema }), commentController.listComments)
  .post(validate({ params: taskCommentParamsSchema, body: createCommentSchema }), commentController.createComment);

module.exports = router;

