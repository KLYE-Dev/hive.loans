const log = require('fancy-log');
const { fetchactive } = require("./api/borrowers.js");
const { fetchlastprice, fetchmanyprice } = require("./api/hiveprice.js");

module.exports.borrowerslist = async function() {
  var fetched = await fetchactive().then(d => {return d}).catch(e => log(e));
  return fetched;
};

module.exports.fetchhiveprice = async function() {
  var fetched = await fetchlastprice().then(d => {return d}).catch(e => log(e));
  return fetched;
};

module.exports.fetchhivepricehistory= async function(amount) {
  var fetched = await fetchmanyprice(amount).then(d => {return d}).catch(e => log(e));
  return fetched;
};
