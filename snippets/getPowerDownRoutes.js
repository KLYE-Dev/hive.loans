const hive = require("@hiveio/hive-js")
const log = require('fancy-log');
const { config } = require("../config/index.js");
let debug = config.debug;
let owner = config.owner;


module.exports.getRoutes = async(user) => {
  if(debug === true) log(`.fetch = async(${user})`)
  var userWdRoutes = await hive.api.call('get_withdraw_routes', [user], function(err, response){
    if(err) {
      log(err)
      return err;
    }
    if(response) {
      log(response)
      return response;
    }
    });
}
