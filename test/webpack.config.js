'use strict';

const path = require('path');

module.exports = {
  entry: {
    app: ["./test/main.test.js"]
  },
  output: {
    path: path.resolve(__dirname, "test"),
    publicPath: "/test/",
    filename: "main.test.js"
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  module: {
    rules: [
      {
        test: /test\.js$/,
        use: 'mocha-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/, 
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.less$/, 
        loader: 'style-loader!css-loader!less-loader'
      },
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'stage-0', 'react'],
          plugins: ['transform-decorators-legacy'],
          filename: __filename
        }
      }
    ]
  }
};
