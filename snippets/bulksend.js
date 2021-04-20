#! /usr/bin/env node
//^ We need that to have this on CLI applications
let hive = require("@hiveio/hive-js")

const { config } = require("../config/index.js");

let hotwallet = config.hotwallet; //Who to do this from
let coldwallet = config.coldwallet;
let privateActiveKey = config.bankwif; //Private active key
let hiveAccounts = {"rishi556.cold" : 0.25, "giftgiver.wallet" : 0.25} //account:% to send as a decimal
let powerUpAccounts = {"giftgiver" : 0.25, "rishi556.lambo" : 0.25} //account:% to send as a decimal


async function send(reciever, amount){
  hive.broadcast.transfer(privateActiveKey, account, reciever, amount, "memo", (err, result) => { //WIF, from, destination, amount, memo
    if(err){
      console.log(`BULKSEND: ERROR: Transfer to ${amount} to ${reciever} Failed!`);
      return false;
    }
    if (!err){
      console.log(`BULKSEND: Sent ${amount} to ${reciever}!`);
      console.log(result);
      return result;
    }
  })
}

//This does the job of toFixed, but rounds down always
Number.prototype.toFixedDown = function(digits) {
  if(this == 0) {
    return 0;
  }
  var n = this - Math.pow(10, -digits) / 2;
  n += n / Math.pow(2, 53);
  return n.toFixed(digits)
}

module.exports.batchSend = (sendList) => {
  hive.api.getAccounts([account], async(err, result) => { // Array of accounts. We only have one
    if(err){
      console.log(`BULKSEND: ERROR: Failed to Fetch ${account}!`);
    }

    let balance = parseFloat(result[0].balance);

    if (balance < 0){
      console.log(`BULKSEND: ERROR: Insufficient Hot Wallet Balance!`);
      return
    }
    for (user in sendList){
      if(balance < sendList[user]) {
        console.log(`BULKSEND: ERROR: Insufficient Hot Wallet Balance.. Failed to Transfer ${sendList[user]} to ${user}!`);
      }
      var success = await send(user, (balance * sendList[user]).toFixedDown(3) + " HIVE");
      if (success != false) {
        return success;
      } else {
        return false;
      }
    }
  });
}
