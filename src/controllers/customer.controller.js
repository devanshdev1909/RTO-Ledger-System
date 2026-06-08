const customers = [
  {
    id: 1,
    name: "Rahul Sharma",
    mobile: "9876543210",
    city: "Raipur"
  },
  {
    id: 2,
    name: "Amit Verma",
    mobile: "9876543211",
    city: "Bilaspur"
  }
];

const getCustomers = (req, res) => {
  res.json(customers);
};

const createCustomer = (req, res) => {
  const customer = req.body;

  customers.push({
    id: customers.length + 1,
    ...customer
  });

  res.status(201).json({
    message: "Customer Created",
    data: customer
  });
};

module.exports = {
    getCustomers,
    createCustomer
};