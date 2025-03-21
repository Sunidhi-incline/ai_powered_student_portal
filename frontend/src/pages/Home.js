import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { handleError } from '../utils/toastUtils';
import 'react-toastify/dist/ReactToastify.css';

function Home() {
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:8080/products', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (data.success) {
          setWelcomeMessage(data.welcomeMessage);
        } else {
          handleError(data.message);
        }
      } catch (error) {
        handleError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <h1>{welcomeMessage}</h1>
      <div className="content">
        <h2>Dashboard</h2>
        <p>Welcome to your dashboard!</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
      <ToastContainer />
    </div>
  );
}

export default Home;