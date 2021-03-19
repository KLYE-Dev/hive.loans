var socket = io();

if(debug === true){
  var onevent = socket.onevent;
  socket.onevent = function (packet) {
      var args = packet.data || [];
      onevent.call (this, packet);    // original call
      packet.data = ["*"].concat(args);
      onevent.call(this, packet);      // additional call to catch-all
  };

  socket.on("*",function(event, data) {
      if(event === 'latestblock') return;
      if(event === 'priceupdate') return;
      console.log(`===============================\nName: ${event}`);
      console.log(data);
      console.log(`===============================`);
  });
}

socket.on('connect', function(data){
  //console.log(`Browser Client SocketID: ${socket.id}`);
  bootbox.hideAll();
  showSuccess('Welcome to the Hive.Loans');
  $("#trollbox").html(`<h6 style="font-size:xx-small;">${hiveloanslogo}<br>${versionwarning}</h6>`);
  $("#jumbotron").center();
  $('#loadingscreenblack').fadeOut('slow');
  if($(`#usernamestore`).val().length > 0) logout();
});

socket.on('walletdata', function(data){
  console.log(data);
  var user = data.username;
  var address = data.address;
  let walletContent = `<center><table style="width:90%;"><tbody><tr><td>HIVE Balance</td></tr><tr><td><center><div class="casperInput input-group" style=""><input type="number" id="userhivebalance" readonly aria-describedby="basic-addon2"><span class="input-group-append"><span class="input-group-text" id="basic-addon2"><b><i class="fab fa-hive" style="color:#E31337;"></i></b></span></span></div></center></td></tr><tr><td><button type="button" style="width:40%;font-weight:900;    font-size: large;" class="button" id="depositbuttonwallet" onClick="depositButtonWallet(\'${user}\', 'HIVE')" title="Click here to begin a deposit to Hive.Loans">Deposit HIVE <i class="fab fa-hive" style="color:#E31337;"></i></button><button type="button" style="width:40%;font-weight:900;    font-size: large;" class="button" id="withdrawhiveshithere" onClick="withdrawButtonWallet(user, 'HIVE')" title="Click here to begin a Withdraw from Hive.Loans">Withdraw HIVE <i class="fab fa-hive" style="color:#E31337;"></i></button></td></tr></tbody></table></center><center><h4>Manual Deposit Information<br><sub>Include the Address and Memo below in your Transfer</sub></h4>Address:<br><input type="text" id="depositName"  title="click to copy to clipboard" onmouseover="this.select()" onclick="copyStringToClipboard(this.value)" style="background: white;color: black;text-align: center;width: 9vw;height: 3vh;font-size: large; border-radius:10px;" readonly><br>Memo:<br><input type="text" id="depositMemo" style="background: white;color: black;text-align: center;width: 70%;height: 3vh;font-size: large; border-radius:10px;" title="click to copy to clipboard" onmouseover="this.select()" onclick="copyStringToClipboard(this.value)" onload="$(this.val(uAddress))" readonly><hr><a href="#" style="text-decoration:none !important;color:white !important;" onClick="showWalletHistory();"></sub>click here to view your wallet history</sub></a><br>` +
  `<br><span id="wallethistoryspan"></span></center>`;
  $("#jumbotron").promise().done(function(){
    $("#jumboTitle").html(`Hive.Loans - @${user} Wallet`);
    $("#jumboWrapper").html(walletContent);
    $('#loginDataSave').val(address);
    $('#userhivebalance').val((data.hivebalance / 1000).toFixed(3));
    //$('#userhbdbalance').val((data.hbdbalance / 1000).toFixed(3));
    $('#depositName').val(data.username);
    $('#depositMemo').val(data.address);
    $("#jumbotron").css({'height':'auto','width':'25%'});
    $("#jumbotron").center();
    $("#jumbotron").fadeIn();
  });
});

socket.on('token', function(data){
  token = data.token;
});

