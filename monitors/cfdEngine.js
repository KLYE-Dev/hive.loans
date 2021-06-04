const { config } = require("../config/index.js");
const debug = config.debug;
const owner = config.owner;
const log = require('fancy-log');
let Price = require("../snippets/priceCheck.js");
const DB = require('../database/models');
const sequelize = DB.sequelize;
const DataBase = sequelize;
const { Op } = require("sequelize");
const Userdata = DataBase.models.Users;
const Futuresdata = DataBase.models.Futures;
const coinWhitelist = require("../config/coinWhitelist.json");

var userSockets = [];

var ActiveCFDContracts = [];

var online = process.connected;
var pid = process.pid;
log(`FUTURES: Connected: ${online} with PID: ${pid}`);

var previousHIVEPrice;
var currentHIVEPrice;

var priceChange = function(price) {
  if(!currentHIVEPrice) currentHIVEPrice = price;
  if(!previousHIVEPrice) previousHIVEPrice = price;
  if(currentHIVEPrice < previousHIVEPrice || currentHIVEPrice > previousHIVEPrice) {
    currentHIVEPrice = price;
    previousHIVEPrice = currentHIVEPrice;
    return true;
  } else {
    return false;
  }
}

var checkValidity = async() => {
  var activeOrders = [];
  await Futuresdata.findAll({
     limit: 200,
     where: {active: true},
     order: [[ 'createdAt', 'DESC' ]],
     raw: true
  }).then( async function(entries){
      let validPositions = entries.map(await function(key) {
          if (key.userId !== -1) {
              delete key.userId;
          }
          if (key.username !== -1) {
              delete key.username;
          }
          if (key.coin !== -1) {
              delete key.coin;
          }
          if (key.amount !== -1) {
              delete key.amount;
          }
          if (key.closeprice !== -1) {
              delete key.closeprice;
          }
          if (key.margin !== -1) {
              delete key.margin;
          }
          if (key.profit !== -1) {
              delete key.profit;
          }
          if (key.active !== -1) {
              delete key.active;
          }
          if (key.spreadfee !== -1) {
              delete key.spreadfee;
          }
          if (key.commissionfee !== -1) {
              delete key.commissionfee;
          }
          if (key.overnightfee !== -1) {
              delete key.overnightfee;
          }
          if (key.updatedAt !== -1) {
              delete key.updatedAt;
          }
          if (key.createdAt !== -1) {
              delete key.createdAt;
          }
          if(active === true) {
            if(key.active == false) {
              delete key;
            }
          } else {
            if(key.active == true) {
              delete key;
            }
          }
          return key;
      });

      await validPositions.forEach((item, i) => {
        activeOrders.push(item);
      });
  });
  activeOrders = JSON.parse(JSON.stringify(activeOrders));
  return activeOrders;
};

var getUsersFutures = async(username, active) => {
  if(!username) return false;
  if(!active) active = false;
  var userFutures = [];
  await Futuresdata.findAll({
     limit: 200,
     where: {username: username},
     order: [[ 'createdAt', 'DESC' ]],
     raw: true
  }).then( async function(entries){
      let userPositions = entries.map(await function(key) {
          if (key.id !== -1) {
              delete key.id;
          }
          if (key.userId !== -1) {
              delete key.userId;
          }
          if (key.updatedAt !== -1) {
              delete key.updatedAt;
          }
          if (key.createdAt !== -1) {
              delete key.createdAt;
          }
          if(active === true) {
            if(key.active == false) {
              delete key;
            }
          } else {
            if(key.active == true) {
              delete key;
            }
          }
          return key;
      });

      await userPositions.forEach((item, i) => {
        userFutures.push(item['username']);
      });
  });
  userFutures = JSON.parse(JSON.stringify(userFutures));
  return userFutures;
};


var cgpricecheck = async(coin) => {
  var response = [];
  if(debug == true) log(`FUTURES: CoinGecko.com Price Check of ${coin.toUpperCase()} Called...`);
  if(coin == undefined) {
    coin = "hive";
  } else {
    coin = coin.toLowerCase();
    if(!coinWhitelist.includes(coin)){
      log('FUTURES: cgpricecheck coin type NOT whitelisted!');
      return false;
    }
  }
  var checkPrice = await Price.cgpricecheck(coin).then(await function(res) {
    response.push(res);
  }).catch(fml => {log(`FUTURES: cgpricecheck/checkPrice ERROR: ${fml}`); return false;});
  if(response){
    return response;
  };
};

