const adminService = require("../services/admin.service");
const asyncHandler = require("../utils/asyncHandler");

const overview = asyncHandler(async (_req, res) => {
  const data = await adminService.getWorkspaceOverview();
  res.json(data);
});

module.exports = {
  overview
};
