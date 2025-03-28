import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { handleError } from '../utils/toastUtils';
import './index.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [subjects] = useState([
    'Artificial Intelligence',
    'Mobile Application',
    'Internet of Things (IOT)',
    'Software Engineering',
    'Power BI'
  ]);

  useEffect(() => {
    // Verify token and get user data
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // Parse user data from localStorage
      const user = JSON.parse(userData);
      setUserName(user.name);

      // Verify token with backend
      const verifyToken = async () => {
        try {
          const response = await fetch('http://localhost:8080/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error('Token verification failed');
          }
        } catch (error) {
          handleError('Session expired. Please login again');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      };

      verifyToken();
    } catch (error) {
      handleError('Invalid user data');
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <img src="/logo.jpg" alt="College Logo" className="college-logo" />
        <div className="header-content">
          <h2 className="welcome-message">Welcome, {userName || 'Student'}! 👋</h2>
          <h3 className="title">Available Subjects</h3>
        </div>
        <button 
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>

      <div className="subject-grid">
        {subjects.map((subject, index) => (
          <div 
            key={index} 
            className="subject-card"
            onClick={() => navigate(`/dashboard2/${encodeURIComponent(subject)}`)}
          >
            <div className="subject-name">
              <span className="subject-icon">📚</span>
              {subject}
            </div>
          </div>
        ))}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Dashboard;