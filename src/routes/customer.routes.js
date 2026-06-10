const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");

// Show customers page
router.get("/", customerController.renderCustomersPage);

module.exports = router;