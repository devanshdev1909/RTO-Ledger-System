const pool = require('../config/db');

exports.getDashboard = async (req, res) => {
    const customerId = req.session.customerId;
    try {
        // Fetch simple counts for dashboard
        const vehiclesCount = await pool.query('SELECT COUNT(*) FROM vehicles WHERE customer_id = $1', [customerId]);
        const requestsResult = await pool.query('SELECT status, COUNT(*) FROM service_requests WHERE customer_id = $1 GROUP BY status', [customerId]);
        
        let totalRequests = 0;
        let pendingRequests = 0;
        let completedRequests = 0;

        requestsResult.rows.forEach(r => {
            const count = parseInt(r.count, 10);
            totalRequests += count;
            if (r.status === 'Pending') pendingRequests += count;
            if (r.status === 'Completed') completedRequests += count;
        });

        res.render('customers/portal/dashboard', {
            vehiclesCount: parseInt(vehiclesCount.rows[0].count, 10),
            totalRequests,
            pendingRequests,
            completedRequests,
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
    try {
        const vehicles = await pool.query('SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY created_at DESC', [customerId]);
        res.render('customers/portal/vehicles', {
            vehicles: vehicles.rows,
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
        const requests = await pool.query(`
            SELECT sr.*, v.vehicle_number 
            FROM service_requests sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            WHERE sr.customer_id = $1
            ORDER BY sr.created_at DESC
        `, [customerId]);
        const vehicles = await pool.query('SELECT * FROM vehicles WHERE customer_id = $1', [customerId]);
        const services = await pool.query('SELECT * FROM services WHERE is_active = true');
        res.render('customers/portal/requests', {
            requests: requests.rows,
            vehicles: vehicles.rows,
            services: services.rows,
            activePage: 'requests',
            error: req.query.error || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};



// Handle Direct Vehicle Addition
exports.postAddVehicle = async (req, res) => {
    const customerId = req.session.customerId;
    const { vehicle_number, vehicle_type, chassis_number, engine_number } = req.body;
    try {
        // Vehicle is added directly and is immediately active (is_active = true)
        await pool.query(
            `INSERT INTO vehicles (customer_id, vehicle_number, vehicle_type, chassis_number, engine_number, created_at, is_active)
             VALUES ($1, $2, $3, $4, $5, NOW(), true)`,
            [customerId, vehicle_number, vehicle_type, chassis_number, engine_number]
        );
        res.redirect('/portal/my-vehicles');
    } catch (err) {
        console.error(err);
        res.redirect('/portal/vehicle/add?error=VehicleAddFailed');
    }
};

// Handle Pending Service Request
exports.postCreateRequest = async (req, res) => {
    const customerId = req.session.customerId;
    const { vehicle_id, service_id, amount, remarks } = req.body;

    // Generate Request No
    const requestNo = 'REQ-' + Date.now();

    try {
        // Service Request goes in as 'Requested' status, awaiting admin approval
        await pool.query(
            `INSERT INTO service_requests (request_no, customer_id, vehicle_id, service_id, amount, status, remarks, created_at)
             VALUES ($1, $2, $3, $4, $5, 'Requested', $6, NOW())`,
            [requestNo, customerId, vehicle_id, service_id, amount, remarks]
        );
        res.redirect('/portal/my-requests');
    } catch (err) {
        console.error(err);
        res.redirect('/portal/request/create?error=RequestFailed');
    }
};



exports.postEditVehicle = async (req, res) => {
    const customerId = req.session.customerId;
    const vehicleId = req.params.id;
    const { vehicle_number, vehicle_type, chassis_number, engine_number } = req.body;
    try {
        // First verify ownership
        const verify = await pool.query('SELECT id FROM vehicles WHERE id = $1 AND customer_id = $2', [vehicleId, customerId]);
        if (verify.rows.length === 0) {
            return res.redirect('/portal/my-vehicles?error=Unauthorized');
        }

        await pool.query(
            `UPDATE vehicles 
             SET vehicle_number = $1, vehicle_type = $2, chassis_number = $3, engine_number = $4
             WHERE id = $5`,
            [vehicle_number, vehicle_type, chassis_number, engine_number, vehicleId]
        );
        res.redirect('/portal/my-vehicles');
    } catch (err) {
        console.error(err);
        res.redirect(`/portal/vehicle/${vehicleId}/edit?error=VehicleUpdateFailed`);
    }
};

exports.postDeleteVehicle = async (req, res) => {
    const customerId = req.session.customerId;
    const vehicleId = req.params.id;
    try {
        // First verify ownership
        const verify = await pool.query('SELECT id FROM vehicles WHERE id = $1 AND customer_id = $2', [vehicleId, customerId]);
        if (verify.rows.length === 0) {
            return res.redirect('/portal/my-vehicles?error=Unauthorized');
        }

        // Check if there are existing service requests for this vehicle
        const requestsCheck = await pool.query('SELECT id FROM service_requests WHERE vehicle_id = $1', [vehicleId]);
        if (requestsCheck.rows.length > 0) {
            return res.redirect('/portal/my-vehicles?error=CannotDeleteVehicleWithRequests');
        }

        await pool.query('DELETE FROM vehicles WHERE id = $1', [vehicleId]);
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
        const verify = await pool.query('SELECT status FROM service_requests WHERE id = $1 AND customer_id = $2', [requestId, customerId]);
        if (verify.rows.length === 0) {
            return res.redirect('/portal/my-requests?error=Unauthorized');
        }
        if (verify.rows[0].status !== 'Requested') {
            return res.redirect('/portal/my-requests?error=CannotEditProcessedRequest');
        }

        await pool.query(
            `UPDATE service_requests 
             SET vehicle_id = $1, service_id = $2, amount = $3, remarks = $4
             WHERE id = $5`,
            [vehicle_id, service_id, amount, remarks, requestId]
        );
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
        const verify = await pool.query('SELECT status FROM service_requests WHERE id = $1 AND customer_id = $2', [requestId, customerId]);
        if (verify.rows.length === 0) {
            return res.redirect('/portal/my-requests?error=Unauthorized');
        }
        if (verify.rows[0].status !== 'Requested') {
            return res.redirect('/portal/my-requests?error=CannotDeleteProcessedRequest');
        }

        await pool.query('DELETE FROM service_requests WHERE id = $1', [requestId]);
        res.redirect('/portal/my-requests');
    } catch (err) {
        console.error(err);
        res.redirect('/portal/my-requests?error=RequestDeleteFailed');
    }
};

exports.getProfile = async (req, res) => {
    const customerId = req.session.customerId;
    try {
        const result = await pool.query('SELECT * FROM customers WHERE id = $1', [customerId]);
        if (result.rows.length === 0) {
            return res.redirect('/portal/logout');
        }
        res.render('customers/portal/profile', {
            profile: result.rows[0],
            activePage: 'profile',
            error: req.query.error || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

exports.postProfile = async (req, res) => {
    const customerId = req.session.customerId;
    const { name, mobile, email, address } = req.body;
    try {
        await pool.query(
            `UPDATE customers 
             SET name = $1, mobile = $2, email = $3, address = $4, updated_at = NOW()
             WHERE id = $5`,
            [name, mobile, email, address, customerId]
        );
        
        // Update session name if it changed
        req.session.customerName = name;

        res.redirect('/portal/profile');
    } catch (err) {
        console.error(err);
        res.redirect('/portal/profile?error=ProfileUpdateFailed');
    }
};
