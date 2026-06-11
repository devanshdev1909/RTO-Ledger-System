require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");

const authRouter = require("./routes/auth.routes");
const { isLoggedIn } = require("./middleware/auth");
const customerRouter = require("./routes/customer.routes");
const vehicleRouter = require("./routes/vehicle.routes");
const ledgerRouter = require("./routes/ledger.routes");
const serviceRoutes = require("./routes/service.routes");
const receiptRouter = require("./routes/receipt.routes");
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

app.use(flash());


app.use((req, res, next) => {
  res.locals.activePage = req.path.split("/")[1] || "dashboard";
  res.locals.permissions = req.session.permissions || [];
  res.locals.userRole = req.session.userRole || null;
  next();
});

// Routes
app.use("/", authRouter);
app.use("/vehicles", vehicleRouter);
app.use("/customers", customerRouter);
app.use("/ledger", ledgerRouter);
app.use("/services", serviceRoutes);
app.use("/receipts", receiptRouter);
app.use("/dashboard", dashboardRouter);
// Dashboard
app.get("/dashboard", isLoggedIn, (req, res) => {
  res.render("dashboard", { userName: req.session.userName });
});

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