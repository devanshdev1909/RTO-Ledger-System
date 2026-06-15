const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { isLoggedIn, hasPermission } = require("../middleware/auth");

router.get("/users", isLoggedIn, hasPermission('user.manage'), userController.listUsers);
router.post("/users", isLoggedIn, hasPermission('user.manage'), userController.createUser);
router.patch("/users/:id/toggle-status", isLoggedIn, hasPermission('user.manage'), userController.toggleUserStatus);
router.get("/users/:id/permissions", isLoggedIn, hasPermission('user.manage'), userController.renderEditPermissions);
router.post("/users/:id/permissions", isLoggedIn, hasPermission('user.manage'), userController.updatePermissions);
router.delete("/users/:id", isLoggedIn, hasPermission('user.manage'), userController.deleteUser);

module.exports = router;
