import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

// Gemini API setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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

// Test route
app.get("/", (req, res) => {
    res.send("🚀 Assignment Generator Backend is running");
});

// Assignment generation route
app.post("/api/generate-questions", async (req, res) => {
    const { topic } = req.body;

    if (!topic) {
        return res.status(400).json({ error: "Topic is required." });
    }

    try {
        const result = await model.generateContent(`Generate 5 assignment questions for the topic: ${topic}`);
        const responseText = await result.response.text();
        const questions = responseText
            .split("\n")
            .map(q => q.replace(/^\d+[\.\)]\s*/, '').trim())
            .filter((line) => line !== "");

        res.json({ questions });
    } catch (err) {
        console.error("❌ Gemini API Error:", err);
        res.status(500).json({ error: "Failed to fetch questions from Gemini API." });
    }
});
// ...existing imports and code...

// Add this new endpoint for submitting answers
app.post("/api/submit-answers", async (req, res) => {
    const { topic, answers, timeSpent } = req.body;

    if (!topic || !answers) {
        return res.status(400).json({ 
            success: false,
            message: "Topic and answers are required" 
        });
    }

    try {
        // Here you could add code to save answers to database
        // For now, we'll just send a success response
        res.json({ 
            success: true,
            message: "Answers submitted successfully",
            data: {
                topic,
                answersCount: Object.keys(answers).length,
                timeSpent
            }
        });
    } catch (err) {
        console.error("Error submitting answers:", err);
        res.status(500).json({ 
            success: false,
            message: "Failed to submit answers" 
        });
    }
});

// ...rest of your existing code...

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
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT} 🚀`));