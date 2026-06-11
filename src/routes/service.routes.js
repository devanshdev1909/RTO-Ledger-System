const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service.controller");
const { isLoggedIn, hasPermission } = require("../middleware/auth");

router.get("/", isLoggedIn, hasPermission('service.view'), serviceController.showServices);
router.get("/requests", isLoggedIn, hasPermission('service.view'), serviceController.showRequests);
router.get("/requests/new", isLoggedIn, hasPermission('service.create'), serviceController.showNewRequestForm);
router.post("/requests", isLoggedIn, hasPermission('service.create'), serviceController.createRequest);
router.get("/requests/:id", isLoggedIn, hasPermission('service.view'), serviceController.showRequestDetails);
router.get("/requests/:id/edit", isLoggedIn, hasPermission('service.create'), serviceController.showEditRequestForm);
router.put("/requests/:id", isLoggedIn, hasPermission('service.create'), serviceController.updateRequest);
router.delete("/requests/:id", isLoggedIn, hasPermission('service.create'), serviceController.deleteRequest);

router.get("/new", isLoggedIn, hasPermission('user.manage'), serviceController.showNewServiceForm);
router.post("/", isLoggedIn, hasPermission('user.manage'), serviceController.createService);
router.get("/:id/edit", isLoggedIn, hasPermission('user.manage'), serviceController.showEditServiceForm);
router.put("/:id", isLoggedIn, hasPermission('user.manage'), serviceController.updateService);
router.delete("/:id", isLoggedIn, hasPermission('user.manage'), serviceController.deleteService);

module.exports = router;
