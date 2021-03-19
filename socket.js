const fs = require("fs");
const spawn = require("child_process");
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const hivejs = require('@hiveio/hive-js');
let { pgpKeygenAsync, pgpEncryptAsync, pgpDecryptAsync } = require("./snippets/pgp.js");
const {Client,  Signature,  cryptoUtils} = require('@hiveio/dhive');
new Client('https://api.hive.blog');
const log = require('fancy-log');
const io = require("socket.io");
const socket = io();
const { Timer } = require('easytimer.js');
const moment = require('moment');
const geoip = require('geoip-lite');
const schedule = require('node-schedule');
const fetch = require('node-fetch');
const { config } = require("./config/index.js");
const DB = require('./database/models');
const sequelize = DB.sequelize;
const DataBase = sequelize;
const { Op } = require("sequelize");
const Userdata = DataBase.models.Users;
const Loandata = DataBase.models.Loans;
const Depositdata = DataBase.models.Deposits;
const Withdrawdata = DataBase.models.Withdrawals;
const Chatdata = DataBase.models.Messages;
const Ownkeydata = DataBase.models.Ownerkeys;
const Pricedata = DataBase.models.Pricelog;

log("CHAIN: Initializing Blockchain Monitoring...");
var rpcThread = spawn.fork(__dirname + '/monitors/chainSnoop.js'); //, [], {}
log("USERS: Initializing Users & Accounts Monitoring...");
var userThread = spawn.fork(__dirname + '/monitors/userManager.js'); // , [], {}
log("LOANS: Initializing Loans & Lending Monitoring...");
var loanThread = spawn.fork(__dirname + '/monitors/lendEngine.js'); // , [], {}
log("PRICE: Initializing CoinMarketCap HIVE CHART Price Monitoring...");
var priceThread = spawn.fork(__dirname + '/monitors/futuresPrice.js'); // , [], {}
log("WRITE: Initializing Custom JSON Chain Communication...");
var scribeThread = spawn.fork(__dirname + '/monitors/hiveScribe.js'); // , [], {}
log("WRITE: Initializing Local Hive Smart Chain Node");
var hscThread = spawn.fork(__dirname + '/monitors/hscEVM.js'); // , [], {}


//const oneday = 60 * 60 * 24 * 1000;
//log(`INITTIME: One Day is ${oneday}ms`);

function simpleStringify(object){
    var simpleObject = {};
    for (var prop in object ){
        if (!object.hasOwnProperty(prop)){
            continue;
        }
        if (typeof(object[prop]) == 'object'){
            continue;
        }
        if (typeof(object[prop]) == 'function'){
            continue;
        }
        simpleObject[prop] = object[prop];
    }
    return [simpleObject]; // returns cleaned up JSON
};

hivejs.api.setOptions({ url: "https://api.hivekings.com" });

var chatHist = [];
var canUserTransact = []; //stores users logged in and if they are permitted to transact - stops a potential to tip and bet at the same time to overwrite balance
var usersInvest = {};
var userSockets = {};
var socketList = [];
var userRawSockets = [];
var socketListKeys = Object.keys(socketList);
var usersHivePower = {};
var founderslist = [];
var maxWin = 0;
var bankRoll = 0;
var greedBR = 0;
var siteProfit = 0;
var userTokens = {};
var siteTake = 0;
var siteEarnings;
var newCurrentBlock = 0;
var blockNum = 0;


let hivebtcprice;
let hiveprice;
let hivePriceData = [];
let withdrawUSDcost = 0.25; // $0.10 USD withdraw fee
let contractDeployUSDcost = 0.50;// $0.50 USD contract creation fee
let cancelContractFeePercent = 1;

var labelstack = [];
var datas = [];

var oldprice;
var lastprice;

var priceNonce = 0;

function returnTime(){
  var time = new Date();
  time.setHours(time.getHours() + 18);
  time = (time).toUTCString();
  time = time.slice(17, time.length - 4);
  return time;
}

//https://api.coingecko.com/api/v3/coins/hive?tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false

var pricecheck = async() => {
  try {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd%2Cbtc')
    .then(res => res.json()).then(json => {
      priceNonce++;
      response = json["hive"];
      hiveprice = parseFloat(response["usd"]);
      hivebtcprice = parseFloat(response["btc"]);

      if((priceNonce % 4) == true){
        if(newCurrentBlock == 0) return;
        //log(`Saving HIVE Price at Block #${newCurrentBlock}`);
        Pricedata.create({hiveusdprice: hiveprice, hivebtcprice: hivebtcprice, block: newCurrentBlock});
      }
      var data = response["usd"];

      var labels = returnTime();//.push( Date.now());  //s.push(data);
      hivePriceData.push(data);
      labelstack.push(labels);
      var labelssend = [{labels:[labels]}];
      var datasets = [{data:[data]}];
      //log(hivePriceData);
      var hivePriceDataKeys = Object.keys(hivePriceData);
      //renderChart(hivePriceData, hivePriceDataKeys, "myChart");

      socketListKeys = Object.keys(socketList);
        if(socketListKeys != undefined){
          socketListKeys.forEach((item, i) => {
              //log(`sent priceupdate to ${item}`)
              socketList[item].emit('priceupdate', {hiveusdprice: hiveprice, hivebtcprice: hivebtcprice, datasets, labelssend}); ///to(socketListKeys[i])
          });
        }


      if((hivePriceDataKeys.length > 20) == true){
         hivePriceDataKeys.shift();
         hivePriceData.shift();
      }
      process.stdout.clearLine();
      //log(`PRICE: 1 HIVE / $${hiveprice} USD / ${hivebtcprice} BTC`)
    }).catch(function (error) {
      log("Error: " + error);
    });
  } catch(e) {
    log(`pricefetch error: ${e}`)
  }
};

pricecheck();

var priceCheckTimer = setInterval(function(){
  pricecheck();
}, 15000);

function censor(censor) {
  var i = 0;
  return function(key, value) {
    if(i !== 0 && typeof(censor) === 'object' && typeof(value) == 'object' && censor == value)
      return '[Circular]';
    if(i >= 29) // seems to be a harded maximum of 30 serialized objects?
      return '[Unknown]';
    ++i; // so we know we aren't using the original object anymore
    return value;
  }
}

async function founders(){
  founderslist = [];
  var votelist = await hivejs.api.callAsync('condenser_api.list_proposal_votes', [['154'], 1000, 'by_proposal_voter']) .then(res => {return res});
  votelist.forEach((item, i) => {
    founderslist.push(item.voter);
  });
  return founderslist;
};
founders();

setTimeout(function(){
  founders();
}, 60000);

function jsonBreadCrumb(name, action, payload) {
  log(`jsonBreadCrumb(${name}, ${action}, ${payload})`)

}//END jsonBreadCrumb


async function sendbackersupdate() {
await Depositdata.findAll({
limit: 100,
where: {amount: {[Op.gte]: 100000}},
order: [[ 'amount', 'DESC' ]],
raw: true
}).then(async function(entries){
var loadedDeposits = [];
let cleanedDeposits = entries.map(function(key) {
if (key.id !== -1) {
delete key.id;
}
if (key.userId !== -1) {
delete key.userId;
}
//if (key.username !== -1) {
//    delete key.username;
//}
if (key.borrower !== -1) {
delete key.borrower;
}
if (key.collected !== -1) {
delete key.collected;
}
if (key.currentpayments !== -1) {
delete key.currentpayments;
}
if (key.totalpayments !== -1) {
delete key.totalpayments;
}
if (key.completed !== -1) {
delete key.completed;
}
if (key.confirms !== -1) {
delete key.confirms;
}
if (key.txid !== -1) {
delete key.txid;
}
if (key.confirmed !== -1) {
delete key.confirmed;
}
if (key.coin !== -1) {
delete key.coin;
}
if (key.nextcollect !== -1) {
delete key.nextcollect;
}
if (key.updatedAt !== -1) {
delete key.updatedAt;
}
if (key.createdAt !== -1) {
delete key.createdAt;
}
return key;
});
cleanedDeposits.forEach((item, i) => {
loadedDeposits.push(item);
});
//loadedBets.push(entries);
var updatekeys = Object.keys(userSockets);
for (var i = 0; i< updatekeys.length;i++){
  if (userSockets[updatekeys[i]]) {
    userSockets[updatekeys[i]].emit('backersupdate', {deposits: loadedDeposits});
  }
}
})
}

