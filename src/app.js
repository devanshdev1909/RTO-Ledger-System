require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");

// Route imports
const authRouter = require("./routes/auth.routes");
const customerRouter = require("./routes/customer.routes");
const vehicleRouter = require("./routes/vehicle.routes");
const jobRouter = require("./routes/job.routes");
const ledgerRouter = require("./routes/ledger.routes");
const reportRouter = require("./routes/report.routes");

const { isLoggedIn } = require("./middleware/auth");
const Report = require("./models/Report");
const pool = require("./config/db");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "rtoledgersecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.messages = {
    success: req.flash("success"),
    error: req.flash("error"),
  };
  next();
});

// Routes
app.use("/", authRouter);
app.use("/customers", customerRouter);
app.use("/vehicles", vehicleRouter);
app.use("/jobs", jobRouter);
app.use("/ledger", ledgerRouter);
app.use("/reports", reportRouter);

// Dashboard
app.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    const stats = await Report.getDashboardStats();
    res.render("dashboard", {
      userName: req.session.userName,
      stats,
    });
  } catch (err) {
    console.log(err);
    res.render("dashboard", {
      userName: req.session.userName,
      stats: null,
    });
  }
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});