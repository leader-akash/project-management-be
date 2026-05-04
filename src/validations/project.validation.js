const { z } = require("zod");
const { objectId, paginationQuery } = require("./common.validation");

const optionalText = (max) =>
  z.preprocess(
    (value) => (value === null || value === undefined ? undefined : value),
    z.string().trim().max(max).optional()
  );

const optionalKey = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.string().trim().min(2).max(12).optional()
);

const projectMemberSchema = z.object({
  user: objectId,
  role: z.enum(["owner", "manager", "member", "viewer"]).default("member")
});

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  key: optionalKey,
  description: optionalText(1000),
  members: z.array(projectMemberSchema).optional()
});

const customLaneSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9][-a-z0-9]{0,30}$/, "Column id: use lowercase letters, numbers, and hyphens (2–32 characters)."),
  title: z.string().trim().min(1).max(40)
});

const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  key: optionalKey,
  description: optionalText(1000),
  status: z.enum(["active", "archived"]).optional(),
  members: z.array(projectMemberSchema).optional(),
  customLanes: z.array(customLaneSchema).max(6).optional()
});

const projectParamsSchema = z.object({
  projectId: objectId
});

const listProjectsQuerySchema = paginationQuery.extend({
  status: z.enum(["active", "archived"]).optional(),
  search: z.string().trim().max(100).optional()
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  projectParamsSchema,
  listProjectsQuerySchema
};
