// Configure CORS based on your requirements (e.g., allowed origins, methods)
module.exports = {
  origin: ['http://dailybook.pnfdigitalservices.com:3000'], // Replace with allowed origins
  credentials: true, // Set to true if necessary for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};