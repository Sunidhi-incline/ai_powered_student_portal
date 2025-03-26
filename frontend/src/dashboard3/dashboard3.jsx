import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import axios from "axios";
import "./index.css";
import 'react-toastify/dist/ReactToastify.css';

const Dashboard3 = () => {
  const { topic } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 minutes in seconds
  const [generationCount, setGenerationCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to continue");
      navigate('/login');
      return;
    }

    if (topic) {
      generateQuestions(topic);
    }

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          handleEndExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [topic, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const generateQuestions = async (selectedTopic) => {
    if (generationCount >= 3) {
      toast.warning("You've reached the maximum number of regeneration attempts");
      return;
    }

    setLoading(true);
    setError(null);
  
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        "http://localhost:8080/api/generate-questions",
        { 
          topic: selectedTopic,
          regenerationCount: generationCount 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      const qns = response?.data?.questions;
      if (qns && qns.length > 0) {
        setQuestions(qns);
        setGenerationCount(prev => prev + 1);
        toast.success("Questions generated successfully!");
        
        // Navigate with state and topic
        navigate('/dashboard4', { 
          state: { 
            questions: qns,
            topic: selectedTopic,
            timeLeft: timeLeft
          }
        });
      } else {
        throw new Error("No questions generated");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to generate questions";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEndExam = (isTimeout = false) => {
    if (!isTimeout) {
      const confirmEnd = window.confirm("Are you sure you want to end the exam?");
      if (!confirmEnd) return;
    }

    toast.info(isTimeout ? "Time's up!" : "Exam ended");
    setTimeout(() => navigate("/dashboard"), 2000);
  };

  return (
    <div className="dashboard3-container">
      <div className="header">
        <img src="/logo.jpg" alt="College Logo" className="college-logo" />
        <div className="title-section">
          <h2 className="main-title">
            Assignment Questions for "{decodeURIComponent(topic)}"
          </h2>
          <div className="timer">⏳ Time Left: {formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className="buttons-group">
        <button 
          onClick={() => generateQuestions(topic)} 
          className="button primary-button"
          disabled={loading || generationCount >= 3}
        >
          {loading ? '⏳ Generating...' : `🔄 Generate Questions (${3 - generationCount} attempts left)`}
        </button>
        <button 
          onClick={() => handleEndExam(false)} 
          className="button danger-button"
          disabled={loading}
        >
          🚫 End Exam
        </button>
      </div>

      <div className="content-area">
        {loading ? (
          <div className="loading-container">
            <p className="loading-text">⏳ Generating questions...</p>
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">❌ {error}</p>
            <button 
              onClick={() => generateQuestions(topic)}
              className="retry-button"
              disabled={generationCount >= 3}
            >
              Try Again
            </button>
          </div>
        ) : questions.length > 0 ? (
          <ul className="question-list">
            {questions.map((question, index) => (
              <li key={index} className="question-item">
                <span className="question-number">{index + 1}.</span>
                <span className="question-text">{question}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="info-container">
            <p className="info-message">Click 'Generate Questions' to start your exam.</p>
            <p className="info-subtitle">You have 3 attempts to generate different sets of questions.</p>
          </div>
        )}
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Dashboard3;