socket.on('infoloandata', function(data){
  try {
    token = data.token
    data = data.loandata;
  } catch(e) {
    console.log(`Error: ${e}`);
  }
  console.log(data);
  //{"id":7,"userId":1,"loanId":"e15f732fdfaf1324e4d4bb0b15c26105","username":"klye","amount":1000,"days":7,"interest":10,"borrower":null,"nextcollect":"2021-02-09T18:41:20.000Z","collected":0,"currentpayments":0,"totalpayments":0,"active":0,"completed":0,"createdAt":"2021-02-09T18:41:20.000Z","updatedAt":"2021-02-09T18:41:20.000Z"}
  var newinterest = (data.interest / 100);
  data.totalpayments = (data.days / 7);
  var totalrepay =  data.amount + (data.amount * newinterest);
  var paymentSum = totalrepay / data.totalpayments;
  if(data.borrower == null){
    data.borrower = 'none';
  }
  if(data.active == 0){
    data.active = `<center><button class="acceptButton push_button4" style="float:left;" id="acceptButton" onclick="acceptContract('${data.loanId}');">Accept <i class="fas fa-fw fa-coins" style="color:gold;"></i></button></center>`;
  } else {
    data.active = 'In Progress';
  }
  if(data.conpleted === 0){
    data.conpleted = 'Waiting';
  }

  var date = new Date(data.createdAt);
  date = date.toString();
  date = date.slice(0, (date.length - 20));

  var hyperdatatable = `<table class=" " style="background: #444444; border-radius: 10px; border: inset 2px grey; width: 100% !important; height: 5% !important;"><tbody><tr><td><code>Loan ID</code><br>${data.loanId}</td><td><code>Lender</code><br>@${data.username}</td><td><code>Amount</code><br>${(data.amount / 1000)} HIVE</td><td><code>Interest Rate</code><br>${data.interest}%</td><td><code>Repaid:</code><br>${(data.collected / 1000)} HIVE</td><td><code>Contract Total Cost:</code><br>${(totalrepay / 1000)} HIVE</td><td><code>Duration</code><br>${data.days} days</td><td><code>Borrower</code><br>${data.borrower}</td><td><code>Payments</code><br>${data.currentpayments} / ${data.totalpayments} <i class="far fa-fw fa-question-circle" title="Payment Amounts of ${(paymentSum / 1000)} HIVE Weekly"></i></td><td><code>Active</code><br>${data.active}</td></tr></tbody></table>`; //<td><code>Completed</code><br>${data.completed}</td><td><code>Created</code><br>${date}</td>
    $('#loadloaninfo').html(`${hyperdatatable}`);
});


socket.on('backersupdate', function(data){
  return;
  try {
    data = data.deposits;
  } catch(e) {
    console.log(`Error: ${e}`);
  }
  data.forEach((item, i) => {
    if(!backerlist.includes(item.username)){
      backerlist.push(item.username)
    }
  });
  backercount = backerlist.length;
  $('.lendingtable').css({'width':'100%'})
  CreateTableFromJSON(data, 'backers', 'activeBackerView', 'activeBackerTable', 'activeBackerHead');
});

socket.on('newloan', function(data){
  console.log(data);
  showSuccess(`Loan ${data.loanId} Created!`);
  showLend()
});

socket.on('nukeloan', function(data){
  console.log(data);
  showSuccess(`Loan ${data.loanId} Cancelled!`);
  showLend()
});


socket.on('newloanmade', function(data){
  showSuccess(`Attempting to Create Lending Contract...`);
});

socket.on('loannuked', function(data){
  showSuccess(`Attempting to Cancel Lending Contract...`);
});

