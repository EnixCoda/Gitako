// `.babelrc` is not loaded by babel-loader for files under node_modules, but `babel.config/js` is
module.exports = {
  env: {
    test: {
      plugins: ['babel-plugin-transform-es2015-modules-commonjs'],
    },
  },
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          esmodules: true,
        },
        exclude: [
          '@babel/plugin-transform-async-to-generator',
          '@babel/plugin-proposal-object-rest-spread',
        ],
      },
    ],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  plugins: ['@babel/plugin-proposal-optional-chaining', '@babel/plugin-proposal-class-properties'],
}
