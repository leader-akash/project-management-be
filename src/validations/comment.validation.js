const { z } = require("zod");
const { objectId } = require("./common.validation");

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(3000)
});

const taskCommentParamsSchema = z.object({
  taskId: objectId
});

module.exports = {
  createCommentSchema,
  taskCommentParamsSchema
};