socket.on('loadallloans', async function(data) {
  console.log(`loadallloans fired!`);
  if(data){
    var unmolestdata = data;
      //if(data.error) return showErr(data.error);
      console.log(data);
      var lendMax;
      var hpFloat;


      let loansContent =`<span id="loadAllLoans" style="width:100% !important; height:100% !important; overflow-y:scroll;"></span><table id="header-fixed" style="max-height:30% !important;"></table>`+ //<span id="contractcount"></span>Available HIVE Lending Contracts</b><br>
      `<b>Lending Contract Information:</b><span id="loadloaninfo"></span><br><br>`+
      `<table style="text-align: center; width: 90%;"><tbody><tr><td><b>Your Current HIVE Power Level:</b><br><span id="loansHPdisplay"></span></td><td><code><span id="loanEnabled"></span></code></td><td><b>Lending Credit Maximum:</b><br><span id="loanMax" value=""></span> HIVE</td></tr><tr><td><b>Active Loan Browser:</b><br><span id="loadActiveloans"></span></td></tr></tbody></table><br>`+
      `<br>`+
      //`<b>Leverage your HIVE account as collateral and get liquid HIVE into your Hive.Loans Account in less than 30 seconds!</b><br>` +
      `<br><br>`+
      `<br></center>`;
      $("#jumbotron").promise().done(function(){
          $("#jumboWrapper").html(loansContent);
          $("#jumbotron").css({'height':'85%','width':'60%'});
          $("#jumbotron").center();
          $("#jumboTitle").html(`Hive.Loans - Lending Contract Pool Overview`);
            var hyperdatatable = `<table id="hyperdatatable" id="loadloans" class=" " style="background: #444444; border-radius: 10px; border: inset 2px grey; width: 100% !important; height: 5% !important;"><tbody><tr><td><code>Loan ID</code><br>~</td><td><code>Lender</code><br>~</td><td><code>Amount</code><br>~</td><td><code>Interest Rate</code><br>~</td><td><code>Repayment Total</code><br>~</td><td><code>Duration</code><br>~</td><td><code>Borrower</code><br>~</td><td><code>Payments</code><br>~ / ~</td><td><code>Active</code><br>~</td></tr></tbody></table>`; //<td><code>Completed</code><br>~</td><td><code>Created</code><br>~</td>
            $('#loadloaninfo').html(`${hyperdatatable}`);

            var activeLoanTable = `<table class="ourloans" id="ourloans" style="background: #444444; border-radius: 10px; border: inset 2px grey; width: 100% !important; height: 10% !important;"><tbody><tr><td><code>Loan ID</code><br>~</td><td><code>Lender</code><br>~</td><td><code>Amount</code><br>~</td><td><code>Interest Rate</code><br>~</td><td><code>Repayment Total</code><br>~</td><td><code>Duration</code><br>~</td><td><code>Borrower</code><br>~</td><td><code>Payments</code><br>~ / ~</td><td><code>Active</code><br>~</td><td><code>Completed</code><br>~</td><td><code>Created</code><br>~</td></tr></tbody></table>`;
            $('#loadActiveloans').html(`${activeLoanTable}`);

                  $(`#contractcount`).html(`${data.loans.length}`);
                  var loans = data.loans;
                  var ourloans = [];
                 unmolestdata.loans.map(function(key) {
                   if(key.borrower == uUsername && key.completed == 0 && key.active == 1){
                     if (key.cancelled !== -1) {
                         delete key.cancelled;
                     }
                     if (key.id !== -1) {
                         delete key.id;
                     }
                     if (key.active !== -1) {
                         delete key.active;
                     }
                     if (key.createdAt !== -1) {
                         delete key.createdAt;
                     }
                       ourloans.push(key);
                   }
                  });
                  if(!data.loans) {data.loans = []};
                  if(!ourloans) {ourloans = []};
                  CreateTableFromJSON(ourloans, 'ourloans', 'loadActiveloans', 'loadActiveTable', 'loadActiveHead');
                  CreateTableFromJSON(data.loans, 'loadloans', 'loadAllLoans', 'loadAllLoansTable', 'loadAllLoansHead');
          //$('#loadloaninfo').html(`Select a lending contract to inspect above`);
          //$("#jumbotron").fadeIn();
      });
      var gettheaccount = await getHivePower(uUsername);
      gettheaccount = JSON.parse(gettheaccount);
      console.log(gettheaccount);
      loanMax = Math.floor(gettheaccount.credit);
      var hpNow = gettheaccount.hp;
      $('span#loanMax').val(`${loanMax.toFixed(3)}`);
      $('span#loanMax').html(`${loanMax.toFixed(3)}`);
      $('span#loansHPdisplay').val(`${hpNow.toFixed(3)}`);
      $('span#loansHPdisplay').html(`${hpNow.toFixed(3)}`);
  }
});

