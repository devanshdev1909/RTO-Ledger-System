const pool = require("../config/db");

// Get all roles
exports.getRoles = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM roles WHERE name != 'Admin' ORDER BY id ASC");
        res.render("admin/roles/index", {
            roles: result.rows,
            activePage: "roles",
            error: req.query.error || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

// Create a new role
exports.postCreateRole = async (req, res) => {
    const { role_name, description } = req.body;
    try {
        await pool.query(
            "INSERT INTO roles (name, description) VALUES ($1, $2)",
            [role_name, description]
        );
        res.redirect("/admin/roles");
    } catch (err) {
        console.error(err);
        res.redirect("/admin/roles?error=FailedToCreateRole");
    }
};

// Delete a role
exports.postDeleteRole = async (req, res) => {
    const roleId = req.params.id;
    try {
        // Prevent deleting roles that have users
        const usersCheck = await pool.query("SELECT id FROM users WHERE role_id = $1 LIMIT 1", [roleId]);
        if (usersCheck.rows.length > 0) {
            return res.redirect("/admin/roles?error=CannotDeleteRoleWithUsers");
        }

        await pool.query("DELETE FROM roles WHERE id = $1", [roleId]);
        res.redirect("/admin/roles");
    } catch (err) {
        console.error(err);
        res.redirect("/admin/roles?error=FailedToDeleteRole");
    }
};

// Render edit permissions page for a role
exports.getRolePermissions = async (req, res) => {
    const roleId = req.params.id;
    try {
        const roleRes = await pool.query("SELECT * FROM roles WHERE id = $1", [roleId]);
        if (roleRes.rows.length === 0) return res.redirect("/admin/roles");

        const allPermissionsRes = await pool.query("SELECT * FROM permissions ORDER BY id ASC");

        // Fetch current permissions for this role
        const rolePermsRes = await pool.query(
            "SELECT permission_id FROM role_permissions WHERE role_id = $1",
            [roleId]
        );

        // Map to an array of permission IDs
        const currentPermissions = rolePermsRes.rows.map(r => parseInt(r.permission_id, 10));

        res.render("admin/roles/permissions", {
            role: roleRes.rows[0],
            permissions: allPermissionsRes.rows,
            currentPermissions,
            activePage: "roles"
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

// Update permissions for a role
exports.postUpdateRolePermissions = async (req, res) => {
    const roleId = req.params.id;
    const { permissions } = req.body; // Array of permission IDs

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Clear old permissions for this role
        await client.query("DELETE FROM role_permissions WHERE role_id = $1", [roleId]);

        // Insert new permissions
        if (permissions && Array.isArray(permissions)) {
            for (const p_id of permissions) {
                await client.query(
                    "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
                    [roleId, p_id]
                );
            }
        } else if (permissions) {
            // If only one checkbox is checked, it comes as a string
            await client.query(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
                [roleId, permissions]
            );
        }

        await client.query("COMMIT");
        res.redirect("/admin/roles");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).send("Server Error");
    } finally {
        client.release();
    }
};
