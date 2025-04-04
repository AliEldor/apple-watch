import React, { useState } from 'react';
import axios from 'axios';

const CsvUpload = ({ onUploadSuccess }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
    setUploadMessage('');
  };

  // Upload CSV file
  const handleUpload = async () => {
    if (!csvFile) {
      setUploadMessage('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadMessage('Uploading...');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = event.target.result;
        // Convert to base64 encoding 
        const base64Data = btoa([...new Uint8Array(new TextEncoder().encode(fileContent))]
          .map(byte => String.fromCharCode(byte))
          .join(''));

        const response = await axios.post('http://localhost:8000/api/v0.1/activity/upload', {
          csv_file: base64Data
        });

        setUploadMessage(`Upload successful! ${response.data.stats.processed} records processed.`);
        
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      };
      reader.readAsText(csvFile);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadMessage(`Upload failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-section">
      <h2>Upload Activity Data</h2>
      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileChange} 
        disabled={isUploading} 
      />
      <button 
        className="upload-btn"
        onClick={handleUpload} 
        disabled={!csvFile || isUploading}
      >
        Upload
      </button>
      {uploadMessage && (
        <div className={`message ${isUploading ? '' : uploadMessage.includes('successful') ? 'success-message' : 'error-message'}`}>
          {uploadMessage}
        </div>
      )}
    </div>
  );
};

export default CsvUpload;