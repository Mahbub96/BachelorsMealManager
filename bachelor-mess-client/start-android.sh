#!/bin/bash

# Bachelor Mess Client - Android Quick Start Script
echo "🚀 Starting Bachelor Mess Client for Android..."

# Set Java environment
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@17/17.0.16/libexec/openjdk.jdk/Contents/Home
export PATH=/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$JAVA_HOME/bin

echo "✅ Java environment set to version 17"

# Check if emulator is running
echo "📱 Checking Android emulator..."
adb devices

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the app
echo "🏃‍♂️ Starting the app..."
npx expo run:android

echo "✅ App should now be running on your Android emulator!" 