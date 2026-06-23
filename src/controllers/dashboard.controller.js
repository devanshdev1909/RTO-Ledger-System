const db = require("../config/db");
const Customer = require("../models/Customer");
const Vehicle = require("../models/Vehicle");
const ServiceRequest = require("../models/ServiceRequest");
const Ledger = require("../models/Ledger");

module.exports.postQuickAdd = async (req, res) => {
    const client = await db.connect();
    try {
        await client.query("BEGIN");
        const { customer, vehicles, services } = req.body;
        const receiptsToPrint = [];

        // 1. Create Customer
        const customerCode = await Customer.getNextCustomerCode(client);
        const newCustomer = await Customer.createStaff(
            customerCode, customer.name, customer.mobile,
            customer.email || null, customer.address, req.session.userId, client
        );
        const customerId = newCustomer.id;

        // 2. Create Vehicles
        const vehicleMap = {}; // Maps frontend temporary index to real DB ID
        if (vehicles && vehicles.length > 0) {
            for (const v of vehicles) {
                const newVehicle = await Vehicle.create(
                    customerId, v.vehicle_number, v.vehicle_type,
                    v.chassis_number || null, v.engine_number || null, v.registration_date || null, client
                );
                vehicleMap[v.index] = newVehicle.id;
            }
        }

        // 3. Create Service Requests and Compulsory Ledgers
        if (services && services.length > 0) {
            for (const s of services) {
                const realVehicleId = vehicleMap[s.vehicle_index];

                const newRequest = await ServiceRequest.create(
                    customerId, realVehicleId, s.service_id,
                    s.service_fee, null, client
                );

                const paidAmount = parseFloat(s.paid_amount) || 0;
                const serviceFee = parseFloat(s.service_fee) || 0;
                
                let ledgerStatus = "Unpaid";
                if (paidAmount >= serviceFee && serviceFee > 0) ledgerStatus = "Paid";
                else if (paidAmount > 0) ledgerStatus = "Partial";

                // Instantly Create Compulsory Ledger
                const newLedger = await Ledger.create(
                    customerId, realVehicleId, newRequest.id,
                    serviceFee, paidAmount, ledgerStatus, client
                );

                // Create Receipt even if amount paid is 0
                if (paidAmount >= 0 && s.payment_mode) {
                    const Receipt = require("../models/Receipt");
                    const receiptNo = await Receipt.getNextReceiptNo(client);
                    const newReceipt = await Receipt.create(
                        receiptNo, newLedger.id, customerId, paidAmount, 
                        s.payment_mode, "Quick Add Registration", req.session.userId, client
                    );
                    receiptsToPrint.push(newReceipt.id);
                }
            }
        }
        await client.query("COMMIT");
        res.status(200).json({ success: true, receipts: receiptsToPrint });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Quick Add Error:", err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};
module.exports.renderDashboard = async (req, res) => {

    try {

        const totalCustomers = await db.query(`
            SELECT COUNT(*) AS total
            FROM customers
        `);

        const totalVehicles = await db.query(`
            SELECT COUNT(*) AS total
            FROM vehicles
        `);

        const totalServices = await db.query(`
            SELECT COUNT(*) AS total
            FROM services
        `);

        const totalRequests = await db.query(`
            SELECT COUNT(*) AS total
            FROM service_requests
        `);

        const pendingJobs = await db.query(`
            SELECT COUNT(*) AS total
            FROM service_requests
            WHERE status = 'Pending'
        `);

        const completedJobs = await db.query(`
            SELECT COUNT(*) AS total
            FROM service_requests
            WHERE status = 'Completed'
        `);

        const todayRequests = await db.query(`
            SELECT COUNT(*) AS total
            FROM service_requests
            WHERE DATE(created_at) = CURRENT_DATE
        `);

        const revenue = await db.query(`
            SELECT COALESCE(SUM(service_fee),0) AS total
            FROM ledgers
        `);

        const dueAmount = await db.query(`
            SELECT COALESCE(SUM(due_amount),0) AS total
            FROM ledgers
        `);

        const requestsOverTime = await db.query(`
            SELECT TO_CHAR(created_at, 'DD Mon') as month, COUNT(*) as count
            FROM service_requests
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY TO_CHAR(created_at, 'DD Mon'), DATE_TRUNC('day', created_at)
            ORDER BY DATE_TRUNC('day', created_at) ASC
        `);

        const customersOverTime = await db.query(`
            SELECT TO_CHAR(created_at, 'DD Mon') as month, COUNT(*) as count
            FROM customers
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY TO_CHAR(created_at, 'DD Mon'), DATE_TRUNC('day', created_at)
            ORDER BY DATE_TRUNC('day', created_at) ASC
        `);

        res.render("dashboard", {
            activePage: "dashboard",
            userName: req.session.userName || "Admin",

            stats: {
                customers: totalCustomers.rows[0].total,
                vehicles: totalVehicles.rows[0].total,
                services: totalServices.rows[0].total,
                requests: totalRequests.rows[0].total,
                pendingJobs: pendingJobs.rows[0].total,
                completedJobs: completedJobs.rows[0].total,
                todayRequests: todayRequests.rows[0].total,
                revenue: revenue.rows[0].total,
                dueAmount: dueAmount.rows[0].total
            },
            chartData: {
                requestsOverTime: JSON.stringify(requestsOverTime.rows),
                customersOverTime: JSON.stringify(customersOverTime.rows)
            }
        });

    } catch (err) {

        console.log(err);
        res.send(err.message);

    }

};