const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const { isLoggedIn } = require("../middleware/auth");

router.get("/", isLoggedIn, dashboardController.renderDashboard);

module.exports = router;
