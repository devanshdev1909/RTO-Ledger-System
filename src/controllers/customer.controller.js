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

const showEditCustomerForm = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
        if (result.rows.length === 0) return res.send("Customer not found");
        res.render("customers/edit", {
            activePage: "customers",
            customer: result.rows[0],
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
        await pool.query(
            `UPDATE customers SET customer_code=$1, name=$2, mobile=$3, email=$4, address=$5 WHERE id=$6`,
            [customer_code, name, mobile, email, address, id]
        );
        res.redirect("/customers");
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM customers WHERE id = $1", [id]);
        res.redirect("/customers");
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};


module.exports = {
    renderCustomersPage,
    showNewCustomerForm,
    createCustomer,
    showEditCustomerForm,
    updateCustomer,
    deleteCustomer
};
