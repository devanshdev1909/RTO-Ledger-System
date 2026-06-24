const express = require("express");
const router = express.Router();
const ledgerController = require("../controllers/ledger.controller");
const { isLoggedIn, hasPermission } = require("../middleware/auth");

router.get("/", isLoggedIn, hasPermission('ledger.view'), ledgerController.index);
router.get("/:id/edit", isLoggedIn, hasPermission('ledger.create'), ledgerController.renderEdit);
router.put("/:id", isLoggedIn, hasPermission('ledger.create'), ledgerController.update);
router.get("/customer/:customerId", isLoggedIn, hasPermission('ledger.view'), ledgerController.customerLedger);

module.exports = router;
