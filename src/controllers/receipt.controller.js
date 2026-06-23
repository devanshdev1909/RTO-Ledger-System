const pool = require("../config/db");
const Receipt = require("../models/Receipt");

// List all generated receipts
module.exports.index = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const receipts = await Receipt.getAll(limit, offset);
        
        const totalReceipts = await Receipt.getCount();
        const totalPages = Math.ceil(totalReceipts / limit);

        res.render("receipts/index", {
            activePage: "receipts",
            userName: req.session.userName,
            receipts: receipts,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};

// Show detail of a single receipt (for printing)
module.exports.show = async (req, res) => {
    try {
        const { id } = req.params;
        const receipt = await Receipt.getById(id);

        if (!receipt) {
            return res.send("Receipt not found");
        }

        res.render("receipts/show", {
            activePage: "receipts",
            userName: req.session.userName,
            receipt: receipt
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};
