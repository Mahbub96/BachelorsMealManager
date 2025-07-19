#!/bin/bash

echo "📦 Installing Android SDK manually..."

# Create Android SDK directory
mkdir -p ~/Library/Android/sdk

# Download Android SDK Command Line Tools
echo "📥 Downloading Android SDK Command Line Tools..."
cd ~/Library/Android/sdk

# Download the latest command line tools
curl -O https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip

# Unzip the tools
unzip commandlinetools-mac-11076708_latest.zip

# Create the proper directory structure
mkdir -p cmdline-tools/latest
mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true

# Set environment variables
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Accept licenses
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses

# Install required SDK packages
echo "📦 Installing Android SDK packages..."
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "system-images;android-34;google_apis;x86_64"

echo "✅ Android SDK installation complete!"
echo "📱 You can now create an Android Virtual Device" 