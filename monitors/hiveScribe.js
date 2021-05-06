const { config } = require("../config/index.js");
let debug = config.debug;
const owner = config.owner;
const hotwallet = config.hotwallet;
const coldwallet = config.coldwallet;
const sidechain = config.sidechainId;
const log = require("fancy-log");
const DB = require("../database/models");
const getStringByteSize = require('../snippets/getStringByteSize.js');
const manaBar = require('../snippets/manaBar.js');
const sequelize = DB.sequelize;
const DataBase = sequelize;
const UserData = DataBase.models.Users;
const DepositData = DataBase.models.Deposits;
const WithdrawData = DataBase.models.Deposits;
const AuditData = DataBase.models.Audits;
const LoanData = DataBase.models.Loans;

var online = process.connected;
var pid = process.pid;
log(`WRITE: Connected: ${online} with PID: ${pid}`);

let writeArray = [];
let writing = false;

class ChainCrumb {
  constructor(name, action, payload) {
    this.contractName = name;
    this.contractAction = action;
    this.contractPayload = payload;
  }
}

var arrayPacker = (name, action, payload) => {
  var createdCrumb;
  if (debug === false) log(`arrayPacker = (${name}, ${action}, ${payload})`);
  if(!name) return log(`WRITE: ERROR: arrayPacker Missing name!`);
  if(!action) return log(`WRITE: ERROR: arrayPacker Missing action!`);
  if(!payload) return log(`WRITE: ERROR: arrayPacker Missing payload!`);
  log(payload);
  //if(payload)
  createdCrumb = new ChainCrumb(name, action, payload);
  log('createdCrumb:');
  log(createdCrumb);

  createdCrumb = JSON.stringify(createdCrumb);
  writeArray.push(createdCrumb);
  delete createdCrumb;
}

var fetchSiteRC = async() => {
  var hotwalletRC = await manaBar.fetchRC(hotwallet);
  log(`hotwalletRC: ${hotwalletRC}%`);
  log(hotwalletRC);
};


