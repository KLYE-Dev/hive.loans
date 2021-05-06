var fs = require("fs");
var cp = require("child_process");
var crypto = require("crypto");
var hivejs = require("@hiveio/hive-js");
const { Client, Signature, cryptoUtils } = require("@hiveio/dhive");
const hiveClient = new Client(["https://api.hive.blog", "https://api.hivekings.com", "https://anyx.io", "https://api.openhive.network"]);
var es = require("event-stream"); // npm install event-stream
var util = require("util");
var log = require("fancy-log");
const io = require("socket.io");
const socket = io();
var fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();
var debug = process.env.DEBUG;
var bankwif = process.env.ACTIVE_PRIVKEY;
var appName = process.env.SITE_ACCOUNT;
var owner = process.env.OWNER_ACCOUNT;
var votemirror = process.env.VOTE_MIRROR;
var refunds = process.env.REFUNDS;
var stdoutblocks = true;//process.env.STDOUT_BLOCKS;
const DB = require("../database/models");
const sequelize = DB.sequelize;
const DataBase = sequelize;
const Userdata = DataBase.models.Users;
const Depositdata = DataBase.models.Deposits;
const Loandata = DataBase.models.Loans;
const Chaindata = DataBase.models.Blockchain;

var fetchLastBlockDB = async() => {
  log(`SNOOP: Connect to DB for Last Scanned Block`);
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
  hive.api.getDynamicGlobalProperties(await function (err, result) {
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
  hive.api.getDynamicGlobalProperties(await function (err, result) {
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
  hive.api.getDynamicGlobalProperties(await function (err, result) {
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
//hive.api.setOptions({ url: "https://api.hivekings.com" });//http://185.130.44.165/
hive.api.setOptions({ url: "https://api.hivekings.com" });

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
const metadata = {
    app: `hive.loans`,
};

let opscan = 0;
let transferscan = 0;
let votescan = 0;
let customjsonscan = 0;
let rewardclaimscan = 0;
let feedpubscan = 0;
let transferFound = 0;
let voteFound = 0;
let delegationscan = 0;
let commentscan = 0;
let transfertovestingscan = 0;
let createclaimedaccountscan = 0;
let claimaccountscan = 0;
let witnesspayscan = 0;
let proposalpayscan = 0;

async function changenode() {
  if (apiindex < apinodes.length){
    apiindex++;
  } else if (apiindex == apinodes.length) {
    apiindex = 0;
  }
  log(`SNOOP: Changed API Node to ${apinodes[apiindex]}`);
  await hive.api.setOptions({ url: `https://${apinodes[apiindex]}` });
}

changenode();

process.on('message', function(m) {
  try {
      m = JSON.parse(m);
      if(debug) log(m);
  } catch(e) {
    log(`ERROR: ${e}`);
    return console.error(e);
  }

  switch(m.type){
    case 'changenode':
      if(m.username !== process.env.OWNER_ACCOUNT) {
        log(`SNOOP: ERROR: User ${m.username} Tried to Change API Node!`);
      } else if (m.username == process.env.OWNER_ACCOUNT) {
        changenode();
      } else {
        log(`SNOOP: ERROR: No User Was Specified!`);
      }
      break;
  }
});

//DEPOSIT SHIT
async function DepositToAccount(uid, depositamt, type, depositID, tx, block, transaction, promo) {
  var uData;
  var txData;
if(promo === true){
  Depositdata.create({userId:'1', username: uid, block: block, txid: deposittxid, amount: depositamt, coin: type, confirms: 1, confirmed: false});

} else if(promo === false){
    try {
      tx = JSON.parse(JSON.stringify(transaction));
      log(`tx:`);
      log(tx);
    } catch(e){
      log(`failed to parse tx!`);
      log(e);
    }
    var DepositID;
    var deposittxid = tx.transaction_id;

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
      log('SNOOP: txCheck did not find a deposit with this txid! Creating one now!');
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
                    log("SNOOP: Deposit of " + parseFloat(depositamt / 1000).toFixed(3) +  " " + type + " added to " + uData.username + " account");
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
                    log("SNOOP: Deposit of " + parseFloat(depositamt / 1000).toFixed(3) +  " " + type + " added to " + uData.username + " account");
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
      return log(`SNOOP: ERROR: THIS DEPOSIT ALREADY EXISTS!`);
    }
} else {
  log(`SNOOP: Deposit Promo status was not defined!`);
}

}//END DepositToAccount


// Lets Start this script!
log("SNOOP: Starting HIVE Network Overwatch Daemon");

let shutdown = false;

var letsgo = async() => {
  if (process.argv[2] == undefined) {
    blockNum = await fetchLastBlockDB();
      sleep(3000);

      hive.api.getDynamicGlobalProperties(await function (err, result) {
          sleep(3000);
          if (result) {
              lastb = result["last_irreversible_block_num"];
              if(blockNum > lastb){
                blockNum = lastb;
                setTimeout(start, 3000);
              }
          }
      });

      if(typeof blockNum !== 'number'){
        synced = false;
        log("SNOOP: Start Block Undefined! Fetching Last Irreversible Block - Please Wait.");
        hive.api.getDynamicGlobalProperties(function (err, result) {
            sleep(3000);
            if (result) {
                lastb = result["last_irreversible_block_num"];
                blockNum = lastb;
                setTimeout(start, 3000);
            }
        });
      } else {
        synced = false;
        log("SNOOP: Previous Saved Block Height Found in DB!");
        setTimeout(start, 3000);
      }
  } else {
      synced = false;
      blockNum = process.argv[2];
      setTimeout(start, 3000);
  }
}
letsgo();



function start() {
    try {
        log(`SNOOP: Start Block ${blockNum}`);
        parseBlock(blockNum);
    } catch (e) {
        log(`SNOOP: Restarting After ${e}`);
        parseBlock(blockNum);
    }
}

async function bail(err) {

  switch (err) {
    case 'shutdown':
    log(`SNOOP: Shutting down in 1 seconds, start again with block ${blockNum}`);
    Chaindata.update({siteblock: blockNum},{where:{id:1}});
    process.exit(err === 'Shutdown' ? 0 : 1);
    break;
  }
    log(`bail called on ${err}`);
    var errstring = err.toString();
    log(`errstring`);
    log(errstring)
    if(errstring.toLowerCase().indexOf("rpcerror") >= 0){
      log(`SNOOP: RPC ERROR: ${errstring} - SWITCHING NODES`);
      changenode();
      await timeout(500);
      return setTimeout(() => parseBlock(blockNum));
    } else {
      log(`SNOOP: ERROR: ${errstring} SWITCHING NODES`);
      changenode();
      await timeout(500);
      return setTimeout(() => parseBlock(blockNum));
    }
}



async function parseBlock(blockNum) {
var newbytesParsed;
    newCurrentBlock = blockNum;
    scanrate++;
    await hive.api.getOpsInBlock(blockNum, false, async function (err, block) {
      if(err){
        log(`Ooops. Parsed too fast!`);
        await timeout(9000);
        return setTimeout(() => parseBlock(blockNum));
      }
      //log(block);
            if (err !== null) return bail(err);
            if (block.length == 0) {
              saveBlock(blockNum);
              if (stdoutblocks === true) {
                process.stdout.write(`[${returnTime()}] SNOOP: SYNCED! Block ${blockNum} / ${blockNum} (Waiting for Block) (Block Size: None / ${formatByteSizeDisplay(bytesParsed)} Total Session) (${opscan} Ops Scanned - ${opspersec} OpS) (${transferscan} transfer, ${votescan} vote, ${customjsonscan} custom_json, ${witnesspayscan} wtnessrewards)`);
                process.stdout.cursorTo(0);
              }
                synced = true;
                process.send(JSON.stringify({type: 'blockupdate', block: newCurrentBlock}))
                var headBlockCheck = await fetchHead();
                saveHead(lastSafeBlock);
                if(headBlockCheck < blockNum){
                  log(`derailed.. Putting back on proper chain`)
                  blockNum = headBlockCheck;
                  await timeout(9000);
                  return setTimeout(() => parseBlock(blockNum));
                }
                await timeout(9000);
                process.stdout.clearLine();
                return setTimeout(() => parseBlock(blockNum));
            }
            process.send(JSON.stringify({type: 'blockupdate', block: newCurrentBlock}));
            if((blockNum % 25) == 1) {
              saveBlock(blockNum);
              saveHead(lastHeadBlock);
              //lastSafeBlock = fetchSafe();
            }

            synced = false;
            newbytesParsed = byteSize(block);
            if(newbytesParsed != undefined){
              //log(`block byte size: ${newbytesParsed}`)
              bytesParsed += newbytesParsed;
              //log(`Total Byte size of session: ${bytesParsed}`);
            }


            for (let transaction of block) {
                for (let operation of transaction.op) {
                    opscan++;
                    const action = transaction['op'][0];
                    const data = operation;
                    const op = {
                        action: action,
                        data: data,
                    };
                    //log(action);
                    // log(`Found operation ${JSON.stringify(op)}`);
                    //log(action);
                    //log(action)
                    switch (action) {
                      case 'custom_json':
                      customjsonscan++;
                      break;
                      case 'producer_reward':
                      witnesspayscan++;
                      break;
                      case 'vote':
                      votescan++;
                      if (data.voter === owner) {
                          voteFound++;
                          saveBlock(blockNum);
                          process_vote(operation);
                      }
                      break;
                      case 'transfer':
                      transferscan++;
                      if (data.to === wallet) {
                          transferFound++;
                          saveBlock(blockNum);
                          process_transfer(operation, transaction);
                      }
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
                      case 'comment':
                      commentscan++;
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
                      case 'proposal_pay':
                      proposalpayscan++;

                      if(operation.receiver == 'klye'){
                        log(operation);
                        log(`PROPOSAL PAY DETECTED - ROUTING TO KLYE`)
                        saveBlock(blockNum);
                        hive.broadcast.transfer(bankwif, appName, 'klye', operation.payment, "Hive.Loans Proposal Payment Auto-Routing", function (fuckeduptransfer, senttransfer) {
                            if (fuckeduptransfer) log("Refund Fucked Up: " + fuckeduptransfer);
                            if (senttransfer) log("Refund of Deposit Transfer to " + depositer + " Sent!");
                        }); //end refund transfer
                      }
                      break;
                    }
                }
            }
            if (stdoutblocks === true) {
              process.stdout.write(`[${returnTime()}] SNOOP: Syncing Block ${blockNum} / ${lastHeadBlock} (${(lastHeadBlock - blockNum)} Left) (Block Size: ${formatByteSizeDisplay(newbytesParsed)} / ${formatByteSizeDisplay(bytesParsed)} Total) (${scansecondstepdown} BpS) (${opscan} Ops Scanned - ${opspersec} OpS) (${transferscan} transfer, ${votescan} vote, ${customjsonscan} custom_json, ${witnesspayscan} wtnessrewards)`);
              process.stdout.cursorTo(0);
            }
            blockNum++;
            recentblock = blockNum + 1;
            if (shutdown) return bail();
            setTimeout(() => parseBlock(blockNum));
    });
}

var process_vote = async function(op) {
  log(op);
  await hive.broadcast.vote(bankwif, appName, op.author, op.permlink, op.weight, function(err, result) {
    if(err){
      log(`SNOOP: process_vote ERROR: ${err}`);
    }
    if(result){
      log(`SNOOP: process_vote Succesful!`);
    }
  });
}


// Transfer operation found? Lets see if it is for us!
var process_transfer = async function (op, transaction) {
    var depositer = op.data.from;
    var currency = op.data.amount.lastIndexOf(" ") + 1;
    var depositmemo = op.data.memo;
    var depoamount = parseFloat(op.data.amount);
    var type;
    function parsetype(words) {
        var n = words.split(" ");
        return n[n.length - 1];
    }
    type = parsetype(op.data.amount);

    //Check if Deposit Memo is equal to an existing account
    let loginData;
    let userNameCheck = await Userdata.findOne({where:{address:depositmemo}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (userNameCheck === null) {
      if(refunds === true){
        hive.broadcast.transfer(bankwif, appName, depositer, op.data.amount, "Hive.Loans Deposit Refund - No Account is Linked to Specified Address!", function (fuckeduptransfer, senttransfer) {
            if (fuckeduptransfer) console.log("Refund Fucked Up: " + fuckeduptransfer);
            if (senttransfer) log("Refund of Deposit Transfer to " + depositer + " Sent!");
        }); //end refund transfer
      }
      log(`SNOOP: User Addressed in that Deposit is not in our Database - Assuming it's a Pledge!`);
      log(`SNOOP: Attempting to Add ${depoamount} ${type} to Account with Address: ${depositmemo}`)
      DepositToAccount(depositer, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction, true);
    } else {
      log(`SNOOP: User Addressed in that Deposit has an Account!- Assuming it's an actual Deposit!`);
      // Look for hivejsit.com Link
      log(op.data.amount + " Deposit Detected from @" + depositer + " on block #" + recentblock);
      // See if the transfer was above minimum
      if (type.toLowerCase().indexOf("hive") >= 0) {
        log(`SNOOP: Attempting to Add ${depoamount} ${type} to Account with Address: ${depositmemo}`)
      DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction, false);//      DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction);
      } else if (type.toLowerCase().indexOf("hbd") >= 0) {
        log(`SNOOP: Attempting to Add ${depoamount} ${type} to Account with Address: ${depositmemo}`)
      DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction, false); //      DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction);
      } else {
          log("SNOOP: Deposit Detected is NOT a Hive.Loans Supported Token..." + depositer);
          /*
          hive.broadcast.transfer(bankwif, appName, depositer, op.data.amount, "Hive.Loans Deposit Refund - Please Only Send HIVE / HBD!", function (fuckeduptransfer, senttransfer) {
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

process.on("SIGINT", function () {
    shutdown = true;
    log(`SNOOP: Shutting down in 1 seconds, start again with block ${blockNum}`);
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
