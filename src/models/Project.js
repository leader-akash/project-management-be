const mongoose = require("mongoose");

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["owner", "manager", "member", "viewer"],
      default: "member"
    }
  },
  { _id: false }
);

const customLaneSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 32
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 40
    }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
      maxlength: 12
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: ""
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    members: {
      type: [projectMemberSchema],
      default: []
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true
    },
    customLanes: {
      type: [customLaneSchema],
      default: []
    },
    issueCounter: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1, name: 1 });
projectSchema.index({ "members.user": 1 });

module.exports = mongoose.model("Project", projectSchema);
