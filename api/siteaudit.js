const { config } = require("../config/index.js");
let debug = config.debug;
const owner = config.owner;
const log = require('fancy-log');
const DB = require('../database/models');
const sequelize = DB.sequelize;
const DataBase = sequelize;
const { Op } = require("sequelize");
const AuditData = DataBase.models.Audits;

var dateNow = new Date().getTime();
var time = new Date();

var globalAudit = [];
module.exports.lastAudit = async() => {


    var audit = await AuditData.findOne({
       limit: 1,
       where: {createdAt: {[Op.lte]: dateNow}},
       order: [[ 'createdAt', 'DESC' ]],
       raw: true
    }).then(function(res){
      var auditD = res.data;
      auditD = JSON.parse(auditD);
      res.data = auditD[0];
      delete res.updatedAt;
      res.queryTime = (time).toUTCString();
      return res;
    }).catch(e => log(e));

  log(audit)
  return audit;
}
