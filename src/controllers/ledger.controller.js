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




// Create new ledger entry and generate receipt
module.exports.create = async (req, res) => {
    try {
        const { service_request_id, customer_id, vehicle_id, service_fee, amount_paid, status, payment_mode } = req.body;

        if (!customer_id || !service_fee || !service_request_id) {
            return res.send("Customer, Service Fee, and Service Request are required");
        }

        const fee = parseFloat(service_fee) || 0;
        const paid = parseFloat(amount_paid) || 0;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert ledger entry
            const ledgerRes = await client.query(`
                INSERT INTO ledgers (customer_id, vehicle_id, service_request_id, service_fee, amount_paid, status)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `, [
                customer_id,
                vehicle_id || null,
                service_request_id,
                fee,
                paid,
                status || "Unpaid"
            ]);

            const ledgerId = ledgerRes.rows[0].id;

            // Generate receipt automatically if amount paid > 0
            if (paid > 0) {
                const nextIdRes = await client.query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM receipts");
                const nextId = nextIdRes.rows[0].next_id;
                const receiptNo = "RCPT" + String(nextId).padStart(3, '0');

                await client.query(`
                    INSERT INTO receipts (receipt_no, ledger_id, amount_received, payment_mode, received_by)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    receiptNo,
                    ledgerId,
                    paid,
                    payment_mode || 'Cash',
                    req.session.userId || null
                ]);
            }

            // Mark service request as Completed
            await client.query(`
                UPDATE service_requests
                SET status = 'Completed'
                WHERE id = $1
            `, [service_request_id]);

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        res.redirect("/ledger");
    } catch (err) {
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

// Update ledger entry and generate receipt for the instalment difference
module.exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount_paid, status, payment_mode } = req.body;

        const paid = parseFloat(amount_paid) || 0;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Fetch original ledger record to calculate payment difference
            const originalRes = await client.query("SELECT amount_paid FROM ledgers WHERE id = $1", [id]);
            if (originalRes.rows.length === 0) {
                throw new Error("Ledger entry not found");
            }
            const oldPaid = parseFloat(originalRes.rows[0].amount_paid) || 0;

            // Update ledger record
            await client.query(`
                UPDATE ledgers
                SET amount_paid = $1, status = $2
                WHERE id = $3
            `, [paid, status, id]);

            // If new amount paid is higher than old, generate a receipt for the payment difference
            if (paid > oldPaid) {
                const diff = paid - oldPaid;
                const nextIdRes = await client.query("SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM receipts");
                const nextId = nextIdRes.rows[0].next_id;
                const receiptNo = "RCPT" + String(nextId).padStart(3, '0');

                await client.query(`
                    INSERT INTO receipts (receipt_no, ledger_id, amount_received, payment_mode, received_by)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    receiptNo,
                    id,
                    diff,
                    payment_mode || 'Cash',
                    req.session.userId || null
                ]);
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        res.redirect("/ledger");
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};
