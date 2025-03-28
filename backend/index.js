import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import rateLimit from 'express-rate-limit';
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

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 2, // limit each IP to 2 requests per windowMs
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many requests, please try again later",
            retryAfter: 60
        });
    }
});

// Database Connection
try {
    await connectDB();
    console.log('✅ Database connected successfully');
} catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
}

// Routes
app.use('/auth', authRouter);
app.use('/products', productRouter);

// Health check route
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString()
    });
});

// Assignment generation route with rate limiting
app.post("/api/generate-questions", limiter, async (req, res) => {
    const { topic, regenerationCount = 0 } = req.body;

    if (!topic) {
        return res.status(400).json({ 
            success: false,
            error: "Topic is required." 
        });
    }

    try {
        const prompt = `Generate 5 unique assignment questions for: ${topic}.\n` +
                      `${regenerationCount > 0 ? `Regeneration attempt ${regenerationCount} - provide different questions.\n` : ''}` +
                      `Format each question on a new line, numbered 1-5.`;

        const result = await model.generateContent(prompt);
        const responseText = await result.response.text();
        
        const questions = responseText
            .split('\n')
            .map(q => q.replace(/^\d+[\.\)]\s*/, '').trim())
            .filter(line => line && !line.toLowerCase().includes('here are') && !line.toLowerCase().includes('assignment questions'));

        if (questions.length === 0) {
            return res.status(500).json({
                success: false,
                error: "Failed to parse questions from response"
            });
        }

        res.json({ 
            success: true,
            questions: questions.slice(0, 5)
        });

    } catch (err) {
        console.error("❌ Gemini API Error:", err);
        
        if (err.status === 429) {
            return res.status(429).json({
                success: false,
                error: "API rate limit exceeded. Please try again later.",
                retryAfter: 60
            });
        }

        res.status(500).json({ 
            success: false,
            error: "Failed to generate questions. Please try again.",
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Answer grading route
app.post("/api/grade-answers", async (req, res) => {
    const { answers, topic, timeSpent, tabSwitches } = req.body;
    
    if (!answers || !Array.isArray(answers) || !topic) {
        return res.status(400).json({
            success: false,
            message: "Answers array and topic are required"
        });
    }

    try {
        // Try Gemini API first
        try {
            const prompt = `Grade these answers for ${topic}:\n\n${
                answers.map((ans, i) => `Question ${i+1}:\n${ans}`).join('\n\n')
            }\n\nProvide scores (0-25) and feedback for each answer. Format as JSON:
            {
                "grades": [numbers],
                "feedback": [strings]
            }`;

            const result = await model.generateContent(prompt);
            const responseText = await result.response.text();
            
            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Could not parse grading response");

            const gradingResult = JSON.parse(jsonMatch[0]);
            if (!gradingResult.grades || !gradingResult.feedback) {
                throw new Error("Invalid grading format");
            }

            return sendGradingResponse(res, gradingResult.grades, gradingResult.feedback, timeSpent, tabSwitches);
            
        } catch (geminiError) {
            console.log("Gemini grading failed, using fallback:", geminiError);
            return simulateGrading(res, answers, timeSpent, tabSwitches);
        }
        
    } catch (err) {
        console.error("Error grading answers:", err);
        res.status(500).json({
            success: false,
            message: "Failed to grade answers",
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Helper functions
function simulateGrading(res, answers, timeSpent, tabSwitches) {
    const timeBonus = Math.min(Math.floor((50 * 60 - timeSpent) / 60) * 2, 20);
    const tabSwitchPenalty = Math.min(tabSwitches * 5, 25);
    
    const grades = answers.map(() => Math.min(Math.floor(Math.random() * 15) + 10, 25));
    const feedback = grades.map(score => {
        if (score >= 22) return "Excellent answer! (simulated)";
        if (score >= 18) return "Very good answer (simulated)";
        if (score >= 14) return "Good but could improve (simulated)";
        return "Needs more work (simulated)";
    });
    
    sendGradingResponse(res, grades, feedback, timeSpent, tabSwitches);
}

function sendGradingResponse(res, grades, feedback, timeSpent, tabSwitches) {
    const timeBonus = Math.min(Math.floor((50 * 60 - timeSpent) / 60) * 2, 20);
    const tabSwitchPenalty = Math.min(tabSwitches * 5, 25);
    const rawScore = grades.reduce((sum, score) => sum + score, 0);
    const totalScore = rawScore + timeBonus - tabSwitchPenalty;
    
    res.json({
        success: true,
        data: {
            grades,
            feedback,
            summary: {
                totalScore: Math.max(0, totalScore),
                rawScore,
                timeBonus,
                tabSwitchPenalty,
                timeSpent,
                tabSwitches
            }
        }
    });
}

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