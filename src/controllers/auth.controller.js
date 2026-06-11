const bcrypt = require("bcrypt");
const User = require("../models/User");
const pool = require("../config/db");

module.exports.renderLogin = (req, res) => {
    res.render("auth/login");
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
            return res.send(
                "User Not Found"
            );
        }

        const isMatch = password === user.password_hash;

        if (!isMatch) {
            return res.send(
                "Invalid Password"
            );
        }

        req.session.userId =
            user.id;

        req.session.roleId =
            user.role_id;

        req.session.userName =
            user.username;

        // Load permissions for this user's role from the database
        const permResult = await pool.query(`
        SELECT p.code
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = $1
        `, [user.role_id]);

        req.session.permissions = permResult.rows.map(r => r.code);
        req.session.userRole = user.role_name;

        res.redirect("/dashboard");

    } catch (err) {

        console.log(err);

        res.send(err.message);

    }

};