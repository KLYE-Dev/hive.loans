const log = require('fancy-log');
const { fetchactive } = require("./api/borrowers.js");
const { fetchlastprice, fetchmanyprice } = require("./api/hiveprice.js");
const { lastAudit } = require("./api/siteaudit.js");

module.exports.borrowerslist = async function() {
  var fetched = await fetchactive().then(d => {return d}).catch(e => log(e));
  return fetched;
};

module.exports.fetchhiveprice = async function() {
  var fetched = await fetchlastprice().then(d => {return d}).catch(e => log(e));
  return fetched;
};

module.exports.fetchhivepricehistory = async function(amount) {
  var fetched = await fetchmanyprice(amount).then(d => {return d}).catch(e => log(e));
  return fetched;
};

module.exports.lastAudit = async function() {
  var fetched = await lastAudit().then(d => {return d}).catch(e => log(e));
  return fetched;
};
