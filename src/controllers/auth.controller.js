const bcrypt = require("bcrypt");
const User = require("../models/User");
const pool = require("../config/db");

module.exports.renderLogin = (req, res) => {
    res.render("auth/login", { activeTab: 'staff', error: null });
};

module.exports.login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        const user =
            await User.findByEmail(email);

        if (!user) {
            return res.render("auth/login", { activeTab: 'staff', error: "User Not Found" });
        }

        const isMatch = password === user.password_hash;

        if (!isMatch) {
            return res.render("auth/login", { activeTab: 'staff', error: "Invalid Password" });
        }

        req.session.userId =
            user.id;

        req.session.roleId =
            user.role_id;

        req.session.userName =
            user.username;

        // Load permissions from user_permissions
        let permResult = await pool.query(`
        SELECT p.code
        FROM permissions p
        JOIN user_permissions up ON p.id = up.permission_id
        WHERE up.user_id = $1
        `, [user.id]);

        // Fallback: If user has no custom permissions, load their role defaults
        if (permResult.rows.length === 0) {
            permResult = await pool.query(`
            SELECT p.code
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
            `, [user.role_id]);
        }

        req.session.permissions = permResult.rows.map(r => r.code);
        req.session.userRole = user.role_name;


        res.redirect("/dashboard");

    } catch (err) {

        console.log(err);
        res.render("auth/login", { activeTab: 'staff', error: "Server Error" });
    }

};