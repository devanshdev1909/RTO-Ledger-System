const pool = require("../config/db");
const User = require("../models/User");
const Role = require("../models/Role");

// List all users
module.exports.listUsers = async (req, res) => {
    try {
        // We added u.role_id here so we can look up their role permissions!
        const allUsers = await User.getAllWithRoles();
        const usersList = allUsers.filter(u => u.role_name !== 'Admin');

        const rolesList = await Role.getAll();

        // Fetch permissions mappings for the modal
        const allPermissionsList = await Role.getPermissions();
        const userPermsList = await User.getAllUserPermissions();
        const rolePermsList = await Role.getRolePermissions();

        const users = usersList.map(u => {
            // First look for custom user permissions
            let perms = userPermsList
                .filter(up => up.user_id === u.id)
                .map(up => parseInt(up.permission_id, 10));

            // Fallback: If no custom permissions, use the role's default permissions
            if (perms.length === 0) {
                perms = rolePermsList
                    .filter(rp => rp.role_id === u.role_id)
                    .map(rp => parseInt(rp.permission_id, 10));
            }
            return { ...u, currentPermissions: perms };
        });

        res.render("admin/users", {
            activePage: "admin",
            userName: req.session.userName,
            users: users,
            roles: rolesList,
            allPermissions: allPermissionsList, // Pass permissions to view
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
        const user = await User.findById(id);
        if (!user) return res.status(404).send("User not found");

        // Fetch all system permissions
        const allPermissions = await Role.getPermissions();

        // Fetch user's current permissions (from user_permissions)
        const userPerms = await User.getUserPermissions(id);
        let checkedPermissionIds = userPerms.map(r => String(r.permission_id));

        // Fallback: If no custom permissions set, default to role permissions
        if (checkedPermissionIds.length === 0) {
            const rolePerms = await Role.getPermissionsForRole(user.role_id);
            checkedPermissionIds = rolePerms.map(r => String(r.permission_id));
        }

        res.render("admin/edit_permissions", {
            activePage: "admin",
            userName: req.session.userName,
            user: user,
            allPermissions: allPermissions,
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
        await User.clearPermissions(id, client);

        // Insert selected permissions
        if (checkedIds.length > 0) {
            await User.assignPermissions(id, checkedIds, client);
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
        const exists = await User.checkUserExists(username, email);
        if (exists) {
            return res.redirect("/admin/users?error=UsernameOrEmailExists");
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert new user
        await User.create(username, email, password_hash, role_id);

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

        await User.update(id, undefined, undefined, undefined, undefined, undefined, is_active);
        res.json({ success: true, message: "User status updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Delete a user
module.exports.deleteUser = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        // Prevent user from deleting themselves
        if (req.session.userId == id) {
            return res.redirect("/admin/users?error=CannotDeleteSelf");
        }

        await client.query("BEGIN");

        // Delete related user_permissions first
        await User.clearPermissions(id, client);

        // Then delete the user
        await User.delete(id);

        await client.query("COMMIT");
        res.redirect("/admin/users");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Delete user error:", err);
        // Provide user-friendly error message if foreign key constraint is violated
        if (err.code === '23503') {
            res.redirect("/admin/users?error=CannotDeleteUserInUse");
        } else {
            res.redirect("/admin/users?error=FailedToDeleteUser");
        }
    } finally {
        client.release();
    }
};
