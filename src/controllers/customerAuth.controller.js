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
    const { name, mobile, email, password, confirm_password } = req.body;

    // Basic server-side validation
    if (!name || !mobile || !password) {
        return res.render('customers/portal/register', { error: 'Please fill in all required fields.' });
    }

    if (password !== confirm_password) {
        return res.render('customers/portal/register', { error: 'Passwords do not match.' });
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
        return res.render('customers/portal/register', { error: 'Please enter a valid 10-digit mobile number.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Generate a random customer code
        const customerCode = 'CUST' + Date.now().toString().slice(-6);

        // Account is immediately active (is_active = true)
        const customer = await Customer.create(
            customerCode,
            name,
            mobile,
            email || null,
            hashedPassword
        );

        res.redirect('/login');
    } catch (err) {
        console.error('Registration error:', err.message);
        // Check for duplicate mobile/email
        if (err.code === '23505') {
            return res.render('customers/portal/register', { error: 'An account with this mobile number or email already exists.' });
        }
        res.render('customers/portal/register', { error: 'Registration failed: ' + err.message });
    }
};

// Show activate account page
exports.getActivateAccount = (req, res) => {
    res.render('customers/portal/activate', { error: null });
};

// Handle account activation (setting password for staff-created users)
exports.postActivateAccount = async (req, res) => {
    const { mobile, password, confirm_password } = req.body;

    if (!mobile || !password) {
        return res.render('customers/portal/activate', { error: 'Please fill in all required fields.' });
    }

    if (password !== confirm_password) {
        return res.render('customers/portal/activate', { error: 'Passwords do not match.' });
    }

    try {
        const customer = await Customer.findByIdentifier(mobile);
        
        if (!customer) {
            return res.render('customers/portal/activate', { error: 'No account found with this mobile number.' });
        }

        if (customer.password) {
            return res.render('customers/portal/activate', { error: 'Account is already active. Please log in.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await Customer.setPassword(customer.id, hashedPassword);

        // Set Customer Session
        req.session.customerId = customer.id;
        req.session.customerName = customer.name;
        res.redirect('/portal/dashboard');
    } catch (err) {
        console.error(err);
        res.render('customers/portal/activate', { error: 'Failed to activate account. Please try again.' });
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
