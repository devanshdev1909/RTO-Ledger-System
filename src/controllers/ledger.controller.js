const Ledger = require("../models/Ledger");
const Customer = require("../models/Customer");
const Job = require("../models/Job");

// Render ledger entries list
module.exports.listEntries = async (req, res) => {
    try {
        const entries = await Ledger.findAll();
        res.render("ledger/index", { entries });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load ledger");
        res.redirect("/dashboard");
    }
};

// Render add ledger entry form
module.exports.renderAddForm = async (req, res) => {
    try {
        const customers = await Customer.findAll();
        const jobs = await Job.findAll();
        res.render("ledger/add", { customers, jobs });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load form");
        res.redirect("/ledger");
    }
};

// Create a new ledger entry
module.exports.createEntry = async (req, res) => {
    try {
        const {
            jobId,
            customerId,
            amount,
            paymentMode,
            transactionType,
            notes
        } = req.body;

        await Ledger.create(
            jobId || null,
            customerId,
            amount,
            paymentMode,
            transactionType,
            notes,
            req.session.userId
        );

        req.flash("success", "Ledger entry added successfully");
        res.redirect("/ledger");
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to add ledger entry");
        res.redirect("/ledger/add");
    }
};

// View single ledger entry
module.exports.viewEntry = async (req, res) => {
    try {
        const entry = await Ledger.findById(req.params.id);

        if (!entry) {
            req.flash("error", "Entry not found");
            return res.redirect("/ledger");
        }

        res.render("ledger/view", { entry });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load entry");
        res.redirect("/ledger");
    }
};

// View customer ledger
module.exports.customerLedger = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.customerId);
        const entries = await Ledger.findByCustomerId(req.params.customerId);
        const balance = await Ledger.getCustomerBalance(req.params.customerId);

        res.render("ledger/customer", { customer, entries, balance });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load customer ledger");
        res.redirect("/ledger");
    }
};

// Delete ledger entry
module.exports.deleteEntry = async (req, res) => {
    try {
        await Ledger.delete(req.params.id);
        req.flash("success", "Entry deleted successfully");
        res.redirect("/ledger");
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to delete entry");
        res.redirect("/ledger");
    }
};
