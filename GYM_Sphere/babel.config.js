module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [

      // Add other plugins as needed
      '@babel/plugin-transform-runtime',
      'react-native-reanimated/plugin'
    ]
  };
};