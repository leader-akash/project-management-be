const Project = require("../models/Project");
const { Task } = require("../models/Task");
const ApiError = require("../utils/ApiError");
const { getPagination } = require("../utils/pagination");
const {
  assertPermission,
  canDeleteProject,
  canManageProject,
  canReadProject
} = require("../utils/permissions");

const populateProject = [
  { path: "owner", select: "name email role" },
  { path: "members.user", select: "name email role" }
];

function buildProjectKey(name, explicitKey) {
  const source = explicitKey || name;
  return source
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 12)
    .toUpperCase() || "PROJ";
}

const RESERVED_LANE_IDS = new Set(["todo", "in-progress", "review", "done"]);

function assertCustomLanes(lanes) {
  if (!lanes) return;
  if (lanes.length > 6) {
    throw new ApiError(400, "You can have at most six custom columns on a board.");
  }
  const seen = new Set();
  for (const lane of lanes) {
    const id = lane.id?.trim();
    if (!id) {
      throw new ApiError(400, "Each custom column needs an id and a title.");
    }
    if (RESERVED_LANE_IDS.has(id)) {
      throw new ApiError(400, `The column id “${id}” is reserved. Pick another id.`);
    }
    if (seen.has(id)) {
      throw new ApiError(400, "Custom column ids must be unique.");
    }
    seen.add(id);
  }
}

function normalizeMembers(ownerId, members = []) {
  const normalizedOwnerId = ownerId._id || ownerId;
  const byUser = new Map();
  byUser.set(normalizedOwnerId.toString(), { user: normalizedOwnerId, role: "owner" });

  for (const member of members) {
    byUser.set(member.user.toString(), {
      user: member.user,
      role: member.role === "owner" ? "manager" : member.role
    });
  }

  return Array.from(byUser.values());
}

async function createProject(payload, user) {
  const project = await Project.create({
    name: payload.name,
    key: buildProjectKey(payload.name, payload.key),
    description: payload.description || "",
    owner: user._id,
    members: normalizeMembers(user._id, payload.members)
  });

  return project.populate(populateProject);
}

async function listProjects(query, user) {
  const { limit, skip, page } = getPagination(query);
  const andFilters = [];

  if (query.status) andFilters.push({ status: query.status });
  if (query.search) {
    andFilters.push({
      $or: [
        { name: new RegExp(query.search, "i") },
        { key: new RegExp(query.search, "i") }
      ]
    });
  }

  andFilters.push({
    $or: [{ owner: user._id }, { "members.user": user._id }]
  });

  const filter = andFilters.length ? { $and: andFilters } : {};

  const [items, total] = await Promise.all([
    Project.find(filter).populate(populateProject).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Project.countDocuments(filter)
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

async function getProjectById(projectId, user) {
  const project = await Project.findById(projectId).populate(populateProject);
  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  assertPermission(canReadProject(project, user));
  return project;
}

async function updateProject(projectId, payload, user) {
  const project = await getProjectById(projectId, user);
  assertPermission(canManageProject(project, user));

  if (payload.name !== undefined) project.name = payload.name;
  if (payload.key !== undefined) project.key = buildProjectKey(payload.key, payload.key);
  if (payload.description !== undefined) project.description = payload.description;
  if (payload.status !== undefined) project.status = payload.status;
  if (payload.members !== undefined) project.members = normalizeMembers(project.owner, payload.members);

  if (payload.customLanes !== undefined) {
    assertCustomLanes(payload.customLanes);
    const previousIds = new Set((project.customLanes || []).map((lane) => lane.id));
    const nextIds = new Set(payload.customLanes.map((lane) => lane.id));
    for (const id of previousIds) {
      if (!nextIds.has(id)) {
        const remaining = await Task.countDocuments({ project: project._id, status: id });
        if (remaining > 0) {
          throw new ApiError(
            400,
            `You still have tasks in the “${id}” column. Move them to another column before removing it.`
          );
        }
      }
    }
    project.customLanes = payload.customLanes;
  }

  await project.save();
  return project.populate(populateProject);
}

async function deleteProject(projectId, user) {
  const project = await getProjectById(projectId, user);
  assertPermission(canDeleteProject(project, user));

  await Project.deleteOne({ _id: project._id });
  return project;
}

module.exports = {
  createProject,
  listProjects,
  getProjectById,
  updateProject,
  deleteProject,
  populateProject
};
