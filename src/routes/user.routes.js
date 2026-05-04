const express = require("express");
const userController = require("../controllers/user.controller");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, userController.listUsers);

module.exports = router;

