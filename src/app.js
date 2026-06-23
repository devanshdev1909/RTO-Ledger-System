require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");

const authRouter = require("./routes/auth.routes");
const userRouter = require("./routes/user.routes");
const { isLoggedIn } = require("./middleware/auth");
const customerRouter = require("./routes/customer.routes");
const customerPortalRoutes = require('./routes/customerPortal.routes');
const vehicleRouter = require("./routes/vehicle.routes");
const ledgerRouter = require("./routes/ledger.routes");
const serviceRoutes = require("./routes/service.routes");
const roleRoutes = require("./routes/role.routes");
const receiptRouter = require("./routes/receipt.routes");
const paymentRoutes = require("./routes/payment.routes");
const dashboardRouter = require("./routes/dashboard.routes");
const pool = require("./config/db");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "rtoledgersecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(async (req, res, next) => {
  res.locals.activePage = req.path.split("/")[1] || "dashboard";

  // Fetch real-time permissions
  if (req.session.userId) {
    try {
      if (req.session.userRole === 'Admin') {
        const allPerms = await pool.query("SELECT code FROM permissions");
        req.session.permissions = allPerms.rows.map(r => r.code);
      } else {
        // 1. Try to load user-specific custom permissions
        let permResult = await pool.query(`
          SELECT p.code
          FROM permissions p
          JOIN user_permissions up ON p.id = up.permission_id
          WHERE up.user_id = $1
        `, [req.session.userId]);

        // 2. Complete Override Fallback: If no custom permissions, load their role defaults
        if (permResult.rows.length === 0 && req.session.roleId) {
          permResult = await pool.query(`
            SELECT p.code
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            WHERE rp.role_id = $1
          `, [req.session.roleId]);
        }

        req.session.permissions = permResult.rows.map(r => r.code);
      }
    } catch (err) {
      console.error("Error fetching real-time permissions:", err);
    }
  }

  res.locals.permissions = req.session.permissions || [];
  res.locals.userRole = req.session.userRole || null;
  res.locals.userName = req.session.userName || null;
  
  res.locals.currentUrl = req.originalUrl;
  res.locals.queryPath = req.path;
  res.locals.queryParams = req.query;
  
  next();
});
app.use("/admin", userRouter);

app.use(flash());




app.use("/", authRouter);
app.use("/admin/roles", roleRoutes);

app.get("/search", isLoggedIn, async (req, res) => {
  const query = (req.query.q || "").trim();
  const results = {
    customers: [],
    vehicles: [],
    receipts: []
  };

  if (query) {
    const searchTerm = `%${query}%`;

    try {
      const customerResult = await pool.query(
        `SELECT * FROM customers
         WHERE customer_code ILIKE $1 OR name ILIKE $1 OR mobile ILIKE $1 OR email ILIKE $1 OR address ILIKE $1
         ORDER BY created_at DESC LIMIT 10`,
        [searchTerm]
      );
      results.customers = customerResult.rows;
    } catch (err) {
      console.error("Search customers error:", err.message);
    }

    try {
      const vehicleResult = await pool.query(
        `SELECT v.*, c.name AS customer_name
         FROM vehicles v
         LEFT JOIN customers c ON v.customer_id = c.id
         WHERE v.vehicle_number ILIKE $1 OR v.chassis_number ILIKE $1 OR v.engine_number ILIKE $1 OR v.vehicle_type ILIKE $1 OR c.name ILIKE $1
         ORDER BY v.created_at DESC LIMIT 10`,
        [searchTerm]
      );
      results.vehicles = vehicleResult.rows;
    } catch (err) {
      console.error("Search vehicles error:", err.message);
    }

    try {
      const receiptResult = await pool.query(
        `SELECT id, receipt_no, customer_name, service_name, amount_received, payment_mode, received_at
         FROM receipts
         WHERE receipt_no ILIKE $1 OR customer_name ILIKE $1 OR service_name ILIKE $1 OR payment_mode ILIKE $1
         ORDER BY received_at DESC LIMIT 10`,
        [searchTerm]
      );
      results.receipts = receiptResult.rows;
    } catch (err) {
      console.error("Search receipts error:", err.message);
      results.receipts = [];
    }
  }

  res.render("search", {
    activePage: "search",
    query,
    results,
    userName: req.session.userName
  });
});

app.use("/vehicles", vehicleRouter);
app.use("/customers", customerRouter);
app.use('/portal', customerPortalRoutes);
app.use("/ledger", ledgerRouter);
app.use("/services", serviceRoutes);
app.use("/receipts", receiptRouter);
app.use("/dashboard", dashboardRouter);
app.use("/payments", paymentRoutes);
// Dashboard routes are handled by dashboardRouter

app.get("/test-session", (req, res) => {
  res.send(req.session);
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database()"
    );

    res.json({
      success: true,
      database: result.rows[0].current_database,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.get("/", (req, res) => {

  if (req.session.userId) {
    return res.redirect("/dashboard");
  }

  res.redirect("/login");

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});