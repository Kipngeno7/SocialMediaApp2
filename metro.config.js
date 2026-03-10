const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// Force Metro to stop using the system's 'watch' syscall 
config.watchFolders = []; 

module.exports = config;
