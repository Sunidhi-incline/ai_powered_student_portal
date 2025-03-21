import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { handleError, handleSuccess } from '../utils/toastUtils';
import 'react-toastify/dist/ReactToastify.css';

function Login() {
  const [loginInfo, setLoginInfo] = useState({
    email: '',
    password: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginInfo;

    if (!email || !password) {
      return handleError('Email and password are required');
    }

    try {
      const url = "http://localhost:8080/auth/login";
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginInfo)
      });

      const result = await response.json();
      
      if (result.success) {
        handleSuccess(result.message);
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } else {
        handleError(result.message);
      }
    } catch (err) {
      handleError('Something went wrong');
    }
  };

  return (
    <div className="container">
      <h1>LOGIN FORM</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            value={loginInfo.email}
            onChange={handleChange}
            placeholder="Enter your email"
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            value={loginInfo.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
        </div>
        <button type="submit">Login</button>
        <p>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </form>
      <ToastContainer />
    </div>
  );
}

export default Login;