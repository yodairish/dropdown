'use strict';

const config = require('./webpack.config');

config.output.publicPath = '/builds/';

// Выкидываем минифайр
config.plugins.pop();

module.exports = config;
