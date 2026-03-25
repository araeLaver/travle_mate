const path = require('path');

// Stub ForkTsCheckerWebpackPlugin before react-scripts loads it.
// fork-ts-checker-webpack-plugin@6.x calls schema_utils_1.default() as a function,
// but schema-utils@3.x exports an object (not a function) -- this throws in the constructor.
// With schema-utils@2.x (global override), the default export IS a function, so this stub
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
      // Belt-and-suspenders: also filter any ForkTsCheckerWebpackPlugin instances
      // in case the stub is bypassed or a different instance slips through.
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );

      // Chunk splitting for better caching and smaller initial bundle
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 20,
          minSize: 20000,
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                const packageName = match ? match[1] : 'vendor';
                return `vendor.${packageName.replace('@', '')}`;
              },
              priority: 10,
            },
            framerMotion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'vendor.framer-motion',
              priority: 20,
            },
            firebase: {
              test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
              name: 'vendor.firebase',
              priority: 20,
            },
            ethers: {
              test: /[\\/]node_modules[\\/]ethers[\\/]/,
              name: 'vendor.ethers',
              priority: 20,
            },
          },
        },
      };

      return webpackConfig;
    },
  },
};
