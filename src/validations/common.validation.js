const mongoose = require("mongoose");
const { z } = require("zod");

const objectId = z.string().refine((value) => mongoose.Types.ObjectId.isValid(value), {
  message: "Invalid MongoDB object id."
});

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

module.exports = {
  objectId,
  paginationQuery
};

