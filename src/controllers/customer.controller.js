const renderCustomersPage = (req, res) => {
    const customers = [
        { name: "Rahul Sharma", phone: "9876543210" },
        { name: "Amit Verma", phone: "9123456780" },
        { name: "Neha Singh", phone: "9988776655" }
    ];

    res.render("customers/index", {
        activePage: "customers",
        customers
    });
};

module.exports = {
    renderCustomersPage
};