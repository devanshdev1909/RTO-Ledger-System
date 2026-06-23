const pool = require("../config/db");

class Customer {
    static async findByIdentifier(identifier) {
        const result = await pool.query(
            'SELECT * FROM customers WHERE mobile = $1 OR email = $1',
            [identifier]
        );
        return result.rows[0];
    }

    static async create(customerCode, name, mobile, email, hashedPassword) {
        const result = await pool.query(
            `INSERT INTO customers (customer_code, name, mobile, email, password, is_active, created_at) 
             VALUES ($1, $2, $3, $4, $5, true, NOW()) RETURNING id`,
            [customerCode, name, mobile, email, hashedPassword]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            "SELECT * FROM customers WHERE id = $1",
            [id]
        );
        return result.rows[0];
    }

    static async updateProfile(id, name, mobile, email, address) {
        const result = await pool.query(
            `UPDATE customers 
             SET name = $1, mobile = $2, email = $3, address = $4, updated_at = NOW()
             WHERE id = $5 RETURNING *`,
            [name, mobile, email, address, id]
        );
        return result.rows[0];
    }

    static async setPassword(id, hashedPassword) {
        const result = await pool.query(
            "UPDATE customers SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
            [hashedPassword, id]
        );
        return result.rows[0];
    }

    static async getAll(limit = null, offset = null) {
        let query = "SELECT * FROM customers ORDER BY created_at DESC";
        const params = [];
        if (limit !== null && offset !== null) {
            query += " LIMIT $1 OFFSET $2";
            params.push(limit, offset);
        }
        const result = await pool.query(query, params);
        return result.rows;
    }

    static async getCount() {
        const result = await pool.query("SELECT COUNT(*) FROM customers");
        return parseInt(result.rows[0].count, 10);
    }

    static async getNextCustomerCode(client) {
        const dbClient = client || pool;
        const result = await dbClient.query("SELECT customer_code FROM customers WHERE customer_code LIKE 'CUST-%'");
        let maxNum = 0;
        result.rows.forEach(row => {
            const match = row.customer_code.match(/^CUST-(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) {
                    maxNum = num;
                }
            }
        });
        return `CUST-${String(maxNum + 1).padStart(3, '0')}`;
    }

    static async createStaff(customerCode, name, mobile, email, address, createdBy, client) {
        const dbClient = client || pool;
        const result = await dbClient.query(
            `INSERT INTO customers (customer_code, name, mobile, email, address, created_by, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW()) RETURNING id`,
            [customerCode, name, mobile, email, address, createdBy]
        );
        return result.rows[0];
    }

    static async update(id, customerCode, name, mobile, email, address) {
        const result = await pool.query(
            `UPDATE customers 
             SET customer_code = $1, name = $2, mobile = $3, email = $4, address = $5, updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [customerCode, name, mobile, email, address, id]
        );
        return result.rows[0];
    }

    static async getById(id) {
        return this.findById(id);
    }

    static async delete(id) {
        await pool.query("DELETE FROM customers WHERE id = $1", [id]);
    }

    static async toggleStatus(id, isActive) {
        const result = await pool.query(
            "UPDATE customers SET is_active = $1 WHERE id = $2 RETURNING *",
            [isActive, id]
        );
        return result.rows[0];
    }
}

module.exports = Customer;
