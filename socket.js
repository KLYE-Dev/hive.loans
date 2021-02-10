const fs = require("fs");
const cp = require("child_process");
const crypto = require('crypto');
const openpgp = require('openpgp');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const hivejs = require('@hiveio/hive-js');
const {Client,  Signature,  cryptoUtils} = require('@hiveio/dhive');
new Client('https://api.hive.blog');
const log = require('fancy-log');
const io = require("socket.io");
const socket = io();
const {Timer} = require('easytimer.js');
const moment = require('moment');
const geoip = require('geoip-lite');
const schedule = require('node-schedule');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
dotenv.config();
const DB = require('./database/models');
const sequelize = DB.sequelize;
const DataBase = sequelize;
const { Op } = require("sequelize");
const Userdata = DataBase.models.Users;
const Loandata = DataBase.models.Loans;
const Depositdata = DataBase.models.Deposits;
const Withdrawdata = DataBase.models.Withdrawals;
const Chatdata = DataBase.models.Messages;

var fetchUserDBQuery = async(table, name) => {
  log(`SOCKET: fetchUserDBQuery(${table}, ${name})`);
  await DataBase.query("SELECT `" + name + "` FROM `" + table + "`", { type: sequelize.QueryTypes.SELECT}).then(result => {
    log(result);
    return result;
  }).catch(err => {console.log(err)});
}

const oneday = 60 * 60 * 24 * 1000;
log(`INITTIME: One Day is ${oneday}ms`);

var debug = process.env.DEBUG;

var chatHist = [];
var canUserTransact = []; //stores users logged in and if they are permitted to transact - stops a potential to tip and bet at the same time to overwrite balance
var usersInvest = {};
var userSockets = {};
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
//process.env.ACTIVE_PRIVKEY;
//process.env.SITE_ACCOUNT;
const bankwif = process.env.ACTIVE_PRIVKEY;
const appName = process.env.SITE_ACCOUNT;
const sidechainId = process.env.SIDECHAIN_ID;


let hivebtcprice;
let hiveusdprice;
let hiveprice;
let withdrawUSDcost = 0.25; // $0.10 USD withdraw fee


var pricecheck = async() => {
  try {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd&include_market_cap=false')
    .then(res => res.json()).then(json => {
      response = json["hive"];
      response = response["usd"];
      hiveprice = response;
      log(`PRICE: 1 HIVE / $${hiveprice} USD`)
    }).catch(function (error) {
      log("Error: " + error);
    });
  } catch(e) {
    log(`pricefetch error: ${e}`)
  }
};

pricecheck();


async function founders(){
  founderslist = [];
  var votelist = await hivejs.api.callAsync('condenser_api.list_proposal_votes', [['154'], 1000, 'by_proposal_voter']) .then(res => {return res});
  votelist.forEach((item, i) => {
      founderslist.push(item.voter);
  });
  return founderslist;
  //log(founderslist);
}

founders();

setTimeout(function(){
  founders();
}, 1200000);

function jsonBreadCrumb(name, action, payload) {

/*
  var payload = {
    symbol: coin,
    to: req.account,
    quantity: sendAmt,
    memo: req.memo
}
*/
  var sudden_json = {"contractName":`${name}`,"contractAction":`${action}`,"contractPayload": payload};
  sudden_json = JSON.stringify(sudden_json);
  hivejs.broadcast.customJson(bankwif, ['hive.loans'], // requiredAuths (for signing json with active key)
    [], `${sidechainId}.hive.loans`, sudden_json, function(err, result) {
      if(err){
        log(err)
        return log(`CRUMB: Something fucked up! ${err}`)
      }
      if(result) {
        log(`CRUMB: jsonBreadCrumb left on block #${result.block_num}`);
      }
    })//END Broadcast
};//END jsonBreadCrumb


