require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ Database Connected"))
.catch(err => console.error("❌ Connection Error:", err));

const Product = mongoose.model('Product', {
    name: String,
    price: Number,
    image: String
});

const User = mongoose.model('User', {
    name: String,
    email: { type: String, unique: true, required: true },
    phone: { type: String, unique: true, required: true },
    pass: String,
    address: String
});

const Order = mongoose.model('Order', {
    userEmail: String,
    userName: String,
    userPhone: String,
    address: String,
    items: Array,
    total: Number,
    status: { type: String, default: 'Pending' },
    date: { type: Date, default: Date.now } // <--- ADD THIS LINE
});
// --- ROUTES ---

// Registration with uniqueness check
const bcrypt = require('bcrypt');

app.post('/register', async (req, res) => {
    try {
        const hashedPass = await bcrypt.hash(req.body.pass, 10);

        const newUser = new User({
            ...req.body,
            pass: hashedPass
        });

        await newUser.save();
        res.status(200).send({ message: "Account Created!" });

    } catch (error) {
        res.status(400).send({ message: "Email or Phone already exists!" });
    }
});


// Login


app.post('/login', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return res.status(401).send("Invalid credentials");

    const isMatch = await bcrypt.compare(req.body.pass, user.pass);

    if (isMatch) res.json(user);
    else res.status(401).send("Invalid credentials");
});

// Products
app.get('/get-products', async (req, res) => res.json(await Product.find()));
app.post('/add-product', async (req, res) => {
    await new Product(req.body).save();
    res.send("Saved");
});
app.delete('/delete-product/:id', async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.send("Deleted");
});

// Orders
app.post('/place-order', async (req, res) => {
    await new Order(req.body).save();
    res.send("Order Placed");
});

app.get('/admin/orders', async (req, res) => res.json(await Order.find()));
// Add this to your server.js
app.get('/my-orders/:email', async (req, res) => {
    try {
        const orders = await Order.find({ userEmail: req.params.email });
        res.json(orders);
    } catch (error) {
        res.status(500).send("Error fetching orders");
    }
});
app.post('/admin/update-status', async (req, res) => {
    const { id, status } = req.body;
    await Order.findByIdAndUpdate(id, { status: status });
    res.send("Updated");
});
// Update Product Details
app.post('/update-product', async (req, res) => {
    const { id, name, price } = req.body;
    await Product.findByIdAndUpdate(id, { name, price });
    res.send("Product Updated");
});
// Get total registered users count
// server.js

// 1. Get total registered users count
app.get('/admin/stats/users-count', async (req, res) => {
    const count = await User.countDocuments();
    res.json({ totalUsers: count });
});

// 2. Get counts for Delivered and Pending orders
app.get('/admin/stats/order-status-counts', async (req, res) => {
    const deliveredCount = await Order.countDocuments({ status: 'Delivered' });
    const pendingCount = await Order.countDocuments({ status: 'Pending' });
    res.json({ delivered: deliveredCount, pending: pendingCount });
});

// Get total products sold (sum of all items in all orders)
app.get('/admin/stats/total-sold', async (req, res) => {
    const orders = await Order.find();
    let totalItems = 0;
    orders.forEach(order => {
        order.items.forEach(item => {
            totalItems += (item.qty || 1);
        });
    });
    res.json({ totalSold: totalItems });
});

// Get sales count for a specific product name
app.get('/admin/stats/product-sales/:name', async (req, res) => {
    const orders = await Order.find({ "items.name": req.params.name });
    let count = 0;
    orders.forEach(order => {
        const item = order.items.find(i => i.name === req.params.name);
        if (item) count += (item.qty || 1);
    });
    res.json({ product: req.params.name, sales: count });
});
// Add this to server.js
app.get('/admin/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).send("Error fetching users");
    }
});
// ✅ SERVE FRONTEND FILES
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});
app.listen(3000, () => console.log("🚀 Server: http://localhost:3000"));
