const Customer = require("../models/Customer");

// Render customers list page
module.exports.listCustomers = async (req, res) => {
    try {
        const customers = await Customer.findAll();
        res.render("customers/index", { customers });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load customers");
        res.redirect("/dashboard");
    }
};

// Render add customer form
module.exports.renderAddForm = (req, res) => {
    res.render("customers/add");
};

// Create a new customer
module.exports.createCustomer = async (req, res) => {
    try {
        const { fullName, mobile, email, address, aadharNumber } = req.body;

        await Customer.create(
            fullName,
            mobile,
            email,
            address,
            aadharNumber,
            req.session.userId
        );

        req.flash("success", "Customer added successfully");
        res.redirect("/customers");
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to add customer");
        res.redirect("/customers/add");
    }
};

// View single customer details
module.exports.viewCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            req.flash("error", "Customer not found");
            return res.redirect("/customers");
        }

        res.render("customers/view", { customer });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load customer");
        res.redirect("/customers");
    }
};

// Render edit customer form
module.exports.renderEditForm = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            req.flash("error", "Customer not found");
            return res.redirect("/customers");
        }

        res.render("customers/edit", { customer });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load customer");
        res.redirect("/customers");
    }
};

// Update customer
module.exports.updateCustomer = async (req, res) => {
    try {
        const { fullName, mobile, email, address, aadharNumber } = req.body;

        await Customer.update(
            req.params.id,
            fullName,
            mobile,
            email,
            address,
            aadharNumber
        );

        req.flash("success", "Customer updated successfully");
        res.redirect(`/customers/${req.params.id}`);
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to update customer");
        res.redirect(`/customers/${req.params.id}/edit`);
    }
};

// Delete customer
module.exports.deleteCustomer = async (req, res) => {
    try {
        await Customer.delete(req.params.id);
        req.flash("success", "Customer deleted successfully");
        res.redirect("/customers");
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to delete customer");
        res.redirect("/customers");
    }
};

// Search customers (API endpoint)
module.exports.searchCustomers = async (req, res) => {
    try {
        const { q } = req.query;
        const customers = await Customer.search(q || "");
        res.json(customers);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Search failed" });
    }
};
