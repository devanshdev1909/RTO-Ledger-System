const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicle.controller");
const { isLoggedIn } = require("../middleware/auth");

// List all vehicles
router.get("/", isLoggedIn, vehicleController.index);

// Show create form
router.get("/new", isLoggedIn, vehicleController.renderNew);

// Create vehicle
router.post("/", isLoggedIn, vehicleController.create);

// Show edit form
router.get("/:id/edit", isLoggedIn, vehicleController.renderEdit);

// Update vehicle
router.put("/:id", isLoggedIn, vehicleController.update);

// Delete vehicle
router.delete("/:id", isLoggedIn, vehicleController.delete);

// POST-based delete fallback (for method-override compatibility)
router.post("/:id/delete", isLoggedIn, vehicleController.delete);

module.exports = router;
