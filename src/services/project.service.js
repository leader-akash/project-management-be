const Project = require("../models/Project");
const { Task } = require("../models/Task");
const ApiError = require("../utils/ApiError");
const { getPagination } = require("../utils/pagination");
const {
  assertPermission,
  canCreateWorkspaceProject,
  canDeleteProject,
  canManageProject,
  canReadProject
} = require("../utils/permissions");
const { toTitleCase } = require("../utils/titleCase");

const populateProject = [
  { path: "owner", select: "name email role" },
  { path: "members.user", select: "name email role" }
];

/** User-provided key: keep letters/digits only, uppercase (do not collapse to initials). */
function sanitizeExplicitKey(raw) {
  return String(raw || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 12);
}

/** Auto key from project title: initials of each word (when no explicit key). */
function initialsKeyFromName(name) {
  const source = String(name || "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim();
  if (!source) return "PROJ";
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 12)
    .toUpperCase();
  return initials || "PROJ";
}

async function ensureUniqueProjectKey(base, excludeProjectId = null) {
  let baseKey = (base || "PROJ").slice(0, 12).replace(/[^A-Z0-9]/g, "");
  if (baseKey.length < 2) {
    baseKey = `${baseKey}PR`.slice(0, 12);
  }

  for (let n = 0; n < 10000; n += 1) {
    const candidate = (n === 0 ? baseKey : `${baseKey}${n}`).slice(0, 12);
    const query = { key: candidate };
    if (excludeProjectId) {
      query._id = { $ne: excludeProjectId };
    }
    const taken = await Project.exists(query);
    if (!taken) {
      return candidate;
    }
  }

  throw new ApiError(500, "Could not allocate a unique project key.");
}

async function resolveProjectKeyForCreate(payload) {
  const explicit = payload.key && String(payload.key).trim();
  if (explicit) {
    const sanitized = sanitizeExplicitKey(payload.key);
    if (sanitized.length < 2) {
      throw new ApiError(400, "Project key must be at least 2 letters or numbers.");
    }
    return ensureUniqueProjectKey(sanitized);
  }

  const fromName = initialsKeyFromName(payload.name);
  return ensureUniqueProjectKey(fromName.length >= 2 ? fromName : "PROJ");
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
  assertPermission(
    canCreateWorkspaceProject(user),
    "Only workspace admins and project managers can create projects."
  );

  const name = toTitleCase(payload.name);
  const key = await resolveProjectKeyForCreate({ name, key: payload.key });
  const project = await Project.create({
    name,
    key,
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

  if (user.role !== "admin" && user.role !== "manager") {
    andFilters.push({
      $or: [{ owner: user._id }, { "members.user": user._id }]
    });
  }

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

  if (payload.name !== undefined) project.name = toTitleCase(payload.name);
  if (payload.key !== undefined) {
    const sanitized = sanitizeExplicitKey(payload.key);
    if (sanitized.length < 2) {
      throw new ApiError(400, "Project key must be at least 2 letters or numbers.");
    }
    project.key = await ensureUniqueProjectKey(sanitized, project._id);
  }
  if (payload.description !== undefined) project.description = payload.description;
  if (payload.status !== undefined) project.status = payload.status;
  if (payload.members !== undefined) project.members = normalizeMembers(project.owner, payload.members);

  if (payload.customLanes !== undefined) {
    const titledLanes = payload.customLanes.map((lane) => ({
      ...lane,
      title: toTitleCase(lane.title)
    }));
    assertCustomLanes(titledLanes);
    const previousIds = new Set((project.customLanes || []).map((lane) => lane.id));
    const nextIds = new Set(titledLanes.map((lane) => lane.id));
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
    project.customLanes = titledLanes;
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