sendbackersupdate();

//var backerTimer = setInterval(function(){
//sendbackersupdate();
//}, 30000);

async function splitOffVests(a){
  if(a){
    return parseFloat(a.split(' ')[0]);
  }
}


var getHivePower = async(user) => {
  if(!user) return "No User Specified";
    log(`getHivePower Called!`)
    var resultData = await hivejs.api.callAsync('condenser_api.get_accounts', [[`${user}`]]).then((res) => {return JSON.parse(JSON.stringify(res))}).catch((e) => log(e));
    var chainProps = await hivejs.api.callAsync('condenser_api.get_dynamic_global_properties', []).then((res) => {return JSON.parse(JSON.stringify(res))}).catch((e) => log(e));
    var hivePower = await splitOffVests(resultData[0].vesting_shares);
    var total_vesting_shares = await splitOffVests(chainProps.total_vesting_shares);
    var total_vesting_fund = await splitOffVests(chainProps.total_vesting_fund_hive);
    var hiveVested = parseFloat(((total_vesting_fund *  hivePower ) / total_vesting_shares).toFixed(3));
    usersHivePower[user] = hiveVested;
    loanMax = parseFloat(hiveVested * 0.7);
    log(`${user} - ${hiveVested} HP > ${loanMax} HIVE Credit`);
    return hiveVested;
}

var connectiontest = async() => {
  try {
    await sequelize.authenticate();
    log('SUCCESS: Connection to DB been Established!');
  } catch (error) {
    log('ERROR: Unable to Connect to the Database:', error);
  }
}
connectiontest();

rpcThread.on('message', function(m) {
  try {
    m = JSON.parse(m);
    //log(m);
  } catch(e) {
    log(`Chainsnoop Message Error`);
  }

  if (m.type === 'update'){
    usersInvest = m.users;
    maxWin = m.maxWin;
    bankRoll = m.BR;
    greedBR = m.greedBR;
    siteProfit = m.siteProfit;
    siteTake = m.sharesitetake;
    siteEarnings = m.sharesiteearnings;
    var updatekeys = Object.keys(userSockets);
    for (var i = 0; i< updatekeys.length;i++){
      if (userSockets[updatekeys[i]]) {
        userSockets[updatekeys[i]].emit('generalupdate', {siteProfit: siteProfit, sharesitetake: siteTake, sharesiteearnings: siteEarnings, totalwagered: m.totalwagered, totalBets: m.totalBets, greedBR: greedBR, bankroll: bankRoll, maxWin: maxWin, invested: usersInvest[keys[i]]});
      }
    }
  } else if (m.type === 'userRequest'){
    if (userSockets[m.user]) {
      userSockets[m.user].emit('investupdate', {invested: m.invested, greed: m.greed, balance: m.balance, error: null, token: userTokens[m.user]});
    }
  } else if(m.type === 'divest'){
    if (userSockets[m.user]) {
      userSockets[m.user].emit('divestupdate', {invested: m.invested, greed: m.greed, balance: m.balance, error: m.error, token: userTokens[m.user]});
    }
  } else if(m.type === 'greedupdate'){
    if (userSockets[m.user]) {
      userSockets[m.user].emit('greedupdate', {invested: m.invested, greed: m.greed, error: m.error, token: userTokens[m.user]});
    }
  } else if (m.type === 'blockupdate'){
  newCurrentBlock = m.block;
  /*
  var bupdkeys = Object.keys(userSockets);
  if(bupdkeys != undefined){
  for (var i = 0; i< bupdkeys.length;i++){
    if (userSockets[bupdkeys[i]]) {
        userSockets[bupdkeys].emit('latestblock', {block:m.block});
      }
   }
 }
 */
    socketListKeys = Object.keys(socketList);
    if(socketListKeys != undefined){
      socketListKeys.forEach((item, i) => {
          socketList[item].emit('latestblock', {block:m.block}); ///to(socketListKeys[i])
      });
    }
  } else if (m.type === 'depositconfirmed'){
    if (userSockets[m.user]) {
      userSockets[m.user].emit('depositcredit', {balance: m.balance, amount: m.amount, coin: m.coin});
    }
  }

});

userThread.on('message', function(m) {
    try{
      m = JSON.parse(m);
      log(`userThread.on('message' message:`);
      log(m);
    } catch(e){
      log(e)
    }
    switch(m.type){
      case 'emit':
        var name = m.name.toString();
        var socketidparse = m.socketid;
        var socketid = m.socketid[0].id
        var newpayload = [];
        var incomingpayload = m.payload;
        var socketCorrect = socketList[m.socketid[0].id];
        incomingpayload.forEach((item, i) => {
          newpayload.push(item);
        });
        if (socketList[m.socketid[0].id]) socketCorrect.emit(`${name}`, newpayload[0]);
      break;
    }
});//END userThread.on('message',

loanThread.on('message', function(m) {
    try{
      m = JSON.parse(m);
      log(`loanThread.on('message' message:`);
      log(m);
    } catch(e){
      log(e)
    }
    switch(m.type){
      case 'emit':
        var name = m.name.toString();
        var socketidparse = m.socketid;
        var socketCorrect = socketList[m.socketid[0].id];
        var socketid = m.socketid[0].id
        var newpayload = [];
        var incomingpayload = m.payload;
        if(incomingpayload.length > 1){
          incomingpayload.forEach((item, i) => {
            newpayload.push(item);
          });
        } else {
          newpayload = m.payload;
        }

        switch(m.name){
          case 'newloanmade':
            jsonBreadCrumb('contracts', 'newloan', m.payload);
          break;//END case 'newloanmade'
          case 'loannuked':
            jsonBreadCrumb('contracts', 'nukeloan', m.payload);
          break;
        }
        if (socketList[m.socketid[0].id]) socketCorrect.emit(`${name}`, newpayload[0]);
      break;
    }

    if (m.type === 'infoloandata'){
    //log(`MYLOANS FIRED`)
    //log(m);
    if (userSockets[m.username]) {
      userSockets[m.username].emit('infoloandata', {loandata: m.loandata, token: m.token});
    }
  } else if (m.type === 'depositconfirmed'){
    if (userSockets[m.username]) {
      userSockets[m.username].emit('depositcredit', {balance: m.balance, amount: m.amount, coin: m.coin});
    }
  } else if (m.type === 'statereply'){
    if (userSockets[m.username]) {
      userSockets[m.username].emit('statereply', {loanstates: m.loanstates, token: m.token});
    }
  }
});


