const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const { isLoggedIn, hasPermission } = require("../middleware/auth");

router.get("/", isLoggedIn, hasPermission('customer.view'), customerController.renderCustomersPage);
router.get("/new", isLoggedIn, hasPermission('customer.create'), customerController.showNewCustomerForm);
router.post("/", isLoggedIn, hasPermission('customer.create'), customerController.createCustomer);
router.get("/:id/edit", isLoggedIn, hasPermission('customer.edit'), customerController.showEditCustomerForm);
router.put("/:id", isLoggedIn, hasPermission('customer.edit'), customerController.updateCustomer);
router.delete("/:id", isLoggedIn, hasPermission('customer.edit'), customerController.deleteCustomer);

module.exports = router;
