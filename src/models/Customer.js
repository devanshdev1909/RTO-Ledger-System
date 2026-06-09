const pool = require("../config/db");

class Customer {

    // Create a new customer
    static async create(
        fullName,
        mobile,
        email,
        address,
        aadharNumber,
        createdBy
    ) {
        const result = await pool.query(
            `
            INSERT INTO customers
            (
                full_name,
                mobile,
                email,
                address,
                aadhar_number,
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [fullName, mobile, email, address, aadharNumber, createdBy]
        );

        return result.rows[0];
    }

    // Find customer by ID
    static async findById(id) {
        const result = await pool.query(
            `SELECT * FROM customers WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Find all customers
    static async findAll() {
        const result = await pool.query(
            `SELECT * FROM customers ORDER BY created_at DESC`
        );
        return result.rows;
    }

    // Search customers by name or mobile
    static async search(query) {
        const result = await pool.query(
            `
            SELECT * FROM customers
            WHERE full_name ILIKE $1
            OR mobile ILIKE $1
            ORDER BY full_name ASC
            `,
            [`%${query}%`]
        );
        return result.rows;
    }

    // Update customer
    static async update(id, fullName, mobile, email, address, aadharNumber) {
        const result = await pool.query(
            `
            UPDATE customers
            SET
                full_name = $1,
                mobile = $2,
                email = $3,
                address = $4,
                aadhar_number = $5,
                updated_at = NOW()
            WHERE id = $6
            RETURNING *
            `,
            [fullName, mobile, email, address, aadharNumber, id]
        );
        return result.rows[0];
    }

    // Delete customer
    static async delete(id) {
        const result = await pool.query(
            `DELETE FROM customers WHERE id = $1 RETURNING *`,
            [id]
        );
        return result.rows[0];
    }
}

module.exports = Customer;
