const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const Customer = require('../models/Customer');

// Show login page
exports.getLogin = (req, res) => {
    // If they go to /portal/login directly, redirect them to the unified login page
    res.redirect('/login');
};

// Show register page
exports.getRegister = (req, res) => {
    res.render('customers/portal/register', { error: null });
};

// Handle Registration (Direct Account Creation)
exports.postRegister = async (req, res) => {
    const { name, mobile, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Generate a random customer code
        const customerCode = 'CUST' + Date.now().toString().slice(-6);

        // Account is immediately active (is_active = true)
        const customer = await Customer.create(
            customerCode,
            name,
            mobile,
            email,
            hashedPassword
        );

        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('customers/portal/register', { error: 'Registration failed. Try again.' });
    }
};

// Handle Login
exports.postLogin = async (req, res) => {
    const { identifier, password } = req.body;
    try {
        const customer = await Customer.findByIdentifier(identifier);
        if (!customer) {
            return res.render('auth/login', { activeTab: 'customer', error: 'Invalid credentials' });
        }

        // Basic check for users created before passwords were added
        if (!customer.password) {
            return res.render('auth/login', { activeTab: 'customer', error: 'Please contact admin to set a password.' });
        }

        const isMatch = await bcrypt.compare(password, customer.password);

        if (isMatch) {
            // Set Customer Session
            req.session.customerId = customer.id;
            req.session.customerName = customer.name;
            res.redirect('/portal/dashboard');
        } else {
            res.render('auth/login', { activeTab: 'customer', error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.render('auth/login', { activeTab: 'customer', error: 'Login failed' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};
