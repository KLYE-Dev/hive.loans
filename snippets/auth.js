#! /usr/bin/env node
//^ We need that to have this on CLI applications
const hive = require("@hiveio/hive-js");
const { config } = require("../config/index.js");
let debug = config.debug;
const owner = config.owner;
module.exports.startup = async() => {
  await hive.api.getConfig(function(err, result) {
      if(err) return err;
          return result;
          //console.log(result);
          //lastSafeBlock = parseInt(result["last_irreversible_block_num"]);
          //return result["last_irreversible_block_num"];
  });
}
