const queryDatabase = require('./db.connection.js'); // Import the query function

module.exports = () => {
    const signupRoute = async (req, res) => {
        const { username, password, isAdmin } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide username and password.' });
        }

        try {
            const existingUser = await queryDatabase('SELECT * FROM users WHERE username = ?', [username]);

            if (existingUser.length > 0) {
                return res.status(409).json({ message: 'Username already exists.' });
            }

            // INSECURE: Storing password in plain text
            const result = await queryDatabase(
                'INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)',
                [username, password, isAdmin || 0]
            );

            res.status(201).json({ message: 'User created successfully.' });
        } catch (error) {
            console.error("Signup error:", error);
            res.status(500).json({ message: 'Error during user creation.' });
        }
    };

    return { signup: signupRoute };
};