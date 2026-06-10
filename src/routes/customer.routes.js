const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");

// Show customers page
router.get("/", customerController.renderCustomersPage);

//Show form 
router.get("/new", customerController.showNewCustomerForm);

//Save customer
router.post("/", customerController.createCustomer);

module.exports = router;