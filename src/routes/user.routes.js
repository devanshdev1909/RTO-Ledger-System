const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { isLoggedIn, hasPermission } = require("../middleware/auth");

router.get("/users", isLoggedIn, hasPermission('user.manage'), userController.listUsers);
router.get("/users/:id/permissions", isLoggedIn, hasPermission('user.manage'), userController.renderEditPermissions);
router.post("/users/:id/permissions", isLoggedIn, hasPermission('user.manage'), userController.updatePermissions);

module.exports = router;
