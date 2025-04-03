import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { register, clearMessages } from '../slices/authSlice';
import "../styles/index.css";

function Register() {
  
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
  });
  
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Select state  from the auth slice
  const { loading, error, message } = useSelector(state => state.auth);
  
  useEffect(() => {
    dispatch(clearMessages());
    
    // clear  when component unmounts
    return () => {
      dispatch(clearMessages());
    };
  }, [dispatch]);
  
  
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 500);
      
      // Clean up timer
      return () => clearTimeout(timer);
    }
  }, [message, navigate]);
  
  // handl input changes
  const updateField = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };
  

  const submitForm = (e) => {
    e.preventDefault();
    dispatch(register(form));
  };
  
  const renderError = () => {
    if (!error) return null;
    
    const errorMessage = typeof error === 'object' 
      ? JSON.stringify(error) 
      : error;
      
    return (
      <div className="error-message">
        {errorMessage}
      </div>
    );
  };
  
  return (
    <div className="login-outer-container">
      <div className="login-container">
        <div className="login-area">
          <h3>REGISTER TO Activity Tracker</h3>
          
          
          {renderError()}
          
         
          {message && (
            <div className="success-alert">
              {message}
            </div>
          )}
          
          <form onSubmit={submitForm} className="login-items">
            <label htmlFor="full_name">Name</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              className="login"
              placeholder="Enter your name"
              value={form.full_name}
              onChange={updateField}
              disabled={loading}
              required
            />
            
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="login"
              placeholder="Enter your email"
              value={form.email}
              onChange={updateField}
              disabled={loading}
              required
            />
            
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="login"
              placeholder="Enter password"
              value={form.password}
              onChange={updateField}
              disabled={loading}
              required
            />
            
            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
          
          <p className="reg">
            Already have an account? <Link className="a" to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;