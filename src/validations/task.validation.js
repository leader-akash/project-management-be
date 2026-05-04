const { z } = require("zod");
const { objectId } = require("./common.validation");

const taskStatus = z.string().trim().min(2).max(40);
const taskPriority = z.enum(["low", "medium", "high", "urgent"]);
const optionalText = (max) =>
  z.preprocess(
    (value) => (value === null || value === undefined ? undefined : value),
    z.string().trim().max(max).optional()
  );
const nullableObjectId = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  objectId.nullable().optional()
);
const nullableDate = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.coerce.date().nullable().optional()
);

const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: optionalText(5000),
  status: taskStatus.optional(),
  priority: taskPriority.optional(),
  assignee: nullableObjectId,
  dueDate: nullableDate,
  position: z.number().finite().optional()
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: optionalText(5000),
  status: taskStatus.optional(),
  priority: taskPriority.optional(),
  assignee: nullableObjectId,
  dueDate: nullableDate,
  position: z.number().finite().optional(),
  expectedVersion: z.number().int().nonnegative().optional()
});

const taskParamsSchema = z.object({
  taskId: objectId
});

const projectTaskParamsSchema = z.object({
  projectId: objectId
});

const listTasksQuerySchema = z.object({
  status: taskStatus.optional(),
  assignee: objectId.optional()
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskParamsSchema,
  projectTaskParamsSchema,
  listTasksQuerySchema
};
