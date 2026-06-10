module.exports.allowRoles = (...roles) => {

    return (req, res, next) => {

        if (!roles.includes(req.session.roleName)) {

            return res.status(403).send(
                "Access Denied"
            );
        }

        next();

    };

};