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
}

module.exports = Customer;
