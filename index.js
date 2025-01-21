require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const loginRoutes = require('./src/login_api.js');
const productsRoutes = require('./src/product.js');
const purchasesRoutes = require('./src/purchases.js');
const reportRoutes = require('./src/reports.js');
const queryDatabase = require('./src/db.connection.js');
const corsOptions = require('./src/cors.js');
const signupRoute = require('./src/signup.js');
const bodyParser = require('body-parser'); // Required for parsing request body

const app = express();
const port = process.env.PORT || 5000;
app.use(bodyParser.json());
app.use(express.json());
app.use(cors(corsOptions));
app.use(session({
    secret: process.env.SESSION_SECRET || 'kuldeep',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Get the route handlers
const login = loginRoutes(queryDatabase);
const signup = signupRoute(queryDatabase);
const products = productsRoutes(queryDatabase);
const purchases = purchasesRoutes(queryDatabase);
const report = reportRoutes(queryDatabase);

// Use the route handlers directly
app.post('/login', login.login);
app.get('/check-auth', login.checkAuth);
app.get('/logout', login.logout);
app.post('/forgot-password', login.forgotPassword);
app.post('/reset-password', login.resetPassword);
app.post('/signup', signup.signup);

// Product routes
app.get('/api/products', products.getAllProducts);
app.post('/api/products/add', products.addProduct);
app.put('/api/products/:id', products.updateProduct);
app.delete('/api/products/:id', products.deleteProduct);

// Purchase routes
app.post('/api/purchases', async (req, res) => {
    console.log("Request Body:", req.body); // Debug: Print the request body
    const purchasesData = req.body;
    try {
        await purchases.addPurchases(purchasesData);
        res.status(201).json({ message: 'Purchases added successfully' });
    } catch (error) {
        console.error("Error adding purchases:", error);
        res.status(500).json({ message: 'Failed to add purchases', error: error.message });
    }
});

app.get('/api/purchases/admin', purchases.getAllPurchasesAdmin);
app.delete('/api/purchases/:purchId', purchases.deletePurchase);
app.put('/api/purchases/:purchId', purchases.updatePurchase);

// Report routes
app.get('/api/reports', report.generateReport);

// Static files (for production)
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});