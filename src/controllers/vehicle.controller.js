const Vehicle = require("../models/Vehicle");
const Customer = require("../models/Customer");

// Render vehicles list page
module.exports.listVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll();
        res.render("vehicles/index", { vehicles });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load vehicles");
        res.redirect("/dashboard");
    }
};

// Render add vehicle form
module.exports.renderAddForm = async (req, res) => {
    try {
        const customers = await Customer.findAll();
        res.render("vehicles/add", { customers });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load form");
        res.redirect("/vehicles");
    }
};

// Create a new vehicle
module.exports.createVehicle = async (req, res) => {
    try {
        const {
            customerId,
            vehicleNumber,
            vehicleType,
            make,
            model,
            year,
            chassisNumber,
            engineNumber
        } = req.body;

        await Vehicle.create(
            customerId,
            vehicleNumber,
            vehicleType,
            make,
            model,
            year,
            chassisNumber,
            engineNumber
        );

        req.flash("success", "Vehicle added successfully");
        res.redirect("/vehicles");
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to add vehicle");
        res.redirect("/vehicles/add");
    }
};

// View single vehicle details
module.exports.viewVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            req.flash("error", "Vehicle not found");
            return res.redirect("/vehicles");
        }

        res.render("vehicles/view", { vehicle });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load vehicle");
        res.redirect("/vehicles");
    }
};

// Render edit vehicle form
module.exports.renderEditForm = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            req.flash("error", "Vehicle not found");
            return res.redirect("/vehicles");
        }

        res.render("vehicles/edit", { vehicle });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load vehicle");
        res.redirect("/vehicles");
    }
};

// Update vehicle
module.exports.updateVehicle = async (req, res) => {
    try {
        const {
            vehicleNumber,
            vehicleType,
            make,
            model,
            year,
            chassisNumber,
            engineNumber
        } = req.body;

        await Vehicle.update(
            req.params.id,
            vehicleNumber,
            vehicleType,
            make,
            model,
            year,
            chassisNumber,
            engineNumber
        );

        req.flash("success", "Vehicle updated successfully");
        res.redirect(`/vehicles/${req.params.id}`);
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to update vehicle");
        res.redirect(`/vehicles/${req.params.id}/edit`);
    }
};

// Delete vehicle
module.exports.deleteVehicle = async (req, res) => {
    try {
        await Vehicle.delete(req.params.id);
        req.flash("success", "Vehicle deleted successfully");
        res.redirect("/vehicles");
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to delete vehicle");
        res.redirect("/vehicles");
    }
};

// Get vehicles by customer (API endpoint for dynamic forms)
module.exports.getByCustomer = async (req, res) => {
    try {
        const vehicles = await Vehicle.findByCustomerId(req.params.customerId);
        res.json(vehicles);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to load vehicles" });
    }
};
