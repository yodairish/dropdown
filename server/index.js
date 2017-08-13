const express = require('express');
const path = require('path');

const DEV = (process.argv.indexOf('dev') !== -1);

const app = express();

if (DEV) {
  const webpack = require('webpack');
  const config = require('../webpack.config.dev');
  const compile = webpack(config);

  app.use(require('webpack-dev-middleware')(compile, {
    noInfo: true,
    publicPath: config.output.publicPath,
  }));

  app.use(require('webpack-hot-middleware')(compile));
}

// Подключаем api
require('./api')(app);

app.get('/js', function (req, res) {
  console.log('call the api');
});

app.get('/builds/:name', function (req, res) {
  res.sendFile(
    path.resolve(__dirname, `../builds/${ req.params.name }`)
  );
});

app.use('/img', express.static(path.resolve(__dirname, '../img')));

app.get('/', function (req, res) {
  res.sendFile(
    path.resolve(__dirname, '../public/index.html')
  );
});

app.listen(7777, function () {
  console.log('Start the example')
})
