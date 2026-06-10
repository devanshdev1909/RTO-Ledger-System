const Customer = require("../models/Customer");

// Controller methods will be written here

module.exports.index = async (req, res) => {

    const customers = [];

    res.render("customers/index", {
        customers,
        activePage: "customers"
    });

};