socket.on('loadedLoans', async function(data){
  if(data){
    var dataGrab = await getUserSiteBalance(uUsername).then(res => { return res }).catch(error => {console.log(error)});
    console.log(data);
    if (data.loans.length == 0){
      showErr(`Fetched No Loans from History!`);
    } else if (data.loans.length == 1){
      //showSuccess(`Fetched ${data.loans.length} Loan from History!`);
    } else {
      //showSuccess(`Fetched ${data.loans.length} Loans from History!`);
    }

    let lendingContent =`<center><span id="activeLendView"></span><table id="header-fixed" style="max-height:30% !important;"></table><br>`+
    `<b>Create New Lending Contract</b>` +
    `<table style="width:80%;"><tbody><tr>` +
    `<td><b>Amount of HIVE:</b><br>` +
    `<div class="casperInput input-group"><input type="number" onchange="$('#newamount').val(this.value); createLoanPreview();" onkeyup="$('#newamount').val(this.value); createLoanPreview();" id="newLendAmount" min="10" max="30" step="1" placeholder="10 to 30" required="" aria-label="Interest Rate" aria-describedby="basic-addon2"><span class="input-group-append"><span class="input-group-text" id="basic-addon2"><b><i class="fab fa-hive" style="color:#E31337;"></i></b></span></span></div></td>` +
    `<td><b>Duration</b><br><select onchange="$('#newdays').val(this.value); createLoanPreview();" class="casperInput" style="width:4vw !important;" onchange="$('#newdays').val(this.value);" value="7" id="newLendDays" min="7" max="91" step="7" name="newLendDays" placeholder="7 to 91" required><option value="7">7 Days</option> <option value="14">14 Days</option> <option value="21">21 Days</option> <option value="28">28 Days</option> <option value="35">35 Days</option> <option value="42">42 Days</option> <option value="49">49 Days</option> <option value="56">56 Days</option> <option value="63">63 Days</option> <option value="70">70 Days</option> <option value="77">77 Days</option> <option value="84">84 Days</option> <option value="91">91 Days</option></select></td>`+
    `<td><b>Interest Rate</b><br><div class="casperInput input-group"><input type="number" onchange="$('#newfee').val(this.value); createLoanPreview();" onkeyup="$('#newfee').val(this.value); createLoanPreview();" id="newLendFee" min="10" max="30" step="1" placeholder="10 to 30" required placeholder="Interest Rate" aria-label="Interest Rate" aria-describedby="basic-addon2"><span class="input-group-append"><span class="input-group-text" id="basic-addon2"><b>%</b></span></span></div></td></tr>` +
    `<tr><td><code>Contract Preview:</code><br><span id="createLoanPreview">Select Some Values above to see Preview</span></td></tr>` +
    `<tr><td><button type="button" style="font-size:larger;font-weight:900;" class="button" id="createNewLend" onClick="derp();" title="Click here to create a new lending contract">Create Contract <i class="fas fa-fw fa-vote-yea" style="color:lawngreen;"></i></button></td></tr></tbody></table><br>` +
    `<br><hr>`+
    `Your HIVE Balance:<br><span id="loanPreviewBalance">0.000</span> HIVE`+
    `<br><br>`+
    //`<table style="align-items: center !important; padding: 0px; margin: 0px; width: 100%;"><tbody><tr><td><h4><b>Active HIVE Lending Contracts</b></h4></td><td><h4><b>Completed HIVE Lending Contracts</b></h4></td></tr><tr><td><span id="activeLendView" class=""></span><table id="header-fixed"></table></td><td><div id="oldLendView">Loading Completed HIVE Lending Contracts</div></td></tr></tbody></table>`+
    `</center>`;

    let newLendingContent = `<center><span id="activeLendView"></span><table id="header-fixed" style="max-height:30% !important;"></table><br>` +
    `<b>Create New Lending Contract</b><br><br>` +
    `<b>Amount of HIVE to Lend:</b><br>` +
    `<div class="casperInput input-group"><input type="number" onchange="$('#newamount').val(this.value); createLoanPreview();" onkeyup="$('#newamount').val(this.value); createLoanPreview();" id="newLendAmount" min="10" max="30" step="1" placeholder="10 to 30" required="" aria-label="Interest Rate" aria-describedby="basic-addon2"><span class="input-group-append"><span class="input-group-text" id="basic-addon2"><b><i class="fab fa-hive" style="color:#E31337;"></i></b></span></span></div>` +
    `<b>Duration of Contract:</b><br><select onchange="$('#newdays').val(this.value); createLoanPreview();" class="casperInput" style="width:4vw !important;" onchange="$('#newdays').val(this.value);" value="7" id="newLendDays" min="7" max="91" step="7" name="newLendDays" placeholder="7 to 91" required><option value="7">7 Days</option> <option value="14">14 Days</option> <option value="21">21 Days</option> <option value="28">28 Days</option> <option value="35">35 Days</option> <option value="42">42 Days</option> <option value="49">49 Days</option> <option value="56">56 Days</option> <option value="63">63 Days</option> <option value="70">70 Days</option> <option value="77">77 Days</option> <option value="84">84 Days</option> <option value="91">91 Days</option></select><br>` +
    `<b>Lending Interest Rate</b><br><div class="casperInput input-group"><input type="number" onchange="$('#newfee').val(this.value); createLoanPreview();" onkeyup="$('#newfee').val(this.value); createLoanPreview();" id="newLendFee" min="10" max="30" step="1" placeholder="10 to 30" required placeholder="Interest Rate" aria-label="Interest Rate" aria-describedby="basic-addon2"><span class="input-group-append"><span class="input-group-text" id="basic-addon2"><b>%</b></span></span></div><br>` +
    `<code>Contract Preview:</code><br><span id="createLoanPreview">Select Some Values above to see Preview</span><br>` +
    `<button type="button" style="font-size:larger;font-weight:900;" class="button" id="createNewLend" onClick="derp();" title="Click here to create a new lending contract">Create Contract <i class="fas fa-fw fa-vote-yea" style="color:lawngreen;"></i></button><br>` +
    `` +
    `</center>`;

    //$("#jumbotron").fadeOut('fast');
    $("#jumbotron").promise().done(function(){
        $("#jumboWrapper").html(newLendingContent); //lendingContent
        $("#jumbotron").css({'height':'85%','width':'60%'});
        $("#jumbotron").center();
        CreateTableFromJSON(data.loans, 'loans', 'activeLendView', 'activeLendTable', 'activeLendHead');
        //$("#jumbotron").fadeIn();
        if(dataGrab){
          $("#loanPreviewBalance").html((dataGrab.hivebalance / 1000));
        }
        $("#jumboTitle").html(`Hive.Loans - Lending Contract Overview`);
        $("#newLendAmount").keyup(function (e) {
            if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57 ) ) {
                return false;
            } else {
              if(parseFloat($("#newLendAmount").val()) < 0){
                $("#newLendAmount").val(0);
              }
            }
        });
    });
  }
});

