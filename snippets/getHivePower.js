const hive = require("@hiveio/hive-js")
const log = require('fancy-log');
const { config } = require("../config/index.js");
let debug = config.debug;
let owner = config.owner;

hive.api.setOptions({ url: "https://api.deathwing.me" });

async function splitOffVests(string){
  if(string){
    return parseFloat(string.split(' ')[0]);
  } else {
    return false;
  }
}

module.exports.getHivePower = async(user) => {
  if(!user) return "No User Specified";
    if(debug === true) log(`getHivePower(${user}) Called!`);
    log(`getHivePower(${user}) Called!`);
    var resultData = await hive.api.callAsync('condenser_api.get_accounts', [[`${user}`]]).then((res) => {return JSON.parse(JSON.stringify(res))}).catch((e) => log(e));
    var chainProps = await hive.api.callAsync('condenser_api.get_dynamic_global_properties', []).then((res) => {return JSON.parse(JSON.stringify(res))}).catch((e) => log(e));
    var hivePower = await splitOffVests(resultData[0].vesting_shares);
    var total_vesting_shares = await splitOffVests(chainProps.total_vesting_shares);
    var total_vesting_fund = await splitOffVests(chainProps.total_vesting_fund_hive);
    var hiveVested = parseFloat(((total_vesting_fund *  hivePower ) / total_vesting_shares).toFixed(3));
    return hiveVested;
}
