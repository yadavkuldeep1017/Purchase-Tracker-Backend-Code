module.exports = (queryDatabase) => ({
    getAllProducts: async (req, res) => {
        try {
            const results = await queryDatabase('SELECT * FROM product_details');
            res.json(results);
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ message: 'Error fetching products' });
        }
    },
    addProduct: async (req, res) => {
        const { prod_name, prod_desc } = req.body;
        if (!prod_name || !prod_desc ) {
            return res.status(400).json({ message: 'Please provide all fields' });
        }
        try {
            const result = await queryDatabase('INSERT INTO product_details (prod_name, prod_desc) VALUES (?, ?)', [prod_name, prod_desc]);
            res.status(201).json({ message: 'Product added', productId: result.insertId });
        } catch (error) {
            console.error('Error adding product:', error);
            res.status(500).json({ message: 'Product Already Exist' });
        }
    },
    updateProduct: async (req, res) => {
        const { prod_name, prod_desc } = req.body;
        const productId = req.params.id;
        try {
            await queryDatabase('UPDATE product_details SET prod_name = ?, prod_desc = ? WHERE prod_id = ?', [prod_name, prod_desc,  productId]);
            res.json({ message: 'Product updated' });
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ message: 'Error updating product' });
        }
    },
    deleteProduct: async (req, res) => {
        const productId = req.params.id;
        try {
            await queryDatabase('DELETE FROM product_details WHERE prod_id = ?', [productId]);
            res.json({ message: 'Product deleted' });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ message: 'Error deleting product' });
        }
    },
});