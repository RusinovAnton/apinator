const path = require('path');
const webpack = require('webpack');
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

module.exports = {
  devtool: 'sourcemap',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist/'),
    filename: 'apinator.js',
    library: 'Apinator',
    libraryExport: 'default',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        enforce: 'pre',
        loader: 'babel-loader',
      }
    ]
  },
  context: __dirname,
  'plugins': [
    new LodashModuleReplacementPlugin,
    // new webpack.optimize.UglifyJsPlugin
  ]
};