const pool = require("../config/db");

class Role {
    static async getAll(excludeAdmin = false) {
        let query = "SELECT * FROM roles ORDER BY id ASC";
        if (excludeAdmin) {
            query = "SELECT * FROM roles WHERE name != 'Admin' ORDER BY id ASC";
        }
        const result = await pool.query(query);
        return result.rows;
    }

    static async getPermissions() {
        const result = await pool.query("SELECT * FROM permissions ORDER BY id ASC");
        return result.rows;
    }

    static async getRolePermissions() {
        const result = await pool.query("SELECT role_id, permission_id FROM role_permissions");
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query("SELECT * FROM roles WHERE id = $1", [id]);
        return result.rows[0];
    }

    static async getPermissionsForRole(roleId) {
        const result = await pool.query("SELECT permission_id FROM role_permissions WHERE role_id = $1", [roleId]);
        return result.rows;
    }

    static async create(name, description, client) {
        const dbClient = client || pool;
        const result = await dbClient.query(
            "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id",
            [name, description]
        );
        return result.rows[0];
    }

    static async assignPermissions(roleId, permissions, client) {
        const dbClient = client || pool;
        for (const p of permissions) {
            await dbClient.query(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
                [roleId, p]
            );
        }
    }

    static async update(id, name, description, client) {
        const dbClient = client || pool;
        await dbClient.query(
            "UPDATE roles SET name = $1, description = $2, updated_at = NOW() WHERE id = $3",
            [name, description, id]
        );
    }

    static async clearPermissions(roleId, client) {
        const dbClient = client || pool;
        await dbClient.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);
    }

    static async delete(id) {
        await pool.query("DELETE FROM roles WHERE id = $1", [id]);
    }

    static async hasUsers(id) {
        const result = await pool.query("SELECT id FROM users WHERE role_id = $1 LIMIT 1", [id]);
        return result.rows.length > 0;
    }
}

module.exports = Role;
