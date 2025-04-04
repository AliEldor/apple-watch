import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Predictions = ({ onGenerated }) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/v0.1/predictions');
      setPredictions(response.data.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setError('Failed to load predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate ai predictions
  const generatePredictions = async () => {
    setGenerating(true);
    try {
    
      await axios.post('http://localhost:8000/api/v0.1/predictions/generate');
 
      const response = await axios.get('http://localhost:8000/api/v0.1/predictions');
      setPredictions(response.data.data);
      setError(null);
      

      if (onGenerated) {
        onGenerated();
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
      setError('Failed to generate predictions. Please ensure you have uploaded enough activity data.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !generating) return <p className="loading">Loading predictions...</p>;
  
  // Group predictions by type
  const groupedPredictions = predictions.reduce((groups, prediction) => {
    const type = prediction.prediction_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(prediction);
    return groups;
  }, {});
  
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button 
          className="generate-btn"
          onClick={generatePredictions} 
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate AI Predictions'}
        </button>
      </div>
      
      {error && <p className="error-message">{error}</p>}
      
      <h3>AI-Generated Predictions</h3>
      
      {predictions.length === 0 ? (
        <p>No predictions available. Generate predictions to see insights.</p>
      ) : (
        Object.keys(groupedPredictions).map(type => (
          <div key={type} className="prediction-section">
            <h4 className="prediction-type">{type.replace('_', ' ')}</h4>
            <ul className="prediction-list">
              {groupedPredictions[type].map((prediction, index) => (
                <li key={index}>{prediction.prediction_text}</li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default Predictions;