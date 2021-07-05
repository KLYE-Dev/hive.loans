const { config } = require("../config/index.js");
let debug = config.debug;
const owner = config.owner;
const log = require("fancy-log");
const hive = require('@hiveio/hive-js');
const openpgp = require('openpgp');
const { pgpKeygen, pgpEncrypt, pgpDecryptAsync, keyPool } = require("../snippets/pgp.js");
const { GetVotingPower } = require("../snippets/getVotingPower.js");
const DB = require("../database/models");
const sequelize = DB.sequelize;
const DataBase = sequelize;
const { Op } = require("sequelize");
const UserData = DataBase.models.Users;
const OwnkeyData = DataBase.models.Ownerkeys;
const DepositData = DataBase.models.Deposits;
const WithdrawData = DataBase.models.Withdrawals;
const LoanData = DataBase.models.Loans;

hive.api.setOptions({ url: "https://api.deathwing.me" });

var getUserVotingPower = async(user) => {
  if(!user) return "No User Specified";
  if(debug === true) log(`getUserVotingPower = async(${user}) Called!`);
  var vpFetch = await GetVotingPower.fetch(user).then((res) =>{return res}).catch((e) => {return e});
};

var userSockets = [];
async function splitOffVests(a){
  if(a){
    return parseFloat(a.split(' ')[0]);
  }
};

var getHiveDelegations = async(user) => {
  var vestsDelegated = 0;
  var hiveDelegated = 0;
  if(!user) return "No User Specified";
  if(debug === true) log(`getHiveDelegations(${user}) Called!`);
  log(`getHiveDelegations(${user}) Called!`);
  var delegationData = await hive.api.callAsync('condenser_api.get_vesting_delegations', [user, '', 1000]).then((res) => {return JSON.parse(JSON.stringify(res))}).catch((e) => log(e));
  var chainProps = await hive.api.callAsync('condenser_api.get_dynamic_global_properties', []).then((res) => {return JSON.parse(JSON.stringify(res))}).catch((e) => log(e));
  delegationData.forEach(async(item, i) => {
    log(item);
    var rawVests = await splitOffVests(item.vesting_shares);
    vestsDelegated += parseFloat(rawVests);
  });
  var total_vesting_shares = await splitOffVests(chainProps.total_vesting_shares);
  var total_vesting_fund = await splitOffVests(chainProps.total_vesting_fund_hive);
  var hiveDelegated = parseFloat(((total_vesting_fund *  vestsDelegated ) / total_vesting_shares).toFixed(3));
  delegationData.push({hivedelegated: hiveDelegated, vestsdelegated: vestsDelegated});
  if(debug === true) log(`User ${user} has ${hiveDelegated} Hive Delegated!`);
  return delegationData;
  //hive.api.getVestingDelegations(`${user}`, '', 1000, await function(err, result) {
  //  console.log(err, result);
  //});
};//END getHivePower = async(user)

var initgo = 0;
let userlevel;
let oldlevel;
let degenearned = 0;

function getUserLevel(exp){
  return (Math.floor(exp / 1000));
};

function nextLevel(e){
  var level = parseInt(e * 1000);
  var exponent = 0;
  var baseXP = 1000;
  var nextlevel = (Math.floor(baseXP * ((e + 1) ^ exponent)) / 1000);
  return nextlevel;
};

function expSaver(exp) {
  var thisexp = exp;
  if(thisexp > lastexp){
    lastexp = exp;
    return exp;
  } else {
    return lastexp;
  }
};

function priorEarned (lvl){
  lvl = parseInt(lvl);
  lvl = Math.floor((lvl * lvl) / 2);
  return lvl;
};

var nska = [];
// valid operations example (vote): [['vote', {voter: 'sisilafamille', author: 'siol', permlink: 'test', weight: 1000}]]
async function multiSigOp(op, signingkeyarray){
  if(!op) return false;
  if(!ska) return false;
  nska = [];
  signingkeyarray.forEach((item, i) => {
    nska.push(item);
  });


  hive.broadcast.send({
    extensions: [],
    operations: [
      ['vote', {
        voter: 'sisilafamille',
        author: 'siol',
        permlink: 'test',
        weight: 1000
      }]
    ]}, [nska], (err, result) => {
      console.log(err, result);
    });

  };//END multiSigOp

