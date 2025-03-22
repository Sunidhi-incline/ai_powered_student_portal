import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './index.css';

const topicsBySubject = {
    'Artificial Intelligence': [
        'Machine Learning Basics',
        'Neural Networks',
        'Deep Learning',
        'Natural Language Processing',
        'Computer Vision'
    ],
    'Mobile Application': [
        'UI/UX Design',
        'React Native',
        'Flutter Development',
        'iOS Development',
        'Android Development'
    ],
    // ... other subjects remain the same
};

const Dashboard2 = () => {
    const { subject } = useParams();
    const navigate = useNavigate();
    
    // Fix: Properly decode and handle the subject parameter
    const decodedSubject = subject ? decodeURIComponent(subject) : '';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
    }, [navigate]);

    // Fix: Update the matching logic to be more flexible
    const matchedSubject = Object.keys(topicsBySubject).find(
        key => key.toLowerCase().trim() === decodedSubject.toLowerCase().trim()
    );

    const topics = matchedSubject ? topicsBySubject[matchedSubject] : [];

    const handleBack = () => {
        navigate('/dashboard');
    };

    // Add console logs for debugging
    console.log('Decoded Subject:', decodedSubject);
    console.log('Matched Subject:', matchedSubject);
    console.log('Topics:', topics);

    return (
        <div className="dashboard2-container">
            <div className="header">
                <img src="/logo.png" alt="College Logo" className="college-logo" />
                <div className="header-content">
                    <h2 className="title">Topics for {matchedSubject || "Unknown Subject"}</h2>
                    <button onClick={handleBack} className="back-button">
                        ← Back to Subjects
                    </button>
                </div>
            </div>

            {topics.length > 0 ? (
                <ul className="topic-list">
                    {topics.map((topic, index) => (
                        <li key={index} className="topic-item">
                            <span className="topic-title">📘 {topic}</span>
                            <Link 
                                to={`/dashboard3/${encodeURIComponent(topic)}`}
                                className="assignment-link"
                            >
                                Generate Assignment →
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="error-message">⚠ No topics found for "{decodedSubject}"</p>
            )}
        </div>
    );
};

export default Dashboard2;