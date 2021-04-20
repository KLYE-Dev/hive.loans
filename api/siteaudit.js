const log = require('fancy-log');
const DB = require('../database/models');
const sequelize = DB.sequelize;
const DataBase = sequelize;
const { Op } = require("sequelize");
const Userdata = DataBase.models.Users;

module.exports.fetchsiteaudit = async() => {
  var borrowers = [];
  await Userdata.findAll({
     limit: 200,
     where: {activeloans: 1},
     order: [[ 'createdAt', 'DESC' ]],
     raw: true
  }).then( async function(entries){
      let cleaneduserdata = entries.map( await function(key) {
          if (key.id !== -1) {
              delete key.id;
          }
          if (key.userId !== -1) {
              delete key.userId;
          }
          if (key.rank !== -1) {
              delete key.rank;
          }
          if (key.hivebalance !== -1) {
              delete key.hivebalance;
          }
          if (key.hbdbalance !== -1) {
              delete key.hbdbalance;
          }
          if (key.hiveprofit !== -1) {
              delete key.hiveprofit;
          }
          if (key.activeloans !== -1) {
              delete key.activeloans;
          }
          if (key.address !== -1) {
              delete key.address;
          }
          if (key.activelends !== -1) {
              delete key.activelends;
          }
          if (key.closedloans !== -1) {
              delete key.closedloans;
          }
          if (key.closedlends !== -1) {
              delete key.closedlends;
          }
          if (key.totallends !== -1) {
              delete key.totallends;
          }
          if (key.totalloans !== -1) {
              delete key.totalloans;
          }
          if (key.flags !== -1) {
              delete key.flags;
          }
          if (key.updatedAt !== -1) {
              delete key.updatedAt;
          }
          if (key.createdAt !== -1) {
              delete key.createdAt;
          }
          return key;
      });

      await cleaneduserdata.forEach((item, i) => {
        borrowers.push(item['username']);
      });
  });
  borrowers = JSON.parse(JSON.stringify(borrowers));
  return borrowers;
}
