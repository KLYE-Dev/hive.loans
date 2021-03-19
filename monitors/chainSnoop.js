var crypto = require("crypto");
var hivejs = require("@hiveio/hive-js");
var log = require("fancy-log");
const io = require("socket.io");
const socket = io();
var fetch = require("node-fetch");
const { config } = require("../config/index.js");
var refunds = process.env.REFUNDS;
var stdoutblocks = process.env.STDOUT_BLOCKS;
const DB = require("../database/models");
const sequelize = DB.sequelize;
const DataBase = sequelize;
const Userdata = DataBase.models.Users;
const Depositdata = DataBase.models.Deposits;
const Loandata = DataBase.models.Loans;
const Chaindata = DataBase.models.Blockchain;

var online = process.connected;
var pid = process.pid;
log(`CHAIN: Connected: ${online} with PID: ${pid}`);


Object.defineProperty(global, '__stack', {
get: function() {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
get: function() {
        return __stack[1].getLineNumber();
    }
});

Object.defineProperty(global, '__function', {
get: function() {
        return __stack[1].getFunctionName();
    }
});

process.on('message', function(m) {
  try {
      m = JSON.parse(m);
      if(config.debug == true) log(m);
      log(`chainSnoop.js Message:`);
      log(m);
  } catch(e) {
    log(`ERROR: ${e}`);
    return console.error(e);
  }

  switch(m.type){
    case 'changenode':
      if(m.username !== config.owner) {
        log(`CHAIN: ERROR: User ${m.username} Tried to Change API Node!`);
      } else if (m.username == config.owner) {
        changenode();
      } else {
        log(`CHAIN: ERROR: No User Was Specified!`);
      }
      break;
  }
});

var fetchLastBlockDB = async() => {
  log(`CHAIN: Connect to DB for Last Scanned Block`);
    var thedata = await Chaindata.findOne({where:{id:1}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    return thedata['siteblock'];
}

var fetchUserDBQuery = async (table, name) => {
    log(`SOCKET: fetchUserDBQuery(${table}, ${name})`);
    await DataBase.query("SELECT `" + name + "` FROM `" + table + "`", { type: sequelize.QueryTypes.SELECT })
        .then((result) => {
            log(result);
            return result;
        })
        .catch((err) => {
            console.log(err);
        });
};

var fetchSafe = async() => {
  hivejs.api.getDynamicGlobalProperties(await function (err, result) {
      if(err) log(err);
      if (result) {
        result = JSON.parse(JSON.stringify(result));
          lastSafeBlock = parseInt(result["last_irreversible_block_num"]);
          return lastSafeBlock;
          //return result["last_irreversible_block_num"];
      }
  });
};

var fetchHead = async() => {
  hivejs.api.getDynamicGlobalProperties(await function (err, result) {
      if(err) log(err);
      if (result) {
          result = JSON.parse(JSON.stringify(result));
          lastHeadBlock = parseInt(result["head_block_number"]);
          return lastHeadBlock;
          //return result["last_irreversible_block_num"];
      }
  });
};

var saveHeadBlock = async() => {
  hivejs.api.getDynamicGlobalProperties(await function (err, result) {
      if(err) log(err);
      if (result) {
          result = JSON.parse(JSON.stringify(result));
          return saveHead(result["head_block_number"]);
      }
  });
}

function saveBlock(blockSave) {
  Chaindata.update({siteblock: blockSave},{where:{id:1}});
}

function saveHead(blockSent) {
  Chaindata.update({headblock: blockSent},{where:{id:1}});
}



function formatByteSizeDisplay(bytes) {
    if(bytes < 1024) return bytes + " bytes";
    else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KB";
    else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MB";
    else return(bytes / 1073741824).toFixed(3) + " GB";
};

function byteSize(obj) {
    var bytes = 0;

    function sizeOf(obj) {
        if(obj !== null && obj !== undefined) {
            switch(typeof obj) {
            case 'number':
                bytes += 8;
                break;
            case 'string':
                bytes += obj.length * 2;
                break;
            case 'boolean':
                bytes += 4;
                break;
            case 'object':
                var objClass = Object.prototype.toString.call(obj).slice(8, -1);
                if(objClass === 'Object' || objClass === 'Array') {
                    for(var key in obj) {
                        if(!obj.hasOwnProperty(key)) continue;
                        sizeOf(obj[key]);
                    }
                } else bytes += obj.toString().length * 2;
                break;
            }
        }
        return bytes;
    };

    function formatByteSize(bytes) {
      return bytes;
    };
    return formatByteSize(sizeOf(obj));
};

const oneday = 60 * 60 * 24 * 1000;

function returnTime(){
  var time = new Date();
  time.setHours(time.getHours() + 18);
  time = (time).toUTCString();
  time = time.slice(17, time.length - 4);
  return time;
}

let scanrate = 0;
let synced = false;
const version = "0.0.81";
const apinodes = ["hived.privex.io", "api.hivekings.com", "api.deathwing.me", "api.hive.blog", "api.openhive.network", "hive.loelandp.nl", "hive-api.arcange.eu", "rpc.ausbit.dev", "anyx.io"];
//hivejs.api.setOptions({ url: "https://api.hivekings.com" });//http://185.130.44.165/
hivejs.api.setOptions({ url: "https://api.hivekings.com" });

/*
    stream.on('data', function(block) {
            var x = 0;
            while (x < block.length) {
              var operation = block.op[0];

              log(x + " " + operation);

              switch(operation){
                case 'proposal_pay':
                  log(block.transactions[x].operations[0]);
                  var proposalop = block.transactions[x].operations[1];
                  var opuser = proposalop.receiver;
                  var opamount = proposalop.amount;
                  if(opuser == 'klye') {
                    //pause strem
                    log(`KLYE PROPOSAL PAYOUT DETECTED`);
                    state = stream.pause();

                    //resume stream
                    //window.resumeStream = async () => {
                    //    state = state.resume();
                    //};
                    }
                break;
                default:
                x++;
                break;
              }

            }
        });
        */

let apiindex = 0;

let scanOn = false;

// Add your Account Info Here!
const wallet = process.env.SITE_ACCOUNT;
const wif = process.env.POSTING_PRIVKEY;
const mintransfer = 0.001;
let lastSafeBlock;
let lastHeadBlock;
let lastb;
let blockNum;
var recentblock;
var oldOpsCount = 0;

var bytesParsed = 0;
let parseOn = false;
const metadata = {
    app: `hive.loans`,
};



async function changenode() {
  if (apiindex < apinodes.length){
    apiindex++;
  } else if (apiindex == apinodes.length) {
    apiindex = 0;
  }
  log(`CHAIN: Changed API Node to ${apinodes[apiindex]}`);
  await hivejs.api.setOptions({ url: `https://${apinodes[apiindex]}` });
}

//changenode();



//DEPOSIT SHIT
var DepositToAccount = async(uid, depositamt, type, depositID, tx, block, transaction, promo) => {
  var uData;
  var txData;
if(promo === true){
  Depositdata.create({userId:'1', username: uid, block: block, txid: deposittxid, amount: depositamt, coin: type, confirms: 1, confirmed: false});

} else if(promo === false){
    try {
      tx = JSON.parse(JSON.stringify(transaction));
      //log(`tx:`);
      //log(tx);
    } catch(e){
      log(`failed to parse tx!`);
      log(e);
    }
    var DepositID;

    var deposittxid = tx.trx_id;

    if (depositID === 'new'){
      DepositID = crypto.randomBytes(16).toString('hex');
    }

    log(`DepositToAccount(${uid}, ${depositamt}, ${type}, ${depositID}, ${tx}, ${block}, ${transaction}))`);
    log(tx);
    log(`deposittxid: ${deposittxid}`);

    let userCheck = await Userdata.findOne({where:{address:`${uid}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (userCheck === null) {
      return log('Error: Faucet failed to fetch users statistics!');
    } else {
      uData = JSON.parse(JSON.stringify(userCheck));//.map(function(userNameCheck){ return userNameCheck.toJSON()});
      log(`DEPOSIT: User ${uData.username} owns address ${uid}`);
    }

    let txCheck = await Depositdata.findOne({where:{txid:`${deposittxid}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (txCheck === null) {
      log('CHAIN: txCheck did not find a deposit with this txid! Creating one now!');
      await Depositdata.create({userId:uData.id, username: uData.username, block: block, txid: deposittxid, amount: depositamt, coin: type, confirms: 1, confirmed: false});
        async function UpdateBalance(amount, type){
          log(`UpdateBalance(${amount}, ${type}) fired`);
          if(type == 'HIVE'){
            var newBalance = parseInt(uData.hivebalance + depositamt);
            sequelize.transaction().then(async function(t) {
                await Userdata.update({hivebalance:newBalance},{where:{userId:`${uData.id}`}})
                .then(async function() {
                    t.commit();
                      await Depositdata.update({confirmed: true},{where:{txid:deposittxid}});
                    log("CHAIN: Deposit of " + parseFloat(depositamt / 1000).toFixed(3) +  " " + type + " added to " + uData.username + " account");
                    return process.send(JSON.stringify({type:'depositconfirmed', balance:newBalance, user:uData.username, amount: depositamt, coin: type}));
                }).catch(function(error) {
                    t.rollback();
                    console.log(error);
                });
            });
          }
          if (type == 'HBD'){
                  var newBalance = parseInt(uData.hbdbalance + depositamt);
            sequelize.transaction().then(async function(t) {
                await Userdata.update({hbdbalance:newBalance},{where:{userId:`${uData.id}`}})
                .then(async function() {
                    t.commit();

                      await Depositdata.update({confirmed: true},{where:{txid:deposittxid}});
                    log("CHAIN: Deposit of " + parseFloat(depositamt / 1000).toFixed(3) +  " " + type + " added to " + uData.username + " account");
                    return process.send(JSON.stringify({type:'depositconfirmed', balance:newBalance, user:uData.username, amount: depositamt, coin: type}));
                }).catch(function(error) {
                    t.rollback();
                    console.log(error);
                });
            });
          }
        }
        UpdateBalance(depositamt, type);

    } else {
      return log(`CHAIN: ERROR: THIS DEPOSIT ALREADY EXISTS!`);
    }
} else {
  log(`CHAIN: Deposit Promo status was not defined!`);
}

}//END DepositToAccount


async function bail(err) {

  switch (err) {
    case 'shutdown':
    log(`CHAIN: Shutting down in 1 seconds, start again with block ${blockNum}`);
    Chaindata.update({siteblock: blockNum},{where:{id:1}});
    process.exit(err === 'Shutdown' ? 0 : 1);
    break;
  }
    log(`bail called on ${err}`);
    var errstring = err.toString();
    log(`errstring`);
    log(errstring)
    if(errstring.toLowerCase().indexOf("rpcerror") >= 0){
      log(`CHAIN: RPC ERROR: ${errstring} - SWITCHING NODES`);
      changenode();
      await timeout(500);
      return setTimeout(() => parseBlock(blockNum));
    } else {
      log(`CHAIN: ERROR: ${errstring} SWITCHING NODES`);
      changenode();
      await timeout(500);
      return setTimeout(() => parseBlock(blockNum));
    }
}


let opscan = 0;
let transferscan = 0;
let votescan = 0;
let customjsonscan = 0;
let rewardclaimscan = 0;
let feedpubscan = 0;
let transferFound = 0;
let voteFound = 0;
let delayvotescan = 0;
let delegationscan = 0;
let returndelegationcan = 0;
let commentscan = 0;
let transfertovestingscan = 0;
let createclaimedaccountscan = 0;
let claimaccountscan = 0;
let witnesspayscan = 0;
let proposalpayscan = 0;
let updatepropscan = 0;
let consolidatescan = 0;
let spsfundscan = 0;
let curaterewardscan = 0;
let authorrewardscan = 0;
let commentbenerewardscan = 0;
let commentrewardscan = 0;
let commentpayoutscan = 0;
let commentoptionsscan = 0;
let changerecoveryscan = 0;
let accountupdatescan = 0;
let accountupdatetwoscan = 0;
let fillvestwdscan = 0;
let limitordercreatescan = 0;
let limitordercancelscan = 0;
let fillorderscan = 0;
let acctwitnessvotescan = 0;
let setwitpropscan = 0;
let convertscan = 0;
let fillconvertscan = 0;
let oldnonce = 0;
var nonce = 0;
let transfersavingsscan = 0;
let withdrawvestingscan = 0;
let interestscan = 0;
let deletecommentscan = 0;
let transferfrombankscan = 0;
let recoverscan = 0;
let filltransferfrombankscan = 0;
let createproposalscan = 0;


function coreOps(action, transaction){
  const data = transaction;
  let operation = transaction.op;
  const op = {
        action: action,
        data: data,
        };
  switch (action) {
    case 'transfer':
      transferscan++;
      var transferinfo = op.data["op"];
      var transfersender = transferinfo[1].to;
      //log(transfersender + " "  + transferscan);
      if (transfersender === config.appName) {
        process_transfer(transaction, transferinfo);
     }
    break;
    case 'vote':
      votescan++;
      if (operation.voter === config.owner) {
        //voteFound++;
        process_vote(operation);
      }
    break;
    case 'proposal_pay':
      proposalpayscan++;
      if(operation.receiver === 'hive.loans') {
        log(`PROPOSAL PAY DETECTED - ROUTING TO KLYE`);
        routeProposalPay(operation);
      }
    break;
  }
};


function blockOpFoo(action){
  switch (action) {
    case 'comment_reward':
       commentrewardscan++;
    break;
    case 'author_reward':
       authorrewardscan++;
    break;
    case 'curation_reward':
       curaterewardscan++;
    break;
    case 'comment_benefactor_reward':
       commentbenerewardscan++;
    break;
    case 'custom_json':
       customjsonscan++;
    break;
    case 'producer_reward':
       witnesspayscan++;
    break;
    case 'comment_payout_update':
       commentpayoutscan++;
    break;
    case 'comment_options':
       commentoptionsscan++;
    break;
    case 'claim_reward_balance':
       rewardclaimscan++;
    break;
    case 'feed_publish':
       feedpubscan++;
    break;
    case 'delegate_vesting_shares':
       delegationscan++;
    break;
    case 'return_vesting_delegation':
       returndelegationcan++;
    break;
    case 'comment':
       commentscan++;
    break;
    case 'fill_vesting_withdraw':
       fillvestwdscan++;
    break;
    case 'limit_order_create':
       limitordercreatescan++;
    break;
    case 'limit_order_cancel':
       limitordercancelscan++;
    break;
    case 'fill_order':
       fillorderscan++;
    break;
    case 'account_witness_vote':
       acctwitnessvotescan++;
    break;
    case 'witness_set_properties':
       setwitpropscan++;
    break;
    case 'convert':
       convertscan++;
    break;
    case 'fill_convert_request':
       fillconvertscan++;
    break;
    case 'REPLACE':
       replacescan++;
    break;
    case 'transfer_to_savings':
       transfersavingsscan++;
    break;
    case 'delayed_voting':
       delayvotescan++;
    break;
    case 'transfer_to_vesting':
       transfertovestingscan++;
    break;
    case 'create_claimed_account':
       createclaimedaccountscan++;
    break;
    case 'claim_account':
       claimaccountscan++;
    break;
    case 'account_update':
       accountupdatescan++;
    break;
    case 'account_update2':
       accountupdatetwoscan++;
    break;
    case 'update_proposal_votes':
       updatepropscan++;
    break;
    case 'consolidate_treasury_balance':
       consolidatescan++;
    break;
    case 'sps_fund':
       spsfundscan++;
    break;
    case 'change_recovery_account':
      changerecoveryscan++;
    break;
    case 'withdraw_vesting':
      withdrawvestingscan++;
    break;
    case 'transfer_from_savings':
      transferfrombankscan++;
    break;
    case 'delete_comment':
      deletecommentscan++;
    break;
    case 'interest':
      interestscan++;
    break;
    case 'recover_account':
      recoverscan++;
    break;
    case 'fill_transfer_from_savings':
      filltransferfrombankscan++;
    break;
    case 'create_proposal':
      createproposalscan++;
    break;
    default:
    if(action !== 'vote' && action !== 'transfer' && action !== 'proposal_pay') {
          log(`default case info: ${action}`);
    }
  }
}

function blockRipper(blockdata, blocknumber) {
  oldnonce = nonce;
  for(var i = 0; i < blockdata.length; i++) {
    let transaction = blockdata[i];
    nonce++;
    opscan++;
    const action = transaction['op'][0];
    const data = transaction;
    const op = {
      action: action,
      data: data,
    };
    coreOps(action, transaction)
    if(scanOn === true) blockOpFoo(action);
  }
};

async function parseBlock(blockNum) {
if(parseOn == true) {
 log(`Already parsing!`);
}
parseOn = true;
var newbytesParsed;
    newCurrentBlock = blockNum;
    scanrate++;
    async function blockGrabber(blockNum) {
       hivejs.api.getOpsInBlock(blockNum, false, async function (err, block) {
        if(err){
          log(`Ooops. Parsed too fast!`);
          await timeout(3005);
          //log(`parseblock line 422`)
          return setTimeout(() => {return parseBlock(blockNum)});
        }
        if (err !== null) return bail(err);
        if (block.length == 0) {
          //saveBlock(blockNum);
          if (stdoutblocks === true) {
            process.stdout.write(`[${returnTime()}] CHAIN: SYNCED! Block ${blockNum} / ${blockNum} (Waiting for Block) (Block Size: None / ${formatByteSizeDisplay(bytesParsed)} Total Session) (${opscan} Ops Scanned - ${opspersec} OpS) (${transferscan} transfer, ${votescan} vote, ${customjsonscan} custom_json, ${witnesspayscan} wtnessrewards)`);
            process.stdout.cursorTo(0);
          }
            synced = true;
            var headBlockCheck = await fetchHead();
            saveHead(lastSafeBlock);
            if(headBlockCheck < blockNum){
              log(`derailed.. Putting back on proper chain`)//blockNum = lastSafeBlock;
              await timeout(3005);
              process.stdout.clearLine();
              log(`parseblock line 438`)
              parseOn = false;
              return setTimeout(() => {return parseBlock(blockNum)});
            }

            //process.stdout.clearLine();
            //log(`parseblock line 443`)
            parseOn = false;
            await timeout(1000);
            return setTimeout(() => {return parseBlock(blockNum)});
        }
        if(block){
          if((blockNum % 25) == 1) {
            saveBlock(blockNum);
            saveHead(lastHeadBlock);//lastSafeBlock = fetchSafe();
          }
          synced = false;
          //newbytesParsed = byteSize(block);
          if(newbytesParsed != undefined){//log(`block byte size: ${newbytesParsed}`)
            bytesParsed += newbytesParsed;//log(`Total Byte size of session: ${bytesParsed}`);
          }
          blockRipper(block, blockNum);
          if (stdoutblocks === true) {
            process.stdout.write(`[${returnTime()}] CHAIN: Syncing Block ${blockNum} / ${lastHeadBlock} (${(lastHeadBlock - blockNum)} Left) (Block Size: ${formatByteSizeDisplay(newbytesParsed)} / ${formatByteSizeDisplay(bytesParsed)} Total) (${scansecondstepdown} BpS) (${opscan} Ops Scanned - ${opspersec} OpS) (${transferscan} transfer, ${votescan} vote, ${customjsonscan} custom_json, ${witnesspayscan} wtnessrewards)`);
            process.stdout.cursorTo(0);
          }
          blockNum++;
          recentblock = blockNum + 1;
          process.send(JSON.stringify({type: 'blockupdate', block: blockNum}));
          if (shutdown) {
            return bail();
          } else {
            parseOn = false;
            //log(`parseblock line 592 Block number: #${blockNum} head block: ${lastHeadBlock}`)
            return parseBlock(blockNum);
          }
        }
      });
    }
    await blockGrabber(blockNum);
}

// Lets Start this script!
log("CHAIN: Starting HIVE Network Overwatch Daemon");

let shutdown = false;

var letsgo = async() => {
  if (!process.argv[2]) {
    blockNum = await fetchLastBlockDB();
    /*
      hivejs.api.getDynamicGlobalProperties(await function (err, result) {
          sleep(3000);
          if (result) {
              lastb = result["last_irreversible_block_num"];
              if(blockNum > lastb){
                blockNum = lastb;
                log(`parseblock line 583`)
                parseBlock(blockNum);
              }
          }
      });
*/
      if(typeof blockNum !== 'number'){
        synced = false;
        log("CHAIN: Start Block Undefined! Fetching Last Irreversible Block - Please Wait.");
        hivejs.api.getDynamicGlobalProperties(function (err, result) {
            sleep(3000);
            if (result) {
                lastb = result["last_irreversible_block_num"];
                blockNum = lastb;
                log(`parseblock line 596`)
                parseBlock(blockNum);
            }
        });
      } else {
        synced = false;
        log("CHAIN: Previous Saved Block Height Found in DB!");
        log(`parseblock line 601`)
        parseBlock(blockNum);
      }
  } else {
      synced = false;
      blockNum = process.argv[2];
      log(`parseblock line 606`)
      parseBlock(blockNum);
  }
}
letsgo();

var opspersec;
var scansecondstepdown;
var scanRateScanner = () => {
  oldOpsCount = opscan;
  scansecondstepdown = scanrate;
  scanrate = 0;
  setTimeout(function(){
    opspersec = (opscan - oldOpsCount);
    scanRateScanner();
  }, 1000);
};
scanRateScanner();


var fetchHeadScanner = () => {
  var head = fetchHead();
  //saveHead(head);
  setTimeout(function(){
    fetchHeadScanner();
  }, 30000);
};
fetchHeadScanner();

var process_vote = async function(op) {
  log(op);
  await hivejs.broadcast.vote(config.bankwif, config.appName, op.author, op.permlink, op.weight, function(err, result) {
    if(err){
      log(`CHAIN: process_vote ERROR: ${err}`);
    }
    if(result){
      log(`CHAIN: process_vote Succesful!`);
      saveBlock(blockNum);
    }
  });
}

var routeProposalPay = async (operation) => {
  hivejs.broadcast.transfer(config.bankwif, config.appName, 'klye', operation.payment, "Hive.Loans Proposal Payment Auto-Routing", await function (fuckeduptransfer, senttransfer) {
    if (fuckeduptransfer) log("Routing Payment Fucked Up: " + fuckeduptransfer);
    if (senttransfer) {
        log("Routing Payment Transfer Sent on Block #" + senttransfer.block_num);
        saveBlock(blockNum);
    }
  }); //end refund transfer
}

// Transfer operation found? Lets see if it is for us!
var process_transfer = async function (transaction, op) {
  log(transaction);
  log(op);
    var depositer = op[1].from;
    var currency = op[1].amount.lastIndexOf(" ") + 1;
    var depositmemo = op[1].memo;
    var depoamount = parseFloat(op[1].amount);
    var type;
    function parsetype(words) {
        var n = words.split(" ");
        return n[n.length - 1];
    }
    type = parsetype(op[1].amount);

    //Check if Deposit Memo is equal to an existing account
    let loginData;
    let userNameCheck = await Userdata.findOne({where:{address:depositmemo}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (userNameCheck === null) {
      if(refunds === true){
        hivejs.broadcast.transfer(config.bankwif, config.appName, depositer, op[1].amount, "Hive.Loans Deposit Refund - No Account is Linked to Specified Address!", function (fuckeduptransfer, senttransfer) {
            if (fuckeduptransfer) console.log("Refund Fucked Up: " + fuckeduptransfer);
            if (senttransfer) log("Refund of Deposit Transfer to " + depositer + " Sent!");
        }); //end refund transfer
      }
      log(`CHAIN: User Addressed in that Deposit is not in our Database - Assuming it's a Pledge!`);
      log(`CHAIN: Attempting to Add ${depoamount} ${type} to Account with Address: ${depositmemo}`)
      return DepositToAccount(depositer, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction, true);
    } else {
      log(`CHAIN: User Addressed in that Deposit has an Account!- Assuming it's an actual Deposit!`);
      // Look for hivejsit.com Link
      log(op[1].amount + " Deposit Detected from @" + depositer + " on block #" + recentblock);
      // See if the transfer was above minimum
      if (type.toLowerCase().indexOf("hive") >= 0) {
        log(`CHAIN: Attempting to Add ${depoamount} ${type} to Account with Address: ${depositmemo}`)
      return DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction, false);//      DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction);
      } else if (type.toLowerCase().indexOf("hbd") >= 0) {
        log(`CHAIN: Attempting to Add ${depoamount} ${type} to Account with Address: ${depositmemo}`)
      return DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction, false); //      DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction);
      } else {
      return log("CHAIN: Deposit Detected is NOT a Hive.Loans Supported Token..." + depositer);
          /*
          hivejs.broadcast.transfer(config.bankwif, config.appName, depositer, op.data.amount, "Hive.Loans Deposit Refund - Please Only Send HIVE / HBD!", function (fuckeduptransfer, senttransfer) {
              if (fuckeduptransfer) {
                  console.log("Refund Fucked Up: " + fuckeduptransfer);
              }
              if (senttransfer) {
                  log("Refund of Transfer to " + depositer + " Sent!");
              }
          }); //end refund transfer
          */
      }
    }
}; //END process_transfer

process.on("SIGINT", function () {
    shutdown = true;
    log(`CHAIN: Shutting down in 1 seconds, start again with block ${blockNum}`);
    Chaindata.update({siteblock: blockNum},{where:{id:1}});
    setTimeout(bail('shutdown'), 1000);
});

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
