const bcrypt = require("bcrypt");
const User = require("../models/User");

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

        res.redirect("/dashboard");

    } catch (err) {

        console.log(err);

        res.send(err.message);

    }

};