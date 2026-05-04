const commentService = require("../services/comment.service");
const socketService = require("../services/socket.service");
const asyncHandler = require("../utils/asyncHandler");

const listComments = asyncHandler(async (req, res) => {
  const comments = await commentService.listComments(req.params.taskId, req.user);
  res.json({ items: comments });
});

const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(req.params.taskId, req.body, req.user);
  socketService.emitToProject(comment.project.toString(), "comment:created", { comment });
  res.status(201).json({ comment });
});

module.exports = {
  listComments,
  createComment
};

