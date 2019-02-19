const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const UglifyJSWebpackPlugin = require('uglifyjs-webpack-plugin')
const { CheckerPlugin } = require('awesome-typescript-loader')
const path = require('path')

const srcPath = path.resolve(__dirname, 'src')
const packagesPath = path.resolve(__dirname, 'packages')

const plugins = [
  new CopyWebpackPlugin([
    {
      from: './src/manifest.json',
      to: 'manifest.json',
    },
    {
      from: './src/assets/icons/*',
      to: 'icons/[name].[ext]',
    },
  ]),
  new webpack.SourceMapDevToolPlugin({}),
  new CheckerPlugin(),
]

const IN_PRODUCTION_MODE = process.env.NODE_ENV === 'production'
if (IN_PRODUCTION_MODE) {
  plugins.push(
    new UglifyJSWebpackPlugin({
      cache: true,
      uglifyOptions: {
        ecma: 6,
      },
    })
  )
  plugins.push(
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    })
  )
}

module.exports = {
  entry: {
    content: './src/content.tsx',
  },
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
        test: /\.jsx?$/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        },
        include: [srcPath, packagesPath],
      },
      {
        test: /\.tsx?$/,
        include: [srcPath],
        loader: 'awesome-typescript-loader',
      },
      {
        test: /\.less$/,
        loader: ['style-loader', 'css-loader', 'less-loader'],
        include: [srcPath],
      },
      {
        test: /\.svg$/,
        resourceQuery: /inline/,
        loader: ['url-loader'],
        include: [srcPath],
      },
      {
        test: /\.svg$/,
        resourceQuery: /svgr/,
        loader: ['babel-loader', 'svgr/webpack'],
        include: [srcPath],
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