var auditseshtotal = 0;
var jsonHiveWrite = async(writeArray) => {
  if (debug === false) log(`jsonHiveWrite = async(${writeArray})`);
  if(!writeArray) return log(`WRITE: ERROR: jsonHiveWrite Missing writeArray!`);
  if(writing == true) return;
  var oldArrayItem;
  writing = true;
  var al = writeArray.length;
  log(`al`);
  log(al);
  var nal = 0;
  for(item in writeArray){


    log(`nal`);
    log(nal);
    if(al <= nal) return;
    if(oldArrayItem){
      if(oldArrayItem == writeArray[item]) {
        log(`Duplicate DETECTED`)
        return;
      }
    } else {
      oldArrayItem = writeArray[item];
    }
    var itemPayload = writeArray[item];
    nal++

    var payloadBytes = getStringByteSize.getStringByteSize(itemPayload);
    itemPayload = JSON.parse(itemPayload);
    log(`${item} - itemPayload:`);
    log(itemPayload);
    if(payloadBytes < 8192) {
     await hive.broadcast.customJson(config.bankwif, ['hive.loans'], // requiredAuths (for signing json with active key)
      [], `${config.sidechainId}.hive.loans`, JSON.stringify(itemPayload), async function(err, result) {
      if(err){
        log(err)
        return writing = false;
      }
      if(result) {
        log(`WRITE: Blockchain Record Left Proof of ${(itemPayload.contractAction).toUpperCase()} at TXID ${result.id} on HIVE Block ${result.block_num}`);
        if(debug === false) log(result);
          switch(`${itemPayload.contractAction}`){
            case 'audit':
              log(`audit case detected! Total in Session: ${auditseshtotal++}`);
              var auditUpdate = await AuditData.create({data: [itemPayload.contractPayload], txid:result.id, block:result.block_num}).then((res) => {
                if(debug === true) log(auditUpdate);
                  if(al <= nal) {
                    writing = false;
                    return res;
                    writeArray.pop();
                  } else {
                    return res;
                  }
              }).catch((e) => {
                return e;
              });
            break;
            case 'acceptdisclaimer':
              UserData.update({disclaimer:writeArray[item].payload.agree},{where:{id:itemPayload['contractAction'].id}}).then((res) => {return res}).catch((e) => {return e});
              if((writeArray.length - 1) == 0) writing = false;
              return writeArray.pop();
            break;
            case 'newloan':
              LoanData.update({startblock:result.block_num, txid:result.id, state:'deployed'},{where:{loanId:itemPayload['contractAction'].loanId}}).then((res) => {return res}).catch((e) => {return e});
              userSockets[writeArray[item].payload.username].emit(`${writeArray[item].action}`, writeArray[item]);
              if((writeArray.length - 1) == 0) writing = false;
              return writeArray.pop();
            break;
            case 'nukeloan':
              LoanData.update({endblock:result.block_num, endtxid:result.id, state:'cancelled', completed: true, cancelled: true},{where:{loanId:itemPayload['contractAction'].loanId}}).then((res) => {return res}).catch((e) => {return e});
              userSockets[writeArray[item].payload.username].emit(`${writeArray[item].action}`, writeArray[item]);
              if((writeArray.length - 1) == 0) writing = false;
              return writeArray.pop();
            break;
            case 'startloan':
              LoanData.update({startblock:result.block_num, txid:result.id, state:'accepted'},{where:{loanId:itemPayload['contractAction'].userId}}).then((res) => {return res}).catch((e) => {return e});
              if((writeArray.length - 1) == 0) writing = false;
              return writeArray.pop();
            break;
            case 'endloan':
              LoanData.update({endblock:result.block_num, txid:result.id, state:'completed'},{where:{loanId:itemPayload['contractAction'].userId}});
              if((writeArray.length - 1) == 0) writing = false;
              return writeArray.pop();
            break;
            case 'newuser':
              UserData.update({flags: JSON.stringify([{"genesis":result.block_num, "birthtxid":result.id}])},{where:{userId: itemPayload['contractAction'].userId}}).then((res) => {return res}).catch((e) => {return e});
              if((writeArray.length - 1) == 0) writing = false;
              return writeArray.pop();
            break;
            case 'withdraw':
              log(result);
              WithdrawData.update({confirmed: true, confirmedblock:result.block_num, confirmedtxid:result.id},{where:{txid:itemPayload['contractPayload'].txid}}).then((res) => {return res}).catch((e) => {return e});
              if((writeArray.length - 1) == 0) writing = false;
              return writeArray.pop();
            break;
            case 'deposit':
              log(result);
              DepositData.update({confirmed: true, confirmedblock:result.block_num, confirmedtxid:result.id},{where:{txid:itemPayload['contractPayload'].txid}}).then((res) => {return res}).catch((e) => {return e});
              if((writeArray.length - 1) == 0) writing = false;
              return writeArray.pop();
            break;
            case 'payment':
              LoanData.update({startblock:result.block_num, txid:result.id},{where:{loanId:writeArray[item]['contractPayload'].loanId}}).then((res) => {return res;}).catch((e) => {return e});
              if((writeArray.length - 1) == 0) writing = false;
              return writeArray.pop();
            break;
            case 'completed':
              await LoanData.update({startblock:result.block_num, txid:result.id},{where:{loanId:writeArray[item]['contractPayload'].loanId}}).then((res) => {return res;}).catch((e) => {return e});
              if((writeArray.length - 1) == 0) writing = false;
              return writeArray.pop();
            break;
            default:
            if((writeArray.length - 1) == 0) writing = false;
            return writeArray.pop();
          }
          //writeArray = writeArray.pop();
          if((writeArray.length - 1) == 0) writing = false;
          return writeArray.pop();
        }
      });//END Broadcast
    } else {
      log(`itemPayload Bytes > 8196b`);
    }
  }
};

async function writeDaemon() {
  if(debug === true) {
    log(`async function writeDaemon()`);
    log(`writeArray.length: ${writeArray.length}`);
  }
  if(writeArray.length > 0 && writing !== true){
    await jsonHiveWrite(writeArray);
  }
}; //END async function writeDaemon()

if(debug === true) {
  var writeArrayCheck = function(){
    setInterval(function(){
      log(`var writeArrayCheck = function()`);
      log(`writeArray:`);
      log(writeArray);
    }, 15000);
  }
  writeArrayCheck();
};


var writeRobot = function(){
  var roboInterval = setInterval(function(){
    if(writing === true) {
      return log(`WRITE: Blockchain Record Writing in Progress!`);
    } else if(writing === false) {
      writeDaemon();
    }
  }, 3000);
};

writeRobot();



process.on("message", async function(m){
  var sendsocket;
  try {
      m = JSON.parse(m);
      if(debug === true){
        log(`hiveScribe.js Message:`);
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
  }
  switch(m.type) {
    case 'jsonbreadcrumb':
      arrayPacker(m.name, m.action, m.payload);
    break;
  }
});
