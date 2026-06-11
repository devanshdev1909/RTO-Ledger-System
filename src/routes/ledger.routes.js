const express = require("express");
const router = express.Router();
const ledgerController = require("../controllers/ledger.controller");
const { isLoggedIn } = require("../middleware/auth");

// All ledger entries
router.get("/", isLoggedIn, ledgerController.index);

// New ledger entry
router.get("/new", isLoggedIn, ledgerController.renderNew);
router.post("/", isLoggedIn, ledgerController.create);

// Edit ledger entry
router.get("/:id/edit", isLoggedIn, ledgerController.renderEdit);
router.put("/:id", isLoggedIn, ledgerController.update);

// Customer-specific ledger
router.get("/customer/:customerId", isLoggedIn, ledgerController.customerLedger);

module.exports = router;
