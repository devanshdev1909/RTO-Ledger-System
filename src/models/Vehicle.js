const pool = require("../config/db");

class Vehicle {

    // Create a new vehicle
    static async create(
        customerId,
        vehicleNumber,
        vehicleType,
        make,
        model,
        year,
        chassisNumber,
        engineNumber
    ) {
        const result = await pool.query(
            `
            INSERT INTO vehicles
            (
                customer_id,
                vehicle_number,
                vehicle_type,
                make,
                model,
                year,
                chassis_number,
                engine_number
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            `,
            [
                customerId,
                vehicleNumber,
                vehicleType,
                make,
                model,
                year,
                chassisNumber,
                engineNumber
            ]
        );

        return result.rows[0];
    }

    // Find vehicle by ID
    static async findById(id) {
        const result = await pool.query(
            `
            SELECT v.*, c.full_name AS customer_name
            FROM vehicles v
            JOIN customers c ON v.customer_id = c.id
            WHERE v.id = $1
            `,
            [id]
        );
        return result.rows[0];
    }

    // Find all vehicles
    static async findAll() {
        const result = await pool.query(
            `
            SELECT v.*, c.full_name AS customer_name
            FROM vehicles v
            JOIN customers c ON v.customer_id = c.id
            ORDER BY v.created_at DESC
            `
        );
        return result.rows;
    }

    // Find vehicles by customer ID
    static async findByCustomerId(customerId) {
        const result = await pool.query(
            `SELECT * FROM vehicles WHERE customer_id = $1 ORDER BY created_at DESC`,
            [customerId]
        );
        return result.rows;
    }

    // Search vehicles by number
    static async search(query) {
        const result = await pool.query(
            `
            SELECT v.*, c.full_name AS customer_name
            FROM vehicles v
            JOIN customers c ON v.customer_id = c.id
            WHERE v.vehicle_number ILIKE $1
            ORDER BY v.vehicle_number ASC
            `,
            [`%${query}%`]
        );
        return result.rows;
    }

    // Update vehicle
    static async update(
        id,
        vehicleNumber,
        vehicleType,
        make,
        model,
        year,
        chassisNumber,
        engineNumber
    ) {
        const result = await pool.query(
            `
            UPDATE vehicles
            SET
                vehicle_number = $1,
                vehicle_type = $2,
                make = $3,
                model = $4,
                year = $5,
                chassis_number = $6,
                engine_number = $7,
                updated_at = NOW()
            WHERE id = $8
            RETURNING *
            `,
            [vehicleNumber, vehicleType, make, model, year, chassisNumber, engineNumber, id]
        );
        return result.rows[0];
    }

    // Delete vehicle
    static async delete(id) {
        const result = await pool.query(
            `DELETE FROM vehicles WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }
}

module.exports = Vehicle;
