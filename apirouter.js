const io = require("socket.io");
const socket = io();
const log = require('fancy-log');
const { config } = require("./config/index.js");
let { apiroutes, borrowerslist, fetchhiveprice, fetchhivepricehistory, lastAudit } = require("./api.js");
let { urlparser } = require("./snippets/urlparser.js");

process.on('message', async function(m) {
  try {
    if(config.debug == true){
      log(m);
    }
  } catch(e) {
    log(`API-ROUTER: Message Error!`);
    log(e)
  }

  switch (m.type) {
    case 'request':
    var parsedURL = urlparser(m.req['url']);
    log(parsedURL)
    var urlRoute = Object.keys(parsedURL);
      switch(urlRoute[0]) {
        case 'audit':
          var price = await lastAudit();
          process.send(JSON.stringify({
            type: 'response',
            payload: price,
            resnum: m.resnum
          }));
        break;
        case 'hiveprice':
          var price = await fetchhiveprice();
          process.send(JSON.stringify({
            type: 'response',
            payload: price,
            resnum: m.resnum
          }));
        break;
        case 'hivepricehistory':
          var price = await fetchhivepricehistory(parsedURL[urlRoute]);
            process.send(JSON.stringify({
              type: 'response',
              payload: price,
              resnum: m.resnum
            }));
        break;
        case 'borrowers':
          var borrowers = await borrowerslist();
          process.send(JSON.stringify({
            type: 'response',
            payload: borrowers,
            resnum: m.resnum
          }));
        break;
        }//END switch (urlRoute);
    break;
  }//END switch (m.type);
});
