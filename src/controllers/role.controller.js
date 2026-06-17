const pool = require("../config/db");
const Role = require("../models/Role");


// Get all roles
exports.getRoles = async (req, res) => {
    try {
        const rolesList = await Role.getAll(true); // excludeAdmin = true
        const allPermissionsList = await Role.getPermissions();
        const rolePermsList = await Role.getRolePermissions();

        // Attach current permissions array to each role
        const roles = rolesList.map(role => {
            const perms = rolePermsList
                .filter(rp => rp.role_id === role.id)
                .map(rp => parseInt(rp.permission_id, 10));
            return { ...role, currentPermissions: perms };
        });

        res.render("admin/roles/index", {
            roles: roles,
            allPermissions: allPermissionsList,
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
        await Role.create(role_name, description);
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
        const hasUsers = await Role.hasUsers(roleId);
        if (hasUsers) {
            return res.redirect("/admin/roles?error=CannotDeleteRoleWithUsers");
        }

        await Role.delete(roleId);
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
        const role = await Role.findById(roleId);
        if (!role) return res.redirect("/admin/roles");

        const allPermissions = await Role.getPermissions();

        // Fetch current permissions for this role
        const rolePerms = await Role.getPermissionsForRole(roleId);

        // Map to an array of permission IDs
        const currentPermissions = rolePerms.map(r => parseInt(r.permission_id, 10));

        res.render("admin/roles/permissions", {
            role: role,
            allPermissions: allPermissions,
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

    console.log("Updating role permissions for role:", roleId);
    console.log("req.body:", req.body);
    console.log("permissions:", permissions);

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Clear old permissions for this role
        await Role.clearPermissions(roleId, client);

        // Insert new permissions
        if (permissions && Array.isArray(permissions)) {
            await Role.assignPermissions(roleId, permissions, client);
        } else if (permissions) {
            // If only one checkbox is checked, it comes as a string
            await Role.assignPermissions(roleId, [permissions], client);
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
