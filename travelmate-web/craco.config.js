const path = require('path');

module.exports = {
  style: {
    postcssOptions: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Remove ForkTsCheckerWebpackPlugin to avoid schema-utils version conflict
      // (react-scripts 5.0.1 + fork-ts-checker-webpack-plugin@6.5.3 schema-utils incompatibility)
      // TypeScript type checking is handled separately via `tsc --noEmit` in CI
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
      );
      return webpackConfig;
    },
  },
};
