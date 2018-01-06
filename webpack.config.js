const webpack = require('webpack')
const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const UglifyJSWebpackPlugin = require('uglifyjs-webpack-plugin')

const srcPath = path.resolve(__dirname, 'src')

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
]

if (process.env.NODE_ENV === 'production') {
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
        NODE_ENV: 'production',
      },
    })
  )
}

module.exports = {
  entry: {
    content: './src/content.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        },
        include: [srcPath],
      },
      {
        test: /\.less$/,
        loader: ['style-loader', 'css-loader', 'less-loader'],
        include: [srcPath],
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)(\?[a-z0-9=.]+)?$/,
        loader: 'url-loader?limit=100000',
        include: [srcPath],
      },
    ],
  },
  plugins,
}
