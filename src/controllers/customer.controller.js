const pool = require("../config/db");

const renderCustomersPage = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM customers ORDER BY created_at DESC"
        );
        const nextCustomerCode = await getNextCustomerCode();

        res.render("customers/staff/index", {
            activePage: "customers",
            customers: result.rows,
            userName: req.session.userName,
            nextCustomerCode
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

const getNextCustomerCode = async () => {
    const result = await pool.query(
        "SELECT customer_code FROM customers WHERE customer_code LIKE 'CUST-%'"
    );
    let maxNum = 0;
    result.rows.forEach(row => {
        const match = row.customer_code.match(/^CUST-(\d+)$/i);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) {
                maxNum = num;
            }
        }
    });
    return `CUST-${String(maxNum + 1).padStart(3, '0')}`;
};

const showNewCustomerForm = async (req, res) => {
    try {
        const nextCustomerCode = await getNextCustomerCode();
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
            customer_code = await getNextCustomerCode();
        }
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
        res.render("customers/staff/edit", {
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

const toggleCustomerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        await pool.query(
            "UPDATE customers SET is_active = $1 WHERE id = $2",
            [is_active, id]
        );
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
