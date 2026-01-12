import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPostingKey, setLoginPostingKey] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Check for existing token on mount
  useEffect(() => {
    console.log('🔍 Checking for existing session...');
    const storedToken = localStorage.getItem('lasnubes_token');
    const storedUsername = localStorage.getItem('lasnubes_username');
    
    if (storedToken && storedUsername) {
      console.log(`📦 Found stored token for @${storedUsername}`);
      verifyToken(storedToken, storedUsername);
    } else {
      console.log('ℹ️ No existing session found');
      setLogsLoading(false);
    }
  }, []);

  // Fetch door logs on component mount
  useEffect(() => {
    if (isLoggedIn) {
      fetchDoorLogs();
    }
  }, [isLoggedIn]);

  const verifyToken = async (existingToken, existingUsername) => {
    console.log(`🔐 Verifying token for @${existingUsername}...`);
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${existingToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Token verified and refreshed');
        setToken(data.token);
        setUsername(data.username);
        setIsLoggedIn(true);
        localStorage.setItem('lasnubes_token', data.token);
        localStorage.setItem('lasnubes_username', data.username);
      } else {
        console.log('❌ Token verification failed');
        localStorage.removeItem('lasnubes_token');
        localStorage.removeItem('lasnubes_username');
      }
    } catch (error) {
      console.error('❌ Token verification error:', error);
      localStorage.removeItem('lasnubes_token');
      localStorage.removeItem('lasnubes_username');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log(`🔐 Attempting login for @${loginUsername}...`);
    setLoginLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: loginUsername,
          postingKey: loginPostingKey
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Login successful!');
        console.log(`📝 Storing token for @${data.username}`);
        setToken(data.token);
        setUsername(data.username);
        setIsLoggedIn(true);
        localStorage.setItem('lasnubes_token', data.token);
        localStorage.setItem('lasnubes_username', data.username);
        setShowLogin(false);
        setLoginUsername('');
        setLoginPostingKey('');
        setMessage('✓ Login successful!');
        setStatus('success');
      } else {
        console.log('❌ Login failed:', data.message);
        // Provide user-friendly error messages
        let errorMessage = data.message;
        if (response.status === 403 || data.message?.includes('not authorized')) {
          errorMessage = 'Invalid username or posting key. Please check and try again.';
        }
        setLoginError(errorMessage);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoginError(`Login failed: ${error.message}`);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    setIsLoggedIn(false);
    setLogs([]);
    localStorage.removeItem('lasnubes_token');
    localStorage.removeItem('lasnubes_username');
    setMessage('✓ Logged out successfully');
    setStatus('success');
    setTimeout(() => {
      setMessage('');
      setStatus(null);
    }, 2000);
  };

  const fetchDoorLogs = async () => {
    try {
      const response = await fetch('/api/door/logs?limit=20');
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleOpenGate = async () => {
    if (!isLoggedIn) {
      console.log('🔒 User not logged in, showing login modal');
      setLoginError('');
      setShowLogin(true);
      return;
    }

    console.log(`🚪 Opening gate as @${username}...`);
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/door/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Gate opened successfully!');
        setMessage('✓ Gate opened successfully!');
        setStatus('success');
        if (data.token) {
          console.log('🔄 Token refreshed');
          setToken(data.token);
          localStorage.setItem('lasnubes_token', data.token);
        }
        setTimeout(() => fetchDoorLogs(), 2000);
      } else {
        console.log('❌ Gate activation failed:', data.message);
        if (response.status === 401) {
          console.log('🔓 Session expired, logging out');
          handleLogout();
          setMessage('✗ Session expired. Please login again.');
        } else {
          setMessage(`✗ Error: ${data.message}`);
        }
        setStatus('error');
      }
    } catch (error) {
      console.error('❌ Gate activation error:', error);
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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🌥️ Las Nubes</h1>
        <p className="subtitle">Automation Control</p>
        
        {isLoggedIn && (
          <div className="user-info">
            <span>Logged in as @{username}</span>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}

        <div className="control-panel">
          <button 
            className={`gate-button ${loading ? 'loading' : ''} ${!isLoggedIn ? 'disabled' : ''}`}
            onClick={handleOpenGate}
            disabled={loading}
          >
            {loading ? '⏳ Opening...' : isLoggedIn ? '🚪 Open Gate' : '🔒 Login to Open Gate'}
          </button>
          
          {message && (
            <div className={`message ${status}`}>
              {message}
            </div>
          )}
        </div>

        {showLogin && (
          <div className="modal-overlay" onClick={() => { setShowLogin(false); setLoginError(''); }}>
            <div className="login-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Login</h2>
              {loginError && (
                <div className="login-error">
                  ⚠️ {loginError}
                </div>
              )}
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label>Hive Username</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="username"
                    required
                    disabled={loginLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Posting Key</label>
                  <input
                    type="password"
                    value={loginPostingKey}
                    onChange={(e) => setLoginPostingKey(e.target.value)}
                    placeholder="5xxxxx..."
                    required
                    disabled={loginLoading}
                  />
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="login-submit"
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Logging in...' : 'Login'}
                  </button>
                  <button
                    type="button"
                    className="login-cancel"
                    onClick={() => { setShowLogin(false); setLoginError(''); }}
                    disabled={loginLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoggedIn && (
          <div className="logs-section">
            <h2>📜 Activity Log</h2>
            {logsLoading ? (
              <p className="loading-text">Loading logs...</p>
            ) : logs.length === 0 ? (
              <p className="no-logs">No activity yet</p>
            ) : (
              <div className="logs-container">
                {logs.map((log, index) => (
                  <div key={index} className="log-entry">
                    <span className="log-message">{log.message}</span>
                    <span className="log-time">{formatTimestamp(log.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
