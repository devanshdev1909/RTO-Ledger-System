const pool = require("../config/db");

// List all users
module.exports.listUsers = async (req, res) => {
    try {
        const usersRes = await pool.query(`
            SELECT u.id, u.username, u.email, u.is_active, r.name as role_name 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.name != 'Admin'
            ORDER BY u.id ASC
        `);
        const rolesRes = await pool.query("SELECT * FROM roles ORDER BY name ASC");
        res.render("admin/users", {
            activePage: "admin",
            userName: req.session.userName,
            users: usersRes.rows,
            roles: rolesRes.rows,
            error: req.query.error || null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// Render the edit permissions checklist page
module.exports.renderEditPermissions = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Fetch target user details
        const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (userRes.rows.length === 0) return res.status(404).send("User not found");
        
        // Fetch all system permissions
        const allPermissionsRes = await pool.query("SELECT * FROM permissions ORDER BY id ASC");
        
        // Fetch user's current permissions (from user_permissions)
        let userPermsRes = await pool.query(`
            SELECT permission_id FROM user_permissions WHERE user_id = $1
        `, [id]);
        
        let checkedPermissionIds = userPermsRes.rows.map(r => String(r.permission_id));
        
        // Fallback: If no custom permissions set, default to role permissions
        if (checkedPermissionIds.length === 0) {
            const rolePermsRes = await pool.query(`
                SELECT permission_id FROM role_permissions WHERE role_id = $1
            `, [userRes.rows[0].role_id]);
            checkedPermissionIds = rolePermsRes.rows.map(r => String(r.permission_id));
        }

        res.render("admin/edit_permissions", {
            activePage: "admin",
            userName: req.session.userName,
            user: userRes.rows[0],
            permissions: allPermissionsRes.rows,
            checkedPermissionIds
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// Update user permissions in database
module.exports.updatePermissions = async (req, res) => {
    const { id } = req.params;
    const { permission_ids } = req.body;
    const checkedIds = Array.isArray(permission_ids) ? permission_ids : (permission_ids ? [permission_ids] : []);

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        
        // Clear current permissions
        await client.query("DELETE FROM user_permissions WHERE user_id = $1", [id]);
        
        // Insert selected permissions
        if (checkedIds.length > 0) {
            for (const permId of checkedIds) {
                await client.query(`
                    INSERT INTO user_permissions (user_id, permission_id) 
                    VALUES ($1, $2)
                `, [id, permId]);
            }
        }
        
        await client.query("COMMIT");
        res.redirect("/admin/users");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).send(err.message);
    } finally {
        client.release();
    }
};

// Create a new user
const bcrypt = require("bcrypt");

module.exports.createUser = async (req, res) => {
    const { username, email, password, role_id } = req.body;

    try {
        // Check if username or email already exists
        const checkUser = await pool.query("SELECT id FROM users WHERE username = $1 OR email = $2", [username, email]);
        if (checkUser.rows.length > 0) {
            return res.redirect("/admin/users?error=UsernameOrEmailExists");
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert new user
        await pool.query(
            "INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4)",
            [username, email, password_hash, role_id]
        );

        res.redirect("/admin/users");
    } catch (err) {
        console.error(err);
        res.redirect("/admin/users?error=FailedToCreateUser");
    }
};

// Toggle user status
module.exports.toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        
        // Prevent user from deactivating themselves
        if (req.session.userId == id && !is_active) {
            return res.status(400).json({ success: false, error: "You cannot deactivate your own account" });
        }

        await pool.query(
            "UPDATE users SET is_active = $1 WHERE id = $2",
            [is_active, id]
        );
        res.json({ success: true, message: "User status updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};
