const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicle.controller");
const { isLoggedIn, hasPermission } = require("../middleware/auth");

router.get("/", isLoggedIn, hasPermission('vehicle.view'), vehicleController.index);
router.post("/", isLoggedIn, hasPermission('vehicle.create'), vehicleController.create);
router.put("/:id", isLoggedIn, hasPermission('vehicle.create'), vehicleController.update);
router.delete("/:id", isLoggedIn, hasPermission('vehicle.create'), vehicleController.delete);
router.patch("/:id/toggle-status", isLoggedIn, hasPermission('vehicle.create'), vehicleController.toggleStatus);

module.exports = router;

