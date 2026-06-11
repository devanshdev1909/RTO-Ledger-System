const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");

// Show customers page
router.get("/", customerController.renderCustomersPage);

//Show form 
router.get("/new", customerController.showNewCustomerForm);

//Save customer
router.post("/", customerController.createCustomer);

// Show edit form
router.get("/:id/edit", customerController.showEditCustomerForm);

// Update customer (method-override converts POST → PUT)
router.put("/:id", customerController.updateCustomer);

// Delete customer (method-override converts POST → DELETE)
router.delete("/:id", customerController.deleteCustomer);


module.exports = router;