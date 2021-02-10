var fs = require("fs");
var cp = require("child_process");
var crypto = require("crypto");
var hivejs = require("@hiveio/hive-js");
const { Client, Signature, cryptoUtils } = require("@hiveio/dhive");
const steemClient = new Client("https://api.hive.blog");
var log = require("fancy-log");
var fetch = require("node-fetch");
const dotenv = require("dotenv");
dotenv.config();
var bankwif = process.env.ACTIVE_PRIVKEY;
var appName = process.env.SITE_ACCOUNT;
const DB = require("../database/models");
const sequelize = DB.sequelize;
const DataBase = sequelize;
const Userdata = DataBase.models.Users;
const Depositdata = DataBase.models.Deposits;
const Loandata = DataBase.models.Loans;
const Chaindata = DataBase.models.Blockchain;

var fetchLastBlockDB = async() => {
  log(`DAEMON: FetchLastBlock (from DB)`)
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

const oneday = 60 * 60 * 24 * 1000;

const version = "0.0.7";
const apinodes = ["https://api.deathwing.me", "https://api.hive.blog", "https://hived.privex.io", "https://api.openhive.network", "https://hive.loelandp.nl", "https://hive-api.arcange.eu", "https://rpc.ausbit.dev", "https://anyx.io", "https://api.hivekings.com"];
let apiindex = 0;

// Add your Account Info Here!
const wallet = process.env.SITE_ACCOUNT;
const wif = process.env.POSTING_PRIVKEY;
const mintransfer = 0.001;
let lastb;
let blockNum;
var recentblock;

// Set HIVE API Server
hivejs.api.setOptions({ url: "https://rpc.ausbit.dev" });

async function changenode() {
  log(`NODE: Changing API Node`);
  if (apiindex < apinodes.length){
    apiindex++;
  } else if (apiindex == apinodes.length) {
    apiindex = 0;
  }
  log(`NODE: Changing API Node to ${apinodes[apiindex]}`);
  hivejs.api.setOptions({ url: `${apinodes[apiindex]}` });
}

process.on('message', async function(m) {
  try {
      m = JSON.parse(m);
      log(m);
  } catch(e) {
    log(`ERROR: ${e}`);
    return console.error(e);
  }
  if(m.type === 'changenode'){
    if(m.username !== process.env.OWNER_ACCOUNT) {
      log(`NODE: ERROR: User ${m.username} Tried to Change API Node!`);
    } else if (m.username == process.env.OWNER_ACCOUNT) {
      changenode();
    } else {
      log(`NODE: ERROR: No User Was Specified!`);
    }
  }

});



// NO NEED TO MODIFY THESE

const metadata = {
    app: `hive.loans`,
};
let opscan = 1;




//DEPOSIT SHIT
async function DepositToAccount(uid, depositamt, type, depositID, tx, block, transaction, promo) {
  var uData;
  var txData;

if(promo === true){
  Depositdata.create({userId:'1', username: uid, block: block, txid: deposittxid, amount: depositamt, coin: type, confirms: 1, confirmed: false});
  return;
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
      log('DAEMON: txCheck did not find a deposit with this txid! Creating one now!');
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
                    log("DAEMON: Deposit of " + parseFloat(depositamt / 1000).toFixed(3) +  " " + type + " added to " + uData.username + " account");
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
                    log("DAEMON: Deposit of " + parseFloat(depositamt / 1000).toFixed(3) +  " " + type + " added to " + uData.username + " account");
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
      return log(`DAEMON: ERROR: THIS DEPOSIT ALREADY EXISTS!`);
    }
} else {
  log(`DAEMON: Deposit Promo status was not defined!`);
}

};//END DepositToAccount


// Lets Start this script!
log("CHAINSNOOP: Wallet Daemon Starting...");

let shutdown = false;

var letsgo = async() => {
  if (process.argv[2] == undefined) {
    blockNum = await fetchLastBlockDB();
      sleep(3000);
      log(blockNum);
      if(typeof blockNum !== 'number'){
        log("Start Block Undefined! Fetching Last Irreversible Block - Please Wait.");
        hivejs.api.getDynamicGlobalProperties(function (err, result) {
            sleep(3000);
            if (result) {
                lastb = result["last_irreversible_block_num"];
                blockNum = lastb;
                setTimeout(start, 3000);
                // start();
            }
        });
      } else {
        log("Start Block Found in DB!");
        setTimeout(start, 3000);
      }
  } else {
      blockNum = process.argv[2];
      setTimeout(start, 3000);
  }
}
letsgo();



