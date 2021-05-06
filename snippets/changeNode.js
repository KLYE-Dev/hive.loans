const hive = require("@hiveio/hive-js")
const log = require('fancy-log');
const { config } = require("../config/index.js");
let debug = config.debug;
let owner = config.owner;
let apiindex = 0;

const apinodes = ["hived.privex.io", "api.hivekings.com", "api.deathwing.me", "api.hive.blog", "api.openhive.network", "hive.roelandp.nl", "hive-api.arcange.eu", "rpc.ausbit.dev", "anyx.io"];
const ournode = ["rpc.hive.loans"]

hive.api.setOptions({ url: "https://api.deathwing.me" });

module.exports.changenode = async() => {
  if (apiindex < apinodes.length){
    apiindex++;
  } else if (apiindex == apinodes.length) {
    apiindex = 0;
  }
  if(debug === true) log(`changeNode.js: Changed API Node to ${apinodes[apiindex]}`);
  await hive.api.setOptions({ url: `https://${apinodes[apiindex]}` });
}
