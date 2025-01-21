const XLSX = require('xlsx');

module.exports = (queryDatabase) => ({
    generateReport: async (req, res) => {
        const { startDate, endDate, month, productName, reportType, productScope, download, typeId } = req.query;
        let query = '';
        let params = [];

        try {
            switch (reportType) {
                case 'custom':
                    if (productScope === 'specific') {
                        query = `SELECT u.username AS Username, pur.purchase_date AS Date,p.prod_name AS Product_Name, pur.quantity AS Quantity, pur.total_price AS Amount
                                 FROM purchase_details pur
                                 JOIN product_details p ON pur.prod_id = p.prod_id
                                 JOIN users u ON pur.username = u.username
                                 WHERE pur.purchase_date BETWEEN ? AND ? AND p.prod_name = ?`;
                        params = [startDate, endDate, productName];
                    } else if (productScope === 'typeSpecific') {
                        query = `SELECT u.username AS Username, pur.purchase_date AS Date,p.prod_name AS Product_Name, pur.quantity AS Quantity, pur.total_price AS Amount
                                 FROM purchase_details pur
                                 JOIN product_details p ON pur.prod_id = p.prod_id
                                 JOIN users u ON pur.username = u.username
                                 WHERE pur.purchase_date BETWEEN ? AND ? AND p.type_id = ?`;
                        params = [startDate, endDate, typeId];
                    } else { // All products within date range
                        query = `SELECT p.prod_name AS Product_Name, SUM(pur.quantity) AS Quantity, SUM(pur.total_price) AS Amount
                                 FROM purchase_details pur
                                 JOIN product_details p ON pur.prod_id = p.prod_id
                                 WHERE pur.purchase_date BETWEEN ? AND ?
                                 GROUP BY p.prod_name`;
                        params = [startDate, endDate];
                    }
                    break;
                case 'monthly':
                    const [year, monthNum] = month.split('-');
                    if (productScope === 'specific') {
                        query = `SELECT u.username AS Username, pur.purchase_date AS Date,p.prod_name AS Product_Name, pur.quantity AS Quantity, pur.total_price AS Amount
                                 FROM purchase_details pur
                                 JOIN product_details p ON pur.prod_id = p.prod_id
                                 JOIN users u ON pur.username = u.username
                                 WHERE MONTH(pur.purchase_date) = ? AND YEAR(pur.purchase_date) = ? AND p.prod_name = ?`;
                        params = [parseInt(monthNum, 10), parseInt(year, 10), productName];
                    } else if (productScope === 'typeSpecific') {
                        query = `SELECT u.username AS Username, pur.purchase_date AS Date,p.prod_name AS Product_Name, pur.quantity AS Quantity, pur.total_price AS Amount
                                 FROM purchase_details pur
                                 JOIN product_details p ON pur.prod_id = p.prod_id
                                 JOIN users u ON pur.username = u.username
                                 WHERE MONTH(pur.purchase_date) = ? AND YEAR(pur.purchase_date) = ? AND p.type_id = ?`;
                        params = [parseInt(monthNum, 10), parseInt(year, 10), typeId];
                    } else {
                        query = `SELECT p.prod_name AS Product_Name, SUM(pur.quantity) AS Quantity, SUM(pur.total_price) AS Amount
                                 FROM purchase_details pur
                                 JOIN product_details p ON pur.prod_id = p.prod_id
                                 WHERE MONTH(pur.purchase_date) = ? AND YEAR(pur.purchase_date) = ?
                                 GROUP BY p.prod_name`;
                        params = [parseInt(monthNum, 10), parseInt(year, 10)];
                    }
                    break;
                case 'all':
                    if (productScope === 'specific') {
                        query = `SELECT u.username AS Username, pur.purchase_date AS Date,p.prod_name AS Product_Name, pur.quantity AS Quantity, pur.total_price AS Amount
                                 FROM purchase_details pur
                                 JOIN product_details p ON pur.prod_id = p.prod_id
                                 JOIN users u ON pur.username = u.username
                                 WHERE p.prod_name = ?`;
                        params = [productName];
                    } else if (productScope === 'typeSpecific') {
                        query = `SELECT u.username AS Username, pur.purchase_date AS Date,p.prod_name AS Product_Name, pur.quantity AS Quantity, pur.total_price AS Amount
                                 FROM purchase_details pur
                                 JOIN product_details p ON pur.prod_id = p.prod_id
                                 JOIN users u ON pur.username = u.username
                                 WHERE p.type_id = ?`;
                        params = [typeId];
                    } else {
                        query = `SELECT p.prod_name AS Product_Name, SUM(pur.quantity) AS Quantity, SUM(pur.total_price) AS Amount
                                 FROM purchase_details pur
                                 JOIN product_details p ON pur.prod_id = p.prod_id
                                 GROUP BY p.prod_name`;
                    }
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid report type' });
            }

            const results = await queryDatabase(query, params);

            if (download === 'excel') {
                if (results && results.length > 0) {
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
            return res.status(500).json({ message: 'Error fetching report data', error: error.message });
        }
    }
});