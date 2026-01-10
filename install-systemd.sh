#!/bin/bash

# Las Nubes Installation Script for systemd
# This script sets up Las Nubes as a systemd service

set -e  # Exit on any error

echo "=========================================="
echo "  Las Nubes Installation Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "❌ Do NOT run this script as root/sudo"
   echo "   Run as your normal user: ./install-systemd.sh"
   exit 1
fi

# Get the absolute path of the installation directory
INSTALL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER=$(whoami)

echo "📂 Install directory: $INSTALL_DIR"
echo "👤 User: $USER"
echo ""

# Check if .env exists
if [ ! -f "$INSTALL_DIR/.env" ]; then
    echo "❌ Error: .env file not found!"
    echo "   Please copy .env.example to .env and configure it first:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    exit 1
fi

echo "✓ Found .env file"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Install it first: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "✓ npm installed"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install --production
echo "✓ Backend dependencies installed"
echo ""

# Install and build frontend
echo "📦 Installing frontend dependencies..."
cd client
npm install --production
echo "✓ Frontend dependencies installed"
echo ""

echo "🔨 Building React frontend..."
npm run build
echo "✓ Frontend built successfully"
cd ..
echo ""

# Create systemd service file from template
echo "📝 Creating systemd service file..."
SERVICE_FILE="las-nubes.service"
sed -e "s|%USER%|$USER|g" \
    -e "s|%INSTALL_DIR%|$INSTALL_DIR|g" \
    las-nubes.service.template > $SERVICE_FILE

echo "✓ Service file created: $SERVICE_FILE"
echo ""

# Install the service
echo "🔧 Installing systemd service (requires sudo)..."
sudo cp $SERVICE_FILE /etc/systemd/system/
sudo systemctl daemon-reload
echo "✓ Service installed"
echo ""

# Enable and start the service
echo "🚀 Enabling and starting Las Nubes service..."
sudo systemctl enable las-nubes.service
sudo systemctl start las-nubes.service
echo ""

# Check status
sleep 2
echo "📊 Service Status:"
echo "=========================================="
sudo systemctl status las-nubes.service --no-pager -l
echo "=========================================="
echo ""

# Show the configured port from .env
PORT=$(grep "^PORT=" .env | cut -d '=' -f2)
PORT=${PORT:-6000}

echo "✅ Installation Complete!"
echo ""
echo "Las Nubes is now running on: http://localhost:$PORT"
echo ""
echo "📌 Useful Commands:"
echo "   Start:   sudo systemctl start las-nubes"
echo "   Stop:    sudo systemctl stop las-nubes"
echo "   Restart: sudo systemctl restart las-nubes"
echo "   Status:  sudo systemctl status las-nubes"
echo "   Logs:    sudo journalctl -u las-nubes -f"
echo "   Disable: sudo systemctl disable las-nubes"
echo ""
echo "🔄 The service will automatically start on system boot."
echo ""
