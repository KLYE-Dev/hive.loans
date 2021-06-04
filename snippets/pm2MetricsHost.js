var pm2io = require('@pm2/io');
const { config } = require("../config/index.js");

var appSocketList = [];
var writeArray = [];
var writing;

module.exports.RaS = pm2io.meter({
  name: 'Requests a Second',
  type: 'meter',
});

module.exports.appSocketList = pm2io.metric({
  name    : 'appSocketList length',
  value   : function() {
    return Object.keys(appSocketList).length;
  }
});

module.exports.isWritingMetric = pm2io.metric({
  name    : 'Writing to Chain',
  value   : function() {
    return writing;
  }
});

module.exports.writeArrayLengthMetric = pm2io.metric({
  name    : 'writeArray length',
  value   : function() {
    return Object.keys(writeArray).length;
  }
});

module.exports.onlineCounter = pm2io.counter({
  name : 'Users Online'
});

module.exports.webPortMetric = pm2io.metric({
  name    : 'Web Port',
  value   : `${config.port}`
});

module.exports.pm2io;
