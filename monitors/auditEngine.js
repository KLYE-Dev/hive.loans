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
log(`AUDIT: Connected: ${online} with PID: ${pid}`);

var fetchSiteRC = async() => {
  var hotwalletRC = await manaBar.fetchRC(hotwallet);
  log(`hotwalletRC: ${hotwalletRC}%`);
  log(hotwalletRC);
};

process.on("message", async function(m){
  var sendsocket;
  try {
      m = JSON.parse(m);
      if(config.debug === false){
        log(`auditEngine.js Message:`);
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
    case 'walletaudit':

    break;
    case 'useraudit':

    break;
  }
});
