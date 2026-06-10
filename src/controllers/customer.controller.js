const pool = require("../config/db");

const renderCustomersPage = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM customers ORDER BY created_at DESC"
        );
        res.render("customers/index", {
            activePage: "customers",
            customers: result.rows,
            userName: req.session.userName
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

const showNewCustomerForm = (req, res) => {
    res.render("customers/new", {
        activePage: "customers",
        userName: req.session.userName
    });
};

const createCustomer = async (req, res) => {
    try {
        const { customer_code, name, mobile, email, address } = req.body;
        await pool.query(
            `INSERT INTO customers (customer_code, name, mobile, email, address, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [customer_code, name, mobile, email, address, req.session.userId]
        );
        res.redirect("/customers");
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

module.exports = {
    renderCustomersPage,
    showNewCustomerForm,
    createCustomer
};