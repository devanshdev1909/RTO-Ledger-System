const pool = require("../config/db");

class Vehicle {

    static async getAll() {
        const result = await pool.query(
            `
            SELECT 
                v.*,
                c.name AS customer_name
            FROM vehicles v
            LEFT JOIN customers c
            ON v.customer_id = c.id
            ORDER BY v.created_at DESC
            `
        );
        return result.rows;
    }

    static async getById(id) {
        const result = await pool.query(
            `
            SELECT * FROM vehicles
            WHERE id = $1
            `,
            [id]
        );
        return result.rows[0];
    }

    static async create(
        customerId,
        vehicleNumber,
        vehicleType,
        chassisNumber,
        engineNumber,
        registrationDate
    ) {
        const result = await pool.query(
            `
            INSERT INTO vehicles
            (
                customer_id,
                vehicle_number,
                vehicle_type,
                chassis_number,
                engine_number,
                registration_date
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *
            `,
            [
                customerId,
                vehicleNumber,
                vehicleType,
                chassisNumber,
                engineNumber,
                registrationDate
            ]
        );
        return result.rows[0];
    }

    static async update(
        id,
        customerId,
        vehicleNumber,
        vehicleType,
        chassisNumber,
        engineNumber,
        registrationDate
    ) {
        const result = await pool.query(
            `
            UPDATE vehicles SET
                customer_id = $1,
                vehicle_number = $2,
                vehicle_type = $3,
                chassis_number = $4,
                engine_number = $5,
                registration_date = $6
            WHERE id = $7
            RETURNING *
            `,
            [
                customerId,
                vehicleNumber,
                vehicleType,
                chassisNumber,
                engineNumber,
                registrationDate,
                id
            ]
        );
        return result.rows[0];
    }

    static async delete(id) {
        await pool.query(
            `DELETE FROM vehicles WHERE id = $1`,
            [id]
        );
    }
    static async toggleStatus(id, isActive) {
        const result = await pool.query(
            `
            UPDATE vehicles 
            SET is_active = $1 
            WHERE id = $2 
            RETURNING *
            `,
            [isActive, id]
        );
        return result.rows[0];
    }

    static async countByCustomerId(customerId) {
        const result = await pool.query('SELECT COUNT(*) FROM vehicles WHERE customer_id = $1', [customerId]);
        return parseInt(result.rows[0].count, 10);
    }

    static async getByCustomerId(customerId) {
        const result = await pool.query('SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY created_at DESC', [customerId]);
        return result.rows;
    }
}

module.exports = Vehicle;
