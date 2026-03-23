const path = require('path');

// Stub ForkTsCheckerWebpackPlugin before react-scripts loads it.
// fork-ts-checker-webpack-plugin@6.x calls schema_utils_1.default() as a function,
// but schema-utils@3.x exports an object (not a function) -- this throws in the constructor.
// Solution: replace the module cache with a no-op class so the constructor never runs.
// TypeScript checking is handled by `tsc --noEmit` in CI instead.
try {
  const forkTsCheckerPath = require.resolve('fork-ts-checker-webpack-plugin');
  require('fork-ts-checker-webpack-plugin'); // populate cache (require itself is safe)
  function ForkTsCheckerWebpackPlugin() {} // no-op stub
  ForkTsCheckerWebpackPlugin.prototype.apply = function () {};
  require.cache[forkTsCheckerPath].exports = ForkTsCheckerWebpackPlugin;
} catch (_) { /* ignore if not installed */ }

module.exports = {
  style: {
    postcssOptions: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Belt-and-suspenders: also filter any ForkTsCheckerWebpackPlugin instances
      // in case the stub is bypassed or a different instance slips through.
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );
      return webpackConfig;
    },
  },
};
