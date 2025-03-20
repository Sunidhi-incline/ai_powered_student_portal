import express from 'express';
import AuthMiddleware from '../Middleware/Auth.js'; // Import auth middleware

const productRouter = express.Router();

// Protected route with AuthMiddleware
productRouter.get('/', AuthMiddleware, (req, res) => {
    res.json({
        message: `Welcome, ${req.user.name || 'Student'}!`,
        user: req.user, // Shows the logged-in user's details
    });
});

export default productRouter;
