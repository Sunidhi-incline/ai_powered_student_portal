import { generateWithGemini } from '../services/gemini.js';

export const gradeAnswers = async (req, res) => {
    try {
        const { topic, answers, timeSpent, tabSwitches } = req.body;

        // Validate inputs
        if (!Array.isArray(answers) || !topic) {
            return res.status(400).json({
                success: false,
                message: "Invalid input format"
            });
        }

        // Generate grading prompt for each answer
        const gradings = await Promise.all(answers.map(async (answer, index) => {
            if (!answer.trim()) {
                return {
                    score: 0,
                    feedback: "No answer provided."
                };
            }

            const gradingPrompt = `
                As an expert grader, evaluate this answer for the topic "${topic}".
                Answer: "${answer}"
                
                Grade this answer out of 25 points based on:
                - Accuracy (10 points)
                - Completeness (8 points)
                - Clarity (7 points)
                
                Provide:
                1. Numerical score (0-25)
                2. Brief constructive feedback
                Format: {score}|{feedback}
            `;

            const result = await generateWithGemini(gradingPrompt);
            const [score, feedback] = result.split('|').map(str => str.trim());
            
            return {
                score: Math.min(25, Math.max(0, parseInt(score) || 0)),
                feedback: feedback || "Feedback generation failed."
            };
        }));

        // Apply penalties for tab switching
        const tabSwitchPenalty = Math.min(15, tabSwitches * 5); // 5 points per switch, max 15
        const finalGrades = gradings.map(grade => ({
            ...grade,
            score: Math.max(0, grade.score - tabSwitchPenalty)
        }));

        // Calculate statistics
        const totalScore = finalGrades.reduce((sum, grade) => sum + grade.score, 0);
        const averageScore = totalScore / answers.length;
        const timeBonus = timeSpent < 2400 ? 5 : 0; // 5 bonus points if completed within 40 minutes

        res.json({
            success: true,
            data: {
                scores: finalGrades.map(g => g.score),
                feedback: finalGrades.map(g => g.feedback),
                statistics: {
                    totalScore: totalScore + timeBonus,
                    averageScore: averageScore,
                    timeSpent: timeSpent,
                    tabSwitches: tabSwitches,
                    tabSwitchPenalty: tabSwitchPenalty,
                    timeBonus: timeBonus
                }
            }
        });

    } catch (error) {
        console.error('Grading Error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to grade answers",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};