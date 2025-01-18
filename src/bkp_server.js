const express = require('express');
const cors = require('cors');
const mysql = require('mysql2'); // Regular mysql2 import (no promises)

const app = express();
const port = 5000;
const dbConfig = require('./db.config.js');
const corsOptions = require('./cors.js');

// Middleware to parse JSON request bodies and enable CORS
app.use(express.json());
app.use(cors(corsOptions));

// Create a database connection (not a pool for this example, but pools are recommended for production)
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return; // Important: Stop the server if the connection fails
    }
    console.log('Connected to MySQL database');
});

// Login route (without bcrypt - INSECURE, ONLY FOR LEARNING)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide both username and password' });
    }

    const query = 'SELECT * FROM users WHERE username = ?';
    connection.query(query, [username], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = results[0];

        // DANGEROUS: Comparing passwords in plain text
        if (password !== user.password) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Successful login
        res.json({ message: 'Login successful', username: user.username });
    });
});

// Get product types (using callbacks)
app.get('/api/product-types', (req, res) => {
    connection.query('SELECT * FROM ProductTypes', (err, results) => {
        if (err) {
            console.error("Error fetching product types:", err);
            return res.status(500).json({ message: 'Error fetching product types' });
        }
        res.json(results);
    });
});

// Get products by type (using callbacks)
app.get('/api/products', (req, res) => {
    const typeId = req.query.typeId;
    if (!typeId) {
        return res.status(400).json({ message: 'Type ID is required' });
    }
    connection.query('SELECT * FROM Products WHERE type_id = ?', [parseInt(typeId)], (err, results) => {
        if (err) {
            console.error("Error fetching products:", err);
            return res.status(500).json({ message: 'Error fetching products' });
        }
        res.json(results);
    });
});

// Add new purchase (using callbacks)
app.post('/api/purchases', (req, res) => {
    const { date, quantity, price, comment, prod_id, username } = req.body;

    if (!date || !quantity || !price || !prod_id || !username) {
        return res.status(400).json({ message: "Please provide all required fields" });
    }

    connection.query(
        'INSERT INTO purchase_details (date, quantity, price, comment, prod_id, username) VALUES (?, ?, ?, ?, ?, ?)',
        [date, parseInt(quantity), parseFloat(price), comment, parseInt(prod_id), username],
        (err, result) => {
            if (err) {
                console.error("Error adding purchase:", err);
                return res.status(500).json({ message: 'Failed to add purchase', error: err.message });
            }
            res.status(201).json({ message: 'Purchase added successfully', purchaseId: result.insertId });
        }
    );
});

app.get('/api/report', (req, res) => {
  const { startDate, endDate, typeId } = req.query;

  let query = `
      SELECT p.prod_name, SUM(pd.quantity) AS total_quantity
      FROM purchase_details pd
      JOIN Products p ON pd.prod_id = p.prod_id
  `;

  const queryParams = [];

  if (startDate && endDate) {
      query += ' WHERE pd.date BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
  }
  if (typeId) {
      query += startDate && endDate ? ' AND p.type_id = ?' : ' WHERE p.type_id = ?';
      queryParams.push(parseInt(typeId));
  }

  query += ' GROUP BY p.prod_name';

  connection.query(query, queryParams, (err, results) => {
      if (err) {
          console.error("Error generating report:", err);
          return res.status(500).json({ message: 'Error generating report' });
      }
      res.json(results);
  });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Handle disconnection properly
process.on('SIGINT', () => {
    connection.end((err) => {
      if (err) {
        return console.log('error:' + err.message);
      }
      console.log('Close the database connection.');
      process.exit();
    });
  });