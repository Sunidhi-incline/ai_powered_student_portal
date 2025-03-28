import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard4 = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Get state from navigation
    const { questions = [], answers: initialAnswers = [], topic, timeLeft: initialTimeLeft } = location.state || {};
    
    const [answers, setAnswers] = useState(initialAnswers);
    const [timeLeft, setTimeLeft] = useState(initialTimeLeft || 50 * 60);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [grading, setGrading] = useState(false);
    const [grades, setGrades] = useState(null);
    const [error, setError] = useState(null);
    const [isFallbackGrading, setIsFallbackGrading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error("Please login first");
            navigate('/login');
            return;
        }

        // Initialize answers array if not provided
        if (questions.length > 0 && answers.length === 0) {
            setAnswers(Array(questions.length).fill(''));
        }

        // Tab switch detection
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitches(prev => prev + 1);
                toast.warning("Tab switching detected! This may affect your score.");
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Timer
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(timer);
        };
    }, [navigate, questions.length]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const simulateClientSideGrading = () => {
        const timeSpent = 50 * 60 - timeLeft;
        const timeBonus = Math.min(Math.floor((50 * 60 - timeSpent) / 60) * 2, 20);
        const tabSwitchPenalty = Math.min(tabSwitches * 5, 25);
        
        const simulatedGrades = answers.map(() => Math.min(Math.floor(Math.random() * 15) + 10, 25));
        const simulatedFeedback = simulatedGrades.map(score => {
            if (score >= 22) return "Excellent answer! (simulated grading)";
            if (score >= 18) return "Very good answer (simulated grading)";
            if (score >= 14) return "Good but could improve (simulated grading)";
            return "Needs more work (simulated grading)";
        });
        
        const rawScore = simulatedGrades.reduce((sum, score) => sum + score, 0);
        const totalScore = rawScore + timeBonus - tabSwitchPenalty;
        
        setGrades({
            grades: simulatedGrades,
            feedback: simulatedFeedback,
            summary: {
                totalScore: Math.max(0, totalScore),
                rawScore,
                timeBonus,
                tabSwitchPenalty,
                timeSpent,
                tabSwitches
            }
        });
        setIsFallbackGrading(true);
    };

    const handleSubmit = async (autoSubmit = false) => {
        if (!autoSubmit) {
            const confirm = window.confirm("Are you sure you want to submit?");
            if (!confirm) return;
        }

        setGrading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8080/api/grade-answers',
                {
                    answers,
                    topic: topic,
                    timeSpent: 50 * 60 - timeLeft,
                    tabSwitches
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000 // 10 second timeout
                }
            );

            if (response.data.success) {
                setGrades(response.data.data);
                toast.success("Grading completed!");
                setIsFallbackGrading(false);
            } else {
                throw new Error(response.data.message || "Grading failed");
            }

        } catch (err) {
            const errorMsg = err.response?.data?.message || 
                            err.message || 
                            "Grading service unavailable";
            setError(errorMsg);
            
            if (err.response?.status === 429 || err.code === 'ECONNABORTED') {
                toast.info("Using simulated grading due to service limits");
                simulateClientSideGrading();
            } else {
                toast.error(errorMsg);
            }
        } finally {
            setGrading(false);
        }
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="dashboard4-container">
            <div className="header">
                <img src="/logo.jpg" alt="College Logo" className="college-logo" />
                <div className="header-content">
                    <h2>Assessment for {topic || "Unknown Topic"}</h2>
                    <div className="timer">Time Left: {formatTime(timeLeft)}</div>
                </div>
            </div>

            {isFallbackGrading && (
                <div className="warning-banner">
                    ⚠ Using simulated grading due to service limits. Results are approximate.
                </div>
            )}

            <div className="answers-section">
                {questions.map((question, index) => (
                    <div key={index} className="question-answer-container">
                        <div className="question">
                            <span className="question-number">{index + 1}.</span>
                            <span className="question-text">{question}</span>
                        </div>
                        <textarea
                            value={answers[index] || ''}
                            onChange={(e) => {
                                const newAnswers = [...answers];
                                newAnswers[index] = e.target.value;
                                setAnswers(newAnswers);
                            }}
                            placeholder={`Your answer for question ${index + 1}...`}
                            disabled={grading || (grades !== null)}
                            className={grades ? 'graded-answer' : ''}
                        />
                        {grades && (
                            <div className="grade-feedback">
                                <div className="score">Score: {grades.grades[index]}/25</div>
                                <div className="feedback">{grades.feedback[index]}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {grades?.summary && (
                <div className="summary-section">
                    <h3>Assessment Summary</h3>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <span className="summary-label">Total Score:</span>
                            <span className="summary-value">{grades.summary.totalScore}/125</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Raw Score:</span>
                            <span className="summary-value">{grades.summary.rawScore}/125</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Time Bonus:</span>
                            <span className="summary-value">+{grades.summary.timeBonus}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Tab Penalty:</span>
                            <span className="summary-value">-{grades.summary.tabSwitchPenalty}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Time Spent:</span>
                            <span className="summary-value">
                                {Math.floor(grades.summary.timeSpent / 60)}m {grades.summary.timeSpent % 60}s
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Tab Switches:</span>
                            <span className="summary-value">{grades.summary.tabSwitches}</span>
                        </div>
                    </div>
                </div>
            )}

            {!grades && (
                <div className="actions">
                    <button 
                        onClick={() => handleSubmit(false)}
                        disabled={grading}
                        className={`submit-button ${grading ? 'loading' : ''}`}
                    >
                        {grading ? (
                            <>
                                <span className="spinner"></span>
                                Grading...
                            </>
                        ) : (
                            'Submit Answers'
                        )}
                    </button>
                </div>
            )}

            {grades && (
                <div className="actions">
                    <button 
                        onClick={handleBackToDashboard}
                        className="back-button"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            )}

            {error && !grades && (
                <div className="error-message">
                    <span className="error-icon">❌</span> {error}
                    <button 
                        onClick={simulateClientSideGrading}
                        className="retry-button"
                    >
                        Use Simulated Grading
                    </button>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={5000} />
        </div>
    );
};

export default Dashboard4;