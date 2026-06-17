const pool = require("../config/db");

class Receipt {
    static async getNextReceiptNo(client) {
        const dbClient = client || pool;
        const result = await dbClient.query("SELECT receipt_no FROM receipts WHERE receipt_no LIKE 'REC-%'");
        let maxNum = 0;
        result.rows.forEach(row => {
            const match = row.receipt_no.match(/^REC-(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) {
                    maxNum = num;
                }
            }
        });
        return `REC-${String(maxNum + 1).padStart(5, '0')}`;
    }

    static async create(receiptNo, ledgerId, customerId, amount, paymentMode, remarks, createdBy, client) {
        const dbClient = client || pool;
        const result = await dbClient.query(
            `INSERT INTO receipts (receipt_no, ledger_id, amount_received, payment_mode, remarks, received_by)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [receiptNo, ledgerId, amount, paymentMode, remarks, createdBy]
        );
        return result.rows[0];
    }

    static async getAll() {
    const result = await pool.query(`
        SELECT
            r.*,
            c.name AS customer_name,
            c.customer_code,
            s.service_name,
            u.username AS received_by_name
        FROM receipts r
        LEFT JOIN ledgers l ON r.ledger_id = l.id
        LEFT JOIN customers c ON l.customer_id = c.id
        LEFT JOIN service_requests sr ON l.service_request_id = sr.id
        LEFT JOIN services s ON sr.service_id = s.id
        LEFT JOIN users u ON r.received_by = u.id
        ORDER BY r.received_at DESC
    `);

    return result.rows;
}

    static async getById(id) {
        const result = await pool.query(`
            SELECT 
                r.id,
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
        return result.rows[0];
    }
}

module.exports = Receipt;
