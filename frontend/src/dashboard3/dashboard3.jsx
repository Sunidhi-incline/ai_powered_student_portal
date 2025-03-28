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
  const [timeLeft, setTimeLeft] = useState(50 * 60);
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
        
        // Navigate with state including questions and empty answers array
        navigate('/dashboard4', { 
          state: { 
            questions: qns,
            answers: Array(qns.length).fill(''),
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
      {/* ... rest of the JSX remains the same ... */}
    </div>
  );
};

export default Dashboard3;