const pool = require("../config/db");

// List all generated receipts
module.exports.index = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                r.*,
                c.name AS customer_name,
                s.service_name
            FROM receipts r
            LEFT JOIN ledgers l ON r.ledger_id = l.id
            LEFT JOIN customers c ON l.customer_id = c.id
            LEFT JOIN service_requests sr ON l.service_request_id = sr.id
            LEFT JOIN services s ON sr.service_id = s.id
            ORDER BY r.received_at DESC
        `);

        res.render("receipts/index", {
            activePage: "receipts",
            userName: req.session.userName,
            receipts: result.rows
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
        const result = await pool.query(`
            SELECT 
                r.receipt_no,
                r.payment_mode,
                r.received_at,
                r.amount_received,
                c.name AS customer_name,
                c.mobile AS customer_mobile,
                v.vehicle_number,
                v.chassis_number,
                v.engine_number,
                sr.request_no,
                sr.created_at AS requested_at,
                s.service_name,
                l.service_fee,
                l.amount_paid,
                l.due_amount
            FROM receipts r
            LEFT JOIN ledgers l ON r.ledger_id = l.id
            LEFT JOIN customers c ON l.customer_id = c.id
            LEFT JOIN vehicles v ON l.vehicle_id = v.id
            LEFT JOIN service_requests sr ON l.service_request_id = sr.id
            LEFT JOIN services s ON sr.service_id = s.id
            WHERE r.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.send("Receipt not found");
        }

        res.render("receipts/show", {
            activePage: "receipts",
            userName: req.session.userName,
            receipt: result.rows[0]
        });
    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
};
