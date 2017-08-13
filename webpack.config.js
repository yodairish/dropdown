'use strict';

const path = require('path');
const webpack = require('webpack');

const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: './client',
  output: {
    path: path.join(__dirname, 'builds'),
    filename: 'index.js',
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: [ 'css-loader?minimize' ] }),
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('style.css'),
    new webpack.optimize.UglifyJsPlugin(),
  ],
  resolve: {
    modules: [path.resolve(__dirname, 'client')]
  },
};
