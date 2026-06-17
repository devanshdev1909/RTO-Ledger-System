const pool = require("../config/db");
const Customer = require("../models/Customer");
const Ledger = require("../models/Ledger");
const Receipt = require("../models/Receipt");
const ServiceRequest = require("../models/ServiceRequest");
const Vehicle = require("../models/Vehicle");
const Service = require("../models/Service");

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
            const ledger = await Ledger.create(
                customer_id,
                vehicle_id || null,
                service_request_id,
                fee,
                paid,
                status || "Unpaid",
                client
            );

            const ledgerId = ledger.id;

            // Generate receipt automatically if amount paid >= 0
            if (paid >= 0) {
                const receiptNo = await Receipt.getNextReceiptNo();
                await Receipt.create(
                    receiptNo,
                    ledgerId,
                    customer_id,
                    paid,
                    payment_mode || 'Cash',
                    '',
                    req.session.userId || null,
                    client
                );
            }

            // Mark service request as Completed
            await ServiceRequest.updateStatus(service_request_id, 'Completed', client);

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

        const vehicles = await Vehicle.getByCustomerId(ledger.customer_id);
        const services = await Service.getActiveServices();

        res.render("ledger/edit", {
            activePage: "ledger",
            userName: req.session.userName,
            ledger: ledger,
            vehicles: vehicles,
            services: services
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
                const receiptNo = await Receipt.getNextReceiptNo();
                await Receipt.create(
                    receiptNo,
                    id,
                    null, // customer_id isn't directly available here without joining, but it's okay or we can omit
                    diff,
                    payment_mode || 'Cash',
                    '',
                    req.session.userId || null,
                    client
                );
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
