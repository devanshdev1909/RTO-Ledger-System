const Vehicle = require("../models/Vehicle");
const Customer = require("../models/Customer");

// Show all vehicles
module.exports.index = async (req, res) => {
  try {
    const vehicles = await Vehicle.getAll();
    const customers = await Customer.getAll();

    res.render("vehicles/index", {
      vehicles,
      customers: customers,
      userName: req.session.userName,
    });
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
};

// Render create form
module.exports.renderNew = async (req, res) => {
  try {
    const customers = await Customer.getAll();
    res.render("vehicles/new", {
      customers: customers,
      userName: req.session.userName,
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
      registration_date,
      driver_name,
      driver_mobile,
    } = req.body;

    await Vehicle.create(
      customer_id,
      vehicle_number,
      vehicle_type,
      chassis_number,
      engine_number,
      registration_date && registration_date.trim() !== '' ? registration_date : null,
      driver_name   && driver_name.trim()   !== '' ? driver_name.trim()   : null,
      driver_mobile && driver_mobile.trim() !== '' ? driver_mobile.trim() : null,
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
    const customers = await Customer.getAll();

    if (!vehicle) {
      return res.send("Vehicle not found");
    }

    res.render("vehicles/edit", {
      vehicle,
      customers: customers,
      userName: req.session.userName,
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
      registration_date,
      driver_name,
      driver_mobile,
    } = req.body;

    await Vehicle.update(
      req.params.id,
      customer_id,
      vehicle_number,
      vehicle_type,
      chassis_number,
      engine_number,
      registration_date && registration_date.trim() !== '' ? registration_date : null,
      driver_name   && driver_name.trim()   !== '' ? driver_name.trim()   : null,
      driver_mobile && driver_mobile.trim() !== '' ? driver_mobile.trim() : null,
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
    if (
      err.code === "23503" ||
      (err.message && err.message.includes("violates foreign key constraint"))
    ) {
      return res.redirect(
        "/vehicles?error=" +
          encodeURIComponent(
            "Cannot delete this vehicle because it is currently linked to existing service requests or ledgers. Please remove those connections first.",
          ),
      );
    }
    res.redirect("/vehicles?error=" + encodeURIComponent(err.message));
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
