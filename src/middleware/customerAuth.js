const pool = require('../config/db');

module.exports = async (req, res, next) => {
    if (req.session && req.session.customerId) {
        // Expose customer details to EJS templates
        res.locals.customerName = req.session.customerName;
        try {
            const profileRes = await pool.query('SELECT * FROM customers WHERE id = $1', [req.session.customerId]);
            if (profileRes.rows.length > 0) {
                res.locals.profile = profileRes.rows[0];
            }
        } catch (err) {
            console.error('Error fetching customer profile:', err);
        }
        return next();
    }
    res.redirect('/login');
};
