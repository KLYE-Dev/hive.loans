const { config } = require("../config/index.js");
let debug = config.debug;
const owner = config.owner;

const fetch = require('node-fetch');
const log = require('fancy-log');

const wcapikey = config.worldcoinkey;
const cmcapikey = config.cmcapikey;
const bncapikey = config.binanceapikey;
const bncapisec = config.binanceapisec;
const CoinMarketCap = require('coinmarketcap-api');
const cmcClient = new CoinMarketCap(cmcapikey);

const coinWhitelist = require("../config/coinWhitelist.json");

function returnTime(){
  var time = new Date();
  //time.toUTCString();
  //time = time.toUTCString();
  //time = time.slice(17, time.length - 4);
  //time = Math.floor(time.getTime() / 1000)
  //time.setHours(time.getHours());
  //time.setMo(time.getHours());
  //time = time.toUTCString();
  //time = time.slice(17, time.length - 4);
  return time;
}

let coin;



module.exports.bncpricecheck = async(coin) => {
  var response = [];
  if(debug === true) log(`priceCheck.js: Binance.com Price Check of ${coin} Called...`);
  if(coin == undefined) {
    coin = "hive";
  } else {
    coin = coin.toLowerCase();
    //log(coinWhitelist);
    //log(coin);
    if(!coinWhitelist.includes(coin)){
      if(debug === true) log(`priceCheck.js: bncpricecheck ${coin} type NOT whitelisted!`);
      return false;
    }
  }
  coin = coin.toUpperCase();
  var bncURL = `https://api.binance.com/api/v3/avgPrice?symbol=${coin}USDT`;

    await fetch(bncURL).then(res => res.json()).then(json => {
      if(debug === true) log(json);
      log(json);
      response.push(json, {date: returnTime()});
    }).catch(function (error) {

      log("priceCheck.js: Error: " + error);
      return false;
    });
    if(response){
      return response;
    }
};


module.exports.cmcpricecheck = async(coin) => {
  if(debug === false) log(`priceCheck.js: CoinMarketCap.com Price Check of ${coin} Called...`);
  var response = [];
  if(coin == undefined) {
    coin = "HIVE";
  } else {
    log(coinWhitelist);
    log(coin);
    if(!coinWhitelist.includes(coin)){
      log(`priceCheck.js: cmcpricecheck ${coin} type NOT whitelisted!`);
      return false;
    }
  }
coin = coin.toUpperCase();
  hivefetchgo = true;
  cmcClient.getQuotes({symbol: `${coin}`}).then(data => {
    data = data.data[`${coin}`];
    //console.log(data);
    var quoteData = data.quote;
    quoteData = quoteData['USD'];
  //console.log(quoteData);
    var pricepayload = {
      name: data.symbol,
      price: quoteData.price,
      total_supply: data.total_supply,
      volume_24h: quoteData.volume_24h,
      percent_change_1h: quoteData.percent_change_1h,
      percent_change_24h: quoteData.percent_change_24h,
      percent_change_7d: quoteData.percent_change_7d,
      percent_change_30d: quoteData.percent_change_30d,
      percent_change_60d: quoteData.percent_change_60d,
      percent_change_90d: quoteData.percent_change_90d,
      market_cap: quoteData.market_cap,
      last_updated: quoteData.last_updated
    };
    response.push(pricepayload);
  }).catch(error => {
    log(`priceCheck.js: error: ${error}`);
    return false;
  });
  if(response) {
    log(response)
    return response;
  }
};
//module.exports.cmcpricecheck = cmcpricecheck(coin);


module.exports.wcpricecheck = async(coin) => {
    var response = [];
      if(debug === true) log(`priceCheck.js: WorldCoinIndex.com Price Check of ${coin} Called...`);
      if(coin == undefined) {
        coin = "hive";
      } else {
        if(debug === true){
          log(coinWhitelist);
          log(coin);
        }
        if(!coinWhitelist.includes(coin)){
          if(debug === true) log(`priceCheck.js: wcpricecheck ${coin} type NOT whitelisted!`);
          return false;
        }
        coin = coin.toLowerCase();
      }

    //`https://www.worldcoinindex.com/apiservice/ticker?key=${wcapikey}&label=${coin}btc-${coin}btc&fiat=btc`;
    var coinworldURL = `https://www.worldcoinindex.com/apiservice/ticker?key=${wcapikey}&label=${coin}usdt-${coin}btc&fiat=usdt"`;
    await fetch(coinworldURL).then(res => res.json()).then(json => {
      json = JSON.parse(JSON.stringify(json));
      json = json.Markets;
      if(debug === true) {
        log(`wcpricecheck`);
        log(json);
      }
      response.push(json, {date: returnTime()});
    }).catch(function (error) {
      log("priceCheck.js: Error: " + error);
      return false;
    });
    if(response){
      return response;
    }
};

//module.exports.wcpricecheck = wcpricecheck(coin);

module.exports.cgpricecheck = async(coin) => {
  var response = [];
  if(debug === true) log(`priceCheck.js: CoinGecko.com Price Check of ${coin} Called...`);
  if(coin == undefined) {
    coin = "hive%2Chive_dollar%2Cbitcoin";
  } else {
    coin = coin.toLowerCase();
    //log(coinWhitelist);
    //log(coin);
    if(!coinWhitelist.includes(coin)){
      if(debug === true) log(`priceCheck.js: cgpricecheck ${coin} type NOT whitelisted!`);
      return false;
    }
  }
  //coin = coin.toLowerCase();
  var coingeckoURL = "https://api.coingecko.com/api/v3/simple/price?ids=" + coin + "&vs_currencies=usd%2Cbtc";

    await fetch(coingeckoURL).then(res => res.json()).then(json => {
      if(debug === true) log(json);
      response.push(json, {date: returnTime()});
    }).catch(function (error) {

      log("priceCheck.js: Error: " + error);
      return false;
    });
    if(response){
      return response;
    }
};

//module.exports.cgpricecheck = cgpricecheck(coin);
