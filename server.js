require('dotenv').config();
const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const path = require('path');
const { postDoorEvent, getDoorLogs } = require('./hiveService');
const {
  isUserAuthorized,
  validateHiveKey,
  generateToken,
  authenticateRequest,
  refreshToken
} = require('./authService');

const app = express();
const PORT = process.env.PORT || 6000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// MQTT Configuration
const mqttConfig = {
  host: process.env.MQTT_BROKER,
  port: parseInt(process.env.MQTT_PORT) || 1883,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
};

// MQTT Client
let mqttClient = null;

const connectMQTT = () => {
  const clientId = `lasnubes_${Math.random().toString(16).slice(3)}`;
  mqttClient = mqtt.connect(`mqtt://${mqttConfig.host}:${mqttConfig.port}`, {
    clientId,
    username: mqttConfig.username,
    password: mqttConfig.password,
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
  });

  mqttClient.on('connect', () => {
    console.log('✓ Connected to MQTT broker');
  });

  mqttClient.on('error', (err) => {
    console.error('MQTT connection error:', err);
  });

  mqttClient.on('close', () => {
    console.log('MQTT connection closed');
  });
};

// Initialize MQTT connection
connectMQTT();

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, postingKey } = req.body;

  console.log(`🔐 Login attempt for user: @${username}`);

  if (!username || !postingKey) {
    console.log('❌ Login failed: Missing credentials');
    return res.status(400).json({
      success: false,
      message: 'Username and posting key are required'
    });
  }

  // Check if user is in whitelist
  if (!isUserAuthorized(username)) {
    console.log(`❌ Login failed: @${username} not in whitelist`);
    return res.status(403).json({
      success: false,
      message: 'User not authorized'
    });
  }
  console.log(`✓ User @${username} is in whitelist`);

  // Validate posting key
  console.log(`🔑 Validating posting key for @${username}...`);
  const isValidKey = await validateHiveKey(username, postingKey);
  if (!isValidKey) {
    console.log(`❌ Login failed: Invalid posting key for @${username}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid posting key'
    });
  }
  console.log(`✓ Posting key validated for @${username}`);

  // Generate JWT token
  const token = generateToken(username);

  console.log(`✓ JWT token generated for @${username}`);
  console.log(`✓ User @${username} logged in successfully\n`);

  res.json({
    success: true,
    token,
    username,
    message: 'Login successful'
  });
});

// Verify and refresh token
app.post('/api/auth/verify', authenticateRequest, (req, res) => {
  // If we get here, token is valid (authenticateRequest middleware passed)
  console.log(`🔄 Token verified and refreshed for @${req.user.username}`);
  
  // Issue a new token with refreshed expiry
  const newToken = refreshToken(req.user.username);

  res.json({
    success: true,
    token: newToken,
    username: req.user.username
  });
});

// API Routes
app.post('/api/door/open', authenticateRequest, async (req, res) => {
  console.log(`🚪 Door open request from @${req.user.username}`);
  
  if (!mqttClient || !mqttClient.connected) {
    console.log('❌ MQTT client not connected');
    return res.status(503).json({ 
      success: false, 
      message: 'MQTT client not connected' 
    });
  }

  const topic = process.env.MQTT_TOPIC_DOOR || 'home/door/cmd';
  const message = 'ON';
  const username = req.user.username; // Get username from authenticated token

  mqttClient.publish(topic, message, { qos: 1 }, async (err) => {
    if (err) {
      console.error('Failed to publish message:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send command',
        error: err.message 
      });
    }

    console.log(`✓ Published: ${message} to ${topic}`);

    // Post to Hive blockchain
    try {
      const hiveResult = await postDoorEvent(username);
      console.log('✓ Posted to Hive:', hiveResult);
      
      res.json({ 
        success: true, 
        message: 'Gate command sent successfully',
        topic,
        command: message,
        hive: hiveResult
      });
    } catch (hiveError) {
      console.error('Hive posting failed:', hiveError);
      // Still return success since the door command worked
      res.json({ 
        success: true, 
        message: 'Gate command sent successfully (Hive logging failed)',
        topic,
        command: message,
        hiveError: hiveError.message
      });
    }
  });
});

// Get door logs from Hive
app.get('/api/door/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await getDoorLogs(limit);
    
    res.json({
      success: true,
      logs: logs,
      count: logs.length
    });
  } catch (error) {
    console.error('Failed to fetch door logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch door logs',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mqtt: mqttClient && mqttClient.connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Las Nubes server running on port ${PORT}`);
  console.log(`📡 MQTT broker: ${mqttConfig.host}:${mqttConfig.port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  if (mqttClient) {
    mqttClient.end();
  }
  process.exit(0);
});