function diminishing_returns(val, scale) {
  if(val < 0)
  return -diminishing_returns(-val, scale);
  var mult = val / scale;
  var trinum = (Math.sqrt(8.0 * mult + 1.0) - 1.0) / 2.0;
  return parseInt(trinum * scale);
};

//The Super top secret xp adding / leveling algorythm
function acctXPAdd(data) {
  if(!data) return log(`USERS: ERROR: Variable 'data' is Undefined!`);
  console.log(`+++++++++++\n acctXPAdd called! \n++++++++++++++`);
  if(debug === false) {
    log(`acctXPAdd(data):`);
  }
  var nextlevelexp;
  let lastexp = 0;
  var reallimit;
  var UserMod = data.moderator;
  var UserRank = data.rank;
  var UserLvL = data.level;
  var UserXP = data.xp;
  var UserXPBonus = data.xpmulti;
  var UserSiteRank = data.siterank;
  var UserDisclaimer = data.disclaimer;
  var TotalHiveProfit = () => {
    try {
    var rawInt = parseInt(data.hiveprofit) / 1000;
    } catch(e){
      return showErr(`${e}`);
    }
    if(rawInt > 0) {
      rawInt = parseInt(data.hiveprofit) * 1;
    } else {
      rawInt = Math.abs(parseInt(data.hiveprofit)) * 1;
    }
    return rawInt;
  }
  var UserShares = parseInt(data.shares);
  var UserShareProfit = parseInt(data.shareprofit) / 1000;
  var UserInvested = parseInt(data.invested) / 1000;
  var UserSiteDelegation = parseInt(data.sitedelegation) / 1000;
  //withdrawal stuff
  var CountUserWd = parseInt(data.withdrawals);
  var TotalUserWd = parseInt(data.withdrawalstotal) / 1000;
  var TotalUserWdFees = parseInt(data.withdrawalsfee) / 1000;

  //deposit stuff
  var CountUserDp = parseInt(data.deposits);
  var TotalUserDp = parseInt(data.depositstotal) / 1000;
  var TotalCFDProfit  = () => {
    try {
    var rawInt = parseInt(data.cfdprofit) / 1000;
    } catch(e){
      return showErr(`${e}`);
    }
    if(rawInt > 0) {
      rawInt = parseInt(data.cfdprofit) * 20;
    } else {
      rawInt = Math.abs(parseInt(data.cfdprofit) * 10);
    }
    return rawInt;
  }
  var TotalCFDTrade = parseInt(data.totalcfdtrade) / 1000;
  var TotalCFDFee = parseInt(data.feescfdtrade) / 1000;

  var TotalShareProfit = parseInt(data.shareprofit) / 1000;
  var TotalLoans = parseInt(data.totalloans) / 1000;
  var TotalLoansFee = parseInt(data.feesloans) / 1000;
  var TotalLends = parseInt(data.totallends) / 1000;
  var TotalLendsFee = parseInt(data.feeslends) / 1000;
  var TotalFees = parseInt(data.totalfees) / 1000;

  //super sketchy price estimates to generate account xp values... probably needs a rewrite..
  var LoansLvL = parseInt((TotalLoans * 1) + (TotalLoansFee * 1) + (TotalLends * 1 ) + (TotalLoansFee * 1) + (TotalHiveProfit * 1));
  if(debug === false) log(`USERS: DEBUG - LoansLvL: ${LoansLvL}`);
  var CFDLvL = parseInt((TotalCFDProfit * 1) + (TotalCFDTrade * 1) + (TotalCFDFee * 1)); //+ (totalBigWinDegen * 0.00000006)
  if(debug === false) log(`USERS: DEBUG - LoansLvL: ${LoansLvL}`);
  var TraderLvL =  parseInt((totalBigLossHive * 0.0000001) + (totalBigLossHbd * 0.000001) + (totalBigLossPal * 0.00000005) + (totalBigLossBros * 0.00000003) + (totalBigLossNeoxag * 0.00000003) + (totalBigLossArchon * 0.00000007)); //+ (totalBigLossDegen * 0.00000006)
  if(debug === false) log(`USERS: DEBUG - TraderLvL: ${TraderLvL}`);
  var WalletLvL = parseInt();
  if(debug === false) log(`USERS: DEBUG - WalletLvL: ${WalletLvL}`);
  var exp = Number((loanslevel + cfdlevel + traderlevel + walletlevel) * 1).toFixed(0) //Number((betslevel + wageredlevel + profitlevel + bigwinlevel + biglosslevel)).toFixed(2)
  if(exp <= 0){
    exp = 1;
  }
  exp = expSaver(exp);
  exp = diminishing_returns(exp, 1000)

  userlevel = getUserLevel(exp);
  nextlevelexp = parseInt(nextLevel(userlevel) * 1000);

  if(nextlevelexp < 1000){
    log(`nextlevelexp == 0`)
    userlevel = 1;
    nextlevelexp = parseInt(nextLevel(userlevel) * 1000);
  }

  var lastlevelcutoff = parseInt(nextLevel((userlevel - 1)) * 1000)
  var nextlevelcutoff = parseInt(nextLevel((userlevel)) * 1000)

  if(userlevel >= oldlevel){
    var powerlevel = parseInt(userlevel - oldlevel);
    setTimeout(function() {
      //let powerlevel = varDiff(userlevel, oldlevelsave);
      let oldlevelsave = oldlevel;
      //log(powerlevel);
      if(powerlevel == 0){
        log(`LEVEL-UP: ${socket.request.session['user']} leveled up: ${userlevel}`);
        socket.request.session['level'] = userlevel;
        io.emit('levelup', {
          user: socket.request.session['user'],
          level: userlevel,
          nextlevel: nextlevelexp,
          reward: userlevel,
          date: (new Date).toUTCString()
        });
      }
      if(powerlevel > 0){
        log(`POWER-LEVEL-UP: @${socket.request.session['user']}(lvl ${userlevel}) Gained ${powerlevel} Levels!`);
        io.emit('powerlevelup', {
          user: socket.request.session['user'],
          level: userlevel,
          nextlevel: nextlevelexp,
          powerlevel: powerlevel,
          oldlevel: oldlevelsave,
          reward: parseInt(priorEarned(userlevel) - priorEarned(oldlevelsave)),
          date: (new Date).toUTCString()
        });
        socket.emit('powerreward',{
          amount: powerlevel
        });
        //deposit(parseInt(powerlevel * 100000000), socket.request.session['user'], "degen");
      }
      dailylevels = parseInt(dailylevels + powerlevel);
      dailydegen = parseInt(dailydegen) + parseInt(priorEarned(userlevel) - priorEarned(oldlevelsave));
      //  }, 100);
    }, 200);
  }

  var percentTillLvL;

  if(userlevel == 0){
    nextlevelexp = parseInt(nextLevel(userlevel + 1) * 1000);
    userlevel = 1;
    lastlevelcutoff = nextlevelexp;
    percentTillLvL = relDiff((lastlevelcutoff), (nextlevelexp - exp)).toFixed(2);
    degenearned = priorEarned(userlevel);
  } else if(userlevel == 1){
    nextlevelexp = parseInt(nextLevel(userlevel) * 1000);
    oldlevel = Math.ceil(exp / 1000);
    lastlevelcutoff = nextlevelexp;
    percentTillLvL = relDiff((lastlevelcutoff), (nextlevelexp - exp)).toFixed(2);
    degenearned = priorEarned(userlevel - 1);
  } else {
    oldlevel = Math.ceil(exp / 1000);
    percentTillLvL = relDiff((exp - nextlevelexp), (lastlevelcutoff - nextlevelexp)).toFixed(2);
    degenearned = priorEarned(userlevel);
  }
  // socket.request.session['level'] = userlevel;

  var difference = parseInt(exp - nextlevelexp);
  //log(`lvl:${userlevel} ${exp} / ${nextlevelexp} - ${percentTillLvL}%`)
  if(parseInt(percentTillLvL) >= 100){
    //    log(percentTillLvL)
    percentTillLvL = 100;
  }

  //if()

  var expinfo = {
    exp: exp,
    lvl: userlevel,
    nextlvlup: parseInt(nextLevel(userlevel) * 1000),
    width: percentTillLvL,
    earned: degenearned
  }

  return expinfo;
};


