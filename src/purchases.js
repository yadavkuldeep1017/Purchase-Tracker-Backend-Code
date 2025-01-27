module.exports = (queryDatabase) => ({
    addPurchases: async (req, res) => { // Renamed to addPurchases
        const purchases = req; // Expecting an array of purchase objects


        if (!Array.isArray(purchases) || purchases.length === 0) {
            throw new Error("Please provide an array of purchases."); // Throw error to be caught in express route
        }

        try {
            // Start a transaction for atomicity (either all inserts succeed or none)
            await queryDatabase('START TRANSACTION');

            for (const purchase of purchases) {
                console.log("Purchases: ",purchase);

                let { date, quantity, price, prod_id, username } = purchase;
                console.log(date, quantity, price, prod_id, username);

                if (!quantity || !price || !prod_id || !username) {
                    await queryDatabase('ROLLBACK'); // Rollback if any purchase is invalid
                    return res.status(400).json({ message: "A purchase is missing required fields." });
                }

                if (!date) {
                    date = new Date().getDate();
                }
                console.log(date);

                const productExists = await queryDatabase('SELECT 1 FROM product_details WHERE prod_id = ?', [prod_id]);
                if (productExists.length === 0) {
                    await queryDatabase('ROLLBACK');
                    return res.status(400).json({ message: `Invalid product ID: ${prod_id}` });
                }

                const userExists = await queryDatabase('SELECT 1 FROM users WHERE username = ?', [username]);
                if (userExists.length === 0) {
                    await queryDatabase('ROLLBACK');
                    return res.status(400).json({ message: `Invalid username: ${username}` });
                }

                await queryDatabase(
                    'INSERT INTO purchase_details (purchase_date, quantity, total_price, prod_id, username) VALUES (?, ?, ?, ?, ?)',
                    [date, parseInt(quantity), parseFloat(price), parseInt(prod_id), username]
                );
            }

            await queryDatabase('COMMIT'); // Commit the transaction if all inserts were successful
        } catch (error) {
            await queryDatabase('ROLLBACK'); // Rollback on any error
            console.error("Error adding purchases:", error);
            throw error; // Re-throw the error to be caught by the Express route handler
        }
    },

    getAllPurchasesAdmin: async (req, res) => {
        try {
            const results = await queryDatabase(`
                SELECT pd.*, p.prod_name, u.fullName
                FROM purchase_details pd
                JOIN product_details p ON pd.prod_id = p.prod_id
                JOIN users u ON pd.username = u.username
                ORDER BY pd.purchase_date DESC
            `);
            res.json(results);
        } catch (error) {
            console.error("Error fetching purchases:", error);
            res.status(500).json({ message: 'Error fetching purchases', error: error.message });
        }
    },

    deletePurchase: async (req, res) => {
        const { purchId } = req.params;
        try {
            const result = await queryDatabase('DELETE FROM purchase_details WHERE purch_id = ?', [purchId]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Purchase not found' });
            }
            res.json({ message: 'Purchase deleted successfully' });
        } catch (error) {
            console.error("Error deleting purchase:", error);
            res.status(500).json({ message: 'Failed to delete purchase', error: error.message });
        }
    },

    updatePurchase: async (req, res) => {
        const { purchId } = req.params;
        const { quantity, price } = req.body;

        if (!quantity || !price) {
            return res.status(400).json({ message: "Please provide quantity and price to update" });
        }

        try {
            const result = await queryDatabase(
                'UPDATE purchase_details SET quantity = ?, total_price = ? WHERE purch_id = ?',
                [parseInt(quantity), parseFloat(price), purchId]
            );
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Purchase not found' });
            }
            res.json({ message: 'Purchase updated successfully' });
        } catch (error) {
            console.error("Error updating purchase:", error);
            res.status(500).json({ message: 'Failed to update purchase', error: error.message });
        }
    },
});