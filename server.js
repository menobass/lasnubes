require('dotenv').config();
const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const path = require('path');

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

// API Routes
app.post('/api/door/open', (req, res) => {
  if (!mqttClient || !mqttClient.connected) {
    return res.status(503).json({ 
      success: false, 
      message: 'MQTT client not connected' 
    });
  }

  const topic = process.env.MQTT_TOPIC_DOOR || 'home/door/cmd';
  const message = 'ON';

  mqttClient.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      console.error('Failed to publish message:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send command',
        error: err.message 
      });
    }

    console.log(`✓ Published: ${message} to ${topic}`);
    res.json({ 
      success: true, 
      message: 'Gate command sent successfully',
      topic,
      command: message
    });
  });
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
