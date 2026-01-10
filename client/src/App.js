import React, { useState } from 'react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);

  const handleOpenGate = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/door/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✓ Gate opened successfully!');
        setStatus('success');
      } else {
        setMessage(`✗ Error: ${data.message}`);
        setStatus('error');
      }
    } catch (error) {
      setMessage(`✗ Failed to connect: ${error.message}`);
      setStatus('error');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setMessage('');
        setStatus(null);
      }, 3000);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌥️ Las Nubes</h1>
        <p className="subtitle">Automation Control</p>
        
        <div className="control-panel">
          <button 
            className={`gate-button ${loading ? 'loading' : ''}`}
            onClick={handleOpenGate}
            disabled={loading}
          >
            {loading ? '⏳ Opening...' : '🚪 Open Gate'}
          </button>
          
          {message && (
            <div className={`message ${status}`}>
              {message}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
