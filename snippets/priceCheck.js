const fetch = require('node-fetch');
const log = require('fancy-log');
const { config } = require("../config/index.js");

const coinWhitelist = require("../config/coinWhitelist.json");

module.exports.cgpricecheck = async(coin) => {
  var response = [];
  if(config.debug == true) log(`priceCheck.js: CoinGecko.com Price Check of ${coin.toUpperCase()} Called...`);
  if(coin == undefined) {
    coin = "hive";
  } else {
    if(!coinWhitelist.includes(coin)){
      log('priceCheck.js: cgpricecheck coin type NOT whitelisted!');
      return false;
    }
  }
  coin = coin.toLowerCase();
  var coingeckoURL = "https://api.coingecko.com/api/v3/simple/price?ids=" + coin + "&vs_currencies=usd%2Cbtc";
    await fetch(coingeckoURL).then(res => res.json()).then(json => {
      response = [];
      response.push(json);
    }).catch(function (error) {
      log("Error: " + error);
      return false;
    });
    if(response){
      return response;
    }
};
