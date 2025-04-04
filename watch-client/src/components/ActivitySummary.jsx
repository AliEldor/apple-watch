import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ActivitySummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/v0.1/activity/summary');
      setSummary(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setError('Failed to load summary data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="loading">Loading summary data...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!summary) return <p>No summary data available.</p>;
    
  return (
    <div>
      <h3>Activity Summary</h3>
      <div>
        <h4>Today's Activity</h4>
        {summary.today ? (
          <ul>
            <li>Steps: {summary.today.steps}</li>
            <li>Distance: {summary.today.distance_km} km</li>
            <li>Active Minutes: {summary.today.active_minutes}</li>
          </ul>
        ) : (
          <p>No data for today</p>
        )}
      </div>
      
      <div>
        <h4>Weekly Average</h4>
        <ul>
          <li>Steps: {summary.weekly_average.steps}</li>
          <li>Distance: {summary.weekly_average.distance} km</li>
          <li>Active Minutes: {summary.weekly_average.active_minutes}</li>
        </ul>
      </div>
      
      <div>
        <h4>All-Time Stats</h4>
        <ul>
          <li>Max Steps: {summary.all_time.max_steps}</li>
          <li>Avg Steps: {summary.all_time.avg_steps}</li>
          <li>Max Distance: {summary.all_time.max_distance} km</li>
          <li>Avg Distance: {summary.all_time.avg_distance} km</li>
          <li>Max Active Minutes: {summary.all_time.max_active_minutes}</li>
          <li>Avg Active Minutes: {summary.all_time.avg_active_minutes}</li>
          <li>Days Tracked: {summary.all_time.total_days_tracked}</li>
        </ul>
      </div>
      
      <div>
        <h4>Current Streak: {summary.current_streak} days</h4>
      </div>
    </div>
  );
};

export default ActivitySummary;