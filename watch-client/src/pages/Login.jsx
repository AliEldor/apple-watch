// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, clearMessages } from '../slices/authSlice';
import "../styles/index.css";

function Login() {

  const [form, setForm] = useState({
    email: '',
    password: ''
  });
  
  // Redux hooks
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  
  // Clear messages on mount
  useEffect(() => {
    dispatch(clearMessages());
  }, [dispatch]);
  
  // Navigate if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);
  
  // Handle input changes
  const updateField = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };
  
  
  const submitForm = (e) => {
    e.preventDefault();
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';
    
    dispatch(login(form))
      .unwrap()
      .then(() => {
        navigate('/home');
      })
      .catch(() => {
       
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
      });
  };
  
  return (
    <div className='login-outer-container'>
      <div className='login-container'>
        <div className='login-area'>
          <h3>LOGIN TO Activity Tracker</h3>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <form onSubmit={submitForm} className='login-items'>
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              className='login' 
              name="email" 
              placeholder='Enter your email' 
              value={form.email}
              onChange={updateField}
              disabled={loading}
              required 
            />
            
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password"
              className='login' 
              name="password" 
              placeholder="Enter Your Password" 
              value={form.password}
              onChange={updateField}
              disabled={loading}
              required 
            />
            
            <button 
              type="submit" 
              className='login-btn'
            >
              Login
            </button>
          </form>
          
          <p className='reg'>
            New to Activity Tracker? <Link className='a' to="/register">Create an Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;