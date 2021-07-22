const { config } = require("../config/index.js");
let debug = config.debug;
const owner = config.owner;
const getStringByteSize = require('../snippets/getStringByteSize.js');
var crypto = require("crypto");
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
log(`SEER: Connected: ${online} with PID: ${pid}`);

const HiveBlocksPerDay = 28800;

var dateNow = new Date().getTime();

let numWeeks; //integer

var estimateRepayBlockNumArray = (weeks) => {
  let now = new Date();
  now.setDate(now.getDate() + weeks * 7);
  return now;
};

var calcNextPaymentByBlock = (block) => {
  if(!block) return false;
  let newPaymentBlock = 0;
  newPaymentBlock = parseInt((block) + (HiveBlocksPerDay * 7));
  log(`newPaymentBlock`);
  log(newPaymentBlock);
  return newPaymentBlock;
};

//calcNextPaymentByBlock(5555);

var calcEndDateByWeeks = (weeks) => {
  let now = new Date();
  now.setDate(now.getDate() + weeks * 7);
  return now;
};
