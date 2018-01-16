'use strict';

const express = require('express');
const app = express();
const webpackMiddleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const testWebpackConfig = require('../webpack.config.js');
const router = require('./router');
const bodyParser = require('body-parser');

app.set('views', 'test');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.json())
app.get('/test/index.html', function (req, res) {
  res.render('index.html');
});

app.use(router);
app.use(webpackMiddleware(webpack(testWebpackConfig), {
  publicPath: '/test/'
}));

app.listen(8080);

console.log('server is listen at port ', 8080);
console.log('================================');
console.log('visit: http://localhost:8080/test/index.html');
console.log('');