var wdfeetotal = 0;
async function fetchAuditWithdrawFees() {
  wdfeetotal = 0;
  var wdDataTotal = await WithdrawData.findAll({
    where:{ fee: {
      [Op.gt]: 0
    }},
    raw: true
  }).then(async function(entries){
    var wdChecked = entries.map(function(key) {
      if (key.fee !== -1) {
        wdfeetotal += parseInt(key.fee);
      };
    });
    return wdfeetotal;
  });
};

process.on('message', async function(m) {
  var messageType;
  var sendsocket;
  var userCheck;
  var yuData;

  try {
    m = JSON.parse(m);
    if(config.debug === true){
      log(`userManager.js Message:`);
      log(m);
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
  }//END try/catch

  switch(m.type) {
    case 'wdfeeaudit':
    var fees;
    fees = await fetchAuditWithdrawFees();
    if(!fees) {
      process.send(JSON.stringify({
        type:'massemit',
        name:'wdfeeaudit',
        socketid: m.socketid,
        error: `Failed to Fetch Withdraw Fee Audit`,
        payload: null
      }));
    } else if(fees) {
      process.send(JSON.stringify({
        type:'massemit',
        name:'wdfeeaudit',
        socketid: m.socketid,
        payload: [wdfeetotal]
      }));
    } else {
      process.send(JSON.stringify({
        type:'massemit',
        name:'wdfeeaudit',
        socketid: m.socketid,
        error: `Failed to Fetch Withdraw Fee Audit`,
        payload: null
      }));
    };
    break;//END wdfeeaudit
    ////////////////////////////////////////////////////
    case 'walletdata':
    async function grabwallet() {
      var userCheck = await UserData.findOne({where:{username:`${m.username}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
      if (userCheck === null) {
        return log(`USERS: ERROR: User ${m.username} not found in DB!`);
      } else {
        log(`USERS: User ${m.username} Data Found!`);
        var yuData = JSON.parse(JSON.stringify(userCheck));
        process.send(JSON.stringify({
          type:'emit',
          name:'walletdata',
          socketid: m.socketid,
          payload: [yuData]
        }));
      }
    }
    await grabwallet();
    break;//END walletdata
    //////////////////////////////////////////////////////////////
    case 'wallethistory':
    var walletHistoryArray = [];
    var withData;
    var depoData;
    var grabbed = false;
    var dg = false;
    var wg = false;
    async function loadAllWithdrawals(){
      await WithdrawData.findAll({
        limit: 200,
        where: {username:`${m.username}`},
        order: [[ 'createdAt', 'DESC' ]],
        raw: true
      }).then(function(entries){
        withData = [];
        let cleanedwiths = entries.map(function(key) {
          delete key.id;
          delete key.userId;
          delete key.username;
          delete key.coin;
          delete key.confirms;
          delete key.confirmedtxid;
          delete key.confirmedblock;
          delete key.updatedAt;
          delete key.createdAt;
          return key;
        });
        cleanedwiths.forEach((item, i) => {
          //withData.push(item);
          walletHistoryArray.push(item);
        });

        //process.send(JSON.stringify({type: 'loadallloans', username: m.username, loans: loadedLoans}));
      });
    }
    await loadAllWithdrawals();

    async function loadAllDeposits(){
      await DepositData.findAll({
        limit: 200,
        where:{username:`${m.username}`},
        order: [[ 'createdAt', 'DESC' ]],
        raw: true
      }).then(function(entries){
        depoData = [];
        let cleaneddeps = entries.map(function(key) {
          delete key.id;
          delete key.userId;
          delete key.username;
          delete key.coin;
          delete key.confirms;
          delete key.updatedAt;
          delete key.createdAt;
          return key;
        });
        cleaneddeps.forEach((item, i) => {
          //depoData.push(item);
          walletHistoryArray.push(item);
        });

      });
    };
    await loadAllDeposits();

    /*

    async function dph() {
    var userdpCheck = await DepositData.findAll({where:{username:`${m.username}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (userdpCheck === null) {
    log(`USERS: ERROR: User ${m.username} not found in Deposit DB!`);
    return dg = true;
  } else {
  log(`USERS: User ${m.username} Deposit Data Found!`);
  depoData = userdpCheck;
  walletHistoryArray.push(depoData);
  return dg = true;
}
}

async function wdh() {
var userwdCheck = await WithdrawData.findAll({where:{username:`${m.username}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
if (userwdCheck === null) {
log(`USERS: ERROR: User ${m.username} not found in Withdraw DB!`);
return wg = true;
} else {
log(`USERS: User ${m.username} Withdraw Data Found!`);
withData = userwdCheck;
walletHistoryArray.push(withData);
return wg = true;
}
await dph();
}
await wdh();
*/

if(walletHistoryArray.length > 0) {
  process.send(JSON.stringify({
    type:'emit',
    name:'wallethistory',
    socketid: m.socketid,
    payload: walletHistoryArray
  }));
}
break;//END wallethistory
/////////////////////////////////////////////////////////////////////
case 'acctupdate':
if(!m.wifkey) return;
if(!m.user) return;
if(!m.ownerKey) return;
if(!m.jsonMetadata) return;
    hive.broadcast.accountUpdate(wif, account, owner, active, posting, memoKey, jsonMetadata, function(err, result) {
      console.log(err, result);
});
break;//END
////////////////////////////////////////////////////////////////////////////////////
case 'gethivepower':
var hivePower = await getHivePower(m.user);
process.send(JSON.stringify({
  type:'emit',
  name:'gethivepower',
  socketid: m.socketid,
  payload: [hivePower]
}));
break;
////////////////////////////////////////////////////////////////////////////////////
case 'swapuserskeys':
var ownerKeySwap = async (userName, ownerKey, loanId, jsonMetadata) => {
  if(userName == undefined) {
    log(`userName not specified!`);
    t.rollback();
    return cb('userName not specified!', {token:req.token});
  }
  if(ownerKey == undefined) {
    log(`ownerKey not specified!`);
    t.rollback();
    return cb('ownerKey not specified!', {token:req.token});
  }
  if(loanId == undefined) {
    log(`loanId not specified!`);
    t.rollback();
    return cb('loanId not specified!', {token:req.token});
  }

  if(jsonMetadata == undefined) {
    log(`jsonMetadata not specified!`);
    t.rollback();
    return cb('jsonMetadata not specified!', {token:req.token});
  }
  var currentOwnerKey = ownerKey;
  var suggestedPassword = hive.formatter.createSuggestedPassword(); // createSuggestedPassword is 32 characters in length
  var newPassword = 'P' + hive.auth.toWif(suggestedPassword); // add P, convert SuggestedPassword to WIF
  var newKeys = hive.auth.getPrivateKeys(userName, newPassword, ['owner', 'active', 'posting', 'memo']); // get the private and public keys
  // SAVE THIS OUTPUT INFORMATION AND DO NOT LOSE IT
  var newKeyJSON = `[{"username":"${user}","currentOwnerKey":"${currentOwnerKey}","newPassword":"${newPassword}","newKeys":${JSON.stringify(newKeys)}}]`;
  newKeyJSON = JSON.stringify(JSON.parse(newKeyJSON));
  console.log(`[{"username":"${user}","currentOwnerKey":"${currentOwnerKey}","newPassword":"${newPassword}","newKeys":${JSON.stringify(newKeys)}}]`);
  console.log(`
    Current owner key : ${currentOwnerKey}
    New password      : ${newPassword}
    New keys          : ${JSON.stringify(newKeys, null, 1)}`);
    var owner = {weight_threshold: 1, account_auths: [], key_auths: [[newKeys.ownerPubkey, 1]]};
    var active = {weight_threshold: 1, account_auths: [], key_auths: [[newKeys.activePubkey, 1]]};
    var posting = {weight_threshold: 1, account_auths: [], key_auths: [[newKeys.postingPubkey, 1]]};
    var memo = newKeys.memoPubkey;
    var newjsonMetadata = jsonMetadata;

    var keychainfile = {
      "list":
      [{
        "name":`${user}`,
        "keys":{
          "posting":`${newKeys.posting}`,
          "postingPubkey":`${newKeys.postingPubkey[1]}`,
          "active":`${newKeys.active}`,
          "activePubkey":`${newKeys.activePubkey[1]}`,
          "memo":`${newKeys.memo}`,
          "memoPubkey":`${newKeys.memoPubkey}`
        }
      }]
    };

    log(`keychainfile;`);
    log(keychainfile);

    /* THE .kc format!

    {
    "list":
    [{
    "name":"klye",
    "keys":{
    "posting":"5postingkeyhere",
    "postingPubkey":"STMpubkeyhere",
    "active":"5activekeyhere",
    "activePubkey":"STMpubkeyhere",
    "memo":"5memokeyhere",
    "memoPubkey":"STMpubkeyhere"
  }
}],
"hash":"1441a7909c087dbbe7ce59881b9df8b9"
}

*/
log(`ACCOUNTS: New ${user} Ownership Key Creation Complete! Saving New Keys and Broadcasting Ownership Transfer!`);

hive.broadcast.accountUpdate(
  currentOwnerKey, // @testuser's CURRENT private owner key
  user,
  owner,
  active,
  posting,
  memo,
  newjsonMetadata,
  async(err, result) => {
    if(err) {
      t.rollback();
      return log(err);
    }
    if(result){
      log(result);
      log(`New Keys Being saved now!`)
      await OwnkeyData.create({userId:uData.id, loanId: loanId, username: uData.username, owned: true, powerdown: false, oldkeys: currentOwnerKey, newkeys: newKeyJSON});
      t.commit();
      var loanPayload = {userId: LoanData.userId, loanId: LoanData.loanId, username: uData.username, amount: LoanData.amount, days: LoanData.days, interest: LoanData.interest};
      jsonBreadCrumb('contracts', 'startloan', loanPayload);
      var date = new Date();
      date.setDate(date.getDate() + 7);
      var totalpayments = (LoanData.days / 7);
      await LoanData.update({borrower: user, nextcollect: date, totalpayments: totalpayments, active: true},{where:{loanId:`${loanId}`}})
      return cb(null, {newActivePriv: newKeys.active, newPostingPriv: newKeys.posting, newMemoPriv: newKeys.memo, token: req.token});
    }
    keyRinse++;
    if(keyRinse < 2){
      log(`keyRinse < 2 - More Ownership Transfers Required!`);
    } else {
      log(`keyRinse = 2 - Account is now Ours!`);
    }
  });
}//END ownerkeyswap
break;

case 'checkkey':
log(`case checkkey:`);
log(m);
var shitfucksec = config.sechash;
var pgp = m.pgp;
var user = m.username;
var decryptedkeys = await pgpDecryptAsync(`${pgp}`, user).then(result => {
  decryptedkeys = result;

  log(`decryptedkeys:`);
  log(decryptedkeys);
  var decryptedPassData = (decryptedkeys[0][user].passdata).toString();
  log(`decryptedPassData:`);
  log(decryptedPassData);
  if (decryptedPassData) {
    if(decryptedPassData.length === 51){
      log(`ACCOUNTS: Potential Owner Private Key Detected!`);
      try {
        var isAuth = hive.auth.isWif(decryptedkeys[0][user].passdata);
        var isPublic = hive.auth.wifToPublic(decryptedkeys[0][user].passdata);
        var isValid = hive.auth.wifIsValid(decryptedkeys[0][user].passdata, isPublic);
        if(isAuth == true && isPublic != false && isValid == true) {
          log(`ACCOUNTS: ${user} Owner Key Valid for Collateral! Switch Keys Now!`);
          //Comment out line below to stop key changing.
          ownerKeySwap(user, decryptedkeys[0][user].passdata, loanId);
        }
      } catch(e) {
        log(`ERROR WITH OWNER KEY VALIDITY CHECKING`)
      }
    } else {
      log(`ACCOUNTS: Potential Password Detected!`);
      var userDataOwner;
      var isVerify = hive.auth.getPrivateKeys(user, decryptedkeys[0][user].passdata, ['owner', 'active', 'posting', 'memo']);
      var userDataDump;
      hive.api.getAccounts([user], function(err, result) {
        //console.log(err, result);
        if(result){
          userDataDump = result[0];
          result = result[0];
          result = result['owner'];
          result = result['key_auths'];
          result = result[0][0];
          userDataOwner = result;
          userDataDump = userDataDump['json_metadata'];
          log(`userDataOwner`);
          log(userDataOwner)
          if(userDataOwner.toString() == isVerify.ownerPubkey.toString()){
            log(`ACCOUNTS: ${user} Owner Key Valid for Collateral! Switch Keys Now!`);
            //Comment out line below to stop key changing.
            ownerKeySwap(user, isVerify.owner.toString(), loanId, userDataDump);
          }
        }
      });
    }
  } else {
    log(`ACCOUNTS: Neither Owner nor Master Password were supplied...`);
  }
}).catch(error => log(error));
break;
case 'test':

break;
}


});//END process.on('message'

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

//----- SLEEP Function to unfuck some nodeJS things - NO modify
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if (new Date().getTime() - start > milliseconds) {
      break;
    }
  }
}
