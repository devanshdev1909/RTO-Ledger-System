const crypto = require('crypto'); 
const pool = require('../config/db');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const ServiceRequest = require('../models/ServiceRequest');
const Service = require('../models/Service');

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
        const vehicles = await Vehicle.getByCustomerId(customerId);
        res.render('customers/portal/vehicles', {
            vehicles: vehicles,
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
        const requests = await ServiceRequest.getByCustomerId(customerId);
        const vehicles = await Vehicle.getByCustomerId(customerId);
        const services = await Service.getActiveServices();
        res.render('customers/portal/requests', {
            requests: requests,
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

// Handle Pending Service Request
exports.postCreateRequest = async (req, res) => {
    const customerId = req.session.customerId;
    const {
        vehicle_id, service_id, amount, remarks,
        razorpay_order_id, razorpay_payment_id, razorpay_signature
    } = req.body;

    try {
        // 1. Signature checks parameters verify
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.redirect('/portal/my-requests?error=PaymentRequired');
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.redirect('/portal/my-requests?error=PaymentVerificationFailed');
        }

        // 2. Prevent duplicate entries
        const isDuplicate = await ServiceRequest.checkDuplicate(vehicle_id, service_id);
        if (isDuplicate) {
            return res.redirect('/portal/my-requests?error=DuplicateRequest');
        }

        // 3. Complete database insertion with Pending status
        await ServiceRequest.create(customerId, vehicle_id, service_id, amount, remarks, 'Pending');
        res.redirect('/portal/my-requests?success=RequestCreated');
    } catch (err) {
        console.error(err);
        res.redirect('/portal/my-requests?error=RequestFailed');
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
