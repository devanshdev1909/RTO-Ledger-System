app.get("/dashboard", (req, res) => {
    res.render("dashboard", {
        userName: req.session.userName,
        activePage: "dashboard"
    });
});