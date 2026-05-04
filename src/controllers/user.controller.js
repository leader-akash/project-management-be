const userService = require("../services/user.service");
const asyncHandler = require("../utils/asyncHandler");

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers(req.query);
  res.json({ items: users });
});

module.exports = {
  listUsers
};

