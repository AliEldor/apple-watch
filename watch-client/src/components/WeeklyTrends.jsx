import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WeeklyTrends = () => {
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeeklyTrends();
  }, []);

 
  const fetchWeeklyTrends = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/v0.1/activity/weekly-trends');
      setWeeklyTrends(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching weekly trends:', error);
      setError('Failed to load weekly trends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="loading">Loading weekly trends...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (weeklyTrends.length === 0) return <p>No weekly trend data available.</p>;
  
  const chartData = weeklyTrends.map(week => ({
    ...week,
    weekShort: `Week of ${week.weekStart.split('-').slice(1).join('/')}` // Format: MM/DD
  }));
  
  return (
    <div>
      <h3>Weekly Activity Trends</h3>
      
      {/* Weekly Total Steps Chart */}
      <div className="chart-container">
        <h4>Weekly Total Steps</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekShort" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalSteps" fill="#8884d8" name="Total Steps" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Weekly Average Steps Chart */}
      <div className="chart-container">
        <h4>Weekly Average Steps Per Day</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekShort" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgSteps" fill="#82ca9d" name="Avg Steps/Day" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Weekly Distance and Active Minutes */}
      <div className="chart-container">
        <h4>Weekly Activity Metrics</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="weekShort" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="totalDistance" fill="#8884d8" name="Total Distance (km)" />
            <Bar yAxisId="right" dataKey="totalActiveMinutes" fill="#ffc658" name="Total Active Minutes" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <h4>Weekly Data Table</h4>
      <table>
        <thead>
          <tr>
            <th>Week</th>
            <th>Total Steps</th>
            <th>Avg Steps/Day</th>
            <th>Total Distance (km)</th>
            <th>Total Active Minutes</th>
            <th>Days Tracked</th>
          </tr>
        </thead>
        <tbody>
          {weeklyTrends.map((week, index) => (
            <tr key={index}>
              <td>{week.weekLabel}</td>
              <td>{week.totalSteps}</td>
              <td>{week.avgSteps}</td>
              <td>{week.totalDistance}</td>
              <td>{week.totalActiveMinutes}</td>
              <td>{week.daysTracked}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WeeklyTrends;