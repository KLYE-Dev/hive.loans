const Migrations = artifacts.require("Migrations.sol");

module.exports = function(deployer) {
  //const config = TruffleConfig.networks[addresses];

  deployer.deploy(Migrations);

};
