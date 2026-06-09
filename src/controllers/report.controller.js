const Report = require("../models/Report");

// Render reports dashboard
module.exports.reportsDashboard = async (req, res) => {
    try {
        const stats = await Report.getDashboardStats();
        res.render("reports/index", { stats });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load reports");
        res.redirect("/dashboard");
    }
};

// Daily collection report
module.exports.dailyCollection = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split("T")[0];
        const data = await Report.getDailyCollection(date);
        res.render("reports/daily", { data, date });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load daily report");
        res.redirect("/reports");
    }
};

// Monthly revenue report
module.exports.monthlyRevenue = async (req, res) => {
    try {
        const now = new Date();
        const year = req.query.year || now.getFullYear();
        const month = req.query.month || (now.getMonth() + 1);
        const data = await Report.getMonthlyRevenue(year, month);
        res.render("reports/monthly", { data, year, month });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load monthly report");
        res.redirect("/reports");
    }
};

// Outstanding dues report
module.exports.outstandingDues = async (req, res) => {
    try {
        const data = await Report.getOutstandingDues();
        res.render("reports/outstanding", { data });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load outstanding report");
        res.redirect("/reports");
    }
};

// Service-wise summary
module.exports.serviceWise = async (req, res) => {
    try {
        const now = new Date();
        const startDate = req.query.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const endDate = req.query.endDate || now.toISOString().split("T")[0];
        const data = await Report.getServiceWiseSummary(startDate, endDate);
        res.render("reports/service-wise", { data, startDate, endDate });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load service report");
        res.redirect("/reports");
    }
};

// Operator performance report
module.exports.operatorPerformance = async (req, res) => {
    try {
        const now = new Date();
        const startDate = req.query.startDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const endDate = req.query.endDate || now.toISOString().split("T")[0];
        const data = await Report.getOperatorPerformance(startDate, endDate);
        res.render("reports/operator", { data, startDate, endDate });
    } catch (err) {
        console.log(err);
        req.flash("error", "Failed to load operator report");
        res.redirect("/reports");
    }
};
