const bcrypt = require("bcrypt");
const User = require("../models/User");

module.exports.renderSignup = (req, res) => {
    res.render("auth/signup");
};

module.exports.renderLogin = (req, res) => {
    res.render("auth/login");
};

module.exports.signup = async (req, res) => {

    try {

        const {
            fullName,
            email,
            mobile,
            password
        } = req.body;

        const hashedPassword =
            await bcrypt.hash(password, 10);

        await User.createUser(
            2, // Operator Role
            fullName,
            email,
            hashedPassword,
            mobile
        );

        res.send("User Created Successfully");

    } catch (err) {

        console.log(err);

        res.send(err.message);
    }
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

        const isMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!isMatch) {
            return res.send(
                "Invalid Password"
            );
        }

        req.session.userId = user.id;

        req.session.userName = user.full_name;

        req.session.roleId = user.role_id;

        req.session.roleName = user.role_name;
 
        res.redirect("/dashboard");

    } catch (err) {

        console.log(err);

        res.send(err.message);

    }

};