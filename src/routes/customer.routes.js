const express = require("express");
const router = express.Router();

const customerController = require(
    "../controllers/customer.controller"
);

const { isLoggedIn } = require("../middleware/auth");

// All customer routes require login
router.use(isLoggedIn);

// List all customers
router.get(
    "/",
    customerController.listCustomers
);

// Render add customer form
router.get(
    "/add",
    customerController.renderAddForm
);

// Create a new customer
router.post(
    "/",
    customerController.createCustomer
);

// Search customers (API)
router.get(
    "/search",
    customerController.searchCustomers
);

// View single customer
router.get(
    "/:id",
    customerController.viewCustomer
);

// Render edit form
router.get(
    "/:id/edit",
    customerController.renderEditForm
);

// Update customer
router.post(
    "/:id",
    customerController.updateCustomer
);

// Delete customer
router.post(
    "/:id/delete",
    customerController.deleteCustomer
);

module.exports = router;
