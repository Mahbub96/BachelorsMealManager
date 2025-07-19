#!/bin/bash

echo "🚀 Setting up Mac Mini M4 for Android Development..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "✅ Homebrew already installed"
fi

# Update Homebrew
echo "🔄 Updating Homebrew..."
brew update

# Install essential tools
echo "📦 Installing essential development tools..."

# Node.js and npm
echo "📦 Installing Node.js..."
brew install node

# Java
echo "📦 Installing Java..."
brew install openjdk@17

# Android tools
echo "📦 Installing Android SDK tools..."
brew install android-sdk
brew install android-platform-tools

# Gradle
echo "📦 Installing Gradle..."
brew install gradle

# Additional tools
echo "📦 Installing additional development tools..."
brew install watchman
brew install cocoapods
brew install git
brew install wget
brew install jq
brew install tree

# Set up environment variables
echo "🔧 Setting up environment variables..."

# Create or update .zshrc
cat >> ~/.zshrc << 'EOF'

# Android Development Environment
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Java
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH

# Homebrew for Apple Silicon
export PATH="/opt/homebrew/bin:$PATH"
EOF

# Also add to fish config if using fish shell
if [ -d ~/.config/fish ]; then
    cat >> ~/.config/fish/config.fish << 'EOF'

# Android Development Environment
set -gx ANDROID_HOME $HOME/Library/Android/sdk
set -gx PATH $PATH $ANDROID_HOME/emulator
set -gx PATH $PATH $ANDROID_HOME/platform-tools
set -gx PATH $PATH $ANDROID_HOME/tools
set -gx PATH $PATH $ANDROID_HOME/tools/bin

# Java
set -gx JAVA_HOME (/usr/libexec/java_home -v 17)
set -gx PATH $JAVA_HOME/bin $PATH

# Homebrew for Apple Silicon
set -gx PATH "/opt/homebrew/bin" $PATH
EOF
fi

echo "✅ Environment variables configured"

# Install project dependencies
echo "📦 Installing project dependencies..."
cd "/Users/mahbub/Desktop/Others/Home Task/bachelor-mess-client"
npm install

echo "🎉 Setup complete! Please restart your terminal and run:"
echo "1. npm start (to start your Expo project)"
echo "2. Download Android Studio from https://developer.android.com/studio"
echo "3. Create an Android Virtual Device in Android Studio"
echo "4. Run 'npm run android' to test on emulator" 