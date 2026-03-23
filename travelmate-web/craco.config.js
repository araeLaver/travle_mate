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
  jest: {
    configure: {
      // react-router-dom v7: main field points to non-existent dist/main.js;
      // Jest 27 (CRA 5) can't parse nested exports conditions and falls back to
      // main → fails. Map directly to the actual CJS builds.
      moduleNameMapper: {
        '^react-router-dom$':
          '<rootDir>/node_modules/react-router-dom/dist/index.js',
        '^react-router/dom$':
          '<rootDir>/node_modules/react-router/dist/development/dom-export.js',
        '^react-router$':
          '<rootDir>/node_modules/react-router/dist/development/index.js',
      },
      // react-router-dom v7+ ships as ESM; allow Jest (Babel) to transform it
      transformIgnorePatterns: [
        '/node_modules/(?!(react-router|react-router-dom|@remix-run)/).+',
      ],
    },
  },
};
