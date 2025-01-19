const express = require('express');
const router = express.Router();
const connection = require('../index'); // Import your database connection

// Add new purchase
router.post('/', (req, res) => {
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

// Get all purchases (for admin)
router.get('/admin', (req, res) => {
    const query = `
        SELECT pd.*, p.prod_name, u.fullName
        FROM purchase_details pd
        JOIN Products p ON pd.prod_id = p.prod_id
        JOIN Users u ON pd.username = u.username
        ORDER BY pd.date DESC
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching purchases:", err);
            return res.status(500).json({ message: 'Error fetching purchases' });
        }
        res.json(results);
    });
});

// Delete a purchase
router.delete('/:purchId', (req, res) => {
    const { purchId } = req.params;
    connection.query('DELETE FROM purchase_details WHERE purch_id = ?', [purchId], (err, result) => {
        if (err) {
            console.error("Error deleting purchase:", err);
            return res.status(500).json({ message: 'Failed to delete purchase', error: err.message });
        }
        if(result.affectedRows === 0) {
            return res.status(404).json({ message: 'Purchase not found' });
        }
        res.json({ message: 'Purchase deleted successfully' });
    });
});

// Update a purchase
router.put('/:purchId', (req, res) => {
    const { purchId } = req.params;
    const { quantity, price, comment } = req.body;

    if (!quantity || !price) {
        return res.status(400).json({ message: "Please provide quantity and price to update" });
    }

    connection.query(
        'UPDATE purchase_details SET quantity = ?, price = ?, comment = ? WHERE purch_id = ?',
        [parseInt(quantity), parseFloat(price), comment, purchId],
        (err, result) => {
            if (err) {
                console.error("Error updating purchase:", err);
                return res.status(500).json({ message: 'Failed to update purchase', error: err.message });
            }
            if(result.affectedRows === 0) {
                return res.status(404).json({ message: 'Purchase not found' });
            }
            res.json({ message: 'Purchase updated successfully' });
        }
    );
});

module.exports = router;