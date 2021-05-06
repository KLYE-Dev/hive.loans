const { config } = require("../config/index.js");
const debug = config.debug;
const owner = config.owner;
var crypto = require("crypto");
const log = require("fancy-log");
const DB = require("../database/models");
const sequelize = DB.sequelize;
const DataBase = sequelize;
const { Op } = require("sequelize");
const Userdata = DataBase.models.Users;
const Orderdata = DataBase.models.Orders;

var online = process.connected;
var pid = process.pid;
log(`EXCHANGE: Connected: ${online} with PID: ${pid}`);

process.on('message', async function(m) {
  var dateNow = (new Date).toUTCString();
  let loanData;
  try {
      m = JSON.parse(m);
      if(debug === true){
        log(`exchangeEngine.js Message:`);
        log(m)
      }
      if(m.socketid) {
        sendsocket = m.socketid;
        if(!userSockets.includes(sendsocket)){
          userSockets.push(sendsocket);
        }
      }
  } catch(e) {
    log(`ERROR: ${e}`);
    return console.error(e);
  }
  switch(m.type){
    case 'createorder':

    break;
    case 'cancelorder':

    break;
    case 'processmarketorder':

    break;
    case 'processcancelorder':

    break;
    case 'converttickertostrings':

    break;
    case 'add':

    break;
    case 'exchangeaudit':

    break;
    case 'statuscheck':

    break;
    case 'start':

    break;
    case 'neworderfromorderdb':

    break;
    case 'inittickers':

    break;
    case 'invest':

    break;
    case 'invest':

    break;
    case 'admin':
    if (!m.name) return;
      switch(m.name){
        case 'lock':

        break;
        case 'unlock':

        break;
      }
    break;
  }
});


/*
ssc-mainnet-hive
{
  "contractName": "market",
  "contractAction": "sell",
  "contractPayload": {
    "symbol": "SIM",
    "quantity": "89.000",
    "price": "0.00161171"
  }
}
*/
