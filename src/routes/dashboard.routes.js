const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");
const { isLoggedIn, hasPermission } = require("../middleware/auth");

router.post("/quick-add", isLoggedIn, hasPermission('ledger.create'), dashboardController.postQuickAdd);
router.get("/", isLoggedIn, dashboardController.renderDashboard);

module.exports = router;
