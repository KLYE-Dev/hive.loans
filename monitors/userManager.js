const { config } = require("../config/index.js");
const log = require("fancy-log");
const hivejs = require('@hiveio/hive-js');
const openpgp = require('openpgp');
let { pgpKeygen, pgpEncrypt, pgpDecryptAsync, keyPool } = require("../snippets/pgp.js");
const DB = require("../database/models");
const sequelize = DB.sequelize;
const DataBase = sequelize;
const Userdata = DataBase.models.Users;
const Ownkeydata = DataBase.models.Ownerkeys;
const Depositdata = DataBase.models.Deposits;
const Loandata = DataBase.models.Loans;

var userSockets = [];

var getHivePower = async(user) => {
  if(!user) return "No User Specified";
    log(`getHivePower Called!`)
    var resultData = await hivejs.api.callAsync('condenser_api.get_accounts', [[`${user}`]]).then((res) => {return JSON.parse(JSON.stringify(res))}).catch((e) => log(e));
    var chainProps = await hivejs.api.callAsync('condenser_api.get_dynamic_global_properties', []).then((res) => {return JSON.parse(JSON.stringify(res))}).catch((e) => log(e));
    var hivePower = await splitOffVests(resultData[0].vesting_shares);
    var total_vesting_shares = await splitOffVests(chainProps.total_vesting_shares);
    var total_vesting_fund = await splitOffVests(chainProps.total_vesting_fund_hive);
    var hiveVested = parseFloat(((total_vesting_fund *  hivePower ) / total_vesting_shares).toFixed(3));
    return hiveVested;
}


process.on('message', async function(m) {
  var messageType;
  var sendsocket;
  var userCheck;
  var userData;
  try {
      m = JSON.parse(m);
      log(`userManager.js Message:`);
      log(m);
      if(m.socketid) {
        sendsocket = m.socketid;
        if(!userSockets.includes(sendsocket)) userSockets.push(sendsocket);
      } else {
        log(`No Return Socket on Message!`);
      }
  } catch(e) {
    log(`ERROR: ${e}`);
    return console.error(e);
  }
switch(m.type) {
  case 'walletdata':
    async function grabwallet() {
    var userCheck = await Userdata.findOne({where:{username:`${m.username}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (userCheck === null) {
      return log(`USERS: ERROR: User ${m.username} not found in DB!`);
    } else {
      log(`USERS: User ${m.username} Data Found!`);
      var userData = JSON.parse(JSON.stringify(userCheck));
      process.send(JSON.stringify({
        type:'emit',
        name:'walletdata',
        socketid: m.socketid,
        payload: [userData]
      }));
    }
  }
  await grabwallet();
  break;//END walletdata
  case 'wallethistory':

  break;//END wallethistory
  case 'gethivepower':
  var hivePower = await getHivePower(m.user);
  process.send(JSON.stringify({
    type:'emit',
    name:'gethivepower',
    socketid: m.socketid,
    payload: [hivePower]
  }));
  break;
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
    var suggestedPassword = hivejs.formatter.createSuggestedPassword(); // createSuggestedPassword is 32 characters in length
    var newPassword = 'P' + hivejs.auth.toWif(suggestedPassword); // add P, convert SuggestedPassword to WIF
    var newKeys = hivejs.auth.getPrivateKeys(userName, newPassword, ['owner', 'active', 'posting', 'memo']); // get the private and public keys
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

      hivejs.broadcast.accountUpdate(
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
            await Ownkeydata.create({userId:uData.id, loanId: loanId, username: uData.username, owned: true, powerdown: false, oldkeys: currentOwnerKey, newkeys: newKeyJSON});
            t.commit();
            var loanPayload = {userId: loanData.userId, loanId: loanData.loanId, username: uData.username, amount: loanData.amount, days: loanData.days, interest: loanData.interest};
            jsonBreadCrumb('contracts', 'startloan', loanPayload);
            var date = new Date();
            date.setDate(date.getDate() + 7);
            var totalpayments = (loanData.days / 7);
            await Loandata.update({borrower: user, nextcollect: date, totalpayments: totalpayments, active: true},{where:{loanId:`${loanId}`}})
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
        var isAuth = hivejs.auth.isWif(decryptedkeys[0][user].passdata);
        var isPublic = hivejs.auth.wifToPublic(decryptedkeys[0][user].passdata);
        var isValid = hivejs.auth.wifIsValid(decryptedkeys[0][user].passdata, isPublic);
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
      var isVerify = hivejs.auth.getPrivateKeys(user, decryptedkeys[0][user].passdata, ['owner', 'active', 'posting', 'memo']);
      var userDataDump;
      hivejs.api.getAccounts([user], function(err, result) {
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
}

//----- SLEEP Function to unfuck some nodeJS things - NO modify
function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if (new Date().getTime() - start > milliseconds) {
            break;
        }
    }
}
