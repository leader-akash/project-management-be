const express = require("express");
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { loginSchema, registerSchema } = require("../validations/auth.validation");

const router = express.Router();

router.post("/register", validate({ body: registerSchema }), authController.register);
router.post("/login", validate({ body: loginSchema }), authController.login);
router.get("/me", requireAuth, authController.me);

module.exports = router;

