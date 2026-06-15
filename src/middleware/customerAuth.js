module.exports = (req, res, next) => {
    if (req.session && req.session.customerId) {
        // Expose customer details to EJS templates
        res.locals.customerName = req.session.customerName;
        return next();
    }
    res.redirect('/login');
};
