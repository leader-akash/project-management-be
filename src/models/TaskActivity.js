const mongoose = require("mongoose");

const ACTIVITY_TYPES = [
  "task_created",
  "column_changed",
  "task_reordered",
  "comment_added",
  "assignment_changed",
  "task_edited"
];

const taskActivitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
      index: true
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

taskActivitySchema.index({ task: 1, createdAt: -1 });

module.exports = {
  TaskActivity: mongoose.model("TaskActivity", taskActivitySchema),
  ACTIVITY_TYPES
};
