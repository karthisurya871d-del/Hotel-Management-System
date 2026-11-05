const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { updateProfile } = require("../controllers/authController");

router.put("/profile", authenticate, updateProfile);

module.exports = router;

