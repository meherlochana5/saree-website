require('dotenv').config();  // MUST BE FIRST

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// 1. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ Database Connected"))
.catch(err => console.error("❌ Connection Error:", err));

// 2. MODELS 
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
    date: { type: Date, default: Date.now } 
});

let otpStore = {};

// 3. NODEMAILER SETUP (Fixed: Only defined ONCE)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false 
    }
});

// --- ROUTES ---

// Registration
app.post('/register', async (req, res) => {
    try {
        const hashedPass = await bcrypt.hash(req.body.pass, 10);
        const newUser = new User({ ...req.body, pass: hashedPass });
        await newUser.save();
        res.status(200).send({ message: "Account Created!" });
    } catch (error) {
        res.status(400).send({ message: "Email or Phone already exists!" });
    }
});

// User Login
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

app.post('/update-product', async (req, res) => {
    const { id, name, price } = req.body;
    await Product.findByIdAndUpdate(id, { name, price });
    res.send("Product Updated");
});

// --- ADMIN STATS ---
app.get('/admin/stats/users-count', async (req, res) => {
    const count = await User.countDocuments();
    res.json({ totalUsers: count });
});

app.get('/admin/stats/order-status-counts', async (req, res) => {
    const deliveredCount = await Order.countDocuments({ status: 'Delivered' });
    const pendingCount = await Order.countDocuments({ status: 'Pending' });
    res.json({ delivered: deliveredCount, pending: pendingCount });
});

app.get('/admin/stats/total-sold', async (req, res) => {
    const orders = await Order.find();
    let totalItems = 0;
    orders.forEach(order => {
        order.items.forEach(item => { totalItems += (item.qty || 1); });
    });
    res.json({ totalSold: totalItems });
});

app.get('/admin/stats/product-sales/:name', async (req, res) => {
    const orders = await Order.find({ "items.name": req.params.name });
    let count = 0;
    orders.forEach(order => {
        const item = order.items.find(i => i.name === req.params.name);
        if (item) count += (item.qty || 1);
    });
    res.json({ product: req.params.name, sales: count });
});

app.get('/admin/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).send("Error fetching users");
    }
});

app.post("/admin-login", (req, res) => {
    const { email, pass } = req.body;
    if(email === "admin@gmail.com" && pass === "1234"){
        res.send({ success: true });
    } else {
        res.status(401).send({ success: false });
    }
});

// --- FORGOT PASSWORD SYSTEM ---

app.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body; 
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[email] = otp; 

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset OTP',
            html: `<h2>Your OTP is ${otp}</h2><p>Use this to reset your password for SareeShop.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("❌ NODEMAILER ERROR:", error);
                return res.status(500).send("Email failed: " + error.message);
            }
            console.log("✅ Email sent: " + info.response);
            res.send("OTP sent");
        });

    } catch (err) {
        console.log("❌ SERVER ERROR:", err);
        res.status(500).send("Error sending email");
    }
});

app.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpStore[email] == otp) {
        res.send("Verified");
    } else {
        res.status(400).send("Invalid");
    }
});

app.post('/reset-password', async (req, res) => {
    try {
        const { email, newPass } = req.body;
        const hashed = await bcrypt.hash(newPass, 10);
        await User.findOneAndUpdate({ email }, { pass: hashed });
        delete otpStore[email];
        res.send("Updated");
    } catch (err) {
        res.status(500).send("Failed");
    }
});

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});