const express = require("express");
const cors = require("cors");

const customerRoutes = require("./routes/customer.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("RTO Ledger Backend Running");
});

// const PORT = 5000;

// const customerRoutes = require("./routes/customer.routes");
// app.use("/api/customers", customerRoutes);

app.use("/api/customers", customerRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});