const db = require("../config/db");
const mailer = require('../utils/mailer');
const Ledger = require('../models/Ledger');
const Receipt = require('../models/Receipt');
const ServiceRequest = require('../models/ServiceRequest');

// Helper function to fetch request details and send email
const sendUpdateNotification = async (id) => {
    try {
        console.log("DEBUG: sendUpdateNotification called for id:", id);
        const reqDetailsRes = await db.query(`
            SELECT sr.*, c.name AS customer_name, c.email AS customer_email, v.vehicle_number, s.service_name 
            FROM service_requests sr
            LEFT JOIN customers c ON sr.customer_id = c.id
            LEFT JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN services s ON sr.service_id = s.id
            WHERE sr.id = $1
        `, [id]);

        console.log("DEBUG: Query result length:", reqDetailsRes.rows.length);
        if (reqDetailsRes.rows.length > 0) {
            const updatedRequest = reqDetailsRes.rows[0];
            console.log("DEBUG: customer email is:", updatedRequest.customer_email);
            return await mailer.sendStatusUpdateEmail(updatedRequest.customer_email, updatedRequest.customer_name, updatedRequest);
        }
        return { success: false, error: "No request details found" };
    } catch (mailErr) {
        console.error("Failed to send status update email:", mailErr);
        return { success: false, error: mailErr.message };
    }
};

