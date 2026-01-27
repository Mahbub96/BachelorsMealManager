const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Strip console.* in production builds to avoid GUI output and reduce bundle
if (process.env.NODE_ENV === 'production') {
  config.transformer = config.transformer || {};
  config.transformer.minifierConfig = {
    compress: {
      drop_console: true,
    },
  };
}

module.exports = config;
