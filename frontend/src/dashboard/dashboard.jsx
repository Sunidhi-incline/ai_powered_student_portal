import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './index.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [subjects] = useState([
    'Artificial Intelligence',
    'Mobile Application',
    'Internet of Things (IOT)',
    'Software Engineering',
    'Power BI'
  ]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const handleSubjectClick = (subject) => {
    navigate(`/dashboard2/${encodeURIComponent(subject)}`);
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <img src="/logo.png" alt="College Logo" className="college-logo" />
        <h2 className="title">Subjects</h2>
        <button 
          className="logout-button"
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }}
        >
          Logout
        </button>
      </div>

      <div className="subject-grid">
        {subjects.map((subject, index) => (
          <div 
            key={index} 
            className="subject-card"
            onClick={() => handleSubjectClick(subject)}
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