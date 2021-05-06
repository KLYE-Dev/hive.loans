const hive = require("@hiveio/hive-js")
const log = require('fancy-log');
const { config } = require("../config/index.js");
let debug = config.debug;
let owner = config.owner;

hive.api.setOptions({ url: "https://api.deathwing.me" });

module.exports.fetchRC = async(user) => {
  if(debug === true) log(`.fetch = async(${user})`)
  if(!user) return;
  var ad;
  var resultData = await hive.api.callAsync('condenser_api.get_accounts', [[`${user}`]]).then((res) => {return JSON.parse(JSON.stringify(res[0]))}).catch((e) => log(e));
  var chainProps = await hive.api.callAsync('condenser_api.get_dynamic_global_properties', []).then((res) => {return JSON.parse(JSON.stringify(res))}).catch((e) => log(e));

  var CURRENT_UNIX_TIMESTAMP = parseInt((new Date(chainProps.time).getTime() / 1000).toFixed(0))
  //calculate available SP
  var totalShares = parseFloat(resultData.vesting_shares) + parseFloat(resultData.received_vesting_shares) - parseFloat(resultData.delegated_vesting_shares);
  //determine elapsed time since last RC update
  var elapsed = CURRENT_UNIX_TIMESTAMP - resultData.voting_manabar.last_update_time;
  var maxMana = totalShares * 1000000;
  //calculate current mana for the 5 day period (432000 sec = 5 days)
  var currentMana = parseFloat(resultData.voting_manabar.current_mana) + elapsed * maxMana / 432000;

  if (currentMana > maxMana) currentMana = maxMana;

  //determine percentage of available mana(RC)
  var currentManaPerc = parseFloat((currentMana * 100 / maxMana).toFixed(2));

  return currentManaPerc;
};
