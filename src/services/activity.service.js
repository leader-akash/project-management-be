const User = require("../models/User");
const { TaskActivity } = require("../models/TaskActivity");

function normalizeId(ref) {
  if (!ref) return null;
  return ref.toString?.() ?? String(ref);
}

async function recordActivity({ taskId, projectId, actorId, type, meta = {} }) {
  await TaskActivity.create({
    task: taskId,
    project: projectId,
    actor: actorId,
    type,
    meta
  });
}

async function recordTaskCreated(taskId, projectId, actorId) {
  await recordActivity({
    taskId,
    projectId,
    actorId,
    type: "task_created",
    meta: {}
  });
}

async function recordCommentAdded(taskId, projectId, actorId, preview) {
  const text = String(preview ?? "").slice(0, 160);
  await recordActivity({
    taskId,
    projectId,
    actorId,
    type: "comment_added",
    meta: { preview: text }
  });
}

async function recordTaskChanges(prev, next, actorId, payload) {
  const taskId = next._id;
  const projectId = next.project;

  if (prev.status !== next.status) {
    await recordActivity({
      taskId,
      projectId,
      actorId,
      type: "column_changed",
      meta: { fromStatus: prev.status, toStatus: next.status }
    });
  } else if (payload.position !== undefined && prev.position !== next.position) {
    await recordActivity({
      taskId,
      projectId,
      actorId,
      type: "task_reordered",
      meta: { column: next.status }
    });
  }

  const prevAssignee = normalizeId(prev.assignee);
  const nextAssignee = normalizeId(next.assignee);
  if (prevAssignee !== nextAssignee) {
    const [prevUser, nextUser] = await Promise.all([
      prevAssignee ? User.findById(prevAssignee).select("name").lean() : null,
      nextAssignee ? User.findById(nextAssignee).select("name").lean() : null
    ]);

    await recordActivity({
      taskId,
      projectId,
      actorId,
      type: "assignment_changed",
      meta: {
        previousAssigneeName: prevUser?.name ?? null,
        nextAssigneeName: nextUser?.name ?? null
      }
    });
  }

  const editedFields = [];
  if (payload.title !== undefined && prev.title !== next.title) editedFields.push("title");
  if (payload.description !== undefined && prev.description !== next.description) editedFields.push("description");
  if (payload.priority !== undefined && prev.priority !== next.priority) editedFields.push("priority");
  const prevDue = prev.dueDate ? new Date(prev.dueDate).toISOString().slice(0, 10) : "";
  const nextDue = next.dueDate ? new Date(next.dueDate).toISOString().slice(0, 10) : "";
  if (payload.dueDate !== undefined && prevDue !== nextDue) editedFields.push("dueDate");

  if (editedFields.length) {
    await recordActivity({
      taskId,
      projectId,
      actorId,
      type: "task_edited",
      meta: { fields: editedFields }
    });
  }
}

async function listActivitiesForTask(taskId) {
  return TaskActivity.find({ task: taskId })
    .populate("actor", "name email role")
    .sort({ createdAt: -1 })
    .limit(80)
    .lean();
}

module.exports = {
  recordTaskCreated,
  recordTaskChanges,
  recordCommentAdded,
  listActivitiesForTask
};