var getHivePower = async(user) => {
  var resultData;
  await hivejs.api.getAccounts([user], async function(err, result) {
    if(err){ console.log(err)}
    if(result){resultData = result;}
    var total_vesting_shares;
    var total_vesting_fund;
    //console.log(resultData);
    resultData = resultData[0];
    var acct = resultData.account;
    var statsBal = resultData.balance;
    var statsBalTop = resultData.balance;
    var statsHBDBal = resultData.hbd_balance;
    var recoverAcct = resultData.recovery_account;
    var hivePower = parseInt(resultData.vesting_shares);
    await hivejs.api.getDynamicGlobalProperties(function(err, result) {
      if(err){console.log(err)}
      total_vesting_shares = parseInt(result.total_vesting_shares);
      total_vesting_fund = parseInt(result.total_vesting_fund_hive);
      hiveVested = ( Number(total_vesting_fund) *  Number(hivePower) ) / Number(total_vesting_shares);
      usersHivePower[user] = hiveVested.toFixed(3);
      log(usersHivePower);
      loanMax = parseFloat(hiveVested * 0.7);
      if(recoverAcct !== 'hive.loans' && recoverAcct !== 'anonsteem' && recoverAcct !== 'beeanon' && recoverAcct !== 'blocktrades') {
        log(`Recovery Account Fucked`);
      } else {
        log(`Recovery Account Fine`);
      }
      return hiveVested.toFixed(3);
    });
  });
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


log("Initializing Blockchain Monitoring...");
var rpcThread = cp.fork(__dirname + '/monitors/chainSnoop.js');
/*EXPERIMENTAL SHIT*/
log("Initializing Loans & Lending Monitoring...");
var loanThread = cp.fork(__dirname + '/monitors/lendEngine.js');

rpcThread.on('message', function(m) {

  m = JSON.parse(m);
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
    var bupdkeys = Object.keys(userSockets);
    for (var i = 0; i< bupdkeys.length;i++){
      if (userSockets[bupdkeys[i]]) {
        userSockets[bupdkeys[i]].emit('latestblock', {block:m.block});
      }
    }
  } else if (m.type === 'depositconfirmed'){
    if (userSockets[m.user]) {
      userSockets[m.user].emit('depositcredit', {balance: m.balance, amount: m.amount, coin: m.coin});
    }
  }

});


loanThread.on('message', function(m) {

  m = JSON.parse(m);
  if (m.type === 'newloanmade'){
    jsonBreadCrumb('contracts', 'newloan', m.payload);
    var newloanmadekeys = Object.keys(userSockets);
    for (var i = 0; i< newloanmadekeys.length;i++){
      if (userSockets[newloanmadekeys[i]]) {
        userSockets[newloanmadekeys[i]].emit('newloanmade', {username: m.user});
      }
    }
  } else if (m.type === 'myloans'){
    //log(`MYLOANS FIRED`)
    //log(m);
    if (userSockets[m.username]) {
      userSockets[m.username].emit('loadedLoans', {loans: m.loans});
    }
  } else if(m.type === 'loancancelled'){
    token = m.token;
    if(m.error == null){
      jsonBreadCrumb('contracts', 'nukeloan', m.payload);
      if (userSockets[m.username]) {
        userSockets[m.username].emit('loannuked', {loanId: m.loanId, error: m.error, token: m.token});
      }
    } else {
      log(`ERROR: ${m.error}`);
    }
  } else if(m.type === 'loadallloans'){
    if (userSockets[m.username]) {
      userSockets[m.username].emit('loadallloans', {loans: m.loans});
    }
  } else if (m.type === 'blockupdate'){
    newCurrentBlock = m.block;
    var blockupdatekeys = Object.keys(userSockets);
    for (var i = 0; i< blockupdatekeys.length;i++){
      if (userSockets[blockupdatekeys[i]]) {
        userSockets[blockupdatekeys[i]].emit('latestblock', {block:m.block});
      }
    }
  } else if (m.type === 'depositconfirmed'){
    if (userSockets[m.user]) {
      userSockets[m.user].emit('depositcredit', {balance: m.balance, amount: m.amount, coin: m.coin});
    }
  }

});