function killCalc(open, amount, margin, type){
  if(!open) return false;
  if(typeof open !== 'number') return false;
  if(open < 0.000001) return false;
  if(!amount) return false;
  if(typeof amount !== 'number') return false;
  if(amount < 0.001) return false;
  if(!margin) return false;
  if(typeof margin !== 'number') return false;
  if(margin < 1 || margin > 10) return false;
  if(!type) return false;
  if(type !== 'long' || type !== 'short') return false;
}


function spreadProfitCalc(price, amount, margin, type){
  var pricediff;
  var profit;
  if(!price) return false;
  if(typeof price !== 'number') return false;
  if(price < 0.000001) return false;
  if(!amount) return false;
  if(typeof amount !== 'number') return false;
  if(amount < 0.001) return false;
  if(!margin) return false;
  if(typeof margin !== 'number') return false;
  if(margin < 1 || margin > 10) return false;
  if(!type) return false;
  if(type !== 'long' || type !== 'short') return false;

  if(type === 'long') {
    pricediff = price * 0.01;
    profit = pricediff * amount;
  } else if (type === 'short') {
    pricediff = price * 0.01;
    profit = pricediff * amount;
  } else {
    return false;
  }
  return profit;
};


var profitCalc =  function(open, close, amount, margin, type){
  var pricediff;
  var profit;
  if(!open) return false;
  if(typeof open !== 'number') return false;
  if(open < 0.000001) return false;
  if(!close) return false;
  if(typeof close !== 'number') return false;
  if(close < 0.000001) return false;
  if(!amount) return false;
  if(typeof amount !== 'number') return false;
  if(amount < 0.001) return false;
  if(!margin) return false;
  if(typeof margin !== 'number') return false;
  if(margin < 1 || margin > 10) return false;
  if(!type) return false;
  if(type !== 'long' || type !== 'short') return false;

  if(type === 'long') {
    pricediff = open - close;
    profit = pricediff * amount;
  } else if (type === 'short') {
    pricediff = close - open;
    profit = pricediff * amount;
  } else {
    return false;
  }
  return profit;
};

var priceVerify = async(orderPrice, coin) => {
  if(!orderPrice) return false;
  if(typeof orderPrice !== 'number') return false;
  if(orderPrice < 0.000001) return false;
  if(!coin) return false;
  coin = coin.toLowerCase();
  if(!coinWhitelist.includes(coin)){
    log('FUTURES: priceVerify coin type NOT whitelisted!');
    return false;
  }
  var marketPrice = await cgpricecheck(coin);
  marketPrice = marketPrice[0][coin];
  log(`orderPrice:`);
  log(orderPrice);
  log(`marketPrice:`);
  log(marketPrice);
  if(orderPrice === marketPrice) {
    return true;
  } else {
    return false;
  }
}

var liquidationCheck = (data, currentPrice) => {
  if(!data) return false;
  if(!currentPrice) return false;
  if(typeof currentPrice !== 'number') return false;
  if(data.type === 'long'){
    if(data.liquidation <= currentPrice) return true;
  } else if (data.type == 'short'){
    if(data.liquidation >= currentPrice) return true;
  } else {
    return false;
  }
};

var stopLossCheck = (data, currentPrice) => {
  if(!data) return false;
  if(!currentPrice) return false;
  if(typeof currentPrice !== 'number') return false;
  if(data.stoploss){
    if(data.type === 'long'){
      if(data.stoploss >= currentPrice) return true;
    } else if (data.type === 'short'){
      if(data.stoploss <= currentPrice) return true;
    }
    if(data.stoploss <= currentPrice) return true;
  } else {
    return false;
  }
};

process.on('message', async function(m) {
  var dateNow = (new Date).toUTCString();
  let loanData;
  try {
      m = JSON.parse(m);
      if(debug === false){
        log(`cfdEngine.js Message:`);
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
    case 'price':
    log(`PRICE TYPE`)
      if(!m.price) return;
      var PriceChange = priceChange(m.price);
      if (PriceChange == true){

      }
    break;
    case 'update':

    break;
    case 'stats':

    break;
    case 'overnightcheck':

    break;
    case 'open':

    break;
    case 'close':

    break;
    case 'invest':

    break;
    case 'divest':

    break;
    case 'history':

    break;
    case 'active':

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
