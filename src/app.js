require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");

const authRouter = require("./routes/auth.routes");
const { isLoggedIn } = require("./middleware/auth");

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

// Routes
app.use("/", authRouter);

// Dashboard
app.get("/dashboard", isLoggedIn, (req, res) => {
  res.render("dashboard", { userName: req.session.userName });
});

app.get("/test-session", (req, res) => {
    res.send(req.session);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});