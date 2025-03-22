import express from 'express';
import AuthMiddleware from '../Middleware/Auth.js';

const productRouter = express.Router();

productRouter.get('/', AuthMiddleware, (req, res) => {
    try {
        // Get user data from the token (added by AuthMiddleware)
        const user = req.user;

        res.json({
            success: true,
            message: "Products route is working!",
            welcomeMessage: `Welcome ${user.userId}!`,
            data: {
                user: user,
                products: [] // Add your products data here
            }
        });
    } catch (error) {
        console.error('Product route error:', error);
        res.status(500).json({
            success: false,
            message: "Error in products route"
        });
    }
});

export default productRouter;