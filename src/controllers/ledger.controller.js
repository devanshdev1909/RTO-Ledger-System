const pool = require("../config/db");
const Customer = require("../models/Customer");
const Ledger = require("../models/Ledger");

// List all ledger entries
// List all ledger entries
module.exports.index = async (req, res) => {
    try {
        const ledgers = await Ledger.getAll();

        // ADD THIS NEW QUERY TO FETCH SERVICE REQUESTS
        const availableRequests = await Ledger.getPendingRequests();

        res.render("ledger/index", {
            activePage: "ledger",
            userName: req.session.userName,
            ledgers: ledgers,
            requests: availableRequests // PASS IT TO THE VIEW HERE
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

        const customer = await Customer.findById(customerId);
        
        if (!customer) {
            return res.send("Customer not found");
        }

        const ledgers = await Ledger.findByCustomerId(customerId);

        const totals = ledgers.reduce((acc, row) => {
            acc.totalFee += parseFloat(row.service_fee || 0);
            acc.totalPaid += parseFloat(row.amount_paid || 0);
            acc.totalDue += parseFloat(row.due_amount || 0);
            return acc;
        }, { totalFee: 0, totalPaid: 0, totalDue: 0 });

        res.render("ledger/customer", {
            activePage: "ledger",
            userName: req.session.userName,
            customer: customer,
            ledgers: ledgers,
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
        const availableRequests = await Ledger.getPendingRequests();

        res.render("ledger/new", {
            activePage: "ledger",
            userName: req.session.userName,
            requests: availableRequests
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

        if (paid > fee) {
            return res.status(400).send("Amount paid cannot be greater than the service fee");
        }

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

            // Generate receipt automatically if amount paid >= 0
            if (paid >= 0) {
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
        const ledger = await Ledger.findById(id);
        // (Keep your existing query)

        if (!ledger) return res.send("Ledger entry not found");

        const vehicles = await pool.query("SELECT id, vehicle_number FROM vehicles WHERE customer_id = $1 ORDER BY vehicle_number", [ledger.customer_id]);
        // Add this line to fetch services:
        const services = await pool.query("SELECT id, service_name, default_fee FROM services WHERE is_active = true ORDER BY service_name");

        res.render("ledger/edit", {
            activePage: "ledger",
            userName: req.session.userName,
            ledger: ledger,
            vehicles: vehicles.rows,
            services: services.rows
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

            // Fetch original ledger record to calculate payment difference and validate fee
            const originalLedger = await Ledger.getPaymentDetails(id, client);
            if (!originalLedger) {
                throw new Error("Ledger entry not found");
            }
            const oldPaid = parseFloat(originalLedger.amount_paid) || 0;
            const fee = parseFloat(originalLedger.service_fee) || 0;

            if (paid > fee) {
                throw new Error("Amount paid cannot be greater than the service fee");
            }

            // Update ledger record
            await Ledger.updatePayment(id, paid, status, client);

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
