//REMOVE RETURN BELOW TO RE-ENABLE SMART CONTRACT SHIT
return;

const spawn = require("child_process");
var {deployENS, ENS} = require('@ethereum-waffle/ens');
const log = require("fancy-log");
var gethclient = require("./gethSwitch.js");

let accounts = [];
var wallet = [];
var online = process.connected;
var pid = process.pid;
log(`SMART: Connected: ${online} with PID: ${pid}`);


var nodeshit = {
    host: "127.0.0.1",
    network_id: "73423",
    port: 30303,
    rpcport: 8545
};

var ethers = require('ethers');

const url = "http://127.0.0.1:8545";

let sideChainStream = new ethers.providers.JsonRpcProvider(url);
// Force page refreshes on network changes
  sideChainStream.on("network", (n, o) => {
    log(n);
      if (o) {
        log(`old Network`);//window.location.reload();
      };
  });

sideChainStream.on("block", async(blockNumber) => {
  log(`Hive Smart Chain #${blockNumber}`);
});

var ens = ENS;

var startTestENS = async() => {
//var makeHIVE = await spawn.execFile('truffle.cmd compile', '--reset'); // , [], {}
  log(`SMART: Side Chain Domain Registry Starting...`);
  ENS = await deployENS(wallet);
  ens = ENS;
  await sideChainStream.setupENS();
  await sideChainStream.ens.createTopLevelDomain('.test');
  await ens.createSubDomain('test.test');
  await ens.setAddressWithReverse('test.test.test', wallet, {recursive: true});s
}

//startTestENS();
