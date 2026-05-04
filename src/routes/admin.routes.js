const express = require("express");
const adminController = require("../controllers/admin.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));
router.get("/overview", adminController.overview);

module.exports = router;
