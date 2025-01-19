require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const loginRoutes = require('./src/login_api.js');
const productsRoutes = require('./src/product.js');
const queryDatabase = require('./src/db.connection.js');
const corsOptions = require('./src/cors.js');
const XLSX = require('xlsx');
const signupRoute = require('./src/signup.js');
const purchasesRoutes = require('./routes/purchases');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors(corsOptions));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key', // Replace with a strong secret in production
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Set to true in production with HTTPS
}));

// Mount the login route handler (passing the queryDatabase function)
const login = loginRoutes(queryDatabase);
const signup = signupRoute(queryDatabase);

app.post('/login', login.login);
app.get('/check-auth', login.checkAuth);
app.get('/logout', login.logout);
app.post('/forgot-password', login.forgotPassword);
app.post('/reset-password', login.resetPassword);
app.post('/signup', signup.signup);

const products = productsRoutes(queryDatabase); // Mount product routes
app.get('/api/products', products.getAllProducts);
app.post('/api/purchase_details', products.insertProducts);

// Add a new product
app.post('/api/products', async (req, res) => {
    const { prod_name, prod_desc } = req.body;
    if (!prod_name || !prod_desc) {
        return res.status(400).json({ message: 'Please provide product name and description' });
    }
    try {
        const result = await queryDatabase('INSERT INTO product_details (prod_name, prod_desc) VALUES (?, ?)', [prod_name, prod_desc]);
        res.status(201).json({ message: 'Product added', productId: result.insertId });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Error adding product' });
    }
});

// Update a product
app.put('/api/products/:id', async (req, res) => {
    const { prod_name, prod_desc } = req.body;
    const productId = req.params.id;
    try {
        await queryDatabase('UPDATE product_details SET prod_name = ?, prod_desc = ? WHERE prod_id = ?', [prod_name, prod_desc, productId]);
        res.json({ message: 'Product updated' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product' });
    }
});

// Delete a product
app.delete('/api/products/:id', async (req, res) => {
    const productId = req.params.id;
    try {
        await queryDatabase('DELETE FROM product_details WHERE prod_id = ?', [productId]);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product' });
    }
});

app.get('/api/reports', async (req, res) => {
    const { startDate, endDate, month, productName, reportType, productScope, download } = req.query;
    let query = '';
    let params = [];

    switch (reportType) {
        case 'custom':
            if (productScope === 'specific') {
                query = `SELECT p.prod_name, pur.quantity, pur.total_price, pur.purchase_date
                         FROM purchase_details pur
                         JOIN product_details p ON pur.prod_id = p.prod_id
                         WHERE pur.purchase_date BETWEEN ? AND ? AND p.prod_name = ?`;
                params = [startDate, endDate, productName];
            } else {
                query = `SELECT distinct p.prod_name, sum(pur.quantity) AS total_quantity, sum(pur.total_price) AS total_amount
                         FROM purchase_details pur
                         JOIN product_details p ON pur.prod_id = p.prod_id
                         WHERE pur.purchase_date BETWEEN ? AND ?
                         GROUP BY p.prod_name`;
                params = [startDate, endDate];
            }
            break;
        case 'monthly':
            if (!month) {
                return res.status(400).json({ message: 'Please select a month.' });
            }
            const [year, monthNum] = month.split('-');
            if (productScope === 'specific') {
                query = `SELECT p.prod_name, pur.quantity, pur.total_price, pur.purchase_date
                         FROM purchase_details pur
                         JOIN product_details p ON pur.prod_id = p.prod_id
                         WHERE MONTH(pur.purchase_date) = ? AND YEAR(pur.purchase_date) = ? AND p.prod_name = ?`;
                params = [parseInt(monthNum, 10), parseInt(year, 10), productName];
            } else {
                query = `SELECT p.prod_name, SUM(pur.quantity) AS total_quantity, SUM(pur.total_price) AS total_amount
                         FROM purchase_details pur
                         JOIN product_details p ON pur.prod_id = p.prod_id
                         WHERE MONTH(pur.purchase_date) = ? AND YEAR(pur.purchase_date) = ?
                         GROUP BY p.prod_name`;
                params = [parseInt(monthNum, 10), parseInt(year, 10)];
            }
            break;
        case 'all':
            if (productScope === 'specific') {
                query = `SELECT p.prod_name, pur.quantity, pur.total_price
                         FROM purchase_details pur
                         JOIN product_details p ON pur.prod_id = p.prod_id
                         WHERE p.prod_name = ?`;
                params = [productName];
            } else {
                query = `SELECT p.prod_name, SUM(pur.quantity) AS total_quantity, SUM(pur.total_price) AS total_amount
                         FROM purchase_details pur
                         JOIN product_details p ON pur.prod_id = p.prod_id
                         GROUP BY p.prod_name`;
            }
            break;
        default:
            return res.status(400).json({ message: 'Invalid report type' });
    }

    try {
        const results = await queryDatabase(query, params);

        if (download === 'excel') {
            if (results.length > 0) {
                const workbook = XLSX.utils.book_new();
                const worksheet = XLSX.utils.json_to_sheet(results);
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
                res.send(excelBuffer);
            } else {
                return res.status(404).json({ message: 'No data to export' });
            }
        } else {
            res.json(results);
        }
    } catch (error) {
        console.error('Error fetching report data:', error);
        return res.status(500).json({ message: 'Error fetching report data' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});