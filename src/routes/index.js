const express = require("express");
const authRoutes = require("./auth.routes");
const projectRoutes = require("./project.routes");
const taskRoutes = require("./task.routes");
const userRoutes = require("./user.routes");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);

module.exports = router;

