#!/bin/bash

# Uninstall Las Nubes systemd service

echo "🛑 Stopping Las Nubes service..."
sudo systemctl stop las-nubes.service

echo "🔧 Disabling Las Nubes service..."
sudo systemctl disable las-nubes.service

echo "🗑️  Removing service file..."
sudo rm -f /etc/systemd/system/las-nubes.service

echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

echo "✅ Las Nubes service uninstalled successfully!"
echo ""
echo "Note: Application files in $(pwd) have not been deleted."
echo "To remove them manually: rm -rf $(pwd)"
