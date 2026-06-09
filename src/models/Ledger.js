const pool = require("../config/db");

class Ledger {

    // Create a ledger entry (payment transaction)
    static async create(
        jobId,
        customerId,
        amount,
        paymentMode,
        transactionType,
        notes,
        createdBy
    ) {
        const result = await pool.query(
            `
            INSERT INTO ledger_entries
            (
                job_id,
                customer_id,
                amount,
                payment_mode,
                transaction_type,
                notes,
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [jobId, customerId, amount, paymentMode, transactionType, notes, createdBy]
        );

        return result.rows[0];
    }

    // Find ledger entry by ID
    static async findById(id) {
        const result = await pool.query(
            `
            SELECT
                le.*,
                c.full_name AS customer_name,
                j.service_type,
                u.full_name AS created_by_name
            FROM ledger_entries le
            JOIN customers c ON le.customer_id = c.id
            LEFT JOIN jobs j ON le.job_id = j.id
            JOIN users u ON le.created_by = u.id
            WHERE le.id = $1
            `,
            [id]
        );
        return result.rows[0];
    }

    // Find all ledger entries
    static async findAll() {
        const result = await pool.query(
            `
            SELECT
                le.*,
                c.full_name AS customer_name,
                j.service_type,
                u.full_name AS created_by_name
            FROM ledger_entries le
            JOIN customers c ON le.customer_id = c.id
            LEFT JOIN jobs j ON le.job_id = j.id
            JOIN users u ON le.created_by = u.id
            ORDER BY le.created_at DESC
            `
        );
        return result.rows;
    }

    // Find ledger entries by customer
    static async findByCustomerId(customerId) {
        const result = await pool.query(
            `
            SELECT
                le.*,
                j.service_type,
                u.full_name AS created_by_name
            FROM ledger_entries le
            LEFT JOIN jobs j ON le.job_id = j.id
            JOIN users u ON le.created_by = u.id
            WHERE le.customer_id = $1
            ORDER BY le.created_at DESC
            `,
            [customerId]
        );
        return result.rows;
    }

    // Find ledger entries by job
    static async findByJobId(jobId) {
        const result = await pool.query(
            `
            SELECT
                le.*,
                c.full_name AS customer_name,
                u.full_name AS created_by_name
            FROM ledger_entries le
            JOIN customers c ON le.customer_id = c.id
            JOIN users u ON le.created_by = u.id
            WHERE le.job_id = $1
            ORDER BY le.created_at DESC
            `,
            [jobId]
        );
        return result.rows;
    }

    // Get customer balance (total due - total paid)
    static async getCustomerBalance(customerId) {
        const result = await pool.query(
            `
            SELECT
                COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END), 0) AS total_credit,
                COALESCE(SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END), 0) AS total_debit
            FROM ledger_entries
            WHERE customer_id = $1
            `,
            [customerId]
        );
        return result.rows[0];
    }

    // Find entries by date range
    static async findByDateRange(startDate, endDate) {
        const result = await pool.query(
            `
            SELECT
                le.*,
                c.full_name AS customer_name,
                j.service_type,
                u.full_name AS created_by_name
            FROM ledger_entries le
            JOIN customers c ON le.customer_id = c.id
            LEFT JOIN jobs j ON le.job_id = j.id
            JOIN users u ON le.created_by = u.id
            WHERE le.created_at BETWEEN $1 AND $2
            ORDER BY le.created_at DESC
            `,
            [startDate, endDate]
        );
        return result.rows;
    }

    // Delete ledger entry
    static async delete(id) {
        const result = await pool.query(
            `DELETE FROM ledger_entries WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }
}

module.exports = Ledger;
