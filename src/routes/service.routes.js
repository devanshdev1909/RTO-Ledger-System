const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/service.controller");
const { isLoggedIn, hasPermission } = require("../middleware/auth");

router.get("/api/active", isLoggedIn, serviceController.apiGetActiveServices);
router.get("/", isLoggedIn, hasPermission('service.view'), serviceController.showServices);
router.get("/requests", isLoggedIn, hasPermission('service.view'), serviceController.showRequests);
router.post("/requests", isLoggedIn, hasPermission('service.create'), serviceController.createRequest);
router.get("/requests/:id", isLoggedIn, hasPermission('service.view'), serviceController.showRequestDetails);
router.put("/requests/:id", isLoggedIn, hasPermission('service.create'), serviceController.updateRequest);
router.delete("/requests/:id", isLoggedIn, hasPermission('service.create'), serviceController.deleteRequest);

router.post("/", isLoggedIn, hasPermission('user.manage'), serviceController.createService);
router.put("/:id", isLoggedIn, hasPermission('user.manage'), serviceController.updateService);
router.delete("/:id", isLoggedIn, hasPermission('user.manage'), serviceController.deleteService);
router.patch("/:id/toggle-status", isLoggedIn, hasPermission('user.manage'), serviceController.toggleServiceStatus);
router.patch("/requests/:id/status", isLoggedIn, hasPermission('service.create'), serviceController.updateRequestStatus);

module.exports = router;
