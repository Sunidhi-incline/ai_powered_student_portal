import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard4 = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 minutes
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const questions = location.state?.questions || [];
    const topic = location.state?.topic || 'Unknown Topic';

    useEffect(() => {
        // Check for valid navigation
        if (!location.state?.questions) {
            toast.error("No questions found. Redirecting to dashboard...");
            setTimeout(() => navigate('/dashboard'), 2000);
            return;
        }

        // Load saved answers if any
        const savedAnswers = localStorage.getItem('examAnswers');
        if (savedAnswers) {
            setAnswers(JSON.parse(savedAnswers));
        }

        // Tab visibility handling
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitchCount(prev => {
                    const newCount = prev + 1;
                    if (newCount >= 3) {
                        toast.error("Multiple tab switches detected. Auto-submitting exam...");
                        handleSubmit(true);
                        return prev;
                    }
                    toast.warning(`Warning: Tab switching detected! (${newCount}/3)`);
                    return newCount;
                });
            }
        };

        // Timer
        const timerInterval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleVisibilityChange);
        window.onbeforeunload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleVisibilityChange);
            window.onbeforeunload = null;
            clearInterval(timerInterval);
        };
    }, [location.state, navigate]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleAnswerChange = (index, value) => {
        const updatedAnswers = {
            ...answers,
            [index]: value
        };
        setAnswers(updatedAnswers);
        // Auto-save to localStorage
        localStorage.setItem('examAnswers', JSON.stringify(updatedAnswers));
    };

    const handleSubmit = async (autoSubmit = false) => {
        if (!autoSubmit) {
            const confirmSubmit = window.confirm("Are you sure you want to submit your answers?");
            if (!confirmSubmit) return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8080/api/submit-answers',
                {
                    topic,
                    answers,
                    timeSpent: 50 * 60 - timeLeft,
                    tabSwitches: tabSwitchCount
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                toast.success("Answers submitted successfully!");
                localStorage.removeItem('examAnswers');
                setTimeout(() => navigate('/dashboard'), 2000);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to submit answers";
            toast.error(errorMsg);
            setIsSubmitting(false);
        }
    };

    if (!questions.length) {
        return (
            <div className="error-container">
                <div className="error-message">No questions available</div>
                <button 
                    className="back-button"
                    onClick={() => navigate('/dashboard')}
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard4-container">
            <div className="header">
                <img src="/logo.jpg" alt="College Logo" className="college-logo" />
                <div className="header-content">
                    <h2 className="title">Answer Sheet - {topic}</h2>
                    <div className="timer">⏳ Time Remaining: {formatTime(timeLeft)}</div>
                </div>
            </div>

            <div className="questions-container">
                {questions.map((question, index) => (
                    <div key={index} className="question-box">
                        <div className="question">
                            <span className="question-number">{index + 1}.</span>
                            {question}
                        </div>
                        <textarea
                            className="answer-input"
                            value={answers[index] || ''}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            placeholder="Type your answer here..."
                            rows={4}
                            disabled={isSubmitting}
                        />
                    </div>
                ))}
            </div>

            <div className="submit-section">
                <button 
                    className="submit-button"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Answers'}
                </button>
            </div>
            
            <ToastContainer 
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
};

export default Dashboard4;