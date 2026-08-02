#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🛡️ Deploying Agent Consigner to VPS (38.49.217.185)"
echo "Agent ID: 5859 | OKX X Layer Testnet"
echo "=========================================================="

# 1. Check Node.js version
echo "--> Checking Node.js version..."
node -v || { echo "Node.js not found. Please ensure Node 20 is installed."; exit 1; }
npm -v

# 2. Install PM2 globally if missing
if ! command -v pm2 &> /dev/null; then
  echo "--> Installing PM2 globally..."
  sudo npm install -g pm2
fi

# 3. Create .env file for Vite build & runtime
echo "--> Setting up .env configuration..."
cat << 'EOF' > .env
VITE_FIREBASE_API_KEY="AIzaSyDKTOg2HA8RznXA2BSa0Tt3EnamGKX8CRQ"
VITE_FIREBASE_AUTH_DOMAIN="verdict-hackathon.firebaseapp.com"
VITE_FIREBASE_DATABASE_URL="https://verdict-hackathon-default-rtdb.europe-west1.firebasedatabase.app"
VITE_FIREBASE_PROJECT_ID="verdict-hackathon"
VITE_FIREBASE_STORAGE_BUCKET="verdict-hackathon.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="20008028767"
VITE_FIREBASE_APP_ID="1:20008028767:web:8b37869b380668423929ea"
FIREBASE_API_KEY="AIzaSyDKTOg2HA8RznXA2BSa0Tt3EnamGKX8CRQ"
FIREBASE_AUTH_DOMAIN="verdict-hackathon.firebaseapp.com"
FIREBASE_DATABASE_URL="https://verdict-hackathon-default-rtdb.europe-west1.firebasedatabase.app"
FIREBASE_PROJECT_ID="verdict-hackathon"
FIREBASE_STORAGE_BUCKET="verdict-hackathon.firebasestorage.app"
FIREBASE_MESSAGING_SENDER_ID="20008028767"
FIREBASE_APP_ID="1:20008028767:web:8b37869b380668423929ea"
PORT=3000
OKX_AGENT_ID="5859"
EOF

# 4. Install project dependencies
echo "--> Installing project dependencies..."
npm install

# 5. Build Vite static production assets
echo "--> Building production frontend..."
npm run build

# 6. Start / Restart processes using PM2 (using .cjs extension for ES module compatibility)
echo "--> Supervising processes with PM2..."
pm2 start ecosystem.config.cjs

# 7. Save PM2 state & enable startup systemd hook
pm2 save
sudo pm2 startup systemd -u $USER --hp $HOME || true

echo "=========================================================="
echo "✅ Agent Consigner deployed successfully!"
echo "Server & API running at: http://38.49.217.185:3000"
echo "Health Check: http://38.49.217.185:3000/api/health"
echo "Firebase Sync: Connected to verdict-hackathon database"
echo "PM2 Status: Run 'pm2 status' or 'pm2 logs'"
echo "=========================================================="
