const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role.controller");
const { isLoggedIn, hasPermission } = require("../middleware/auth");

// Make sure only users with role.manage permission can access these routes
router.use(isLoggedIn);
router.use(hasPermission('role.manage'));

router.get("/", roleController.getRoles);
router.post("/", roleController.postCreateRole);
router.post("/:id/delete", roleController.postDeleteRole);
router.get("/:id/permissions", roleController.getRolePermissions);
router.post("/:id/permissions", roleController.postUpdateRolePermissions);

module.exports = router;
