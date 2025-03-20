import express from 'express';
import { signupUser, loginUser } from '../Controllers/AuthControllers.js';
import { validateSignup, validateLogin } from '../Middleware/AuthValidation.js';
import AuthMiddleware from '../Middleware/Auth.js';

const router = express.Router();

// Debug middleware for auth routes
router.use((req, res, next) => {
    console.log(`Auth Route: ${req.method} ${req.path}`);
    next();
});

// Auth Routes
router.post('/signup', validateSignup, signupUser);
router.post('/login', validateLogin, loginUser);

// Protected Route (Requires Token)
router.get('/profile', AuthMiddleware, (req, res) => {
    res.json({ success: true, message: `Welcome, ${req.user.userId}` });
});

// Test route to verify router is working
router.get('/test', (req, res) => {
    res.json({ message: 'Auth router is working' });
});

export default router;
