const pool = require("../config/db");

class Ledger {
    static async getAll() {
        const result = await pool.query(`
            SELECT 
                l.*,
                c.name AS customer_name,
                c.customer_code,
                v.vehicle_number,
                s.service_name
            FROM ledgers l
            LEFT JOIN customers c ON l.customer_id = c.id
            LEFT JOIN vehicles v ON l.vehicle_id = v.id
            LEFT JOIN service_requests sr ON l.service_request_id = sr.id
            LEFT JOIN services s ON sr.service_id = s.id
            ORDER BY l.id DESC
        `);
        return result.rows;
    }

    static async getPendingRequests() {
        const result = await pool.query(`
            SELECT 
                sr.id, sr.request_no, sr.customer_id, sr.vehicle_id, sr.amount,
                c.name AS customer_name, v.vehicle_number, s.service_name
            FROM service_requests sr
            LEFT JOIN ledgers l ON sr.id = l.service_request_id
            JOIN customers c ON sr.customer_id = c.id
            LEFT JOIN vehicles v ON sr.vehicle_id = v.id
            JOIN services s ON sr.service_id = s.id
            WHERE l.id IS NULL AND sr.status = 'Pending'
            ORDER BY sr.created_at DESC
        `);
        return result.rows;
    }

    static async findByCustomerId(customerId) {
        const result = await pool.query(`
            SELECT 
                l.*,
                v.vehicle_number,
                s.service_name
            FROM ledgers l
            LEFT JOIN vehicles v ON l.vehicle_id = v.id
            LEFT JOIN service_requests sr ON l.service_request_id = sr.id
            LEFT JOIN services s ON sr.service_id = s.id
            WHERE l.customer_id = $1
            ORDER BY l.created_at DESC
        `, [customerId]);
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query(`
            SELECT l.*, c.name AS customer_name, v.vehicle_number
            FROM ledgers l
            LEFT JOIN customers c ON l.customer_id = c.id
            LEFT JOIN vehicles v ON l.vehicle_id = v.id
            WHERE l.id = $1
        `, [id]);
        return result.rows[0];
    }

    static async getPaymentDetails(id, client) {
        const dbClient = client || pool;
        const result = await dbClient.query(
            "SELECT amount_paid, service_fee FROM ledgers WHERE id = $1", 
            [id]
        );
        return result.rows[0];
    }

    static async create(customerId, vehicleId, serviceRequestId, serviceFee, amountPaid, status, client) {
        const dbClient = client || pool;
        const result = await dbClient.query(`
            INSERT INTO ledgers (customer_id, vehicle_id, service_request_id, service_fee, amount_paid, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [customerId, vehicleId, serviceRequestId, serviceFee, amountPaid, status]);
        return result.rows[0];
    }

    static async updatePayment(id, amountPaid, status, client) {
        // Option to pass a client for transactions
        const dbClient = client || pool;
        const result = await dbClient.query(`
            UPDATE ledgers
            SET amount_paid = $1, status = $2
            WHERE id = $3
        `, [amountPaid, status, id]);
        return result;
    }
}

module.exports = Ledger;
