const mongoose = require("mongoose");

const DEFAULT_TASK_STATUSES = ["todo", "in-progress", "review", "done"];
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: ""
    },
    status: {
      type: String,
      default: "todo",
      index: true,
      maxlength: 40
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "medium",
      index: true
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    dueDate: {
      type: Date,
      default: null
    },
    position: {
      type: Number,
      default: 1000,
      index: true
    },
    version: {
      type: Number,
      default: 0
    },
    issueNumber: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

taskSchema.index({ project: 1, issueNumber: 1 }, { unique: true, sparse: true });
taskSchema.index({ project: 1, status: 1, position: 1 });
taskSchema.index({ project: 1, updatedAt: -1 });

module.exports = {
  Task: mongoose.model("Task", taskSchema),
  DEFAULT_TASK_STATUSES,
  TASK_PRIORITIES
};

