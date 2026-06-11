const pool = require("../config/db");

// List all ledger entries
module.exports.index = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                l.*,
                c.name AS customer_name,
                c.customer_code,
                v.vehicle_number,
                s.service_name
            FROM ledgers l
            LEFT JOIN customers c ON l.customer_id = c.id
            LEFT JOIN vehicles v ON l.vehicle_id = v.id
            LEFT JOIN service_requests sr ON l.service_request_id = sr.id
            LEFT JOIN services s ON sr.service_id = s.id
            ORDER BY l.created_at DESC
`);


        res.render("ledger/index", {
            activePage: "ledger",
            userName: req.session.userName,
            ledgers: result.rows
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

// Show ledger for a specific customer
module.exports.customerLedger = async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await pool.query(
            "SELECT * FROM customers WHERE id = $1", [customerId]
        );

        if (customer.rows.length === 0) {
            return res.send("Customer not found");
        }

        const ledgers = await pool.query(`
            SELECT 
                l.*,
                v.vehicle_number,
                s.service_name
            FROM ledgers l
            LEFT JOIN vehicles v ON l.vehicle_id = v.id
            LEFT JOIN service_requests sr ON l.service_request_id = sr.id
            LEFT JOIN services s ON sr.service_id = s.id
            WHERE l.customer_id = $1
            ORDER BY l.created_at DESC
        `, [customerId]);

        const totals = ledgers.rows.reduce((acc, row) => {
            acc.totalFee += parseFloat(row.service_fee || 0);
            acc.totalPaid += parseFloat(row.amount_paid || 0);
            acc.totalDue += parseFloat(row.due_amount || 0);
            return acc;
        }, { totalFee: 0, totalPaid: 0, totalDue: 0 });

        res.render("ledger/customer", {
            activePage: "ledger",
            userName: req.session.userName,
            customer: customer.rows[0],
            ledgers: ledgers.rows,
            totals
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

// Render new ledger entry form
module.exports.renderNew = async (req, res) => {
    try {
        const availableRequests = await pool.query(`
            SELECT 
                sr.id,
                sr.request_no,
                sr.customer_id,
                sr.vehicle_id,
                sr.amount,
                c.name AS customer_name,
                v.vehicle_number,
                s.service_name
            FROM service_requests sr
            LEFT JOIN ledgers l ON sr.id = l.service_request_id
            JOIN customers c ON sr.customer_id = c.id
            LEFT JOIN vehicles v ON sr.vehicle_id = v.id
            JOIN services s ON sr.service_id = s.id
            WHERE l.id IS NULL AND sr.status = 'Pending'
            ORDER BY sr.created_at DESC
        `);

        res.render("ledger/new", {
            activePage: "ledger",
            userName: req.session.userName,
            requests: availableRequests.rows
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};




// Create new ledger entry
module.exports.create = async (req, res) => {
    try {
        const { service_request_id, customer_id, vehicle_id, service_fee, amount_paid, status } = req.body;

        if (!customer_id || !service_fee || !service_request_id) {
            return res.send("Customer, Service Fee, and Service Request are required");
        }

        const fee = parseFloat(service_fee) || 0;
        const paid = parseFloat(amount_paid) || 0;

        // Start transaction
        await pool.query('BEGIN');

        // Insert ledger
        await pool.query(`
            INSERT INTO ledgers (customer_id, vehicle_id, service_request_id, service_fee, amount_paid, status)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [
            customer_id,
            vehicle_id || null,
            service_request_id,
            fee,
            paid,
            status || "Unpaid"
        ]);

        // Mark service request as Completed
        await pool.query(`
            UPDATE service_requests
            SET status = 'Completed'
            WHERE id = $1
        `, [service_request_id]);

        await pool.query('COMMIT');

        res.redirect("/ledger");
    } catch (err) {
        await pool.query('ROLLBACK');
        console.log(err);
        res.send(err.message);
    }
};

// Render edit ledger entry form
module.exports.renderEdit = async (req, res) => {
    try {
        const { id } = req.params;
        const ledger = await pool.query(`
    SELECT l.*, c.name AS customer_name, v.vehicle_number
    FROM ledgers l
    LEFT JOIN customers c ON l.customer_id = c.id
    LEFT JOIN vehicles v ON l.vehicle_id = v.id
    WHERE l.id = $1
`, [id]);
        // (Keep your existing query)

        if (ledger.rows.length === 0) return res.send("Ledger entry not found");

        const vehicles = await pool.query("SELECT id, vehicle_number FROM vehicles WHERE customer_id = $1 ORDER BY vehicle_number", [ledger.rows[0].customer_id]);
        // Add this line to fetch services:
        const services = await pool.query("SELECT id, service_name, default_fee FROM services WHERE is_active = true ORDER BY service_name");

        res.render("ledger/edit", {
            activePage: "ledger",
            userName: req.session.userName,
            ledger: ledger.rows[0],
            vehicles: vehicles.rows,
            services: services.rows // Add this line
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

// Update ledger entry
// Update ledger entry
module.exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount_paid, status } = req.body;

        const paid = parseFloat(amount_paid) || 0;

        await pool.query(`
            UPDATE ledgers
            SET amount_paid = $1, status = $2
            WHERE id = $3
        `, [paid, status, id]);

        res.redirect("/ledger");
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};
