const express = require("express");
const router = express.Router();

const vehicleController = require(
    "../controllers/vehicle.controller"
);

const { isLoggedIn } = require("../middleware/auth");

// All vehicle routes require login
router.use(isLoggedIn);

// List all vehicles
router.get(
    "/",
    vehicleController.listVehicles
);

// Render add vehicle form
router.get(
    "/add",
    vehicleController.renderAddForm
);

// Create a new vehicle
router.post(
    "/",
    vehicleController.createVehicle
);

// Get vehicles by customer (API)
router.get(
    "/by-customer/:customerId",
    vehicleController.getByCustomer
);

// View single vehicle
router.get(
    "/:id",
    vehicleController.viewVehicle
);

// Render edit form
router.get(
    "/:id/edit",
    vehicleController.renderEditForm
);

// Update vehicle
router.post(
    "/:id",
    vehicleController.updateVehicle
);

// Delete vehicle
router.post(
    "/:id/delete",
    vehicleController.deleteVehicle
);

module.exports = router;
