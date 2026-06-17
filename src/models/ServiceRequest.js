const pool = require("../config/db");

class ServiceRequest {
    static async getStatusCountsByCustomerId(customerId) {
        const result = await pool.query('SELECT status, COUNT(*) FROM service_requests WHERE customer_id = $1 GROUP BY status', [customerId]);
        return result.rows;
    }

    static async getByCustomerId(customerId) {
        const result = await pool.query(`
            SELECT sr.*, v.vehicle_number 
            FROM service_requests sr
            JOIN vehicles v ON sr.vehicle_id = v.id
            WHERE sr.customer_id = $1
            ORDER BY sr.created_at DESC
        `, [customerId]);
        return result.rows;
    }

    static async create(customerId, vehicleId, serviceId, amount, remarks, client) {
        const dbClient = client || pool;
        const requestNo = 'REQ-' + Date.now();
        const result = await dbClient.query(
            `INSERT INTO service_requests (request_no, customer_id, vehicle_id, service_id, amount, status, remarks, created_at)
         VALUES ($1, $2, $3, $4, $5, 'Pending', $6, NOW()) RETURNING id`,
            [requestNo, customerId, vehicleId, serviceId, amount, remarks]
        );
        return result.rows[0];
    }


    static async update(id, vehicleId, serviceId, amount, remarks) {
        await pool.query(
            `UPDATE service_requests 
             SET vehicle_id = $1, service_id = $2, amount = $3, remarks = $4
             WHERE id = $5`,
            [vehicleId, serviceId, amount, remarks, id]
        );
    }

    static async delete(id) {
        await pool.query('DELETE FROM service_requests WHERE id = $1', [id]);
    }

    static async verifyOwnershipAndStatus(id, customerId) {
        const result = await pool.query('SELECT status FROM service_requests WHERE id = $1 AND customer_id = $2', [id, customerId]);
        return result.rows[0];
    }

    static async checkVehicleRequests(vehicleId) {
        const result = await pool.query('SELECT id FROM service_requests WHERE vehicle_id = $1 LIMIT 1', [vehicleId]);
        return result.rows.length > 0;
    }

    static async updateStatus(id, status, client) {
        const dbClient = client || pool;
        await dbClient.query('UPDATE service_requests SET status = $1 WHERE id = $2', [status, id]);
    }
}

module.exports = ServiceRequest;
