const Customer = require("../models/Customer");

module.exports.index = async (req, res) => {
    const customers =
        await Customer.getAllCustomers();

    res.render(
        "customers/index",
        { customers }
    );
};

module.exports.renderNewForm = (req, res) => {
    res.render("customers/new");
};

module.exports.createCustomer = async (req, res) => {

    const {
        customer_code,
        name,
        mobile,
        email,
        address
    } = req.body;

    await Customer.createCustomer(
        customer_code,
        name,
        mobile,
        email,
        address,
        req.session.userId
    );

    res.redirect("/customers");
};
module.exports.renderEditForm =
async (req, res) => {

    const customer =
        await Customer.getCustomerById(
            req.params.id
        );

    res.render(
        "customers/edit",
        { customer }
    );
};