const apiGetActiveServices = async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, service_name, default_fee FROM services WHERE is_active = true ORDER BY service_name"
        );
        res.json({ success: true, services: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// SERVICES PAGE
const showServices = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const result = await db.query(`
            SELECT *
            FROM services
            ORDER BY id DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countRes = await db.query(`SELECT COUNT(*) FROM services`);
        const totalPages = Math.ceil(parseInt(countRes.rows[0].count) / limit);

        res.render("services/index", {
            activePage: "services",
            services: result.rows,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};

const showNewServiceForm = (req, res) => {
    res.render("services/new", {
        activePage: "services"
    });
};

const createService = async (req, res) => {
    try {
        const { service_name, default_fee, description, is_active } = req.body;
        const activeValue = true;
        await db.query(`
            INSERT INTO services (service_name, default_fee, description, is_active)
            VALUES ($1, $2, $3, $4)
        `, [service_name, default_fee, description, activeValue]);
        res.redirect("/services");
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};

const showEditServiceForm = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query("SELECT * FROM services WHERE id = $1", [id]);
        if (!result.rows.length) {
            return res.status(404).send("Service not found");
        }
        res.render("services/edit", {
            activePage: "services",
            service: result.rows[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};

const updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { service_name, default_fee, description, is_active } = req.body;
        await db.query(`
            UPDATE services
            SET service_name = $1,
                default_fee = $2,
                description = $3
            WHERE id = $4
        `, [service_name, default_fee, description, id]);
        res.redirect("/services");
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};

const deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM services WHERE id = $1", [id]);
        res.redirect("/services");
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};

// SERVICE REQUEST LIST
const showRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const result = await db.query(`
            SELECT sr.*, c.name AS customer_name, v.vehicle_number, s.service_name
            FROM service_requests sr
            LEFT JOIN customers c ON sr.customer_id = c.id
            LEFT JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN services s ON sr.service_id = s.id
            ORDER BY sr.id DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset]);

        const countRes = await db.query(`SELECT COUNT(*) FROM service_requests`);
        const totalPages = Math.ceil(parseInt(countRes.rows[0].count) / limit);

        // Fetch data needed for the Modal dropdowns
        const customers = await db.query(`SELECT id, name FROM customers ORDER BY name`);
        const vehicles = await db.query(`SELECT id, vehicle_number, customer_id FROM vehicles ORDER BY vehicle_number`);
        const services = await db.query(`SELECT id, service_name, default_fee FROM services WHERE is_active = true ORDER BY service_name`);

        res.render("service_requests/index", {
            activePage: "service_requests",
            requests: result.rows,
            currentPage: page,
            totalPages: totalPages,
            customers: customers.rows,
            vehicles: vehicles.rows,
            services: services.rows
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};


// NEW REQUEST FORM
const showNewRequestForm = async (req, res) => {
    try {
        const customers = await db.query(`
            SELECT id, name
            FROM customers
            ORDER BY name
        `);

        const vehicles = await db.query(`
            SELECT id, vehicle_number, customer_id
            FROM vehicles
            ORDER BY vehicle_number
        `);

        const services = await db.query(`
            SELECT
                id,
                service_name,
                default_fee
            FROM services
            WHERE is_active = true
            ORDER BY service_name
        `);

        res.render("service_requests/new", {
            activePage: "service_requests",
            customers: customers.rows,
            vehicles: vehicles.rows,
            services: services.rows
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};

// CREATE SERVICE REQUEST
const crypto = require('crypto');

const createRequest = async (req, res) => {
    const client = await db.connect();
    try {
        const {
            customer_id,
            vehicle_id,
            service_id,
            amount,
            status,
            remarks,
            payment_method,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // Block duplicate: same vehicle + same service still active
        const isDuplicate = await ServiceRequest.checkDuplicate(vehicle_id, service_id);
        if (isDuplicate) {
            return res.status(409).send(
                `<script>alert('A service request for this vehicle and service already exists and is still active. Please complete or cancel the existing request first.'); window.history.back();</script>`
            );
        }

        let isPaid = false;
        let paymentMode = 'Cash';

        if (payment_method === 'Razorpay') {
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.status(400).send("Missing Razorpay payment details.");
            }
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(razorpay_order_id + '|' + razorpay_payment_id)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).send("Payment signature verification failed.");
            }
            isPaid = true;
            paymentMode = 'Razorpay';
        } else if (payment_method === 'Cash') {
            isPaid = true;
            paymentMode = 'Cash';
        }

        await client.query('BEGIN');

        // 1. Create Service Request
        const requestNo = 'REQ' + Date.now();
        const fullRemarks = (payment_method === 'Razorpay' ? `Paid via Razorpay (${razorpay_payment_id}) | ` : '') + (remarks || '');
        const srResult = await client.query(
            `INSERT INTO service_requests (request_no, customer_id, vehicle_id, service_id, amount, status, remarks)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
            [requestNo, customer_id, vehicle_id || null, service_id, amount, status || 'Pending', fullRemarks]
        );
        const serviceRequestId = srResult.rows[0].id;

        // 2. Create Ledger entry
        const parsedAmount = parseFloat(amount) || 0;
        const amountPaid = isPaid ? parsedAmount : 0;
        const ledgerStatus = isPaid ? 'Paid' : 'Unpaid';
        
        const ledgerResult = await Ledger.create(
            customer_id,
            vehicle_id || null,
            serviceRequestId,
            parsedAmount,   // service_fee
            amountPaid,     // amount_paid
            ledgerStatus,
            client
        );

        // 3. Generate Receipt if Paid
        let receiptNoForEmail = null;
        if (isPaid && parsedAmount > 0) {
            const receiptNo = await Receipt.getNextReceiptNo(client);
            receiptNoForEmail = receiptNo;
            await Receipt.create(
                receiptNo,
                ledgerResult.id,
                customer_id,
                parsedAmount,
                paymentMode,
                '',
                req.session.userId || null,
                client
            );
        }

        await client.query('COMMIT');

        // 4. Send Receipt Email (Fire and forget)
        if (isPaid && parsedAmount > 0 && receiptNoForEmail) {
            const customerRes = await db.query('SELECT email, name FROM customers WHERE id = $1', [customer_id]);
            if (customerRes.rows.length > 0 && customerRes.rows[0].email) {
                const receiptDetails = {
                    receipt_no: receiptNoForEmail,
                    amount: parsedAmount,
                    payment_mode: paymentMode,
                    remarks: ''
                };
                require("../utils/mailer").sendReceiptEmail(customerRes.rows[0].email, customerRes.rows[0].name, receiptDetails)
                    .catch(e => console.error("Receipt email failed:", e));
            }
        }

        res.redirect('/services/requests');

    } catch (err) {
        await client.query('ROLLBACK');
        console.log(err);
        res.status(500).send('Server Error');
    } finally {
        client.release();
    }
};

const showRequestDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(`
            SELECT
                sr.*,
                c.name AS customer_name,
                v.vehicle_number,
                s.service_name,
                s.default_fee
            FROM service_requests sr
            LEFT JOIN customers c ON sr.customer_id = c.id
            LEFT JOIN vehicles v ON sr.vehicle_id = v.id
            LEFT JOIN services s ON sr.service_id = s.id
            WHERE sr.id = $1
        `, [id]);

        if (!result.rows.length) {
            return res.status(404).send("Service request not found");
        }

        res.render("service_requests/show", {
            activePage: "service_requests",
            request: result.rows[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};

const showEditRequestForm = async (req, res) => {
    try {
        const { id } = req.params;
        const requestResult = await db.query(`
            SELECT *
            FROM service_requests
            WHERE id = $1
        `, [id]);

        if (!requestResult.rows.length) {
            return res.status(404).send("Service request not found");
        }

        const customers = await db.query(`
            SELECT id, name
            FROM customers
            ORDER BY name
        `);

        const vehicles = await db.query(`
            SELECT id, vehicle_number, customer_id
            FROM vehicles
            ORDER BY vehicle_number
        `);

        const services = await db.query(`
            SELECT id, service_name, default_fee
            FROM services
            WHERE is_active = true
            ORDER BY service_name
        `);

        res.render("service_requests/edit", {
            activePage: "service_requests",
            request: requestResult.rows[0],
            customers: customers.rows,
            vehicles: vehicles.rows,
            services: services.rows
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};

const updateRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            customer_id,
            vehicle_id,
            service_id,
            amount,
            status,
            remarks
        } = req.body;

        // Start transaction
        await db.query('BEGIN');

        // 1. Update the service request itself
        await db.query(`
            UPDATE service_requests
            SET customer_id = $1,
                vehicle_id = $2,
                service_id = $3,
                amount = $4,
                status = $5,
                remarks = $6
            WHERE id = $7
        `, [customer_id, vehicle_id || null, service_id, amount, status, remarks, id]);

        // 2. Fetch the corresponding ledger entry (if it exists) to get the amount paid
        const ledgerRes = await db.query(
            "SELECT amount_paid FROM ledgers WHERE service_request_id = $1",
            [id]
        );

        if (ledgerRes.rows.length > 0) {
            const paid = parseFloat(ledgerRes.rows[0].amount_paid) || 0;
            const fee = parseFloat(amount) || 0;

            // Recalculate the status for the ledger based on the new fee
            let newLedgerStatus = "Unpaid";
            if (fee > 0 && paid >= fee) {
                newLedgerStatus = "Paid";
            } else if (paid > 0 && paid < fee) {
                newLedgerStatus = "Partial";
            }

            // Update the ledger entry with new details
            await db.query(`
                UPDATE ledgers
                SET customer_id = $1,
                    vehicle_id = $2,
                    service_fee = $3,
                    status = $4
                WHERE service_request_id = $5
            `, [customer_id, vehicle_id || null, fee, newLedgerStatus, id]);
        }

        await db.query('COMMIT');

        // Send email notification
        await sendUpdateNotification(id);

        res.redirect("/services/requests");
    } catch (err) {
        await db.query('ROLLBACK');
        console.log(err);
        res.status(500).send("Server Error");
    }
};


const deleteRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM service_requests WHERE id = $1", [id]);
        res.redirect("/services/requests");
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};
const toggleServiceStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        await db.query(
            "UPDATE services SET is_active = $1 WHERE id = $2",
            [is_active, id]
        );
        res.json({ success: true, message: "Service status updated successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: err.message });
    }
};
const updateRequestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status input
        if (!["Requested", "Pending", "Completed", "Cancelled"].includes(status)) {
            return res.status(400).json({ success: false, error: "Invalid status value" });
        }

        await db.query(
            "UPDATE service_requests SET status = $1 WHERE id = $2",
            [status, id]
        );

        // Send email notification
        const emailResult = await sendUpdateNotification(id);
        
        if (emailResult && !emailResult.success) {
            return res.json({ success: false, error: "Status updated but email failed: " + emailResult.error });
        }

        res.json({ success: true, message: "Status updated successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: err.message });
    }
};


module.exports = {
    apiGetActiveServices,
    showServices,
    showNewServiceForm,
    createService,
    showEditServiceForm,
    updateService,
    deleteService,
    showRequests,
    showNewRequestForm,
    createRequest,
    showRequestDetails,
    showEditRequestForm,
    updateRequest,
    deleteRequest,
    toggleServiceStatus,
    updateRequestStatus
};