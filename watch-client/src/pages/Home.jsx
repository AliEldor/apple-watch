import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../slices/authSlice';
import axios from 'axios';
import '../styles/home.css';

import CsvUpload from '../components/CsvUpload';
import ActivitySummary from '../components/ActivitySummary';
import DailyTrends from '../components/DailyTrends';
import WeeklyTrends from '../components/WeeklyTrends';
import Predictions from '../components/Predictions';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('summary');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const handleLogout = () => {
    dispatch(logout())
      .unwrap()
      .then(() => {
        navigate('/login');
      });
  };

  const refreshData = () => {
    setRefreshKey(oldKey => oldKey + 1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleUploadSuccess = () => {
    refreshData();
  };

  return (
    <div className="home-container">
      <header className="header">
        <h1>Activity Tracker</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </header>
      
      {/* CSV Upload Component */}
      <CsvUpload onUploadSuccess={handleUploadSuccess} />
      
      <div>
        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => handleTabChange('summary')}
          >
            Summary
          </button>
          <button 
            className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => handleTabChange('daily')}
          >
            Daily Trends
          </button>
          <button 
            className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => handleTabChange('weekly')}
          >
            Weekly Trends
          </button>
          <button 
            className={`tab-btn ${activeTab === 'predictions' ? 'active' : ''}`}
            onClick={() => handleTabChange('predictions')}
          >
            Predictions
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'summary' && <ActivitySummary key={`summary-${refreshKey}`} />}
          {activeTab === 'daily' && <DailyTrends key={`daily-${refreshKey}`} />}
          {activeTab === 'weekly' && <WeeklyTrends key={`weekly-${refreshKey}`} />}
          {activeTab === 'predictions' && (
            <Predictions 
              key={`predictions-${refreshKey}`} 
              onGenerated={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;