const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const path = require('path')
const Dotenv = require('dotenv-webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const srcPath = path.resolve(__dirname, 'src')
const packagesPath = path.resolve(__dirname, 'packages')

const plugins = [
  new CopyWebpackPlugin([
    {
      from: './src/manifest.json',
      to: 'manifest.json',
      transform(content) {
        const { version, description, author, homepage: homepage_url } = require('./package.json')
        const manifest = JSON.parse(content)
        return JSON.stringify(
          Object.assign(manifest, { version, description, author, homepage_url }),
        )
      },
    },
    {
      from: './src/assets/icons/*',
      to: 'icons/[name].[ext]',
    },
    {
      from: './vscode-icons/icons/*',
      to: 'icons/vscode/[name].[ext]',
    },
    {
      from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js',
      to: 'browser-polyfill.js',
    },
    {
      from: './src/firefox-shim.js',
      to: 'firefox-shim.js',
    },
  ]),
  new ForkTsCheckerWebpackPlugin(),
  new Dotenv(),
  new MiniCssExtractPlugin(),
]

const analyse = process.env.ANALYSE !== undefined
if (analyse) {
  plugins.push(new BundleAnalyzerPlugin())
  console.log(`BundleAnalyzerPlugin added`)
}

const IN_PRODUCTION_MODE = process.env.NODE_ENV === 'production'
plugins.push(
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.VERSION': JSON.stringify(process.env.VERSION),
  }),
)

module.exports = {
  entry: {
    content: './src/content.tsx',
  },
  devtool: IN_PRODUCTION_MODE ? 'source-map' : 'eval-source-map',
  mode: IN_PRODUCTION_MODE ? 'production' : 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: [srcPath, packagesPath, 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        },
        include: [srcPath, packagesPath],
        exclude: /node_modules/,
        sideEffects: false,
      },
      {
        test: /\.scss$/,
        loader: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
        include: [srcPath],
      },
      {
        test: /\.svg$/,
        resourceQuery: /inline/,
        loader: ['url-loader'],
      },
      {
        test: /\.csv$/,
        loader: ['raw-loader'],
      },
      {
        test: /\.json$/,
        loader: ['json-loader'],
        include: [srcPath],
      },
    ],
  },
  plugins,
}
