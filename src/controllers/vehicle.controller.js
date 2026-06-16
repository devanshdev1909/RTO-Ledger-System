const Vehicle = require("../models/Vehicle");
const pool = require("../config/db");

// Show all vehicles
module.exports.index = async (req, res) => {
    try {
        const vehicles = await Vehicle.getAll();
        const customersResult = await pool.query(
            "SELECT id, name FROM customers ORDER BY name ASC"
        );

        res.render("vehicles/index", {
            vehicles,
            customers: customersResult.rows,
            userName: req.session.userName
        });

    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

// Render create form
module.exports.renderNew = async (req, res) => {
    try {
        const customers = await pool.query(
            "SELECT id, name FROM customers ORDER BY name"
        );
        res.render("vehicles/new", {
            customers: customers.rows,
            userName: req.session.userName
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

// Create vehicle
module.exports.create = async (req, res) => {
    try {
        const {
            customer_id,
            vehicle_number,
            vehicle_type,
            chassis_number,
            engine_number,
            registration_date
        } = req.body;

        await Vehicle.create(
            customer_id,
            vehicle_number,
            vehicle_type,
            chassis_number,
            engine_number,
            registration_date
        );

        res.redirect("/vehicles");
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

// Render edit form
module.exports.renderEdit = async (req, res) => {
    try {
        const vehicle = await Vehicle.getById(req.params.id);
        const customers = await pool.query(
            "SELECT id, name FROM customers ORDER BY name"
        );

        if (!vehicle) {
            return res.send("Vehicle not found");
        }

        res.render("vehicles/edit", {
            vehicle,
            customers: customers.rows,
            userName: req.session.userName
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

// Update vehicle
module.exports.update = async (req, res) => {
    try {
        const {
            customer_id,
            vehicle_number,
            vehicle_type,
            chassis_number,
            engine_number,
            registration_date
        } = req.body;

        await Vehicle.update(
            req.params.id,
            customer_id,
            vehicle_number,
            vehicle_type,
            chassis_number,
            engine_number,
            registration_date
        );

        res.redirect("/vehicles");
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

// Delete vehicle
module.exports.delete = async (req, res) => {
    try {
        await Vehicle.delete(req.params.id);
        res.redirect("/vehicles");
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

// Toggle vehicle active status
module.exports.toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        await Vehicle.toggleStatus(id, is_active);
        res.json({ success: true, message: "Vehicle status updated successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

