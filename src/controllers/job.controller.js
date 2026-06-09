const Job = require("../models/Job");
const Customer = require("../models/Customer");
const Vehicle = require("../models/Vehicle");

// Render jobs list page
module.exports.listJobs = async (req, res) => {
    try {
        const jobs = await Job.findAll();
        res.render("jobs/index", { jobs });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load jobs");
        res.redirect("/dashboard");
    }
};

// Render add job form
module.exports.renderAddForm = async (req, res) => {
    try {
        const customers = await Customer.findAll();
        res.render("jobs/add", { customers });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load form");
        res.redirect("/jobs");
    }
};

// Create a new job
module.exports.createJob = async (req, res) => {
    try {
        const {
            customerId,
            vehicleId,
            serviceType,
            description,
            totalAmount,
            paidAmount
        } = req.body;

        await Job.create(
            customerId,
            vehicleId,
            serviceType,
            description,
            totalAmount,
            paidAmount || 0,
            "pending",
            req.session.userId
        );

        req.flash("success", "Job created successfully");
        res.redirect("/jobs");
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to create job");
        res.redirect("/jobs/add");
    }
};

// View single job details
module.exports.viewJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            req.flash("error", "Job not found");
            return res.redirect("/jobs");
        }

        res.render("jobs/view", { job });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load job");
        res.redirect("/jobs");
    }
};

// Render edit job form
module.exports.renderEditForm = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            req.flash("error", "Job not found");
            return res.redirect("/jobs");
        }

        res.render("jobs/edit", { job });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load job");
        res.redirect("/jobs");
    }
};

// Update job
module.exports.updateJob = async (req, res) => {
    try {
        const {
            serviceType,
            description,
            totalAmount,
            paidAmount,
            status
        } = req.body;

        await Job.update(
            req.params.id,
            serviceType,
            description,
            totalAmount,
            paidAmount,
            status
        );

        req.flash("success", "Job updated successfully");
        res.redirect(`/jobs/${req.params.id}`);
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to update job");
        res.redirect(`/jobs/${req.params.id}/edit`);
    }
};

// Record payment for a job
module.exports.recordPayment = async (req, res) => {
    try {
        const { amount } = req.body;

        await Job.updatePayment(req.params.id, amount);

        req.flash("success", "Payment recorded successfully");
        res.redirect(`/jobs/${req.params.id}`);
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to record payment");
        res.redirect(`/jobs/${req.params.id}`);
    }
};

// Delete job
module.exports.deleteJob = async (req, res) => {
    try {
        await Job.delete(req.params.id);
        req.flash("success", "Job deleted successfully");
        res.redirect("/jobs");
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to delete job");
        res.redirect("/jobs");
    }
};