async function start() {
    try {
        log(`Parser is resuming at block ${blockNum}`);
        parseBlock(blockNum);
    } catch (e) {
        log(`Restarting After ${e}`);
        parseBlock(blockNum);
    }
}

async function bail(err) {
  if(err === 'shutdown') {
    process.exit(err === undefined ? 0 : 1);
  }
    log(`bail called on ${err}`);
    var errstring = err.toString();
    log(`errstring`);
    log(errstring)
    if(errstring.toLowerCase() === 'rpcerror: internal error'){
      log(`THE ERROR WAS INTERNAL ERROR.. SWITCHING NODES`)
      changenode();
      await timeout(1000);
      return setTimeout(() => parseBlock(blockNum));
    }
}

function parseBlock(blockNum) {
    newCurrentBlock = blockNum;
    process.send(JSON.stringify({type: 'blockupdate', block: newCurrentBlock}));
    hivejs.api.getBlock(blockNum, async function (err, block) {
        try {
            if (err !== null) return bail(err);
            if (block === null) {
                await timeout(9000);
                return setTimeout(() => parseBlock(blockNum));
            }
            blockJSON = JSON.stringify(block);
            Chaindata.update({siteblock: blockNum},{where:{id:1}});
            blockNum++;
            recentblock = blockNum + 1;
            for (let transaction of block.transactions) {
                for (let operation of transaction.operations) {
                    const action = operation[0];
                    const data = operation[1];
                    const op = {
                        action: action,
                        data: data,
                    };
                    // log(`Found operation ${JSON.stringify(op)}`);
                    if (action === "transfer" && data.to === wallet) {
                        opscan++;
                        //console.log("Transfer Scanned: " + opscan);
                        process_transfer(op, transaction);
                    }
                }
            }
            if (shutdown) return bail();
            setTimeout(() => parseBlock(blockNum));
        } catch (e) {
            log(`Fucking up with ${e}`);
            if (shutdown) return bail(e);
            setTimeout(() => parseBlock(blockNum));
            //return bail(e);
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
      /*
      hivejs.broadcast.transfer(bankwif, appName, depositer, op.data.amount, "Hive.Loans Deposit Refund - No Account is Linked to Specified Address!", function (fuckeduptransfer, senttransfer) {
          if (fuckeduptransfer) console.log("Refund Fucked Up: " + fuckeduptransfer);
          if (senttransfer) log("Refund of Deposit Transfer to " + depositer + " Sent!");
      }); //end refund transfer
      */
      log(`User Addressed in that Deposit is not in our Database - Assuming it's a Pledge!`);
      log(`Attempting to Add ${depoamount} ${type} to Account with Address: ${depositmemo}`)
      DepositToAccount(depositer, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction, true);
    } else {
      log(`User Addressed in that Deposit has an Account!- Assuming it's an actual Deposit!`);
      // Look for hivejsit.com Link
      log(op.data.amount + " Deposit Detected from @" + depositer + " on block #" + recentblock);
      // See if the transfer was above minimum
      if (type.toLowerCase().indexOf("hive") >= 0) {
        log(`Attempting to Add ${depoamount} ${type} to Account with Address: ${depositmemo}`)
      DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction, false);//      DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction);
      } else if (type.toLowerCase().indexOf("hbd") >= 0) {
        log(`Attempting to Add ${depoamount} ${type} to Account with Address: ${depositmemo}`)
      DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction, false); //      DepositToAccount(depositmemo, parseInt(depoamount * 1000), type, 'new', op, recentblock, transaction);
      } else {
          log("Deposit Detected is NOT a Hive.Loans Supported Token..." + depositer);
          /*
          hivejs.broadcast.transfer(bankwif, appName, depositer, op.data.amount, "Hive.Loans Deposit Refund - Please Only Send HIVE / HBD!", function (fuckeduptransfer, senttransfer) {
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
    log(`Shutting down in 1 seconds, start again with block ${blockNum}`);
    Chaindata.update({siteblock: blockNum},{where:{id:1}});
    shutdown = true;
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
