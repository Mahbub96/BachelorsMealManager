#!/bin/bash

echo "🔄 Restarting Bachelor Mess Backend Server..."

# Kill any existing node processes running the server
pkill -f "node.*server.js" || true

# Wait a moment for processes to terminate
sleep 2

# Start the server
echo "🚀 Starting server..."
npm start &

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test health endpoint
echo "🏥 Testing health endpoint..."
curl -s http://192.168.0.130:3000/health | jq '.'

# Test login endpoint
echo "🔐 Testing login endpoint..."
curl -s -X POST http://192.168.0.130:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq '.'

# Test profile endpoint with invalid token
echo "👤 Testing profile endpoint (should fail with invalid token)..."
curl -s -X PUT http://192.168.0.130:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"name":"Test User"}' | jq '.'

echo "✅ Server restart and testing complete!" 