socket.on('depositcredit', function(data){
  showSuccess(`Deposit of ${data.amount / 1000} ${data.coin} Credited!`);
  if (data.coin == 'HIVE'){
    uHIVEbalance = data.balance;
    $('#userhivebalance').val(uHIVEbalance / 1000);
    showWallet(uUsername);
  } else {
    uHBDbalance = data.balance;
    $('#userhbdbalance').val(uHBDbalance / 1000);
    showWallet(uUsername);
  }
});

socket.on('statereply', function(data){
  showErr(data);
  $('#blocknumber').html(`<a href="https://hiveblocks.com/b/${data.block}" target="_blank" title="Click this to view the block on HiveBlocks.com in a new window!" style="color:white !important; text-decoration: none !important;">#${data.block} <i class="fas fa-external-link-square-alt"></i></a>`);
  flashwin($('#blocknumber'));
});

socket.on('latestblock', function(data){
  $('#blocknumber').html(`<a href="https://hiveblocks.com/b/${data.block}" target="_blank" title="Click this to view the block on HiveBlocks.com in a new window!" style="color:white !important; text-decoration: none !important;">#${data.block} <i class="fas fa-external-link-square-alt" style="font-size:x-small;"></i></a>`);
  flashwin($('#blocknumber'));
});

var pricechartInit = 0;

var old_percent_change_1h = 0;
var old_percent_change_24h = 0;
var old_percent_change_7d = 0;
var old_percent_change_30d = 0;

socket.on('hivepriceupdate', function(data){
  console.log(data);
  $('#pricepercentticker').html(`| Total Supply: ${commaNumber((data.total_supply).toFixed(3))} | Market Cap: $${commaNumber((data.market_cap).toFixed(2))} USD | Daily Volume: $${commaNumber((data.volume_24h).toFixed(2))} USD | Last Hour: ${(data.percent_change_1h).toFixed(2)}% | Last Day: ${(data.percent_change_24h).toFixed(2)}% | Past Week: ${(data.percent_change_7d).toFixed(2)}% | Past Month: ${(data.percent_change_30d).toFixed(2)}%`)
});

