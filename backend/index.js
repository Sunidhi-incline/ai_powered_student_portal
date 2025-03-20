import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './Models/db.js';
import authRouter from './Routes/AuthRouter.js';
import productRouter from './Routes/ProductRouter.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Database Connection
try {
    await connectDB();
} catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
}

// Routes
app.use('/auth', authRouter);
app.use('/products', productRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: "Internal Server Error",
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
