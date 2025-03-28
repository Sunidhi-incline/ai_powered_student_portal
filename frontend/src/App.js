import React from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './dashboard/dashboard';
import Dashboard2 from './dashboard2/dashboard2';
import Dashboard3 from './dashboard3/dashboard3';
import Dashboard4 from './dashboard4/dashboard4';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard2/:subject" 
        element={
          <ProtectedRoute>
            <Dashboard2 />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard3/:topic" 
        element={
          <ProtectedRoute>
            <Dashboard3 />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard4" 
        element={
          <ProtectedRoute>
            <Dashboard4 />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;