socket.on('hivepriceupdatebackup', function(data){
  console.log(data);
  $('#pricepercentticker').html(`| Total Supply: --------.--- | Market Cap: $-------.-- USD | Daily Volume: $-.-- USD | Last Hour: -.--% | Last Day: -.--% | Past Week: -.--% | Past Month:-.--%`)
});

socket.on('priceupdate', function(data){
  var type = 'USD';
  //console.log(data);
  /*
  if(pricechartInit == 0) {
    if(data.datasets == undefined) return;
    renderChart(data.datasets, 0, "myChart");
    pricechartInit++;
  } else {
    addData(data.datasets, data.labelssend, "myChart");
  }
  */
  if(oldhiveusdprice > data.hiveusdprice) {
    $('#pricecheck').html(`1 HIVE = $${ data.hiveusdprice} <code><span id="pricetype">USD</span></code>`);
    flashlose($('#pricecheck'));
  } else if (oldhiveusdprice < data.hiveusdprice ){
    $('#pricecheck').html(`1 HIVE = $${ data.hiveusdprice} <code><span id="pricetype">USD</span></code>`);
    flashwin($('#pricecheck'));
  } else if (oldhiveusdprice ==  data.hiveusdprice){
    $('#pricecheck').html(`1 HIVE = $${ data.hiveusdprice} <code><span id="pricetype">USD</span></code>`);
  } else {
    $('#pricecheck').html(`1 HIVE = $${ data.hiveusdprice} <code><span id="pricetype">USD</span></code>`);
  }/*
  if ($('#pricetype').val() == undefined) {
    type = 'USD';
    $('#pricecheck').html(`1 HIVE = $${data.hiveusdprice} <span id="pricetype">${type}</span>`);
    flashwin($('#pricecheck'));
  } else if($('#pricetype').val() == 'BTC'){
    type = 'BTC';
    $('#pricecheck').html(`1 HIVE = $${data.hivebtcprice} <span id="pricetype">${type}</span>`);
    flashwin($('#pricecheck'));
  } else {
    $('#pricecheck').html(`1 HIVE = $${data.hivebtcprice} <span id="pricetype">${type}</span>`);
    flashwin($('#pricecheck'));
    flashwin($('#pricecheck'));
  }
*/
});

socket.on('chatmessage', function(message){
  console.log(message);
    writeToChatBox(message);
    limitTrollBox();
    scrollToTop($("#trollbox"));
});

socket.on('chatHistory', function(hist){
  console.log(`chatHistory`);
  console.log(hist);
  hist = hist.chathist;
  writeBufferToChatBox(hist);
});

socket.on('depositmemo', function(data){
$('#depositmemo').val(data.usernameid);
});

socket.on('withdrawbalance', function(data){
$("#withdrawbalance").val(data.balance);
});

socket.on('tipsent', function(data){
  data.amount = (data.amount/100000000).toFixed(8);
  data.balance = (data.balance/100000000).toFixed(8);
  alertChatMessage({message: "Tip from " + data.from + " for " + data.amount + " STEEM", time: data.time});
  showSuccess("TIP Recieved from " + data.from + " for " + data.amount);
  $("#balance").val(data.balance);
  token = data.token;
});

socket.on('balupdate', function(data){
  if (data.error) return showErr(data.error);
  //console.log("balupdate data:");
  //console.log(data);
    $("#balance").val(data.balance);
});


socket.on('tip', function(data){
  $("#balance").val((data.balance/100000000).toFixed(8));
  showSuccess('Tip received from ' + data.fromuser + " for " + (data.amount/100000000).toFixed(8) + " HIVE");
});


socket.on('adminlogin', function(userident){
  showSuccess('Welcome Back Lord ' + userident);
  $('#adminpagetab').css({'display':'block'});
  socket.emit('populateadmintab', userident);
});

socket.on('makeadmintab', function(admintabcontents){
  $('#adminTab').html(admintabcontents);

});

socket.on('sharesitetake', function(data){
  log(data);
  var siteshare = (data/100000000).toFixed(3);
$('#sitetake').val(siteshare);
});
