const path = require('path');

// Stub ForkTsCheckerWebpackPlugin before react-scripts loads it.
// fork-ts-checker-webpack-plugin@6.x calls schema_utils_1.default() as a function,
// but schema-utils@3.x exports an object (not a function) -- this throws in the constructor.
// With the schema-utils shim (resolve.alias below), the default export IS a function, so this stub
// is belt-and-suspenders only. TypeScript checking is handled by `tsc --noEmit` in CI.
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
      // Redirect ALL schema-utils imports (in main thread AND thread-loader workers)
      // to the local shim that satisfies both babel-loader@8.x API (default export as fn)
      // and terser-webpack-plugin@5.x / webpack@5 API (named { validate } export).
      // A require.cache patch on the main thread does NOT propagate into thread-loader
      // worker processes, so resolve.alias is the only correct fix here.
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.alias = webpackConfig.resolve.alias || {};
      webpackConfig.resolve.alias['schema-utils'] = path.resolve(
        __dirname,
        'src/schema-utils-shim.js'
      );

      // Belt-and-suspenders: also filter any ForkTsCheckerWebpackPlugin instances
      // in case the stub is bypassed or a different instance slips through.
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );
      return webpackConfig;
    },
  },
};