priceThread.on('message', function(m) {
    try{
      m = JSON.parse(m);
      log(`priceThread.on('message' message:`);
      log(m);
    } catch(e){
      m = JSON.parse(JSON.stringify(m));
    }
    log(`priceThread.on('message' message:`);
    log(m);
    switch(m.type){
      case 'emit':
        var name = m.name.toString();
        var socketidparse = m.socketid;
        var socketCorrect = socketList[m.socketid[0].id];
        var socketid = m.socketid[0].id
        var newpayload = [];
        var incomingpayload = m.payload;
        if(incomingpayload.length > 1){
          incomingpayload.forEach((item, i) => {
            newpayload.push(item);
          });
        } else {
          newpayload = m.payload;
        }
        switch(m.name){
          case 'priceshift':
            jsonBreadCrumb('contracts', 'priceshift', m.payload);
          break;//END case 'newloanmade'
          case 'price':
            jsonBreadCrumb('contracts', 'nukeloan', m.payload);
          break;
        }
        if (socketList[m.socketid[0].id]) socketCorrect.emit(`${name}`, newpayload[0]);
      break;

      case 'massemit':
        var name = m.name.toString();
        var newpayload = [];
        var incomingpayload = [m.payload];
        if(incomingpayload.length > 1){
          incomingpayload.forEach((item, i) => {
            newpayload.push(item);
          });
        } else {
          newpayload = m.payload;
        }
        var masskeys = Object.keys(socketList);
        for (var i = 0; i< masskeys.length;i++){
          if (socketList[masskeys[i]]) {
            socketList[masskeys[i]].emit(`${name}`, newpayload);
          }
        }
      break;
    }

    if (m.type === 'infoloandata'){
    //log(`MYLOANS FIRED`)
    //log(m);
    if (userSockets[m.username]) {
      userSockets[m.username].emit('infoloandata', {loandata: m.loandata, token: m.token});
    }
  } else if (m.type === 'priceerror'){
    if (userSockets[m.username]) {
      userSockets[m.username].emit('depositcredit', {balance: m.balance, amount: m.amount, coin: m.coin});
    }
  }
});



