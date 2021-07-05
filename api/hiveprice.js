const log = require('fancy-log');
const DB = require('../database/models');
const sequelize = DB.sequelize;
const DataBase = sequelize;
const { Op } = require("sequelize");
const Pricedata = DataBase.models.Pricelog;

module.exports.fetchhivepricebyblock= async(b) => {
  log(`hiveprice.js module.exports.fetchhivepricebyblock called!`);
  if(!b) return log(`hiveprice.js fetchhivepricebyblock had no block specified!`)
  var pricefetch = [];
  await Pricedata.find({
     limit: 1,
     where: { block: parseInt(b)},
     order: [['createdAt', 'DESC']],
     raw: true
  }).then( async function(entries){
      let cleanedpricedata = entries.map( await function(key) {
          if (key.id !== -1) {
              delete key.id;
          }
        key.hivebtcprice = parseFloat(key.hivebtcprice);
        key.hiveusdprice = parseFloat(key.hiveusdprice);
        key.hbdbtcprice = parseFloat(key.hbdbtcprice);
        key.hbdusdprice = parseFloat(key.hbdusdprice);
          if (key.createdAt !== -1) {
              delete key.createdAt;
          }
          return key;
      });

      await cleanedpricedata.forEach((item, i) => {
        pricefetch.push(item);
      });
  });
  pricefetch = JSON.parse(JSON.stringify(pricefetch));
  return pricefetch;
};

module.exports.fetchlastprice = async() => {
  log(`hiveprice.js module.exports.fetchlastprice called!`);
  var pricefetch = [];
  await Pricedata.findAll({
     limit: 1,
     where: { },
     order: [['createdAt', 'DESC']],
     raw: true
  }).then( async function(entries){
      let cleanedpricedata = entries.map( await function(key) {
          if (key.id !== -1) {
              delete key.id;
          }
        key.hivebtcprice = parseFloat(key.hivebtcprice);
        key.hiveusdprice = parseFloat(key.hiveusdprice);
        key.hbdbtcprice = parseFloat(key.hbdbtcprice);
        key.hbdusdprice = parseFloat(key.hbdusdprice);
          if (key.createdAt !== -1) {
              delete key.createdAt;
          }
          return key;
      });

      await cleanedpricedata.forEach((item, i) => {
        pricefetch.push(item);
      });
  });
  pricefetch = JSON.parse(JSON.stringify(pricefetch));
  return pricefetch;
}

module.exports.fetchmanyprice = async(amount) => {
  if(amount > 200) amount = 200;
  amount = parseInt(amount);
  var pricefetch = [];
  await Pricedata.findAll({
     limit: amount,
     where: {},
     order: [[ 'createdAt', 'DESC' ]],
     raw: true
  }).then( async function(entries){
      let cleanedpricedata = entries.map( await function(key) {
          if (key.id !== -1) {
              delete key.id;
          }
          key.hivebtcprice = parseFloat(key.hivebtcprice);
          key.hiveusdprice = parseFloat(key.hiveusdprice);
          key.hbdbtcprice = parseFloat(key.hbdbtcprice);
          key.hbdusdprice = parseFloat(key.hbdusdprice);
          if (key.createdAt !== -1) {
              delete key.createdAt;
          }
          return key;
      });

      await cleanedpricedata.forEach((item, i) => {
        pricefetch.push(item);
      });
  });
  pricefetch = JSON.parse(JSON.stringify(pricefetch));
  return pricefetch;
}
