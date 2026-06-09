const pool = require("../config/db");

class Job {

    // Create a new job/service
    static async create(
        customerId,
        vehicleId,
        serviceType,
        description,
        totalAmount,
        paidAmount,
        status,
        createdBy
    ) {
        const result = await pool.query(
            `
            INSERT INTO jobs
            (
                customer_id,
                vehicle_id,
                service_type,
                description,
                total_amount,
                paid_amount,
                status,
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            `,
            [
                customerId,
                vehicleId,
                serviceType,
                description,
                totalAmount,
                paidAmount,
                status,
                createdBy
            ]
        );

        return result.rows[0];
    }

    // Find job by ID with related data
    static async findById(id) {
        const result = await pool.query(
            `
            SELECT
                j.*,
                c.full_name AS customer_name,
                c.mobile AS customer_mobile,
                v.vehicle_number,
                u.full_name AS created_by_name
            FROM jobs j
            JOIN customers c ON j.customer_id = c.id
            JOIN vehicles v ON j.vehicle_id = v.id
            JOIN users u ON j.created_by = u.id
            WHERE j.id = $1
            `,
            [id]
        );
        return result.rows[0];
    }

    // Find all jobs
    static async findAll() {
        const result = await pool.query(
            `
            SELECT
                j.*,
                c.full_name AS customer_name,
                v.vehicle_number,
                u.full_name AS created_by_name
            FROM jobs j
            JOIN customers c ON j.customer_id = c.id
            JOIN vehicles v ON j.vehicle_id = v.id
            JOIN users u ON j.created_by = u.id
            ORDER BY j.created_at DESC
            `
        );
        return result.rows;
    }

    // Find jobs by customer ID
    static async findByCustomerId(customerId) {
        const result = await pool.query(
            `
            SELECT j.*, v.vehicle_number
            FROM jobs j
            JOIN vehicles v ON j.vehicle_id = v.id
            WHERE j.customer_id = $1
            ORDER BY j.created_at DESC
            `,
            [customerId]
        );
        return result.rows;
    }

    // Find jobs by status
    static async findByStatus(status) {
        const result = await pool.query(
            `
            SELECT
                j.*,
                c.full_name AS customer_name,
                v.vehicle_number
            FROM jobs j
            JOIN customers c ON j.customer_id = c.id
            JOIN vehicles v ON j.vehicle_id = v.id
            WHERE j.status = $1
            ORDER BY j.created_at DESC
            `,
            [status]
        );
        return result.rows;
    }

    // Update job
    static async update(id, serviceType, description, totalAmount, paidAmount, status) {
        const result = await pool.query(
            `
            UPDATE jobs
            SET
                service_type = $1,
                description = $2,
                total_amount = $3,
                paid_amount = $4,
                status = $5,
                updated_at = NOW()
            WHERE id = $6
            RETURNING *
            `,
            [serviceType, description, totalAmount, paidAmount, status, id]
        );
        return result.rows[0];
    }

    // Update payment
    static async updatePayment(id, paidAmount) {
        const result = await pool.query(
            `
            UPDATE jobs
            SET
                paid_amount = paid_amount + $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
            `,
            [paidAmount, id]
        );
        return result.rows[0];
    }

    // Delete job
    static async delete(id) {
        const result = await pool.query(
            `DELETE FROM jobs WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }
}

module.exports = Job;
