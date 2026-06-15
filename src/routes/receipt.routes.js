const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receipt.controller");
const { isLoggedIn, hasPermission } = require("../middleware/auth");

router.get("/", isLoggedIn, hasPermission('receipt.print'), receiptController.index);
router.get("/:id", isLoggedIn, hasPermission('receipt.print'), receiptController.show);

module.exports = router;
