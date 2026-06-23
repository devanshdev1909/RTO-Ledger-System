const crypto = require('crypto'); 
const pool = require('../config/db');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/Service');
const Ledger = require('../models/Ledger');
const Receipt = require('../models/Receipt');

exports.getDashboard = async (req, res) => {
    const customerId = req.session.customerId;
    try {
        // Fetch simple counts for dashboard
        const vehiclesCount = await Vehicle.countByCustomerId(customerId);
        const requestsResult = await ServiceRequest.getStatusCountsByCustomerId(customerId);

        let totalRequests = 0;
        let pendingRequests = 0;
        let completedRequests = 0;

        requestsResult.forEach(r => {
            const count = parseInt(r.count, 10);
            totalRequests += count;
            if (r.status === 'Pending') pendingRequests += count;
            if (r.status === 'Completed') completedRequests += count;
        });

        const vehicles = await Vehicle.getByCustomerId(customerId);
        const services = await Service.getActiveServices();

        res.render('customers/portal/dashboard', {
            vehiclesCount: vehiclesCount,
            totalRequests,
            pendingRequests,
            completedRequests,
            vehicles: vehicles,
            services: services,
            activePage: 'dashboard',
            error: req.query.error || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

exports.getMyVehicles = async (req, res) => {
    const customerId = req.session.customerId;
    if (!customerId) {
        return res.redirect('/login');
    }
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const vehicles = await Vehicle.getByCustomerId(customerId, limit, offset);
        const totalVehicles = await Vehicle.countByCustomerId(customerId);
        const totalPages = Math.ceil(totalVehicles / limit);

        res.render('customers/portal/vehicles', {
            vehicles: vehicles,
            currentPage: page,
            totalPages: totalPages,
            activePage: 'vehicles',
            error: req.query.error || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};



exports.getMyRequests = async (req, res) => {
    const customerId = req.session.customerId;
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const requests = await ServiceRequest.getByCustomerId(customerId, limit, offset);
        const totalRequests = await ServiceRequest.getCountByCustomerId(customerId);
        const totalPages = Math.ceil(totalRequests / limit);

        const vehicles = await Vehicle.getByCustomerId(customerId);
        const services = await Service.getActiveServices();
        res.render('customers/portal/requests', {
            requests: requests,
            currentPage: page,
            totalPages: totalPages,
            vehicles: vehicles,
            services: services,
            customerId: customerId,
            activePage: 'requests',
            error: req.query.error || null ,
            success: req.query.success || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};



// Handle Direct Vehicle Addition
exports.postAddVehicle = async (req, res) => {
    const customerId = req.session.customerId;
    const {
        vehicle_number,
        vehicle_type,
        chassis_number,
        engine_number,
        driver_name,
        driver_mobile,
        registration_date
    } = req.body;
    try {
        await Vehicle.create(
            customerId,
            vehicle_number,
            vehicle_type,
            chassis_number,
            engine_number,
            registration_date && registration_date.trim() !== '' ? registration_date : null,
            driver_name    && driver_name.trim()    !== '' ? driver_name.trim()    : null,
            driver_mobile  && driver_mobile.trim()  !== '' ? driver_mobile.trim()  : null
        );
        res.redirect('/portal/my-vehicles');
    } catch (err) {
        console.error(err);
        res.redirect('/portal/my-vehicles?error=VehicleAddFailed');
    }
};

// Handle Service Request from Customer Portal (Razorpay Payment)
exports.postCreateRequest = async (req, res) => {
    const customerId = req.session.customerId;
    const {
        vehicle_id, service_id, amount, remarks,
        razorpay_order_id, razorpay_payment_id, razorpay_signature
    } = req.body;

    console.log('[Portal Request] Received:', {
        customerId, vehicle_id, service_id, amount,
        hasOrderId: !!razorpay_order_id,
        hasPaymentId: !!razorpay_payment_id,
        hasSignature: !!razorpay_signature
    });

    const client = await pool.connect();
    try {
        // 1. Verify payment fields are present
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.log('[Portal Request] ❌ Missing Razorpay fields');
            client.release();
            return res.redirect('/portal/my-requests?error=PaymentRequired');
        }

        // 2. Verify Razorpay signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        console.log('[Portal Request] Signature match:', expectedSignature === razorpay_signature);

        if (expectedSignature !== razorpay_signature) {
            console.log('[Portal Request] ❌ Signature mismatch');
            console.log('[Portal Request] Expected:', expectedSignature);
            console.log('[Portal Request] Received:', razorpay_signature);
            client.release();
            return res.redirect('/portal/my-requests?error=PaymentVerificationFailed');
        }
        console.log('[Portal Request] ✅ Signature verified');

        // 3. Prevent duplicate entries
        const isDuplicate = await ServiceRequest.checkDuplicate(vehicle_id, service_id);
        if (isDuplicate) {
            console.log('[Portal Request] ❌ Duplicate request');
            client.release();
            return res.redirect('/portal/my-requests?error=DuplicateRequest');
        }

        // 3. Begin DB transaction
        await client.query('BEGIN');

        // 4. Create Service Request
        const fullRemarks = `Paid via Razorpay | Order: ${razorpay_order_id} | Payment: ${razorpay_payment_id}` + (remarks ? ` | ${remarks}` : '');
        const serviceRequest = await ServiceRequest.create(
            customerId, vehicle_id, service_id, amount, fullRemarks, 'Pending', client
        );
        console.log('[Portal Request] ✅ ServiceRequest created, ID:', serviceRequest.id);

        // 5. Create Ledger entry — Paid (full payment via Razorpay)
        const parsedAmount = parseFloat(amount) || 0;
        
        const ledgerResult = await client.query(`
            INSERT INTO ledgers (customer_id, vehicle_id, service_request_id, service_fee, amount_paid, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [
            customerId,
            vehicle_id || null,
            serviceRequest.id,
            parsedAmount,   // service_fee
            parsedAmount,   // amount_paid
            'Paid'          // status
        ]);
        const ledger = ledgerResult.rows[0];
        
        console.log('[Portal Request] ✅ Ledger created, ID:', ledger.id);

        // 6. Generate Receipt
        const receiptNo = await Receipt.getNextReceiptNo(client);
        await Receipt.create(
            receiptNo,
            ledger.id,
            customerId,
            parsedAmount,
            'Online (Razorpay)',
            `Razorpay Payment ID: ${razorpay_payment_id}` + (remarks ? ` | ${remarks}` : ''),
            null,
            client
        );
        console.log('[Portal Request] ✅ Receipt created, No:', receiptNo);

        await client.query('COMMIT');
        console.log('[Portal Request] ✅ Transaction committed — all done!');

        // Fetch customer to send emails
        const customer = await Customer.findById(customerId);
        if (customer && customer.email) {
            // Send Request Created Email
            const requestDetails = {
                request_no: serviceRequest.request_no || 'Pending',
                service_name: "Online Request", // We don't have the exact service name here without another query
                vehicle_number: "Online Vehicle", // We don't have the exact vehicle number here without another query
                status: 'Pending'
            };
            require("../utils/mailer").sendRequestCreatedEmail(customer.email, customer.name, requestDetails);

            // Send Receipt Email
            const receiptDetails = {
                receipt_no: receiptNo,
                amount: parsedAmount,
                payment_mode: 'Online (Razorpay)',
                remarks: `Razorpay Payment ID: ${razorpay_payment_id}` + (remarks ? ` | ${remarks}` : '')
            };
            require("../utils/mailer").sendReceiptEmail(customer.email, customer.name, receiptDetails);
        }

        res.redirect('/portal/my-requests');
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('[Portal Request] ❌ Error:', err.message);
        console.error('[Portal Request] Detail:', err.detail || '');
        res.redirect('/portal/my-requests?error=RequestFailed');
    } finally {
        try {
            client.release();
        } catch(e) {}
    }
};



exports.postEditVehicle = async (req, res) => {
    const customerId = req.session.customerId;
    const vehicleId = req.params.id;
    const {
        vehicle_number,
        vehicle_type,
        chassis_number,
        engine_number,
        driver_name,
        driver_mobile,
        registration_date
    } = req.body;
    try {
        // First verify ownership
        const vehicles = await Vehicle.getByCustomerId(customerId);
        if (!vehicles.find(v => v.id == vehicleId)) {
            return res.redirect('/portal/my-vehicles?error=Unauthorized');
        }

        await Vehicle.update(
            vehicleId,
            customerId,
            vehicle_number,
            vehicle_type,
            chassis_number,
            engine_number,
            registration_date && registration_date.trim() !== '' ? registration_date : null,
            driver_name    && driver_name.trim()    !== '' ? driver_name.trim()    : null,
            driver_mobile  && driver_mobile.trim()  !== '' ? driver_mobile.trim()  : null
        );
        res.redirect('/portal/my-vehicles');
    } catch (err) {
        console.error(err);
        res.redirect(`/portal/my-vehicles?error=VehicleUpdateFailed`);
    }
};

exports.postDeleteVehicle = async (req, res) => {
    const customerId = req.session.customerId;
    const vehicleId = req.params.id;
    try {
        // First verify ownership
        const vehicles = await Vehicle.getByCustomerId(customerId);
        if (!vehicles.find(v => v.id == vehicleId)) {
            return res.redirect('/portal/my-vehicles?error=Unauthorized');
        }

        // Check if there are existing service requests for this vehicle
        const hasRequests = await ServiceRequest.checkVehicleRequests(vehicleId);
        if (hasRequests) {
            return res.redirect('/portal/my-vehicles?error=CannotDeleteVehicleWithRequests');
        }

        await Vehicle.delete(vehicleId);
        res.redirect('/portal/my-vehicles');
    } catch (err) {
        console.error(err);
        res.redirect('/portal/my-vehicles?error=VehicleDeleteFailed');
    }
};



exports.postEditRequest = async (req, res) => {
    const customerId = req.session.customerId;
    const requestId = req.params.id;
    const { vehicle_id, service_id, amount, remarks } = req.body;
    try {
        // Verify ownership and status
        const request = await ServiceRequest.verifyOwnershipAndStatus(requestId, customerId);
        if (!request) {
            return res.redirect('/portal/my-requests?error=Unauthorized');
        }
        if (request.status !== 'Requested') {
            return res.redirect('/portal/my-requests?error=CannotEditProcessedRequest');
        }

        await ServiceRequest.update(requestId, vehicle_id, service_id, amount, remarks);
        res.redirect('/portal/my-requests');
    } catch (err) {
        console.error(err);
        res.redirect(`/portal/request/${requestId}/edit?error=RequestUpdateFailed`);
    }
};

exports.postDeleteRequest = async (req, res) => {
    const customerId = req.session.customerId;
    const requestId = req.params.id;
    try {
        // Verify ownership and status
        const request = await ServiceRequest.verifyOwnershipAndStatus(requestId, customerId);
        if (!request) {
            return res.redirect('/portal/my-requests?error=Unauthorized');
        }
        if (request.status !== 'Requested') {
            return res.redirect('/portal/my-requests?error=CannotDeleteProcessedRequest');
        }

        await ServiceRequest.delete(requestId);
        res.redirect('/portal/my-requests');
    } catch (err) {
        console.error(err);
        res.redirect('/portal/my-requests?error=RequestDeleteFailed');
    }
};



exports.postProfile = async (req, res) => {
    const customerId = req.session.customerId;
    const { name, mobile, email, address } = req.body;
    try {
        await Customer.updateProfile(customerId, name, mobile, email, address);

        // Update session name if it changed
        req.session.customerName = name;

        // Redirect back to the page they were on
        res.redirect(req.get('Referrer') || '/portal/dashboard');
    } catch (err) {
        console.error(err);
        const referrer = req.get('Referrer') || '/portal/dashboard';
        const separator = referrer.includes('?') ? '&' : '?';
        res.redirect(referrer + separator + 'error=ProfileUpdateFailed');
    }
};
