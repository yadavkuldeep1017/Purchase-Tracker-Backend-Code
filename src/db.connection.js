const mysql = require('mysql2/promise');
const dbConfig = require('./db.config.js');

const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    idleTimeout: 60000
});

async function queryDatabase(sql, values) {
    try {
        const [rows] = await pool.execute(sql, values);
        return rows;
    } catch (error) {
        console.error('Database query error:', error);
        if (error.code === "PROTOCOL_CONNECTION_LOST") {
            console.log("Reconnecting to database");
            try {
                await pool.getConnection()
                return await queryDatabase(sql, values)
            } catch (err) {
                console.log("error in reconnecting", err)
                throw err
            }
        }
        throw error;
    }
}

module.exports = queryDatabase;