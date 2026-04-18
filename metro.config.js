const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  server: {
    port: Number(process.env.METRO_PORT) || 8081,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);