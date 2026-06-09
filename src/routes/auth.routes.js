const express = require("express");
const router = express.Router();

const authController = require(
    "../controllers/auth.controller"
);

router.get(
    "/signup",
    authController.renderSignup
);

router.post(
    "/signup",
    authController.signup
);

router.get(
    "/login",
    authController.renderLogin
);

router.post(
    "/login",
    authController.login
);

router.get(
    "/logout",
    (req, res) => {

        req.session.destroy(() => {

            res.redirect("/login");

        });

    }
);

module.exports = router;