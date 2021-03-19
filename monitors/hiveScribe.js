const { config } = require("../config/index.js");
const log = require("fancy-log");
const hivejs = require('@hiveio/hive-js');
const DB = require("../database/models");
const sequelize = DB.sequelize;
const DataBase = sequelize;
const Userdata = DataBase.models.Users;
const Depositdata = DataBase.models.Deposits;
const Loandata = DataBase.models.Loans;

var online = process.connected;
var pid = process.pid;
log(`WRITE: Connected: ${online} with PID: ${pid}`);

var jsonHiveWrite = async(name, action, payload) => {
  if(!name) return;
  if(!action) return;
  if(!payload) return;
  var sudden_json = {"contractName":`${name}`,"contractAction":`${action}`,"contractPayload": payload};
  sudden_json = JSON.stringify(sudden_json);
  hivejs.broadcast.customJson(config.bankwif, ['hive.loans'], // requiredAuths (for signing json with active key)
  [], `${config.sidechainId}.hive.loans`, sudden_json, await function(err, result) {
  if(err){
    log(err)
    return false;
  }
  if(result) {
    log(result);
    log(`WRITE: jsonHiveWrite left Proof on HIVE Block ${result.block_num} - Updating Local Contract in DB`);
      switch(action){
        case 'newloan':
          Loandata.update({startblock:result.block_num, txid:result.id, state:'deployed'},{where:{loanId:`${payload.loanId}`}});
          userSockets[payload.username].emit(`${action}`, payload);
        break;
        case 'nukeloan':
          Loandata.update({endblock:result.block_num, endtxid:result.id, state:'cancelled', completed: true, cancelled: true},{where:{loanId:`${payload.loanId}`}});
          userSockets[payload.username].emit(`${action}`, payload);
        break;
        case 'startloan':
          Loandata.update({startblock:result.block_num, txid:result.id, state:'accepted'},{where:{loanId:`${payload.loanId}`}});
        break;
        case 'endloan':
          Loandata.update({endblock:result.block_num, txid:result.id, state:'completed'},{where:{loanId:`${payload.loanId}`}});
        break;
        case 'newuser':
          Userdata.update({flags: JSON.stringify([{"genesis":result.block_num, "birthtxid":result.id}])},{where:{userId:payload.userId}});
        break;
        case 'withdraw':
          Loandata.update({startblock:result.block_num, txid:result.id},{where:{txid:`${payload.txid}`}});
        break;
        case 'deposit':
          Loandata.update({startblock:result.block_num, txid:result.id},{where:{txid:`${payload.loanId}`}});
        break;
        case 'payment':
          Loandata.update({startblock:result.block_num, txid:result.id},{where:{loanId:`${payload.loanId}`}});
        break;
        case 'completed':
          Loandata.update({startblock:result.block_num, txid:result.id},{where:{loanId:`${payload.loanId}`}});
        break;
        default:
          return true;
      }
    }
  });//END Broadcast
};

process.on("message", async function(m){
  var sendsocket;
  try {
      m = JSON.parse(m);
      log(`hiveScribe.js Message:`);
      log(m)
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
      await jsonHiveWrite(m.username, m.action, m.payload);
    break;
    case 'hbdspotprice':
      hbdCMCprice();
    break;
  }
});
