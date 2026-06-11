const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receipt.controller");
const { isLoggedIn } = require("../middleware/auth");

// Only show listing and details for viewing/printing
router.get("/", isLoggedIn, receiptController.index);
router.get("/:id", isLoggedIn, receiptController.show);

module.exports = router;
