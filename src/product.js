const queryDatabase = require('./db.connection.js'); // Import the query function

module.exports = () => {
    const getAllProducts = async (req, res) => {
        try {
            const products = await queryDatabase('SELECT prod_id, prod_name, prod_desc FROM product_details');
            res.json(products); // Send the products as JSON
        } catch (error) {
            console.error("Error fetching products:", error);
            res.status(500).json({ message: 'Error fetching products' });
        }
    };

    const insertProducts = async (req, res) => {
        const { quantity, price, prod_id, username } = req.body;

        // Basic validation (can be extended for more robust checks)
        if (!quantity || !price || !prod_id || !username) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        let purchaseDate;

        // Check if date is provided in the request body
        if (req.body.date) {
            // Validate the provided date format (optional)
            // You can use a library like moment.js for date validation
            purchaseDate = req.body.date; // Use the provided date
        } else {
            // Get the current date in YYYY-MM-DD HH:MM:SS format
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            purchaseDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }

        try {
            const result = await queryDatabase(
                'INSERT INTO purchase_details (purchase_date, quantity, total_price, prod_id, username) VALUES (?, ?, ?, ?, ?)',
                [purchaseDate, parseInt(quantity), parseFloat(price), parseInt(prod_id), username]
            );
            res.status(201).json({ message: 'Purchase added successfully', purchaseId: result.insertId });
        } catch (error) {
            console.error("Error adding purchase:", error);
            res.status(500).json({ message: 'Failed to add purchase', error: error.message });
        }
    };

    return {
        getAllProducts,
        insertProducts,
    };
};