const hive = require("@hiveio/hive-js")
const log = require('fancy-log');
const { config } = require("../config/index.js");
let debug = config.debug;
let owner = config.owner;

hive.api.setOptions({ url: "https://api.deathwing.me" });

module.exports.fetch = async(user) => {
  if(debug === true) log(`.fetch = async(${user})`)
  await hive.api.getAccounts([`${user}`], function(err, response){
    var secondsago = (new Date - new Date(response[0].last_vote_time + "Z")) / 1000;
     var vpow = response[0].voting_power + (10000 * secondsago / 432000);
      vpow = Math.min(vpow / 100, 100).toFixed(2);
      return vpow;
  });
}
