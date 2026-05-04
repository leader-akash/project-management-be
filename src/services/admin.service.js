const User = require("../models/User");
const Project = require("../models/Project");
const { Task } = require("../models/Task");

async function getWorkspaceOverview() {
  const [userCount, projectCount, taskCount, users, projects] = await Promise.all([
    User.countDocuments({}),
    Project.countDocuments({}),
    Task.countDocuments({}),
    User.find({})
      .select("name email role lastSeenAt isActive createdAt")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean(),
    Project.find({})
      .populate({ path: "owner", select: "name email role" })
      .populate({ path: "members.user", select: "name email role" })
      .sort({ updatedAt: -1 })
      .limit(150)
      .lean()
  ]);

  return {
    stats: { users: userCount, projects: projectCount, tasks: taskCount },
    users,
    projects
  };
}

module.exports = {
  getWorkspaceOverview
};
