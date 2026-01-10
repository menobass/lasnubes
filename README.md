# Las Nubes 🌥️

Progressive Web App for farm automation control. This MVP controls a gate via MQTT protocol.

## Features

- 🚪 Remote gate control via MQTT
- 📱 Progressive Web App (installable on mobile/desktop)
- 🎨 Modern, responsive UI
- 🔄 Real-time feedback
- ⚙️ Configurable backend and frontend ports
- 🌐 Works on any device with a browser

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MQTT broker (configured in .env)

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd lasnubes
```

2. Install backend dependencies:
```bash
npm install
```

3. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

4. Create `.env` file from example:
```bash
cp .env.example .env
```

5. Edit `.env` with your MQTT broker credentials and port configuration:
```env
PORT=6000
CLIENT_PORT=3000
MQTT_BROKER=147.135.113.77
MQTT_PORT=1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MQTT_TOPIC_DOOR=home/door/cmd
```

**Note**: Both backend and frontend ports are configurable. If port 3000 is already in use on your server, change `CLIENT_PORT` to any available port (e.g., 3001, 8080, etc.).

## Development

Run both backend and frontend in development mode:
```bash
npm run dev:all
```

Or use the helper script that respects your .env port configuration:
```bash
./start-dev.sh
```

Or run them separately:

Backend only:
```bash
npm run dev
```

Frontend only (will use CLIENT_PORT from .env):
```bash
cd client
PORT=${CLIENT_PORT:-3000} npm start
```

The app will be available at:
- Frontend: http://localhost:[CLIENT_PORT] (default: 3000)
- Backend API: http://localhost:[PORT] (default: 6000)

## Production Build

1. Build the React frontend:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

The server will serve the built React app and handle API requests on the configured port (default: 6000).

## Deployment

### Systemd Service (Recommended for VPS/Linux)

**Idiot-proof one-command installation:**

1. Clone the repository to your VPS:
```bash
git clone <your-repo-url>
cd lasnubes
```

2. Configure your `.env` file:
```bash
cp .env.example .env
nano .env  # Edit with your MQTT credentials and ports
```

3. Run the installation script:
```bash
./install-systemd.sh
```

That's it! The script will:
- ✅ Install all dependencies
- ✅ Build the React frontend
- ✅ Create and install the systemd service
- ✅ Start the service automatically
- ✅ Enable auto-start on system boot

**Service Management:**
```bash
# Start the service
sudo systemctl start las-nubes

# Stop the service
sudo systemctl stop las-nubes

# Restart the service
sudo systemctl restart las-nubes

# Check status
sudo systemctl status las-nubes

# View logs (follow mode)
sudo journalctl -u las-nubes -f

# View recent logs
sudo journalctl -u las-nubes -n 50

# Disable auto-start on boot
sudo systemctl disable las-nubes

# Re-enable auto-start on boot
sudo systemctl enable las-nubes
```

**To Uninstall:**
```bash
./uninstall-systemd.sh
```

### Manual VPS Deployment (Alternative)

1. Install Node.js on your VPS
2. Clone the repository
3. Install dependencies and build:
```bash
npm install
cd client && npm install && npm run build && cd ..
```
4. Configure your .env file
5. Use PM2 or similar to run the server:
```bash
npm install -g pm2
pm2 start server.js --name "las-nubes"
pm2 save
pm2 startup
```

### Environment Variables

- `PORT` - Backend server port (default: 6000)
- `CLIENT_PORT` - Frontend development server port (default: 3000) - only used in development
- `MQTT_BROKER` - MQTT broker hostname/IP
- `MQTT_PORT` - MQTT broker port (default: 1883)
- `MQTT_USERNAME` - MQTT username
- `MQTT_PASSWORD` - MQTT password
- `MQTT_TOPIC_DOOR` - MQTT topic for door control

## API Endpoints

### POST /api/door/open
Opens the gate by sending "ON" command to MQTT topic.

Response:
```json
{
  "success": true,
  "message": "Gate command sent successfully",
  "topic": "home/door/cmd",
  "command": "ON"
}
```

### GET /api/health
Health check endpoint.

Response:
```json
{
  "status": "ok",
  "mqtt": "connected",
  "timestamp": "2026-01-09T..."
}
```

## Future Features

- 🔐 Hive Blockchain authentication
- 📹 Video streaming integration
- 🏠 Additional home automation controls
- 📊 Activity logging and monitoring
- 🔔 Push notifications

## Tech Stack

- **Backend**: Node.js, Express, MQTT
- **Frontend**: React, PWA
- **Communication**: REST API, MQTT Protocol

## License

MIT
