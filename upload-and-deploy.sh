#!/bin/bash

# Upload and deploy script
# This script will upload the package to the server

SERVER="195.2.73.224"
USER="root"
PACKAGE="miniapp-deploy.tar.gz"

echo "🚀 Uploading deployment package to server..."
echo ""

# Check if package exists
if [ ! -f "$PACKAGE" ]; then
    echo "❌ Error: $PACKAGE not found!"
    echo "Run ./connect-and-deploy.sh first to create the package."
    exit 1
fi

# Upload package
echo "📤 Uploading $PACKAGE to $SERVER..."
scp $PACKAGE ${USER}@${SERVER}:/home/miniapp_expert/

echo ""
echo "✅ Upload complete!"
echo ""
echo "Next: Connect to server and deploy"
echo ""
echo "Run this command:"
echo "  ssh ${USER}@${SERVER}"
echo ""
echo "Then on the server:"
echo "  cd /home/miniapp_expert"
echo "  tar -xzf miniapp-deploy.tar.gz"
echo "  chmod +x deploy-configs/one-command-deploy.sh"
echo "  ./deploy-configs/one-command-deploy.sh"
echo ""
echo "Password: h374w#54EeCTWYLu_qRA"
echo ""

