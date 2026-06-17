const Customer = require("../models/Customer");

const renderCustomersPage = async (req, res) => {
    try {
        const customers = await Customer.getAll();
        const nextCustomerCode = await Customer.getNextCustomerCode();

        res.render("customers/staff/index", {
            activePage: "customers",
            customers: customers,
            userName: req.session.userName,
            nextCustomerCode
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

const showNewCustomerForm = async (req, res) => {
    try {
        const nextCustomerCode = await Customer.getNextCustomerCode();
        res.render("customers/staff/new", {
            activePage: "customers",
            userName: req.session.userName,
            nextCustomerCode
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

const createCustomer = async (req, res) => {
    try {
        let { customer_code, name, mobile, email, address } = req.body;
        if (!customer_code || customer_code === "CUST-") {
            customer_code = await Customer.getNextCustomerCode();
        }
        await Customer.createStaff(customer_code, name, mobile, email, address, req.session.userId);
        res.redirect("/customers");
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

const showEditCustomerForm = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.getById(id);
        if (!customer) return res.send("Customer not found");
        res.render("customers/staff/edit", {
            activePage: "customers",
            customer: customer,
            userName: req.session.userName
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { customer_code, name, mobile, email, address } = req.body;
        await Customer.update(id, customer_code, name, mobile, email, address);
        res.redirect("/customers");
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await Customer.delete(id);
        res.redirect("/customers");
    } catch (err) {
        console.log(err);
        if (err.code === '23503' || (err.message && err.message.includes('violates foreign key constraint'))) {
            return res.send("Cannot delete this customer because they are currently linked to existing vehicles, service requests, or ledgers. Please remove those connections first.");
        }
        res.send(err.message);
    }
};

const toggleCustomerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        await Customer.toggleStatus(id, is_active);
        res.json({ success: true, message: "Customer status updated successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    renderCustomersPage,
    showNewCustomerForm,
    createCustomer,
    showEditCustomerForm,
    updateCustomer,
    deleteCustomer,
    toggleCustomerStatus
};
