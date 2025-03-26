import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./index.css";

const Dashboard3 = () => {
  const { topic } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(50 * 60); // 50 minutes in seconds

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
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
          handleEndExam();
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
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        "http://localhost:8080/api/generate-questions",
        { topic: selectedTopic },
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
      } else {
        throw new Error("No questions generated");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const handleEndExam = () => {
    const confirmEnd = window.confirm("Are you sure you want to end the exam?");
    if (confirmEnd) {
      navigate("/dashboard");
    }
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
          disabled={loading}
        >
          🔄 Regenerate Questions
        </button>
        <button 
          onClick={handleEndExam} 
          className="button danger-button"
        >
          🚫 End Exam
        </button>
      </div>

      {loading ? (
        <p className="loading-text">⏳ Generating questions...</p>
      ) : error ? (
        <p className="error-message">❌ {error}</p>
      ) : questions.length > 0 ? (
        <ul className="question-list">
          {questions.map((question, index) => (
            <li key={index} className="question-item">
              📘 {question}
            </li>
          ))}
        </ul>
      ) : (
        <p className="info-message">Click 'Regenerate Questions' to start.</p>
      )}
    </div>
  );
};

export default Dashboard3;