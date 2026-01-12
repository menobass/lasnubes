# Las Nubes 🌥️

Progressive Web App for farm automation control with Hive blockchain integration. Controls a gate via MQTT protocol with immutable activity logging on the Hive blockchain.

## Features

- 🚪 Remote gate control via MQTT
- 🔐 Hive blockchain authentication (whitelisted users only)
- 📝 Immutable activity logging on Hive blockchain
- 📱 Progressive Web App (installable on mobile/desktop)
- 🎨 Modern, responsive UI
- 🔄 Real-time feedback
- ⚙️ Configurable backend and frontend ports
- 🌐 Works on any device with a browser
- 📊 Retrievable event history from blockchain

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MQTT broker (configured in .env)
- Hive blockchain account with posting key
- `authorized-users.json` file with whitelisted Hive usernames

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

5. Edit `.env` with your MQTT broker credentials, port configuration, and Hive credentials:
```env
PORT=6000
CLIENT_PORT=3000
MQTT_BROKER=your.mqtt.broker.com
MQTT_PORT=1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password
MQTT_TOPIC_DOOR=home/door/cmd
HIVE_USERNAME=your_hive_username
HIVE_POSTING_KEY=your_hive_posting_key
JWT_SECRET=your_secret_key_here
```

6. Create `authorized-users.json` with whitelisted Hive usernames:
```json
{
  "authorizedUsers": [
    "username1",
    "username2",
    "username3"
  ]
}
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
- `HIVE_USERNAME` - Hive blockchain account username for posting events
- `HIVE_POSTING_KEY` - Hive posting key for blockchain transactions
- `JWT_SECRET` - Secret key for JWT token generation

## API Endpoints

### Authentication

#### POST /api/auth/login
Authenticate a user with Hive credentials.

Request:
```json
{
  "username": "hiveusername",
  "postingKey": "5K..."
}
```

Response:
```json
{
  "success": true,
  "token": "jwt_token_here",
  "username": "hiveusername",
  "message": "Login successful"
}
```

#### POST /api/auth/verify
Verify and refresh JWT token. Requires valid token in Authorization header.

Response:
```json
{
  "success": true,
  "token": "refreshed_jwt_token",
  "username": "hiveusername"
}
```

### Door Control

#### POST /api/door/open
Opens the gate by sending "ON" command to MQTT topic. Requires authentication. Logs event to Hive blockchain.

Headers:
```
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "success": true,
  "message": "Gate command sent successfully",
  "topic": "home/door/cmd",
  "command": "ON",
  "hive": {
    "success": true,
    "transactionId": "abc123...",
    "blockNum": 123456,
    "payload": {
      "action": "door_activated",
      "user": "hiveusername",
      "timestamp": "2026-01-11T...",
      "message": "Gate Door Activated by @hiveusername"
    }
  }
}
```

#### GET /api/door/logs
Retrieve door activation history from Hive blockchain.

Query Parameters:
- `limit` (optional): Maximum number of events to fetch (default: 50)

Response:
```json
{
  "success": true,
  "logs": [
    {
      "action": "door_activated",
      "user": "hiveusername",
      "timestamp": "2026-01-11T...",
      "message": "Gate Door Activated by @hiveusername",
      "block_num": 123456
    }
  ],
  "count": 10
}
```

### System

#### GET /api/health
Health check endpoint.

Response:
```json
{
  "status": "ok",
  "mqtt": "connected",
  "timestamp": "2026-01-11T..."
}
```

## Hive Blockchain Integration

Las Nubes uses the Hive blockchain for:

1. **Authentication**: Users log in with their Hive username and posting key. Only whitelisted users in `authorized-users.json` can access the system.

2. **Immutable Logging**: Every gate activation is recorded as a custom JSON operation on the Hive blockchain (`lasnubes_door_event`), providing:
   - Permanent, tamper-proof audit trail
   - Timestamp verification
   - User attribution
   - Public transparency

3. **Event Retrieval**: Historical door activations can be queried from the blockchain, providing complete activity history even if the local server is reset.

### Custom JSON Format

Events are stored on Hive using this format:
```json
{
  "action": "door_activated",
  "user": "hiveusername",
  "timestamp": "2026-01-11T12:34:56.789Z",
  "message": "Gate Door Activated by @hiveusername"
}
```

## Future Features

- � Video streaming integration
- 🏠 Additional home automation controls
- 📊 Enhanced activity monitoring and analytics
- 🔔 Push notifications
- 📈 Hive blockchain activity dashboard

## Tech Stack

- **Backend**: Node.js, Express, MQTT, JWT Authentication
- **Frontend**: React, PWA
- **Blockchain**: Hive (@hiveio/dhive)
- **Communication**: REST API, MQTT Protocol
- **Authentication**: JWT with Hive posting key validation

## License

MIT
