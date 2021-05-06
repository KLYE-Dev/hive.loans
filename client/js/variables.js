var output;
var token = '';
var keyclicks = 0;

var options = {
  useEasing : false,
  useGrouping : false,
  separator : '',
  decimal : '.',
  prefix : '',
  suffix : ''
};
var debug = false;

var skcLinkData;

let usersDataFetch;
let usersLoanDataFetch;
var founderlist = '';
var foundercount = 0;
var backerlist = [];
var hypertabletwo;
var backercount = 0;
var username = "";
var user;
var hkcLogin = false;
var depositDelaySec = 0;
var uHIVEbalance = 0;
var uHBDbalance = 0;
var uAddress = '';
var uUsername = '';
var manualPay = 0;
var oldhiveusdprice;
var oldhivebtcprice;
var sound = false;
var userDelegations = [];
var siteAudit = [];
var userWalletFetchData;

let hiveprice;
let hivechart;
let areaSeries;
let candlestickSeries = [];
let dataChart = [];
let currentBusinessDay;
let chartlength;
let currentIndex;
let lastIndex;
let lastClose;

let activecurrency = 'hive';

let tickercurrency = 'usd';
let lastHiveBTCPrice;
let lastHivePrice;

let exchangetype = 'hlshare';
let exchangebase = 'hive';

var total_vesting_shares;
var total_vesting_fund;

//const barSeries = loanchart.addBarSeries();

var context = new AudioContext();
var nyannyan = new Audio('./sound/nyan.mp3');

var memo_key;
var owner_key;
var active_key;
var posting_key;
var profiledata;
var dateCreated;
var witdeclaration;
var reputation;
