const express = require("express");
const router = express.Router();

const ledgerController = require(
    "../controllers/ledger.controller"
);

const { isLoggedIn } = require("../middleware/auth");

// All ledger routes require login
router.use(isLoggedIn);

// List all ledger entries
router.get(
    "/",
    ledgerController.listEntries
);

// Render add entry form
router.get(
    "/add",
    ledgerController.renderAddForm
);

// Create a new ledger entry
router.post(
    "/",
    ledgerController.createEntry
);

// View customer ledger
router.get(
    "/customer/:customerId",
    ledgerController.customerLedger
);

// View single entry
router.get(
    "/:id",
    ledgerController.viewEntry
);

// Delete entry
router.post(
    "/:id/delete",
    ledgerController.deleteEntry
);

module.exports = router;
