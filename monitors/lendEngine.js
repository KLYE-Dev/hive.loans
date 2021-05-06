const { config } = require("../config/index.js");
let debug = config.debug;
const owner = config.owner;
var crypto = require("crypto");
const getStringByteSize = require('../snippets/getStringByteSize.js');
const log = require("fancy-log");
const DB = require("../database/models");
const sequelize = DB.sequelize;
const DataBase = sequelize;
const { Op } = require("sequelize");
const Userdata = DataBase.models.Users;
const Depositdata = DataBase.models.Deposits;
const Loandata = DataBase.models.Loans;

var online = process.connected;
var pid = process.pid;
log(`LOANS: Connected: ${online} with PID: ${pid}`);

var loadedLoans = [];
var userSockets = [];
var siteAudit = [];

var messageType;
var sendsocket;
let userData;
let userCheck;
var LoanID;
let loanData;
let loanCheck;
var loanFee;

process.on('message', async function(m) {
  var dateNow = (new Date).toUTCString();
  let loanData;
  try {
      m = JSON.parse(m);
      log(`lendEngine.js Message:`);
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

switch(m.type){
  case 'loadallloans':
  async function loadAllLoans(){
    await Loandata.findAll({
      limit: 200,
      where: { },
      order: [[ 'createdAt', 'DESC' ]],
      raw: true
    }).then(function(entries){
        var loadedLoans = [];
        let cleanedloans = entries.map(function(key) {
            //if (key.id !== -1) {
            //    delete key.id;
            //}
            if (key.userId !== -1) {
                delete key.userId;
            }
            //if (key.username !== -1) {
            //    delete key.username;
            //}

            //if (key.currentpayments !== -1) {
            //    delete key.currentpayments;
            //}
            if (key.deployfee !== -1) {
                delete key.deployfee;
            }
            if (key.payblocks !== -1) {
                delete key.payblocks;
            }
            if (key.cancelfee !== -1) {
                delete key.cancelfee;
            }
            if (key.status == 'cancelled') {
                delete key;
            }
            if (key.totalpayments !== -1) {
                delete key.totalpayments;
            }
            if (key.nextcollect !== -1) {
                delete key.nextcollect;
            }
            if (key.updatedAt !== -1) {
                delete key.updatedAt;
            }
            //if (key.createdAt !== -1) {
            //    delete key.createdAt;
            //}
            return key;
        });
        cleanedloans.forEach((item, i) => {
          loadedLoans.push(item);
        });
        //loadedBets.push(entries);
        process.send(JSON.stringify({
          type:'emit',
          name:'loadallloans',
          socketid: m.socketid,
          payload: [{loans: loadedLoans}],
          token: m.token
        }));
         //process.send(JSON.stringify({type: 'loadallloans', username: m.username, loans: loadedLoans}));
    });
  }
  await loadAllLoans();
  break;
  //END case 'loadallloans'
  case 'loadmyloans':
  async function loadMyLoans(){
    await Loandata.findAll({
      limit: 25,
      where: {username: m.username},
      order: [[ 'createdAt', 'DESC' ]],
      raw: true
    }).then(function(entries){
        var loadedLoans = [];
        let cleanedloans = entries.map(function(key) {
            if (key.id !== -1) {
                delete key.id;
            }
            if (key.userId !== -1) {
                delete key.userId;
            }
            if (key.username !== -1) {
                delete key.username;
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
        cleanedloans.forEach((item, i) => {
          loadedLoans.push(item);
        });
        process.send(JSON.stringify({
          type:'emit',
          name:'loadmyloans',
          socketid: m.socketid,
          payload: [{loans: loadedLoans}],
          token: m.token
        }));
    });
  }
  await loadMyLoans();
  break;
  //END case 'loadmyloans'
    case 'newloan':
    m.amount =  parseInt(m.amount);
      var loanFee;
      var cancelFee;
      userCheck = await Userdata.findOne({where:{username:`${m.username}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
      if (userCheck === null) {
        return log(`LOANS: ERROR: User ${m.username} not found in DB!`);
      } else {
        userData = JSON.parse(JSON.stringify(userCheck));
        switch(userData.rank){
          case 'user':
          loanFee = parseInt((m.amount * 1) / 100);
          cancelFee = parseInt(((m.amount * (m.interest / 10)) * 1) / 100);
          break;
          case 'founder':
          loanFee = parseInt((m.amount * 0.5) / 100);
          cancelFee = parseInt(((m.amount * (m.interest / 10)) * 0.5) / 100);
          break;
          case 'backer':
          loanFee = parseInt((m.amount * 1) / 100);
          cancelFee = parseInt(((m.amount * (m.interest / 10)) * 1) / 100);
          break;
          case 'benefactor':
          loanFee = 0;
          cancelFee = 0;
          break;
          case 'owner':
          loanFee = 0;
          cancelFee = 0;
          break;
        }
        //log(`loanFee:`)
        //log(loanFee)
        //log(`cancelFee:`)
        //log(cancelFee)
        var deploytotalcost = m.amount + loanFee;
        //log(`deploytotalcost:`);
        //log(deploytotalcost);
        if(deploytotalcost <= userData.hivebalance) {
          LoanID = crypto.randomBytes(16).toString('hex');
          sequelize.transaction().then(async function(t) {
          Loandata.create({userId: m.userId, loanId: LoanID, username: m.username, amount: m.amount, days: m.days, interest: m.interest, deployfee: loanFee, cancelfee: cancelFee})
              .then(async function() {
                userData.hivebalance -= deploytotalcost;
                userData.activelends++;
                userData.totallends++;
                await Userdata.update({error:null, hivebalance:userData.hivebalance, activelends: userData.activelends, totallends:userData.totallends},{where:{id:userData.id}});
                t.commit();
                var loanPayload = {userId: m.userId, loanId: LoanID, username: m.username, amount: m.amount, days: m.days, interest: m.interest, deployfee: loanFee};
                log(`LOANS: New Loan from ${m.username} - ${(m.amount / 1000).toFixed(3)} HIVE at ${m.interest}% for ${m.days} days!`);
                process.send(JSON.stringify({
                  type: 'emit',
                  name:'newloanmade',
                  socketid: m.socketid,
                  error:null,
                  payload: loanPayload,
                  token: m.token
                }));
              }).catch(function(error) {
                  t.rollback();
                  console.log(error);
              });
          });
        } else {
          log(`Not enough HIVE in Balance to lend!`);
        }
      }
    break;
    //END case 'newloan'

    case 'acceptloan':
    let loanCheck = await Loandata.findOne({where:{loanId:`${m.loanId}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (loanCheck === null) {
      return log(`SOCKET: ERROR: Loan ${m.loanId} not found in DB!`);
    } else {
      loanData = JSON.parse(JSON.stringify(loanCheck));
      log(loanData);
      if(loanData.username == m.user) return log(`LOANS: ERROR: You Cannot Accept your Own Contracts.`);
      loanAmount = parseInt(loanData.amount);
    }
    userCheck = await Userdata.findOne({where:{username:`${m.user}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (userCheck === null) {
      return log('Error: Faucet failed to fetch users statistics!');
    } else {
      uData = JSON.parse(JSON.stringify(userCheck));//.map(function(userNameCheck){ return userNameCheck.toJSON()});
      log(`CONTRACT: Crediting ${(loanAmount / 1000)} HIVE for ${uData.username} Accepting ContractID #${m.loanId}`);
      uData.hivebalance += loanAmount;
    }//end ellse


    sequelize.transaction().then(async function(t) {
      await Userdata.update({hivebalance: uData.hivebalance, activeloans:(uData.activeloans + 1),  totalloans:(uData.totalloans + 1)},{where:{username:`${user}`}})
      .then( async function() {

          }).catch(function(error) {
            t.rollback();
            console.log(error);
            canUserTransact[user] = true;
            return cb('Claiming Failed, Try again Later!', {token: req.token});
          });
        });
    break;
    //END case 'acceptloan'

    case 'cancelloan':
    if(m.loanId == undefined){
      return log(`LOANS: Variable loanId is Undefined!`);
    }
    userCheck = await Userdata.findOne({where:{username:`${m.username}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (userCheck === null) {
      return log(`LOANS: ERROR: User ${m.username} not found in DB!`);
    } else {
      userData = JSON.parse(JSON.stringify(userCheck));

      var loanChecker = await Loandata.findOne({where:{loanId:`${m.loanId}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});

      if (loanChecker === null) {
        return log(`LOANS: ERROR: Loan ${m.loanId} not found in DB!`);
      } else {
        loanData = JSON.parse(JSON.stringify(loanChecker));
        if(m.username !== owner || m.username !== loanData.username) {
          process.send(JSON.stringify({
            type:'emit',
            name:'loannuked',
            socketid: m.socketid,
            error: 'Cannot Cancel Contract, User Privileges Invalid!',
            payload: null,
            token: m.token
          }));
          return log(`LOANS: @${m.username} Tried to Cancel a Loan Belonging to @${loanData.username}!`);
        }
        var loanAmount = parseInt(loanData.amount);
        if(loanData.active === 0 && loanData.cancelled === 0){
          log(`userData.username`);
          log(userData.username);
          log(`loanData.username`);
          log(loanData.username);

          if(loanData.username == userData.username) {
            loanAmount = parseInt(loanAmount - loanData.cancelfee);
            userData.hivebalance += loanAmount;
            userData.activelends--;
            await Loandata.update({completed: true, cancelled: true, state: 'cancelled'},{where:{loanId:`${m.loanId}`}});
            await Userdata.update({hivebalance:userData.hivebalance, activelends: userData.activelends},{where:{username:m.username}});

            var loanPayload = {userId: loanData.userId, loanId: loanData.loanId, username: loanData.username, amount: loanData.amount, days: loanData.days, interest: loanData.interest, completed: true, cancelled: true, cancelfee: cancelFee};
            process.send(JSON.stringify({
              type:'emit',
              name:'loannuked',
              socketid: m.socketid,
              error: null,
              payload: loanPayload,
              token: m.token
            }));
            } else {
            process.send(JSON.stringify({
              type:'emit',
              name:'loannuked',
              socketid: m.socketid,
              error: 'Cannot Cancel Contract!',
              payload: null,
              token: m.token
            }));
            }
          }
      }
    }
    break;
    //END case 'cancelloan'

    case 'infoloan':
    loanCheck = await Loandata.findOne({where:{loanId:`${m.loanId}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (loanCheck === null) {
      return log(`LOANS: ERROR: Loan ${m.loanId} not found in DB!`);
    } else {
      loanData = JSON.parse(JSON.stringify(loanCheck));
      var loanInfoPayload = JSON.stringify({username: m.username, loanId: m.loanId, loandata: loanData, token: m.token});
      process.send(JSON.stringify({
        type:'emit',
        name:'infoloandata',
        socketid: m.socketid,
        error: null,
        payload: [loanInfoPayload]
      }));
    }
    break;
    //END case 'infoloan'

    case 'myloanlist':
    var histvar;
    if(!m.history) histvar = false;
    var fetchUserLoans = async(history) => {
      if(!history || typeof history != 'boolean') history = false;
    loanCheck = await Loandata.findAll({
            limit: 200,
            where:{
              borrower:`${m.username}`,
              completed:`${history}`,
            },
            order: [ [ 'createdAt', 'DESC' ]],
            raw: true
          }).then(function(entries){

              let cleanedloans = entries.map(function(key) {
                if(history === true) {

                } else {
                  if (key.active == 0) {
                      delete key;
                  }
                  if (key.completed == 0) {
                      delete key;
                  }
                }

                  return loadedLoans.push(key);
                  //return key;
              });
            });
    if (loanCheck === null) {
      return log(`LOANS: ERROR: Loans not found in DB!`);
    } else {
      process.send(JSON.stringify({
        type:'emit',
        name:'myloanlist',
        socketid: m.socketid,
        error: null,
        payload: [{username: m.username, loandata: loadedLoans, token: m.token}]
      }));
    }
  };
    await fetchUserLoans(histvar);
    break;
    //END case 'myloanlist'

    case 'statecheck':
    var fetchUserState = await Loandata.findAll({
      where: {username: m.username},
      order: [ [ 'createdAt', 'DESC' ]],
      raw: true
    }).then(function(entries){
        var loanStates = [];
        let stateCheked = entries.map(function(key) {
            if (key.id !== -1) {
                delete key.id;
            }
            if (key.username !== -1) {
                delete key.username;
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
        stateCheked.forEach((item, i) => {
          loanStates.push(item);
        });
        if (loanStateCheckNow === null) {
          return log(`LOANS: ERROR: Loans not found in DB!`);
          process.send(JSON.stringify({
            type:'emit',
            name:'statereply',
            socketid: m.socketid,
            error: 'loans not found!',
            payload: [{username: m.username, loanstates: loanStates, token: m.token}]
          }));
        } else {
          process.send(JSON.stringify({
            type:'emit',
            name:'statereply',
            socketid: m.socketid,
            error: null,
            payload: [{username: m.username, loanstates: loanStates, token: m.token}]
          }));
        }
    });
    await fetchUserState();
    break;
    //END case 'statecheck'
    case 'useraudit':
    var fetchUserState = await Loandata.findAll({
      where: {username: m.username},
      order: [ [ 'createdAt', 'DESC' ]],
      raw: true
    }).then(function(entries){
        var loanStates = [];
        let stateCheked = entries.map(function(key) {
            if (key.id !== -1) {
                delete key.id;
            }
            if (key.username !== -1) {
                delete key.username;
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
        stateCheked.forEach((item, i) => {
          loanStates.push(item);
        });
        if (loanStateCheckNow === null) {
          return log(`LOANS: ERROR: Loans not found in DB!`);
          process.send(JSON.stringify({
            type:'emit',
            name:'statereply',
            socketid: m.socketid,
            error: 'loans not found!',
            payload: [{username: m.username, loanstates: loanStates, token: m.token}]
          }));
        } else {
          process.send(JSON.stringify({
            type:'emit',
            name:'statereply',
            socketid: m.socketid,
            error: null,
            payload: [{username: m.username, loanstates: loanStates, token: m.token}]
          }));
        }
    });
    await fetchUserState();
    break;
    //END case 'useraudit'
    case 'siteaudit':
            var loanState = [];
            var userState = [];
            var bankState = [];

                async function fetchUsersSiteState(){
                  var wew = await Userdata.findAll({
                    where:{
                      createdAt: {
                        [Op.lte]: dateNow
                    }
                  },
                    order: [[ 'createdAt', 'DESC' ]],
                    raw: true
                  }).then(function(entries){
                      let usersCheked = entries.map(function(key) {
/*
"userId":13,
"rank":"user",
"hivebalance":0,
"feesorder":0,
"totalcfdtrade":0,
"feescfdtrade":0,
"activeloans":1,
"closedloans":0,
"feesloans":0,
"totalloans":10,
"activelends":1,
"closedlends":0,
"totallends":50,
"feeslends":0,
"deposits":0,
"depositstotal":0,
"withdrawals":10,
"withdrawalstotal":17633,
"withdrawalsfee":3596,
"totalfees":0
*/

                        delete key.id;
                        //delete key.userId;
                        delete key.username;
                        delete key.level;
                        delete key.xp;
                        delete key.xpmulti;
                        delete key.siterank;
                        delete key.disclaimer;
                        //delete key.hivebalance;
                        delete key.hiveprofit;
                        //delete key.shares;
                        delete key.shareprofit;
                        delete key.cfdprofit;
                        delete key.investedproft;
                        delete key.investedpercent;
                        delete key.address;
                        delete key.emergencyaddress;
                        delete key.siterank;
                        delete key.activeorder;
                        delete key.hbdbalance;
                        delete key.closedorder;
                        delete key.totalorder;
                        delete key.activecfdtrade;
                        delete key.closedcfdtrade;
                        delete key.invested;
                        delete key.totallends;
                        //delete key.feeslends;
                        delete key.deposits;
                        delete key.depositstotal;
                        delete key.withdrawals;
                        delete key.withdrawalstotal;
                        //delete key.withdrawalfees;
                        //delete key.totalfees;
                        delete key.flags;
                        delete key.createdAt;
                        delete key.updatedAt;
                        return key;
                      });
                      usersCheked.forEach((item, i) => {
                        userState.push(item);
                      });
                      if (userState == null || loanState == null) {
                        return log(`LOANS: ERROR: Loans not found in DB!`);
                        process.send(JSON.stringify({
                          type:'massemit',
                          name:'siteaudit',
                          error: 'site audit failed!',
                          payload: [{loansstate: loanState, usersstate: userState, date: dateNow}]
                        }));
                      } else {
                        process.send(JSON.stringify({
                          type:'massemit',
                          name:'siteaudit',
                          error: null,
                          payload: [{loansstate: loanState, usersstate: userState, date: dateNow}]
                        }));
                        return wew;
                      }
                  });
                }
    var stateLoanCheked;
    async function fetchLoansState() {
      await Loandata.findAll({
        raw: true
      }).then(async function(entries){
          stateLoanCheked = entries.map(function(key) {
              //if (key.id !== -1) {
              //    delete key.id;
              //}
              //if (key.userId !== -1) {
              //    delete key.userId;
              //}
              //if (key.nextcollect !== -1) {
              //    delete key.nextcollect;
              //}
              //if (key.createdAt !== -1) {
              //    delete key.createdAt;
              //}
              return key;
          });
          stateLoanCheked.forEach((item, i) => {
            loanState.push(item);
          });
          await fetchUsersSiteState();
      });
    }
    await fetchLoansState();
    break;
  }
})//END process.on message