//===================================================
//Start the socket.io stuff
//===================================================
exports = module.exports = function(socket, io){
  if (!socketList.includes(socket)) {
        socketList[socket.id] = socket;
        socketListKeys = Object.keys(socketList);
        log(`SOCKETS: Connected: ${socketListKeys.length}`);
        socket.emit('priceupdate', {hiveusdprice:hiveprice, hivebtcprice: hiveprice});
      } else if (socketList.includes(socket)) {
        socketListKeys = Object.keys(socketList);
        log(`Known Socket detected - length: ${socketList.length}`);
        socket.emit('priceupdate', {hiveusdprice:hiveprice, hivebtcprice: hiveprice});
      } else {
        log(`Not on or Off list wtf`);
      }

      var pricepayload = JSON.stringify({type:'hivespotprice', socketid: simpleStringify(socketList[socket.id])});
      priceThread.send(pricepayload);

/*
var chatpunt = async() => {
  log(`chatpunt fired`)
  var chatHist = await Chatdata.findAll({
    limit: 50,
    order: [[ 'createdAt', 'DESC' ]],
    raw: true
  });
  return socket.emit('chatHistory', {chathist: chatHist, newmsg: "0"});
}
*/


socket.on("disconnect", function() {
  console.log('User Disconnect:', socket.request.session['user']);
  delete userSockets[socket.request.session['user']];
  delete userTokens[socket.request.session['user']];
  delete usersHivePower[socket.request.session['user']];
  delete socketList[socket.id];
  socketListKeys = Object.keys(socketList);
});


socket.on('withdrawopen', async function(req, cb) {
  await pricecheck();
  var user = socket.request.session['user'];
  let userData;
  var rank;
  var fee;
  var type = req.coin.toLowerCase();
  let userCheck = await Userdata.findOne({where:{username:`${user}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
  if (userCheck === null) {
    return cb('Error: Failed to fetch users statistics!', null);
  } else {
    userData = JSON.parse(JSON.stringify(userCheck));//.map(function(userNameCheck){ return userNameCheck.toJSON()});
    rank = userData.rank;
  }
  if (rank == 'user'){
    withdrawUSDcost = 0.25;
  } else if (rank == 'owner'){
    withdrawUSDcost = 0;
  } else if (rank == 'backer'){
    withdrawUSDcost = 0.25;
  } else if (rank == 'benefactor'){
    withdrawUSDcost = 0;
  } else if (rank == 'founder'){
    withdrawUSDcost = 0.125;
  } else {
    withdrawUSDcost = 0.25;
  }


  if (hiveprice == undefined || hiveprice == 0){
    await pricecheck();
    fee = parseFloat((withdrawUSDcost / hiveprice).toFixed(3));
  } else {
    fee = parseFloat((withdrawUSDcost / hiveprice).toFixed(3));
  }
  var feestring = fee.toString();
  var secbytes = crypto.createHash('sha256').update(feestring).digest('hex');
  var withdrawbalance;
  if (type == 'hive'){
    withdrawbalance = (userData.hivebalance / 1000);
  } else if (type == 'hbd') {
    withdrawbalance = (userData.hbdbalance / 1000);
  } else {
    return cb('No Currency Type Specified!', null);
  }
  log(`WITHDRAW: ${socket.request.session['user']} Opened Withdraw Modal`);
  return cb(null, {balance: withdrawbalance, fee: fee, security: secbytes, rank: rank, coin:type});
});

socket.on('withdraw', async function(req, cb) {
  log(`socket.on('withdraw' ${JSON.stringify(req)}`)
  if(typeof req.fee == undefined || req.fee == null){
    req.fee = null;
  }
  log(req)
  var user = socket.request.session['user'];
  var userData;
  var wData;
  var feecheck = req.fee;
  var cointype = req.type.toUpperCase();
  var feecheckstring = feecheck.toString();
  var secbytes;
  var sendtype = req.type.toLowerCase();
  var stealth;
  var senttx;
  var wduserID;
  if(user != 'klye'){
    if (req.amount < req.fee) {
      return cb(`Must Withdraw Atleast 1 ${req.type}`, {token: userTokens[socket.request.session['user']]});
    }
  }
  if (req.amount < 1) {
    return cb(`Must Withdraw Atleast 1 ${req.type}`, {token: userTokens[socket.request.session['user']]});
  }
  if (canUserTransact[user] == true) canUserTransact[user] = false;
  let userCheck = await Userdata.findOne({where:{username:`${user}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
  if (userCheck === null) {
    canUserTransact[user] == true
    return cb('Failed to fetch users statistics!', {token: userTokens[socket.request.session['user']]});
  } else {
    userData = JSON.parse(JSON.stringify(userCheck));//.map(function(userNameCheck){ return userNameCheck.toJSON()});
  }
  wduserID = userData.id;
  //var userDepositTotal = await DepositsData.findAll({where: {userId: userData.id},{attributes: [[sequelize.fn('sum', sequelize.col('amount')), 'totalDepositAmount']], raw:true}});
  //userDepositTotal = userDepositTotal['totalDepositAmount'];
  //log('userDepositTotal:');
  //log(userDepositTotal);


  try{
    feecheckstring = feecheck.toString();
    secbytes = crypto.createHash('sha256').update(feecheckstring).digest('hex');
    log(`secbytes`);
    log(secbytes);
    log(`req.security`);
    log(req.security);
  } catch(e) {
    console.error(e);
    return cb('Fee Amount Security Check Failed!', {token: userTokens[socket.request.session['user']]});
  }

  if(secbytes != req.security){
    return cb('Fee Amount Security Check Failed!', {token: userTokens[socket.request.session['user']]});
  }

  log("WITHDRAW: Transfer to: " + req.account + " - Amount: " + req.amount);
  if (req.amount < feecheck) {
    canUserTransact[user] = true;
    return cb('Tried to Withdraw Less Than Fee!', {token: userTokens[socket.request.session['user']]});
  }
  if (socket.request.session['user'] == undefined) {
    canUserTransact[user] = true;
    return cb('Withdraw User Not Found!', {token: userTokens[socket.request.session['user']]});
  }
  var saneSendAmount = req.amount;
  var sanefeecheck = feecheck;
  feecheck = parseInt(feecheck * 1000);
  req.amount = parseInt(req.amount * 1000);

  if(cointype == 'HIVE') {
    if (userData.hivebalance < req.amount) {
      canUserTransact[user] = true;
      return cb(`Not Enough ${cointype} in Balance!`, {token: userTokens[socket.request.session['user']]});
    } //END Balance < Check

    if (userData.hivebalance >= req.amount) {
      userData.hivebalance -= req.amount;
      req.amount = parseInt(req.amount - feecheck);
      saneSendAmount = parseFloat((saneSendAmount - sanefeecheck).toFixed(8));
    } //END if balance > amount

    sequelize.transaction().then(async function(t) {
      await Userdata.update({hivebalance: userData.hivebalance},{where:{id:`${wduserID}`}})
      .then( async function() {
        async function sendTransfer() {
          hivejs.broadcast.transfer(config.bankwif, config.appName, req.account, parseFloat(req.amount / 1000).toFixed(3) + " " + cointype, req.memo, async function (fuckeduptransfer, senttransfer) {
            if (fuckeduptransfer) {
              console.log("Refund Fucked Up: " + fuckeduptransfer);
              t.rollback();
              return cb('Withdraw Send RPC Command Failed... Please Try Again!', {token: userTokens[socket.request.session['user']]});
            }
            if (senttransfer) {
              log(senttransfer);
              log(`Withdraw Transfer to ${user} of ${parseFloat(req.amount / 1000).toFixed(3)} ${cointype} Sent!`);
              await Withdrawdata.create({userId: userData.id, coin: cointype, username: user, sentto: req.account, amount: req.amount, txid: senttransfer.id, confirmed: true});
              canUserTransact[user] = true;
              t.commit();
              return cb(null, {balance: userData.hivebalance, token: userTokens[socket.request.session['user']]});
            }
          }); //end refund transfer
        }
        await sendTransfer();
      }).catch(function(error) {
        t.rollback();
        console.log(error);
        canUserTransact[user] = true;
        return cb('Withdraw Transaction Failed... Please Try Again!', {token: userTokens[socket.request.session['user']]});
      });
    });
  } else if (cointype == 'HBD') {
    if (userData.hbdbalance < req.amount) {
      canUserTransact[user] = true;
      return cb(`Not Enough ${cointype} in Balance!`, {token: userTokens[socket.request.session['user']]});
    } //END Balance < Check

    if (userData.hbdbalance >= req.amount) {
      userData.hbdbalance -= req.amount;
      req.amount = parseInt(req.amount - feecheck);
      saneSendAmount = parseFloat((saneSendAmount - sanefeecheck).toFixed(8));
    } //END if balance > amount

    sequelize.transaction().then(async function(t) {
      await Userdata.update({hbdbalance: userData.hbdbalance},{where:{id:`${wduserID}`}})
      .then( async function() {
        async function sendTransfer() {
          hivejs.broadcast.transfer(config.bankwif, config.appName, req.account, parseFloat(req.amount / 1000) + " " + cointype, req.memo, async function (fuckeduptransfer, senttransfer) {
            if (fuckeduptransfer) {
              console.log("Refund Fucked Up: " + fuckeduptransfer);
              t.rollback();
              return cb('Withdraw Send RPC Command Failed... Please Try Again!', {token: userTokens[socket.request.session['user']]});
            }
            if (senttransfer) {
              log(senttransfer);
              log(`Withdraw Transfer to ${user} of ${req.amount} ${cointype} Sent!`);
              await Withdrawdata.create({userId: userData.id, coin: cointype, username: user, sentto: req.account, amount: req.amount, txid: senttransfer.id, confirmed: true});                    canUserTransact[user] = true;
              t.commit();
              return cb(null, {balance: userData.hbdbalance, token: userTokens[socket.request.session['user']]});
            }
          }); //end refund transfer
        }
        await sendTransfer();
      }).catch(function(error) {
        t.rollback();
        console.log(error);
        canUserTransact[user] = true;
        return cb('Withdraw Transaction Failed... Please Try Again!', {token: userTokens[socket.request.session['user']]});
      });
    });
  }

}); //END socket.on('withdraw')

socket.on("loginopen", function(req, cb) {
  var token = crypto.randomBytes(64).toString('base64');
  var user;
  var session = socket.request.session;
  if (req.username) user = req.username;
  if(typeof user !== undefined){
    log(`loginopen: ${JSON.stringify(user)}`);
    return cb(null,  );
  } else {
    log(`loginopen user undefined`);
    return cb('Username was not present', null);
  }

});


socket.on("login", async function(req, cb) {
  log(req);
  if (typeof cb !== 'function') return socket.emit('muppet', 'You fucking muppet, you need a callback for this call');
  if (typeof req.username !== 'string') return cb('Username must be a string', null);
  if (typeof req.password !== 'string') return cb('Password must be a string', null);
  if (typeof req['2fa'] !== 'undefined') {
    if (typeof req['2fa'] !== 'string') return cb('2fa must be a string', null);
    if (req['2fa'].length > 32) return cb('What shit you trying to pull?', null);
  }
  var login = {username: req.username};

  let loginData;
  let userNameCheck = await Userdata.findOne({where:{username:login.username}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
  if (userNameCheck === null) {
    return cb('Login Failure - Please Check Your Username & Password!', null);
  } else {
    loginData = JSON.parse(JSON.stringify(userNameCheck));
    if (isPasswordCorrect(loginData.password.passwordHash, loginData.password.salt, login.password)){
      if (typeof data['2fa'] !== 'undefined'){
        if (typeof req['2fa'] === 'undefined') return cb('specify 2fa passcode', null);
        if (!is2FACorrect(req['2fa'], data['2fa'])) return cb('2fa incorrect', null);
      }

      var token = crypto.randomBytes(64).toString('base64');
      var chattoken = crypto.randomBytes(64).toString('base64');

      socket.request.session['user'] = login.username;
      socket.request.session['token'] = token;
      socket.request.session['chattoken'] = chattoken;
      userTokens[login.username] = token;
      userSockets[login.username] = socket;
      userRawSockets[socket.id] = socket;
      var userident = login.username;
      if(userident === 'klye'){
        log("Admin Login Detected: " + userident);
        socket.emit("adminlogin", userident);
      }

      var chatHist = await Chatdata.findAll({
        limit: 50,
        order: [[ 'createdAt', 'DESC' ]],
        raw: true
      });

      socket.emit('chatHistory', {chathist: chatHist, newmsg: "0"});

      return cb(null, {token: userTokens[socket.request.session['user']], invest: usersInvest[socket.request.session['user']], balance: details.balance, ssHash: details.ssHash, cs: details.cs, lastbet: lastbet, chatToken: chattoken});
    }else{
      return cb('Incorrect Password', null);
    }
  }
});


socket.on("openskclink", async function(data, cb) {
  var datasave;
  var user = data.username.toLowerCase();

  if (user == "hive.loans"){
    log(`Idiot tried to log in`);
    return cb(`You don't have proper e-peen for this account.`, null);
  }

  if(canUserTransact.includes(user) == false){
    canUserTransact.push(user);
    canUserTransact[user] = true;
  } else {
    canUserTransact[user] = true;
  }

  var encryptMsg = data.password;
  var login = {
    username: data.username,
    password: data.password
  }
  var clientIp = socket.handshake.headers['x-forwarded-for'];
  var req = data;

  hivejs.api.getAccounts([user], async function(err, result) {
    if (err) {
      canUserTransact[user] = true;
      console.error(err);
      return cb('Hive Keychain Login Failed!');
    }
    if (result) {
      result = result[0];
      result = result['posting'];
      result = result['key_auths'];
      result = result[0][0];
      pubPostingKey = result;

      recoveredPubKey = Signature.fromString(encryptMsg).recover(cryptoUtils.sha256(`#Signed Hive.Loans Identity Verification`));

      if (pubPostingKey == recoveredPubKey.toString()) {
        log(`LOGIN: User Logged In`)
        if (typeof data['2fa'] !== 'undefined') {
          if (typeof req['2fa'] === 'undefined') return cb('Specify 2FA Passcode', null);
          if (!is2FACorrect(req['2fa'], data['2fa'])) return cb('2FA Incorrect', null);
        }
        try {
          var geoLocate = geoip.lookup(clientIp);
          var geoCity = geoLocate.city;
          var geoState = geoLocate.region;
          var geoCountry = geoLocate.country;
          log(`LOGIN: @${login.username} - ${geoCity}, ${geoState}, ${geoCountry} - ${clientIp}`);
        } catch(e){
          log(`LOGIN: Error Geo-Locating IP Address: ${clientIp}`)
        }
        log(`LOGIN: Client Verified HIVE ID.. Checking if User Exists!`);
        let loginData;
        let userNameCheck = await Userdata.findOne({where:{username:user}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
        if (userNameCheck === null) {
          var noobrank = 'user';
          var founderslist = await founders();
          if (user == 'coininstant') noobrank = 'benefactor';
          log(`user not found! Creating user!`);
          if (founderslist.includes(user)){
            noobrank = 'founder';
          }
          if (backerlist.includes(user)){
            noobrank = 'backer';
          }
          var newUserArray = {
            username: user,
            rank: noobrank,
            hivebalance: 0,
            hbdbalance: 0,
            hiveprofit: 0,
            activeloans: 0,
            activelends: 0,
            closedloans: 0,
            closedlends: 0,
            totalloans: 0,
            totallends: 0,
            flags: 0,
          };

          let loginData;
          let uid;
          sequelize.transaction().then(async function(t) {
            await Userdata.create(newUserArray)
            .then(async function() {
              t.commit();
              log(`SOCKET: User ${user} Registered!`);
              let userNameCheck = await Userdata.findOne({where:{username:user}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
              if (userNameCheck === null) {
                log(`Registration Failure - Unable to Locate Newly Registered Account: ${user}`);
              } else {
                loginData = JSON.parse(JSON.stringify(userNameCheck));
                uid = loginData.id;
                if(typeof loginData.userId !== 'number'){
                  log(`loginData.userId is undefined! Updating now!`);
                  await Userdata.update({userId:uid},{where:{id:uid}});
                }
                if(typeof loginData.rank !== 'string'){
                  await Userdata.update({rank:'user'},{where:{id:uid}});
                }
                var newAddyHash = crypto.randomBytes(16).toString('hex');
                if(loginData.address === '0'){
                  log(`loginData.address is undefined! Updating now!`);

                  await Userdata.update({address:newAddyHash},{where:{id:uid}});
                }

                var token = crypto.randomBytes(64).toString('base64');
                var chattoken = crypto.randomBytes(64).toString('base64');

                socket.request.session['user'] = user;
                socket.request.session['token'] = token;
                socket.request.session['chattoken'] = chattoken;
                socket.request.session['uid'] = uid;
                socket.request.session['rank'] = loginData.rank;
                socket.request.session['socketid'] = socket.request.session.id;
                userTokens[login.username] = token;
                userSockets[login.username] = socket;
                userRawSockets[socket.id] = socket;

                var chatHist = await Chatdata.findAll({
                  limit: 50,
                  order: [[ 'createdAt', 'DESC' ]],
                  raw: true
                });



                socket.emit('chatHistory', {chathist: chatHist, newmsg: "0"});

                return cb(null, {
                  token: userTokens[socket.request.session['user']],
                  chatToken: socket.request.session['chattoken'],
                  userId: socket.request.session['uid'],
                  username: socket.request.session['user'],
                  rank: socket.request.session['rank'],
                  socketid: socket.request.session['socketid'],
                  hivebalance: loginData.hivebalance,
                  hbdbalance: loginData.hbdbalance,
                  hiveprofit: loginData.hiveprofit,
                  address: newAddyHash,
                  activeloans: loginData.activeloans,
                  activelends: loginData.activelends,
                  closedloans: loginData.closedloans,
                  closedlends: loginData.closedlends,
                  totalloans: loginData.totalloans,
                  totallends: loginData.totallends,
                  flags: loginData.flags
                });
              }
              jsonBreadCrumb('accounts', 'newuser', {userId: loginData.id, username: loginData.username});
              return cb(null, "Account Registered! Please Login Now!");
            }).catch(function(error) {
              t.rollback();
              console.log(error);
              return cb('Error: Unable to Create Account', null);
            });
          });
        } else if(userNameCheck !== null){

          var newloginData;

          try {
            newloginData = JSON.parse(JSON.stringify(userNameCheck));
          }catch(e){
            log(e);
            newloginData = userNameCheck;
          }

          if(typeof newloginData.userId !== 'number'){
            await Userdata.update({userId:newloginData.id},{where:{id:newloginData.id}});
          }
          if(typeof newloginData.rank !== 'string'){
            await Userdata.update({rank:'user'},{where:{id:newloginData.id}});
          }
          if(newloginData.address === '0'){
            log(`loginData.address is undefined! Updating now!`);
            var newAddyHash = crypto.randomBytes(16).toString('hex');
            await Userdata.update({address:newAddyHash},{where:{id:newloginData.id}});
          }
          var token = crypto.randomBytes(64).toString('base64');
          var chattoken = crypto.randomBytes(64).toString('base64');

          socket.request.session['user'] = user;
          socket.request.session['token'] = token;
          socket.request.session['chattoken'] = chattoken;
          socket.request.session['uid'] = newloginData.id;
          socket.request.session['rank'] = newloginData.rank;
          socket.request.session['socketid'] = socket.request.session.id;
          userTokens[login.username] = token;
          userSockets[login.username] = socket;

          var getLoginHivePower = await getHivePower(user).then(result => {return result}).catch(error => log(error));

          var chatHist = await Chatdata.findAll({
            limit: 50,
            order: [[ 'createdAt', 'DESC' ]],
            raw: true
          });

          socket.emit('chatHistory', {chathist: chatHist, newmsg: "0"});
          //usersHivePower.push(user[getHivePower(user)]);

          return cb(null, {
            token: userTokens[socket.request.session['user']],
            chatToken: socket.request.session['chattoken'],
            userId: socket.request.session['uid'],
            username: socket.request.session['user'],
            rank: socket.request.session['rank'],
            socketid: socket.request.session['socketid'],
            hivebalance: newloginData.hivebalance,
            hbdbalance: newloginData.hbdbalance,
            hiveprofit: newloginData.hiveprofit,
            hivepower: getLoginHivePower,
            address: newloginData.address,
            activeloans: newloginData.activeloans,
            activelends: newloginData.activelends,
            closedloans: newloginData.closedloans,
            closedlends: newloginData.closedlends,
            totalloans: newloginData.totalloans,
            totallends: newloginData.totallends,
            flags: newloginData.flags
          });

        }
      } else {
        log(`openskclink WRONG PASSWORD`);
        return cb('Failed to Login!', null);
      }
    }
    //log(result);
  })
});

socket.on("chatmenu", function(data, cb) {
  var source = socket.request.session['user'];
  //data = JSON.stringify(data);
  if (source === "klye") {
    menu = "admin";
    return cb(null, {
      menu: menu,
      user: data.username,
      source: source
    });
  }

  if (socket.request.session['moderator'] === 1) {
    menu = "moderator";
    return cb(null, {
      menu: menu,
      user: data.username,
      source: source
    });
  } else {
    menu = "user";
    return cb(null, {
      menu: menu,
      user: data.username,
      source: source
    });
  }
}); //END chatmenu

socket.on("loanmenu", function(data, cb) {
  log(`socket.on("loanmenu")`);
  try {
    data = JSON.parse(data.data);
  } catch(e) {
    log(`Failed to parse loanmenu data!`);
  }
  log(data)
  var source = socket.request.session['user'];
  if (source == 'klye') {
    menu = "admin";
    return cb(null, {
      menu: menu,
      user: data.username,
      loanId: data.loanId
    });
  }
  if (socket.request.session['moderator'] === 1) {
    menu = "moderator";
    return cb(null, {
      menu: menu,
      user: data.username,
      loanId: data.loanId
    });
  } else {
    menu = "user";
    return cb(null, {
      menu: menu,
      user: data.username,
      loanId: data.loanId
    });
  }
}); //END chatmenu

socket.on('getuserdata', async function(req, cb){
  log(`socket.on('getuserdata'`);
  var user = socket.request.session['user'];
  let userData;
  let userNameCheck = await Userdata.findOne({where:{username:`${user}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
  if (userNameCheck === null) {
    return cb('User was not found in DB', null);
  } else {
    userData = JSON.parse(JSON.stringify(userNameCheck));
    return cb(null, {data: JSON.stringify(userData)});
  }
});

socket.on('getfounders', async function(req, cb){
  return cb(null, {founders:founderslist});
})

socket.on('changenode', function(req) {
  var user = socket.request.session['user'];
  if(user !== 'klye') return log(`${user} tried to change nodes!`);
  if(user == 'klye'){
    var ltpayload = JSON.stringify({type: 'changenode', username: user});
    rpcThread.send(ltpayload);
  }
});

socket.on('createloan', async function(req, cb){
  log(`socket.on('createloan',`)
  log(req);
  var sitefee;
  var user = socket.request.session['user'];
  var amount = parseInt(req.amount * 1000);
  var days = req.days;
  var fee = req.interest;
  var interest = req.interest;
  if (typeof cb !== 'function') return socket.emit('muppet', {message:'You fucking muppet, you need a callback for this call', token: req.token});
  if (typeof amount != 'number') return cb('Amount Must be a Number!', {token: req.token});
  if (amount < 0) return cb('Amount Must be a Positive Number!', {token: req.token});
  if (typeof fee != 'number') return cb('Fee Must be a Number!', {token: req.token});
  if (typeof user != 'string') return cb('Username Specified was Not a String?!', {token: req.token});


  if (fee < 10 ) return cb('Fee Must be a over 10%!', {token: req.token});
  if (typeof days != 'number') return cb('Days Must be a Number!', {token: req.token});
  if (days < 7) return cb('Duration Must be 7 or over!', {token: req.token});
  if (days > 91) return cb('Duration Must less than 91!', {token: req.token});
  let userData;
  let userNameCheck = await Userdata.findOne({where:{username:user}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
  if (userNameCheck === null) {
    return cb('User was not found in DB', {token: req.token});
  } else {
    userData = JSON.parse(JSON.stringify(userNameCheck));
    switch(userData.rank) {
      case 'backer':
      if (fee > 35 ) return cb('Fee Must be a under 35%!', {token: req.token});
      break;
      case 'founder':
      if (fee > 30 ) return cb('Fee Must be a under 30%!', {token: req.token});
      break;
      case 'owner':
      if (fee > 100 ) return cb('GODMODE: Fee Must be a under 100%!', {token: req.token});
      break;
    }
    if(amount <= userData.hivebalance){
      log(`LENDING: ${user} creating a new loan - ${amount / 1000} HIVE at ${interest}% for ${days} days!`);
      var ltpayload = JSON.stringify({type:'newloan', userId: userData.id, username: userData.username, amount: amount, days: days, interest: interest, token: req.token, socketid: socket.id});
      loanThread.send(ltpayload);



      return cb(null, {token: req.token});
    } else {
      log(`LENDING: ${user} balance too low to create loan!`);
      return cb('Not Enough Balance to Create Loan!', {token: req.token});
    }
  }
});//END socket.on createloan



socket.on('acceptloan', async function(req, cb) {
  var user = socket.request.session['user'];
  //req = JSON.parse(req);
  var gottenHP = await getHivePower(user).then(result => {return result}).catch(error => log(error));
  log(gottenHP);
  if(gottenHP < 10) return cb("Not Enough Hive Power for this Loan!", {token: req.token});
  var loanId;
  var loanFee;
  try {
    req = JSON.parse(JSON.stringify(req));
    loanId = req.loanId;
  } catch (e){
    log(e);
  }
  var userCheckRecovery = async(user) => {
    log(`userCheckRecovery(${user})`);
  await hivejs.api.getAccounts([user], async function(err, result) {
     if(err){console.log(err)}
     if(result) {
       result = JSON.parse(JSON.stringify(result));
       result = result[0];
       var recoverAcct = await result.recovery_account;
       log(recoverAcct)
       if(recoverAcct !== 'hive.loans' && recoverAcct !== 'anonsteem' && recoverAcct !== 'beeanon' && recoverAcct !== 'blocktrades' && recoverAcct !== 'klye') {
         return cb("Your Recovery Account isn't Supported!", {token: req.token});
       } else {
         log(`ACCEPT CONTRACT: Recovery Account Fine`);



           log(`socket.on('acceptloan', async function(req, cb){`)
             log(req);
             let loanData;
             let loanCheck = await Loandata.findOne({where:{loanId:loanId}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
             if (loanCheck === null) {
               return cb("Loan ID was not Found!", {token: req.token});
             } else if (typeof loanCheck !== undefined){
               log(loanCheck);
               loanData = JSON.parse(JSON.stringify(loanCheck));
               log(loanData);
               if(typeof loanData != undefined) log(`loanData != Undefined`);
               if (user == loanData.username) return cb("Are you Trying to Lend to Yourself?", {token: req.token});
               loanData = JSON.parse(JSON.stringify(loanCheck));
               var loanAmount = parseInt(loanData.amount / 1000);
               var pubpgpkey = await pgpKeygenAsync(user);
               gottenHP = await getHivePower(user).then(result => {
                 log(`Users HP:`);
                 log(result);
                 var firstpass = parseFloat(usersHivePower[user] * 0.7);
                 log(`loanAmount:`);
                 log(loanAmount + " HIVE");
                log(`ACCEPT-LOAN: User can Loan up to ${(firstpass).toFixed(3)} HIVE`);
                 if(loanAmount <= firstpass){
                   log(`ACCEPT-LOAN: Loan is Suitable! Sending Account Surrender Panel Now`);

                   return cb(null, {username: user, limit: firstpass, loanId: loanId, loanData: loanData, pgppublic: `${pubpgpkey}`, token: req.token});
                 } else {
                   log(`ACCEPT-LOAN: ERROR: Not enough HIVE Power in Account!`);
                   return cb("Not Enough Hive Power for this Loan!", {token: req.token});
                 }
                 return result
               }).catch(error => {console.log(error)});

             } else {
               log(`loanData.username ==`);
                log(`${loanData.username }`);
             }
       }
     }
   });
  }
  userCheckRecovery(user);
});//END Accept loan


  socket.on('confirmloan', async function(req, cb){
    log(`confirm loan:`);
    log(req);
    var loanId = req.loanId;
    var user = socket.request.session['user'];
    var pgpdata = req.pgp;
    if (typeof cb !== 'function') return socket.emit('muppet', {message:'You fucking muppet, you need a callback for this call', token: req.token});
    if (typeof loanId != 'string') return cb('LoanID Must be a String!', {token: req.token});
    if (typeof user != 'string') return cb('Claiming User Must be a String!', {token: req.token});
    if (typeof pgpdata != 'string') return cb('PGP Encryption is Incorrect', {token: req.token});

    var ltpayload = JSON.stringify({type:'checkkey', username: user, loanId: loanId, pgp: pgpdata, token: req.token, socketid: simpleStringify(socketList[socket.id])});
    userThread.send(ltpayload);
    return cb(null, "Checking the Account Key Provided...");
  });//END socket.on createloan

      socket.on('infoloan', async function(req, cb){
        var loanId = req.loanId;
        var user = socket.request.session['user'];
        log(`socket.on('infoloan',`)
        log(req);
        var gottenHP = passdata;
        log(gottenHP);
        var firstpass = parseFloat((usersHivePower[user]) * 0.7);
        log(firstpass);
        var ltpayload = JSON.stringify({type:'infoloan', username: user, loanId: loanId, token: req.token, socketid: simpleStringify(socketList[socket.id])});
        loanThread.send(ltpayload);
        return cb(null, 'Contract Info Fetching in Progress')
      });//END socket.on createloan


      socket.on('cancelloan', async function(req, cb){
        var loanId = req.loanId;
        var user = socket.request.session['user'];
        log(`socket.on('cancelloan',`)
        log(req);
        //if (typeof cb !== 'function') return socket.emit('muppet', {message:'You fucking muppet, you need a callback for this call', token: req.token});
        //if (typeof loanId != 'string') return cb('LoanID Specified was Not a String?!', {token: req.token});
        //if (!testToken(socket, req.token)) return cb('incorrect token', {token: req.token});
        var ltpayload = JSON.stringify({type:'cancelloan', username: user, loanId: loanId, token: req.token, socketid: simpleStringify(socketList[socket.id])});
        loanThread.send(ltpayload);
      });//END socket.on createloan

      socket.on("getmyactiveloans", function(req, cb) {
        var user = socket.request.session['user'];
        var ltpayload = JSON.stringify({type:'myloanlist', username: req.username, token: req.token, socketid: simpleStringify(socketList[socket.id])});
        loanThread.send(ltpayload);
        log(`Fetching users active loans loans`)
        //return cb(null, 'Fetching Users Loans');
      });

      socket.on("payLoanIdDirect", async function(req, cb) {
        //log(`socket.on("getmyloanlists"`)
        var user = socket.request.session['user'];
        let loanData;
        let loanCheck = await Loandata.findOne({where:{loanId:`${req.loanId}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
        if (loanCheck === null) {
          log(`LOANS: ERROR: Loan ${req.loanId} not found in DB!`);
          return cb(`Loan ${req.loanId} not found in DB!`, {token: req.token});
        } else {
          loanData = JSON.parse(JSON.stringify(loanCheck));
          var loanAmount = parseInt(loanData.amount);
          return cb(null, {username: req.username, loanId: req.loanId, loandata: loanData, token: req.token});
        }
      });

      socket.on("confirmpayLoanIdDirect", async function(req, cb) {
        log(`socket.on("getmyloanlists"`)
        var user = socket.request.session['user'];
        log(req)
        let loanData;
        var uData;
        var paymentAmt = parseInt(req.amount * 1000);
        var contractFinished = false;
        var overpay = 0;
        log(paymentAmt);
        if (typeof cb !== 'function') return socket.emit('muppet', {message:'You fucking muppet, you need a callback for this call', token: req.token});
        if (typeof paymentAmt != 'number') return cb('Amount Must be a Positive Number!', {token: req.token});
        if (paymentAmt < 0) return cb('Amount Must be a Positive Number!', {token: req.token});

        let loanCheck = await Loandata.findOne({where:{loanId:`${req.loanId}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
        if (loanCheck === null) {
          log(`LOANS: ERROR: Loan ${req.loanId} not found in DB!`);
          return cb(`Loan ${req.loanId} not found in DB!`, {token: req.token});
        } else {
          log(`LOANS: Loan ${req.loanId} Found! Grabbing stats`);
          try {
            loanData = JSON.parse(JSON.stringify(loanCheck));
          } catch (e){
            log(`LOANS: Failed to Parse User ${user} loanData!`);
            return cb(`Failed to Fetch Loan Contract Data`, {token: req.token});
          }
          if(user == loanData.user){
            return cb(`Did You Just Try and Accept Your Own Loan?`, {token: req.token});
          }
          var loanAmount = parseInt(loanData.amount);
          var newinterest = (loanData.interest / 100);
          var totalpayments = (loanData.days / 7);
          var totalrepay =  loanData.amount + (loanData.amount * newinterest);
          var outstandingDebt = (totalrepay - loanData.collected);

          let userCheck = await Userdata.findOne({where:{username:`${user}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
          if (userCheck === null) {
            log(`LOANS: ERROR: Borrower ${req.loanId} not found in DB!`);
            return cb(`Borrower not found in DB!`, {token: req.token});
          } else {
            log(`LOANS: User ${user} Found! Grabbing stats`);
            uData = JSON.parse(JSON.stringify(userCheck));
            if(uData.hivebalance >=  paymentAmt){
              uData.hivebalance -= paymentAmt;
              loanData.collected += paymentAmt;
              await Userdata.update({hivebalance: uData.hivebalance},{where:{username:`${user}`}});

            } else {
              log('Error: Not Enough HIVE Balance!');
              return cb('Not Enough HIVE Balance!', {token: req.token});
            }
            if (paymentAmt == outstandingDebt) {
              await Loandata.update({collected: loanData.collected, currentpayments: (loanData.currentpayments + 1), totalpayments: (loanData.totalpayments + 1), active: false, completed: true},{where:{loanId:`${req.loanId}`}});
              log(`LOANS: Lending Contract #${req.loanId} Completed! Returning user ${user}'s Ownership Keys to them! IMPLEMENT THIS`);
              contractFinished = true;
            } else if (paymentAmt < outstandingDebt) {
              await Loandata.update({collected: loanData.collected, currentpayments: (loanData.currentpayments + 1), totalpayments: (loanData.totalpayments + 1), active: true, completed: false},{where:{loanId:`${req.loanId}`}});
              log(`LOANS: Lending Contract #${req.loanId} Updated!`);
            } else if (paymentAmt > outstandingDebt) {
              await Loandata.update({collected: loanData.collected, currentpayments: (loanData.currentpayments + 1), totalpayments: (loanData.totalpayments + 1), active: false, completed: true},{where:{loanId:`${req.loanId}`}});
              overpay = (paymentAmt - outstandingDebt);
              log(`LOANS: Lending Contract #${req.loanId} Completed! Returning user ${user}'s Ownership Keys to them! OVERPAID BY: ${(overpay / 1000)} HIVE`);
              contractFinished = true;
            }
            var lenderData;
            let lenderCheck = await Userdata.findOne({where:{username:`${loanData.username}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
            if (lenderCheck === null) {
              log(`LOANS: ERROR: Lender ${req.loanId} not found in DB!`);
              return cb(`Lender not found in DB!`, {token: req.token});
            } else {
              lenderData = JSON.parse(JSON.stringify(lenderCheck));
              lenderData.hivebalance += paymentAmt;
              lenderData.hiveprofit += paymentAmt;
              if (contractFinished == true) {
                if(lenderData.activelends >= 1){
                  lenderData.activelends--;
                  lenderData.closedlends++;
                }
                await Userdata.update({hivebalance: lenderData.hivebalance, hiveprofit: lenderData.hiveprofit, activelends: lenderData.activelends, closedlends: lenderData.closedlends, totallends: lenderData.totallends},{where:{username:`${loanData.username}`}});
              } else {
                await Userdata.update({hivebalance: lenderData.hivebalance, hiveprofit: lenderData.hiveprofit,  currentpayments: (lenderData.currentpayments + 1), totalpayments: (loanData.totalpayments + 1), active: true, completed: false},{where:{username:`${loanData.username}`}});
              }
              return cb(null, {username: req.username, loanId: req.loanId, loandata: loanData, token: req.token});
            }
            //return cb(null, 'Fetching Users Loans');
          }
        }
      });

      socket.on("walletdata", function(req, cb) {
        var user = socket.request.session['user'];
        var username = req.username;
        if (user != config.owner){
          if(user != username) return cb('You Cannot Look Up That Wallet!', null);
        }
        var ltpayload = JSON.stringify({type:'walletdata', username: username, socketid: simpleStringify(socketList[socket.id])});
        userThread.send(ltpayload);
        log(`Fetching user ${user} wallet data`)
        return cb(null, 'Fetching Wallet Data');
      });

      socket.on("wallethistory", function(req, cb) {
        var user = socket.request.session['user'];
        var ltpayload = JSON.stringify({type:'wallethistory', username: user, socketid: simpleStringify(socketList[socket.id])});
        userThread.send(ltpayload);
        log(`Fetching user ${user} wallet history`)
        return cb(null, 'Fetching Wallet History');
        //return cb(null, 'Fetching Users Loans');
      });

      socket.on("loadmyloans", function(req, cb) {
        var user = socket.request.session['user'];
        var ltpayload = JSON.stringify({type:'loadmyloans', username: user, socketid: simpleStringify(socketList[socket.id])});
        loanThread.send(ltpayload);
        return cb(null, 'Loading Your Lending Contracts');
        log(`Fetching users loans`)
        //return cb(null, 'Fetching Users Loans');
      });
      socket.on("loadallloans", function(req, cb) {
        var user = socket.request.session['user'];
        var ltpayload = JSON.stringify({type:'loadallloans', username: user, socketid: simpleStringify(socketList[socket.id])});
        loanThread.send(ltpayload);
        return cb(null, 'Loading All Lending Contracts');
        log(`Fetching all loans`)
        //return cb(null, 'Fetching Users Loans');
      });

      socket.on("getbackers", function(req, cb) {
        var user = socket.request.session['user'];
        var ltpayload = JSON.stringify({type:'loadallloans', username: user, socketid: simpleStringify(socketList[socket.id])});
        loanThread.send(ltpayload);
        log(`Fetching all loans`)
        //return cb(null, 'Fetching Users Loans');
      });

      socket.on("chatmessage", function(msg, cb) {
        log(msg);
        var user = socket.request.session['user'];
        var uid = socket.request.session['uid'];
        var lvl = socket.request.session['lvl'];
        var rank = socket.request.session['rank'];
        var rando = crypto.randomBytes(6).toString('HEX');
        if (typeof cb !== 'function') return;
        if (typeof msg.message !== 'string') return cb('Send a string you fuck', null);
        if (msg.token !== socket.request.session['chattoken']) return cb('Incorrect Token', null);
        if (msg.message === '') return cb('No Chat Message', null);
        if (msg.message === undefined) return cb('No Chat Message', null);
        if (msg.message === null) return cb('No Chat Message', null);
        if (msg.message.length > 256) return cb('Message Too Long', null);
        if (socket.request.session['muted'] == 1) return cb('You Are Muted & Cannot Chat!', null);

        var m = {
          userId: uid,
          username: user,
          rank: rank,
          lvl: lvl,
          msg: msg.message,
          rng: rando,
          createdAt: (new Date).toUTCString()
        };

        if (m.msg.charAt(0).toLowerCase().indexOf("/") >= 0) {
          m = null;
          return cb(null, true);
        } else {
          if (m === null) {
            return cb(null, true);
          }
          Chatdata.create(m);
          io.emit('chatmessage', m);
        }
        return cb(null, true);
      });

      socket.on('get2fa', function(req, cb){
        if (typeof cb !== 'function') return;
        if (!testToken(socket, req.token))  return cb('incorrect token', {token: 0});

        get2fa(socket.request.session['user'], function(err, code){
          if (err) return cb(err, null);

          if (code) return cb(null, {token: userTokens[socket.request.session['user']], set: true });
          var secret = speakeasy.generateSecret({length: 20});
          socket.request.session['2fa'] = secret.base32;
          QRCode.toDataURL("otpauth://totp/" + socket.request.session['user'] + "-nudies?secret=" + secret.base32, function(err, data_url) {

            return cb(err, {qrcode: data_url, secret: secret.base32, set: false, token: userTokens[socket.request.session['user']]});
          });
        })
      });

      socket.on('set2fa', function(req, cb){
        if (typeof cb !== 'function') return;
        if (typeof req.code !== 'string') return cb('send me a string you tool', {token: 0});
        if (req.code.length>32) return cb('What shit you trying to pull here?', {token: 0});
        if (!testToken(socket, req.token)) return cb('incorrect token', {token: 0});

        var verified = speakeasy.totp.verify({
          secret: socket.request.session['2fa'],
          encoding: 'base32',
          token: req.code
        });
        if (verified){
          save2fa(socket.request.session['2fa'], socket.request.session['user'], function(err, d){
            if (err) return cb('error saving', {token: userTokens[socket.request.session['user']]});
            return cb(null, {token: userTokens[socket.request.session['user']]});
          });

        }else{
          return cb('not correct', null);
        }
      });

      socket.on('del2fa', function(req, cb){
        if (typeof cb !== 'function') return;
        if (typeof req.code !== 'string') return cb('send me a string you tool', {token: 0});
        if (req.code.length>32) return cb('What shit you trying to pull here?', {token: 0});
        if (!testToken(socket, req.token)) return cb('incorrect token', {token: 0});
        var user = socket.request.session['user'];

        fs.readFile( __dirname + "/db/logins/" + user, function(err, data){ //read user data
          if (err) return cb('DB error', null);
          data = JSON.parse(data);
          if (typeof data['2fa'] === 'undefined') return cb('No 2fa set', {token: userTokens[socket.request.session['user']]});
          console.log(req.code, data['2fa']);
          var verified = is2FACorrect(req.code, data['2fa']);

          if (verified){
            delete data['2fa'];
            fs.writeFile(__dirname + "/db/logins/" + user, JSON.stringify(data), function(err,d){
              if (err) return cb('error deleting', {token: userTokens[socket.request.session['user']]});
              return cb(null, {token: userTokens[socket.request.session['user']]});
            });
          }else{
            return cb('not correct', null);
          }

        });
      });
      // END io
    }

    function get2fa(user, cb){
      fs.readFile( __dirname + "/db/logins/" + user, function(err, data){ //read user data
        if (err) return cb(err, null);
        data = JSON.parse(data);
        if (typeof data['2fa'] === 'undefined') return cb(null, false);
        return cb(null, true);
      });
    }

    //save 2FA to users account
    function save2fa(secret, user, cb){
      fs.readFile( __dirname + "/db/logins/" + user, function(err, data){ //read user data
        if (err) return cb(err, null);
        data = JSON.parse(data);
        data['2fa'] = secret;
        fs.writeFile(__dirname + "/db/logins/" + user, JSON.stringify(data), function(err,d){
          if (err) return cb(err, null);
          return cb(null, true);
        });
      });
    }

    //test if a 2FA attempt is valid
    function is2FACorrect(code, secret){
      var verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: code
      });
      return verified;
    }

    //test a token against a users current token
    function testToken(socket, token){
      if ( userTokens[socket.request.session['user']] !== token) return false;
      var token = crypto.randomBytes(64).toString('base64');
      userTokens[socket.request.session['user']] = token;
      return true;
    }

    //create a random base64 token
    function changeToken(user){
      var token = crypto.randomBytes(64).toString('base64');
      if (userTokens[user]) userTokens[user] = token;
      return token;
    }
    //create salt and hash password
    function hashPassword(password) {
      var salt = crypto.randomBytes(64).toString('base64');
      return sha512(password, salt);
    }

    //sha512 of password and salt
    var sha512 = function(password, salt){
      var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
      hash.update(password);
      var value = hash.digest('hex');
      return {
        salt:salt,
        passwordHash:value
      };
    };

    //Check password
    function isPasswordCorrect(savedHash, savedSalt, passwordAttempt) {
      var passwordHash = sha512(passwordAttempt, savedSalt);
      if (passwordHash.passwordHash === savedHash){
        return true;
      }else{
        return false;
      }
    }

    // Function to check letters and numbers
    function alphanumeric(inputtxt) {
      var letterNumber = /^[0-9a-zA-Z]+$/;
      if(inputtxt.match(letterNumber)){
        return true;
      }else {
        return false;
      }
    }

    function largest(current, newL){
      if (current < newL){
        return newL;
      }
      return current;
    }

    function timeout(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    process.on('SIGINT', function () {
      log(`Shutting down in 1 seconds, start again with block ${blockNum}`);
      shutdown = true;
      setTimeout(bail, 1000);
    });
