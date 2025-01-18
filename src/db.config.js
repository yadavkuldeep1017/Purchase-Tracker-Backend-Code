const dbConfig = {
    host: process.env.DB_HOST || '193.203.184.198',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'u697133129_dailybook',
    password: process.env.DB_PASSWORD || 'Dailybook@123',
    database: process.env.DB_NAME || 'u697133129_dailybook',
};

module.exports=dbConfig;