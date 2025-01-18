const queryDatabase = require('./db.connection.js'); // Import the query function

module.exports = () => {
    const loginRoute = async (req, res) => {
        const { username, password } = req.body;

        try {
            const results = await queryDatabase(
                'SELECT username, isAdmin FROM users WHERE username = ? AND password = ?',
                [username, password]
            );

            if (results.length === 1) {
                const isAdminBoolean = Boolean(results[0].isAdmin); // Convert to boolean
                req.session.user = { username: results[0].username, isAdmin: isAdminBoolean };
                res.json({ message: 'Login successful', isAdmin: isAdminBoolean });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ message: 'Database error' });
        }
    };

    const checkAuthRoute = (req, res) => {
        if (req.session.user) {
            res.json({ isAuthenticated: true, isAdmin: req.session.user.isAdmin });
        } else {
            res.json({ isAuthenticated: false });
        }
    };

    const logoutRoute = (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).json({ message: "Logout failed" });
            }
            res.json({ message: "Logout successful" });
        });
    };

    const forgotPasswordRoute = async (req, res) => {
        const { mobileNumber } = req.body;
        try {
            const results = await queryDatabase('SELECT mobile FROM users WHERE mobile=?', [mobileNumber]);
            if (results.length === 1) {
                res.json({ message: 'Mobile number found' });
            } else {
                res.status(404).json({ message: 'Mobile number not found' });
            }
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ message: 'Database error' });
        }
    };

    const resetPasswordRoute = async (req, res) => {
        const { mobileNumber, newPassword } = req.body;
        try {
            const results = await queryDatabase('UPDATE users SET password=? WHERE mobile=?', [newPassword, mobileNumber]);
            if (results.affectedRows === 1) {
                res.json({ message: 'Password reset successfully' });
            } else {
                res.status(404).json({ message: 'Mobile number not found' });
            }
        } catch (error) {
            console.error("Database error:", error);
            res.status(500).json({ message: 'Database error' });
        }
    };

    return {
        login: loginRoute,
        checkAuth: checkAuthRoute,
        logout: logoutRoute,
        forgotPassword: forgotPasswordRoute,
        resetPassword: resetPasswordRoute,
    };
};