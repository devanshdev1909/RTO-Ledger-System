module.exports.isLoggedIn = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }
    next();
};

module.exports.hasPermission = (permissionCode) => {
    return (req, res, next) => {
        const permissions = req.session.permissions || [];
        if (permissions.includes(permissionCode)) {
            return next();
        }
        return res.status(403).render("error", {
            message: "Access Denied",
            detail: `You do not have permission to perform this action. Required: ${permissionCode}`,
            userName: req.session.userName || ''
        });
    };
};

module.exports.isCustomerLoggedIn = (req, res, next) => {
    if (!req.session.customerId) {
        return res.redirect("/customer/login");
    }
    next();
};
