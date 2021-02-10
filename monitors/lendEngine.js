var fs = require("fs");
var cp = require("child_process");
var crypto = require("crypto");
const dotenv = require("dotenv");
const log = require("fancy-log");
dotenv.config();
var bankwif = process.env.ACTIVE_PRIVKEY;
var appName = process.env.SITE_ACCOUNT;
const DB = require("../database/models");
const sequelize = DB.sequelize;
const DataBase = sequelize;
const Userdata = DataBase.models.Users;
const Depositdata = DataBase.models.Deposits;
const Loandata = DataBase.models.Loan;



process.on('message', async function(m) {
  try {
      m = JSON.parse(m);
      log(m);
  } catch(e) {
    log(`ERROR: ${e}`);
    return console.error(e);
  }
  if(m.type === 'newloan'){
    var LoanID;
    log(m);
    m.amount =  parseInt(m.amount);

      let userData;
      let userCheck = await Userdata.findOne({where:{username:`${m.username}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
      if (userCheck === null) {
        return log(`LEND-ENGINE: ERROR: User ${m.username} not found in DB!`);
      } else {
        userData = JSON.parse(JSON.stringify(userCheck));
        if(m.amount < userData.hivebalance) {
          userData.hivebalance -= m.amount;
          userData.activelends++;
          userData.totallends++;
          sequelize.transaction().then(async function(t) {
          LoanID = crypto.randomBytes(16).toString('hex');
          Loandata.create({userId: m.userId, loanId: LoanID, username: m.username, amount: m.amount, days: m.days, interest: m.interest})
              .then(async function() {
                  t.commit();
                    await Userdata.update({hivebalance:userData.hivebalance, activelends: userData.activelends, totallends:userData.totallends},{where:{id:userData.id}});
                    var loanPayload = {userId: m.userId, loanId: LoanID, username: m.username, amount: m.amount, days: m.days, interest: m.interest};
                  log(`LEND-ENGINE: New Loan from ${m.username} - ${(m.amount / 1000).toFixed(3)} HIVE at ${m.interest}% for ${m.days} days!`);
                  return process.send(JSON.stringify({type:'newloanmade', user:m.username, payload: loanPayload, token: m.token}));
              }).catch(function(error) {
                  t.rollback();
                  console.log(error);
              });
          });
        }
      }
  } else if (m.type === 'loadmyloans') {

    async function fetchUserLoans(){
      await Loandata.findAll({
        limit: 25,
        where: {username: m.username},
        order: [ [ 'createdAt', 'DESC' ]],
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
          //loadedBets.push(entries);

          process.send(JSON.stringify({
              type: 'myloans',
              username: m.username,
              loans: loadedLoans
          }));
      });
    }
    await fetchUserLoans();

  }else if (m.type === 'loadallloans') {
    async function fetchUserLoans(){
      await Loandata.findAll({
        limit: 200,
        where: { },
        order: [ [ 'createdAt', 'DESC' ]],
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
          //loadedBets.push(entries);

          process.send(JSON.stringify({
              type: 'loadallloans',
              username: m.username,
              loans: loadedLoans
          }));
      });
    }
    await fetchUserLoans();

  }  else if (m.type === "cancelloan"){
    let userData;
    let userCheck = await Userdata.findOne({where:{username:`${m.username}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (userCheck === null) {
      return log(`LEND-ENGINE: ERROR: User ${m.username} not found in DB!`);
    } else {
      userData = JSON.parse(JSON.stringify(userCheck));
    }

    let loanData;
    let loanCheck = await Loandata.findOne({where:{loanId:`${m.loanId}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (loanCheck === null) {
      return log(`LEND-ENGINE: ERROR: Loan ${m.loanId} not found in DB!`);
    } else {
      loanData = JSON.parse(JSON.stringify(loanCheck));
      var loanAmount = parseInt(loanData.amount);
      if(loanData.active == 0 && loanData.username == m.username){
      userData.hivebalance += loanAmount;
      userData.activelends--;
      await Loandata.destroy({where:{loanId:`${m.loanId}`}});
      var loanPayload = {userId: loanData.userId, loanId: m.loanId, username: loanData.username, amount: loanData.amount, days: loanData.days, interest: loanData.interest};
      await Userdata.update({hivebalance:userData.hivebalance, activelends: userData.activelends},{where:{username:m.username}});
        process.send(JSON.stringify({
            type: 'loancancelled',
            error: null,
            username: m.username,
            loanId: m.loanId,
            payload: loanPayload,
            token: m.token
        }));
      } else {
        process.send(JSON.stringify({
            type: 'loancancelled',
            error: 'Cannot Cancel Active Contract!',
            username: m.username,
            loanId: m.loanId,
            token: m.token
        }));
      }
    }
  } else if(m.type === 'infoloan'){
    let loanData;
    let loanCheck = await Loandata.findOne({where:{loanId:`${m.loanId}`}, raw:true, nest: true}).then(result => {return result}).catch(error => {console.log(error)});
    if (loanCheck === null) {
      return log(`LEND-ENGINE: ERROR: Loan ${m.loanId} not found in DB!`);
    } else {
      loanData = JSON.parse(JSON.stringify(loanCheck));
      var loanAmount = parseInt(loanData.amount);
        process.send(JSON.stringify({
            type: 'infoloandata',
            error: null,
            username: m.username,
            loanId: m.loanId,
            loandata: loanData,
            token: m.token
        }));
    }
  } else {
    log(`m.type: ${m.type} doesn't have a function response!`)
  }
});//END process.on message
