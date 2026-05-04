const taskService = require("../services/task.service");
const activityService = require("../services/activity.service");
const asyncHandler = require("../utils/asyncHandler");

const listTaskActivities = asyncHandler(async (req, res) => {
  await taskService.getTaskById(req.params.taskId, req.user, false);
  const items = await activityService.listActivitiesForTask(req.params.taskId);
  res.json({ items });
});

module.exports = {
  listTaskActivities
};
