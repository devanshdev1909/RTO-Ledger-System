const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service.controller");

router.get("/", serviceController.showServices);
router.get("/requests", serviceController.showRequests);
router.get("/requests/new", serviceController.showNewRequestForm);
router.post("/requests", serviceController.createRequest);
router.get("/requests/:id", serviceController.showRequestDetails);
router.get("/requests/:id/edit", serviceController.showEditRequestForm);
router.put("/requests/:id", serviceController.updateRequest);
router.delete("/requests/:id", serviceController.deleteRequest);

router.get("/new", serviceController.showNewServiceForm);
router.post("/", serviceController.createService);
router.get("/:id/edit", serviceController.showEditServiceForm);
router.put("/:id", serviceController.updateService);
router.delete("/:id", serviceController.deleteService);

module.exports = router;