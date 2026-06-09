const pool = require("../config/db");

class Report {

    // Daily collection summary
    static async getDailyCollection(date) {
        const result = await pool.query(
            `
            SELECT
                payment_mode,
                transaction_type,
                COUNT(*) AS total_transactions,
                SUM(amount) AS total_amount
            FROM ledger_entries
            WHERE DATE(created_at) = $1
            GROUP BY payment_mode, transaction_type
            ORDER BY payment_mode
            `,
            [date]
        );
        return result.rows;
    }

    // Monthly revenue summary
    static async getMonthlyRevenue(year, month) {
        const result = await pool.query(
            `
            SELECT
                DATE(created_at) AS date,
                SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END) AS total_credit,
                SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END) AS total_debit,
                COUNT(*) AS total_transactions
            FROM ledger_entries
            WHERE EXTRACT(YEAR FROM created_at) = $1
            AND EXTRACT(MONTH FROM created_at) = $2
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at)
            `,
            [year, month]
        );
        return result.rows;
    }

    // Outstanding dues (customers with pending balances)
    static async getOutstandingDues() {
        const result = await pool.query(
            `
            SELECT
                c.id AS customer_id,
                c.full_name,
                c.mobile,
                COUNT(j.id) AS total_jobs,
                SUM(j.total_amount) AS total_billed,
                SUM(j.paid_amount) AS total_paid,
                SUM(j.total_amount - j.paid_amount) AS outstanding
            FROM customers c
            JOIN jobs j ON c.id = j.customer_id
            WHERE j.total_amount > j.paid_amount
            GROUP BY c.id, c.full_name, c.mobile
            ORDER BY outstanding DESC
            `
        );
        return result.rows;
    }

    // Service-wise summary
    static async getServiceWiseSummary(startDate, endDate) {
        const result = await pool.query(
            `
            SELECT
                service_type,
                COUNT(*) AS total_jobs,
                SUM(total_amount) AS total_revenue,
                SUM(paid_amount) AS total_collected,
                SUM(total_amount - paid_amount) AS total_pending
            FROM jobs
            WHERE created_at BETWEEN $1 AND $2
            GROUP BY service_type
            ORDER BY total_revenue DESC
            `,
            [startDate, endDate]
        );
        return result.rows;
    }

    // Operator performance report
    static async getOperatorPerformance(startDate, endDate) {
        const result = await pool.query(
            `
            SELECT
                u.id AS user_id,
                u.full_name AS operator_name,
                COUNT(j.id) AS total_jobs,
                SUM(j.total_amount) AS total_billed,
                SUM(j.paid_amount) AS total_collected
            FROM users u
            JOIN jobs j ON u.id = j.created_by
            WHERE j.created_at BETWEEN $1 AND $2
            GROUP BY u.id, u.full_name
            ORDER BY total_jobs DESC
            `,
            [startDate, endDate]
        );
        return result.rows;
    }

    // Dashboard summary stats
    static async getDashboardStats() {
        const result = await pool.query(
            `
            SELECT
                (SELECT COUNT(*) FROM customers) AS total_customers,
                (SELECT COUNT(*) FROM vehicles) AS total_vehicles,
                (SELECT COUNT(*) FROM jobs) AS total_jobs,
                (SELECT COUNT(*) FROM jobs WHERE status = 'pending') AS pending_jobs,
                (SELECT COALESCE(SUM(total_amount), 0) FROM jobs) AS total_revenue,
                (SELECT COALESCE(SUM(paid_amount), 0) FROM jobs) AS total_collected,
                (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM jobs) AS total_outstanding
            `
        );
        return result.rows[0];
    }
}

module.exports = Report;
