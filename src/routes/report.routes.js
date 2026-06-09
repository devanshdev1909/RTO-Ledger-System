const express = require("express");
const router = express.Router();

const reportController = require(
    "../controllers/report.controller"
);

const { isLoggedIn } = require("../middleware/auth");
const { allowRoles } = require("../middleware/rbac");

// All report routes require login
router.use(isLoggedIn);

// Reports dashboard
router.get(
    "/",
    reportController.reportsDashboard
);

// Daily collection report
router.get(
    "/daily",
    reportController.dailyCollection
);

// Monthly revenue report
router.get(
    "/monthly",
    reportController.monthlyRevenue
);

// Outstanding dues report
router.get(
    "/outstanding",
    reportController.outstandingDues
);

// Service-wise summary
router.get(
    "/service-wise",
    reportController.serviceWise
);

// Operator performance (admin only)
router.get(
    "/operator",
    allowRoles("admin"),
    reportController.operatorPerformance
);

module.exports = router;
