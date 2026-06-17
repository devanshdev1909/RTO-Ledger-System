const pool = require("../config/db");

class User {

    static async create(username, email, passwordHash, roleId) {
        const result = await pool.query(
            "INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [username, email, passwordHash, roleId]
        );
        return result.rows[0];
    }

    static async findByEmail(email) {

        const result = await pool.query(
            `
            SELECT
                u.*,
                r.name AS role_name
            FROM users u
            JOIN roles r
            ON u.role_id = r.id
            WHERE u.email = $1
            `,
            [email]
        );

        return result.rows[0];
    }
    static async getAllWithRoles() {
        const result = await pool.query(`
            SELECT u.*, r.name AS role_name 
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ORDER BY u.created_at DESC
        `);
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        return result.rows[0];
    }

    static async update(id, roleId, username, email, mobile, passwordHash, isActive) {
        let query = `
            UPDATE users 
            SET role_id = $1, username = $2, email = $3, mobile = $4, is_active = $5, updated_at = NOW()
        `;
        const params = [roleId, username, email, mobile, isActive];
        let paramIndex = 6;

        if (passwordHash) {
            query += `, password_hash = $${paramIndex}`;
            params.push(passwordHash);
            paramIndex++;
        }

        query += ` WHERE id = $${paramIndex} RETURNING *`;
        params.push(id);

        const result = await pool.query(query, params);
        return result.rows[0];
    }

    static async delete(id) {
        await pool.query("DELETE FROM users WHERE id = $1", [id]);
    }

    static async getAllUserPermissions() {
        const result = await pool.query("SELECT user_id, permission_id FROM user_permissions");
        return result.rows;
    }

    static async getUserPermissions(userId) {
        const result = await pool.query("SELECT permission_id FROM user_permissions WHERE user_id = $1", [userId]);
        return result.rows;
    }

    static async assignPermissions(userId, permissions, client) {
        const dbClient = client || pool;
        for (const p of permissions) {
            await dbClient.query(
                "INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2)",
                [userId, p]
            );
        }
    }

    static async clearPermissions(userId, client) {
        const dbClient = client || pool;
        await dbClient.query("DELETE FROM user_permissions WHERE user_id = $1", [userId]);
    }

    static async checkUserExists(username, email) {
        const result = await pool.query("SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1", [username, email]);
        return result.rows.length > 0;
    }
}

module.exports = User;