exports = module.exports = function(socket, io){



  socket.on("disconnect", function() {
    console.log('User Disconnect:', socket.request.session['user']);
    delete userSockets[socket.request.session['user']];
    delete userTokens[socket.request.session['user']];
    delete usersHivePower[socket.request.session['user']];
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
      if (req.amount < 1) {
        return cb(`Must Withdraw Atleast 1 ${req.type}`, {token: userTokens[socket.request.session['user']]});
      }
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
      }; //END Balance < Check

      if (userData.hivebalance >= req.amount) {
        userData.hivebalance -= req.amount;
        req.amount = parseInt(req.amount - feecheck);
        saneSendAmount = parseFloat((saneSendAmount - sanefeecheck).toFixed(8));
      }; //END if balance > amount

      sequelize.transaction().then(async function(t) {
        await Userdata.update({hivebalance: userData.hivebalance},{where:{id:`${wduserID}`}})
        .then( async function() {
          async function sendTransfer() {
            hivejs.broadcast.transfer(bankwif, appName, req.account, parseFloat(req.amount / 1000).toFixed(3) + " " + cointype, req.memo, async function (fuckeduptransfer, senttransfer) {
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
      }; //END Balance < Check

      if (userData.hbdbalance >= req.amount) {
        userData.hbdbalance -= req.amount;
        req.amount = parseInt(req.amount - feecheck);
        saneSendAmount = parseFloat((saneSendAmount - sanefeecheck).toFixed(8));
      }; //END if balance > amount

      sequelize.transaction().then(async function(t) {
        await Userdata.update({hbdbalance: userData.hbdbalance},{where:{id:`${wduserID}`}})
        .then( async function() {
          async function sendTransfer() {
            hivejs.broadcast.transfer(bankwif, appName, req.account, parseFloat(req.amount / 1000) + " " + cointype, req.memo, async function (fuckeduptransfer, senttransfer) {
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
        var userident = login.username;
        if(userident === 'klye'){
          log("Admin Login Detected: " + userident);
          socket.emit("adminlogin", userident);
        };

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
    //console.log(`SOCKET.JS openskclink:`);
    //console.log(data);
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
            log(`user not found! Creating user!`);
            if (founderslist.includes(user)){
              noobrank = 'founder';
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

            var resultData;
            await hivejs.api.getAccounts([user], async function(err, result) {
              if(err){ console.log(err)}
              if(result){resultData = result;}

              var total_vesting_shares;
              var total_vesting_fund;

              //console.log(resultData);
              resultData = resultData[0];
              var acct = resultData.account;
              var statsBal = resultData.balance;
              var statsBalTop = resultData.balance;
              var statsHBDBal = resultData.hbd_balance;
              var recoverAcct = resultData.recovery_account;
              var hivePower = parseInt(resultData.vesting_shares);
              await hivejs.api.getDynamicGlobalProperties(function(err, result) {
                if(err){console.log(err)}
                total_vesting_shares = parseInt(result.total_vesting_shares);
                total_vesting_fund = parseInt(result.total_vesting_fund_hive);
                hiveVested = ( Number(total_vesting_fund) *  Number(hivePower) ) / Number(total_vesting_shares);
                usersHivePower[user] = hiveVested.toFixed(3);
                log(usersHivePower);
                loanMax = parseFloat(hiveVested * 0.7);
                if(recoverAcct !== 'hive.loans' && recoverAcct !== 'anonsteem' && recoverAcct !== 'beeanon' && recoverAcct !== 'blocktrades') {
                  log(`Recovery Account Fucked`);
                } else {
                  log(`Recovery Account Fine`);
                }
              });
            });

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
              hivebalance: newloginData.hivebalance,
              hbdbalance: newloginData.hbdbalance,
              hiveprofit: newloginData.hiveprofit,
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

  socket.on('getuserdata', async function(req, cb){
    log(`socket.on('getuserdata'`);
    var user = socket.request.session['user'];
    let userData;
    let userNameCheck = await Userdata.findOne({where:{username:`${user}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (userNameCheck === null) {
      return cb('User was not found in DB', null);
    } else {
      userData = JSON.parse(JSON.stringify(userNameCheck));
      return cb(null, {userdata: userData});
    }
  });

socket.on('getfounders', async function(req, cb){
  return cb(null,{founders:founderslist});
})

async function sendbackersupdate() {
  await Depositdata.findAll({
    limit: 100,
    where: {amount: {[Op.gte]: 100000}},
    order: [[ 'amount', 'DESC' ]],
    raw: true
  }).then(function(entries){
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
          io.emit('backersupdate', {deposits: loadedDeposits});
    })
}

sendbackersupdate();

setInterval(function(){
  sendbackersupdate();
}, 30000);

  socket.on('changenode', function(req) {
    var user = socket.request.session['user'];
    if(user !== 'klye') return log(`${user} tried to change nodes!`);
    if(user == 'klye'){
        rpcThread.send(JSON.stringify({type: 'changenode', username: user}));
    }
  });

  socket.on('createloan', async function(req, cb){
    log(`socket.on('createloan',`)
    log(req);
    var user = socket.request.session['user'];
    var amount = parseInt(req.amount * 1000);
    var days = req.days;
    var fee = req.interest;

    var interest = req.interest;
    if (typeof cb !== 'function') return socket.emit('muppet', {message:'You fucking muppet, you need a callback for this call', token: req.token});
    if (typeof amount != 'number') return cb('Amount Must be a Number!', {token: req.token});
    if (typeof fee != 'number') return cb('Fee Must be a Number!', {token: req.token});
    if (typeof days != 'number') return cb('Days Must be a Number!', {token: req.token});
    if (typeof user != 'string') return cb('Username Specified was Not a String?!', {token: req.token});
    if (!testToken(socket, req.token)) return cb('incorrect token', {token: req.token});
    if (amount < 0) return cb('Amount Must be a Positive Number!', {token: req.token});
    if (fee < 10 ) return cb('Fee Must be a over 10%!', {token: req.token});
    if (days < 7) return cb('Duration Must be 7 or over!', {token: req.token});
    if (days > 91) return cb('Duration Must less than 91!', {token: req.token});

    let userData;
    let userNameCheck = await Userdata.findOne({where:{username:user}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (userNameCheck === null) {
      return cb('User was not found in DB', {token: req.token});
    } else {
      userData = JSON.parse(JSON.stringify(userNameCheck));
      if(userData.rank == 'backer'){
        if (fee > 35 ) return cb('Fee Must be a under 35%!', {token: req.token});
      } else {
        if (fee > 30 ) return cb('Fee Must be a under 30%!', {token: req.token});
      }

      if(amount <= userData.hivebalance){
        log(`LENDING: ${user} creating a new loan - ${amount / 1000} HIVE at ${interest}% for ${days} days!`);
        loanThread.send(JSON.stringify({type:'newloan', userId: userData.id, username: userData.username, amount: amount, days: days, interest: interest, token: req.token}));
        return cb(null, {token: userTokens[user]});
      } else {
        log(`LENDING: ${user} balance too low to create loan!`);
        return cb('Not Enough Balance to Create Loan!', {token: userTokens[user]});
      }
    }
  });//END socket.on createloan


  socket.on('acceptloan', async function(req, cb){
    var loanId = req.loanId;
    var user = socket.request.session['user'];
    log(`socket.on('acceptloan',`)
    log(req);
    var gottenHP = getHivePower(user);
    log(gottenHP);
    var firstpass = (parseFloat(usersHivePower[user]) * 0.7);
    log(firstpass);

    //if (typeof cb !== 'function') return socket.emit('muppet', {message:'You fucking muppet, you need a callback for this call', token: req.token});
    //if (typeof loanId != 'string') return cb('LoanID Specified was Not a String?!', {token: req.token});
    //if (!testToken(socket, req.token)) return cb('incorrect token', {token: req.token});
    //loanThread.send(JSON.stringify({type:'acceptloan', username: user, loanId: loanId, token: req.token}));
  });//END socket.on createloan


  socket.on('infoloan', async function(req, cb){
    var loanId = req.loanId;
    var user = socket.request.session['user'];
    log(`socket.on('infoloan',`)
    log(req);
    var gottenHP = getHivePower(user);
    log(gottenHP);
    var firstpass = (parseFloat(usersHivePower[user]) * 0.7);
    log(firstpass);

    //if (typeof cb !== 'function') return socket.emit('muppet', {message:'You fucking muppet, you need a callback for this call', token: req.token});
    //if (typeof loanId != 'string') return cb('LoanID Specified was Not a String?!', {token: req.token});
    //if (!testToken(socket, req.token)) return cb('incorrect token', {token: req.token});
    loanThread.send(JSON.stringify({type:'infoloan', username: user, loanId: loanId, token: req.token}));
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
    loanThread.send(JSON.stringify({type:'cancelloan', username: user, loanId: loanId, token: req.token}));
    return cb(null, 'Contract Cancel in Progress');
  });//END socket.on createloan


  socket.on("loadmyloans", function(req, cb) {
    var user = socket.request.session['user'];
    loanThread.send(JSON.stringify({type:'loadmyloans', username: user}));
    log(`Fetching users loans`)
    //return cb(null, 'Fetching Users Loans');
  });

  socket.on("loadallloans", function(req, cb) {
    var user = socket.request.session['user'];
    loanThread.send(JSON.stringify({type:'loadallloans', username: user}));
    log(`Fetching all loans`)
    //return cb(null, 'Fetching Users Loans');
  });

  socket.on("getbackers", function(req, cb) {
    var user = socket.request.session['user'];
    loanThread.send(JSON.stringify({type:'loadallloans', username: user}));
    log(`Fetching all loans`)
    //return cb(null, 'Fetching Users Loans');
  });


  socket.on("changepass", function(req, cb) {
    if (typeof cb !== 'function') return socket.emit('muppet', 'You fucking muppet, you need a callback for this call');
    if (typeof req.password != 'string') return cb('Password must be a string', null);
    if (typeof req.newpassword != 'string') return cb('New Password must be a string', null);
    if (!testToken(socket, req.token)) return cb('incorrect token', {token: 0});

    var newLogin = {username: socket.request.session['user'], password: req.password, newpassword: req.newpassword};
    var userLogin = fs.readFile( __dirname + "/db/logins/" + newLogin.username, function(err, data){
      if (err) return cb('DB read error', null);
      data=JSON.parse(data);
      if (isPasswordCorrect(data.password.passwordHash, data.password.salt, newLogin.password)){
        var userData = {
          username: newLogin.username,
          password: hashPassword(newLogin.newpassword),
        }
        fs.writeFile(__dirname + "/db/logins/" + newLogin.username, JSON.stringify(userData), function(err,d){
          if (err) return cb('Save error', null);
          return cb(null, {token: userTokens[socket.request.session['user']]});
        });
      }else{
        return cb('Incorrect Password', null);
      }
    });
  });

  socket.on("chatmessage", function(msg, cb) {
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

  socket.on("showSeeds", function(req, cb){
    if (typeof cb !== 'function') return;
    if (!testToken(socket, req.token)) return cb('incorrect token', {token: 0});

    fs.readFile( __dirname + "/db/seeds/" + socket.request.session['user'], function(err, data){
      if (err) return cb('DB error', null);
      data = JSON.parse(data);
      return cb(null, {token: userTokens[socket.request.session['user']], ssHash: data.ssHash, cs: data.cs, nonce: data.nonce});
    });
  });
  socket.on('updategreed', function(req, cb){
    //console.log(req.leverage);
    if (typeof cb !== 'function') return;
    if (typeof req.leverage !== 'number') return cb('Leverage needs to be a whole number', {token: 0});
    if (!testToken(socket, req.token)) return cb('incorrect token', {token: 0});
    req.leverage = parseInt(req.leverage);
    rpcThread.send(JSON.stringify({type: 'greed', greed: req.leverage, user: socket.request.session['user']}));

    return cb(null, {error: false});
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





/*
socket.on("withdraw"), function(user, bankwif, appName, to, from, amount, currency, message) {
  var withdraw = function (user, bankwif, appName, to, from, amount, currency, message) {

  hivejs.broadcast.transfer(bankwif, appName, to, amount, message, function (fuckeduptransfer, senttransfer) {
		if (fuckeduptransfer) {
			console.log("Withdrawal Transfer Fucked Up: " + fuckeduptransfer);
		};
		if (senttransfer) {
			// Write Sending Users New Balance to Balances File
			fs.writeFile(__dirname + "/db/balances/" + from, JSON.stringify(info), function (err, d) {
				// If User Balance Save to File Fails
				if (err) {
          log("Withdrawal Failed from User: " + user);
				};
				stattype = "tips";
				updatestat(stattype, 1, null);
				console.log("║".blue + logo + " O".green.bold + " DISK".green.bold + " │".blue + " @" + from + " Balance Updated");
			}); // End writefile / balance save
		}; //END senttransfer
	}); //END hivejs.broadcast.transfer
  };//END withdrawfunction
};//END withdraw
*/

process.on('SIGINT', function () {
  log(`Shutting down in 1 seconds, start again with block ${blockNum}`);
  shutdown = true;
  setTimeout(bail, 1000);
});

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function largest(current, newL){
  if (current<newL){
    return newL;
  }
  return current;
}
