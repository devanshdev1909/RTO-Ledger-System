const express = require("express");
const router = express.Router();

const jobController = require(
    "../controllers/job.controller"
);

const { isLoggedIn } = require("../middleware/auth");

// All job routes require login
router.use(isLoggedIn);

// List all jobs
router.get(
    "/",
    jobController.listJobs
);

// Render add job form
router.get(
    "/add",
    jobController.renderAddForm
);

// Create a new job
router.post(
    "/",
    jobController.createJob
);

// View single job
router.get(
    "/:id",
    jobController.viewJob
);

// Render edit form
router.get(
    "/:id/edit",
    jobController.renderEditForm
);

// Update job
router.post(
    "/:id",
    jobController.updateJob
);

// Record payment
router.post(
    "/:id/payment",
    jobController.recordPayment
);

// Delete job
router.post(
    "/:id/delete",
    jobController.deleteJob
);

module.exports = router;
