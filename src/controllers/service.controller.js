const db = require("../config/db");

// SERVICES PAGE
const showServices = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT *
            FROM services
            ORDER BY id DESC
        `);

        res.render("services/index", {
            activePage: "services",
            services: result.rows
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
        await db.query(`
            INSERT INTO services (service_name, default_fee, description, is_active)
            VALUES ($1, $2, $3, $4)
        `, [service_name, default_fee, description, is_active === "on"]);
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
                description = $3,
                is_active = $4
            WHERE id = $5
        `, [service_name, default_fee, description, is_active === "on", id]);
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
        const result = await db.query(`
            SELECT
                sr.*,
                c.name AS customer_name,
                v.vehicle_number,
                s.service_name
            FROM service_requests sr
            LEFT JOIN customers c
                ON sr.customer_id = c.id
            LEFT JOIN vehicles v
                ON sr.vehicle_id = v.id
            LEFT JOIN services s
                ON sr.service_id = s.id
            ORDER BY sr.id DESC
        `);

        res.render("service_requests/index", {
            activePage: "service_requests",
            requests: result.rows
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
            SELECT id, vehicle_number
            FROM vehicles
            ORDER BY vehicle_number
        `);

        const services = await db.query(`
            SELECT
                id,
                service_name,
                default_fee
            FROM services
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
const createRequest = async (req, res) => {
    try {

        const {
            customer_id,
            vehicle_id,
            service_id,
            amount,
            remarks
        } = req.body;

        const requestNo = "REQ" + Date.now();

        await db.query(`
            INSERT INTO service_requests
            (
                request_no,
                customer_id,
                vehicle_id,
                service_id,
                amount,
                status,
                remarks
            )
            VALUES($1,$2,$3,$4,$5,$6,$7)
        `,
            [
                requestNo,
                customer_id,
                vehicle_id,
                service_id,
                amount,
                "Pending",
                remarks
            ]);

        res.redirect("/services/requests");

    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
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
            SELECT id, vehicle_number
            FROM vehicles
            ORDER BY vehicle_number
        `);

        const services = await db.query(`
            SELECT id, service_name, default_fee
            FROM services
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

        await db.query(`
            UPDATE service_requests
            SET customer_id = $1,
                vehicle_id = $2,
                service_id = $3,
                amount = $4,
                status = $5,
                remarks = $6
            WHERE id = $7
        `, [customer_id, vehicle_id, service_id, amount, status, remarks, id]);

        res.redirect("/services/requests");
    } catch (err) {
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

module.exports = {
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
    deleteRequest
};