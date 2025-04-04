import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DailyTrends = () => {
  const [dailyTrends, setDailyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDailyTrends();
  }, []);

  const fetchDailyTrends = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/v0.1/activity/daily-trends');
      setDailyTrends(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching daily trends:', error);
      setError('Failed to load daily trends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="loading">Loading daily trends...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (dailyTrends.length === 0) return <p>No daily trend data available.</p>;
  
  return (
    <div>
      <h3>Daily Activity Trends</h3>
      
      {/* Steps Chart */}
      <div className="chart-container">
        <h4>Daily Steps</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="steps" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Distance Chart */}
      <div className="chart-container">
        <h4>Daily Distance (km)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="distance" stroke="#82ca9d" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Active Minutes Chart */}
      <div className="chart-container">
        <h4>Daily Active Minutes</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="activeMinutes" stroke="#ffc658" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <h4>Daily Data Table</h4>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Steps</th>
            <th>Distance (km)</th>
            <th>Active Minutes</th>
          </tr>
        </thead>
        <tbody>
          {dailyTrends.map((day, index) => (
            <tr key={index}>
              <td>{day.date}</td>
              <td>{day.steps}</td>
              <td>{day.distance}</td>
              <td>{day.activeMinutes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DailyTrends;