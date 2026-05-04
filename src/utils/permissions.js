const ApiError = require("./ApiError");

const PROJECT_ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  MEMBER: "member",
  VIEWER: "viewer"
};

function getMembership(project, userId) {
  const normalizedUserId = userId.toString();

  if (project.owner?.toString() === normalizedUserId || project.owner?._id?.toString() === normalizedUserId) {
    return PROJECT_ROLES.OWNER;
  }

  const member = project.members?.find((entry) => {
    const entryUserId = entry.user?._id?.toString?.() || entry.user?.toString?.();
    return entryUserId === normalizedUserId;
  });

  return member?.role || null;
}

function canReadProject(project, user) {
  return Boolean(getMembership(project, user._id));
}

function canManageProject(project, user) {
  const membership = getMembership(project, user._id);
  return membership === PROJECT_ROLES.OWNER || membership === PROJECT_ROLES.MANAGER;
}

function canDeleteProject(project, user) {
  const membership = getMembership(project, user._id);
  return membership === PROJECT_ROLES.OWNER;
}

function canWriteTasks(project, user) {
  const membership = getMembership(project, user._id);
  return (
    membership === PROJECT_ROLES.OWNER ||
    membership === PROJECT_ROLES.MANAGER ||
    membership === PROJECT_ROLES.MEMBER
  );
}

function canComment(project, user) {
  return canWriteTasks(project, user);
}

function assertPermission(condition, message = "You do not have permission to perform this action.") {
  if (!condition) {
    throw new ApiError(403, message);
  }
}

module.exports = {
  PROJECT_ROLES,
  getMembership,
  canReadProject,
  canManageProject,
  canDeleteProject,
  canWriteTasks,
  canComment,
  assertPermission
};

