import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../slices/authSlice';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        navigate('/login');
      });
  };

  return (
    <div>
      <header>
        <h1>Activity Tracker</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>
      <main>
        <h2>Welcome to your Activity Dashboard</h2>
        <p>Your health data will be displayed here.</p>
      </main>
    </div>
  );
};

export default Home;