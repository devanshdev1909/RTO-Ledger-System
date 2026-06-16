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

        req.session.userRole = user.role_name;


        res.redirect("/dashboard");

    } catch (err) {

        console.log(err);
        res.render("auth/login", { activeTab: 'staff', error: "Server Error" });
    }

};