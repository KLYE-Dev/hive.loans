const { config } = require("../config/index.js");
let debug = config.debug;
const owner = config.owner;
const log = require('fancy-log');
const CoinMarketCap = require('coinmarketcap-api');
let Price = require("../snippets/priceCheck.js");
const fetch = require('node-fetch');
const apiKey = config.cmcapikey;
const client = new CoinMarketCap(apiKey);

var hivecmcqoute;
var hivefetchgo = false;
var hbdcmcqoute;
var hbdfetchgo = false;
var userSockets = [];

var online = process.connected;
var pid = process.pid;

log(`TICKER: Connected: ${online} with PID: ${pid}`);

var backupfeed = async() => {
  try {
    await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd%2Cbtc')
    .then(res => res.json()).then(json => {
      response = json["hive"];
      var hiveprice = parseFloat(response["usd"]);
      var pricepayload = {
        price: hiveprice,
      };
      process.send(JSON.stringify({
        type: 'massemit',
        name:'hivepriceupdatebackup',
        error: null,
        payload: pricepayload
      }));
    }).catch(function (error) {
      log("Error: " + error);
    });
  } catch(e) {
    log(`pricefetch error: ${e}`)
  }
};

async function hiveCMCprice() {
  hivefetchgo = true;
  client.getQuotes({symbol: 'HIVE'}).then(data => {
    data = data.data['HIVE'];
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

    process.send(JSON.stringify({
      type: 'massemit',
      name:'hivepriceupdate',
      error: null,
      payload: pricepayload
    }));

  }).catch(error => {
    log(`TICKER: ERROR: ${error}`);
    backupfeed();
  });
}

  hiveCMCprice();

setTimeout(function() {
  if(hivefetchgo === false){
    hiveCMCprice();
  }
}, 300000);

process.on("message", function(m){
  var sendsocket;
  try {
      m = JSON.parse(m);
      log(`futuresPrice.js Message:`);
      log(m)
      if(m.socketid) {
        sendsocket = m.socketid;
        if(!userSockets.includes(sendsocket)){
          userSockets.push(sendsocket);
        }
      }
  } catch(e) {
    log(`TICKER: ERROR: ${e}`);
    return console.error(e);
  }
  switch(m.type) {
    case 'hivespotprice':
      hiveCMCprice();
    break;
    case 'hbdspotprice':
      hbdCMCprice();
    break;
  }
});


function hbdCMCprice() {
  client.getQuotes({symbol: 'HBD'}).then(data => {data = JSON.stringify(data.data); log(data
  );}).catch(console.error);
  setTimeout(function() {
    hbdCMCprice();
  }, 300000)
}

  //hbdCMCprice();

process.send({


});
