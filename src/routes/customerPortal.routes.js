const express = require('express');
const router = express.Router();
const customerAuth = require('../controllers/customerAuth.controller');
const customerPortal = require('../controllers/customerPortal.controller');
const isCustomerAuth = require('../middleware/customerAuth');
const paymentController = require('../controllers/payment.controller');


// Auth Routes
router.get('/login', customerAuth.getLogin);
router.post('/login', customerAuth.postLogin);
router.get('/register', customerAuth.getRegister);
router.post('/register', customerAuth.postRegister);
router.get('/activate', customerAuth.getActivateAccount);
router.post('/activate', customerAuth.postActivateAccount);
router.get('/logout', customerAuth.logout);

// Portal Routes (Protected)
router.use(isCustomerAuth);
router.get('/dashboard', customerPortal.getDashboard);

router.get('/my-vehicles', customerPortal.getMyVehicles);
router.post('/vehicle/add', customerPortal.postAddVehicle);
router.post('/vehicle/:id/edit', customerPortal.postEditVehicle);
router.post('/vehicle/:id/delete', customerPortal.postDeleteVehicle);

router.get('/my-requests', customerPortal.getMyRequests);
router.post('/request/create', customerPortal.postCreateRequest);
router.post('/request/:id/edit', customerPortal.postEditRequest);
router.post('/request/:id/delete', customerPortal.postDeleteRequest);


router.post('/profile', customerPortal.postProfile);

// Payment integration endpoints
router.post('/payment/create-order', paymentController.createOrder);
router.post('/payment/verify', paymentController.verifyPayment);


module.exports = router;
