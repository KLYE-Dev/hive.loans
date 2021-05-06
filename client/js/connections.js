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
  $("#alertpanel").css({'left':'0.5%','top':'57%','height':'50%','width': '18%','position': 'absolute'});

  var dangerPrice = `<script type="text/javascript">` +
  `var cf_widget_size = "large";` +
  `var cf_widget_from = "HIVE";` +
  `var cf_widget_to = "usd";` +
  `var cf_widget_name = "Hive";` +
  `var cf_clearstyle = false;` +
  `</script>`;
  $("#alertWrapper").html(dangerPrice);
  $("#alertpanel").fadeIn();
  $("#trollbox").eq(-1).html(`<h6 style="font-size:xx-small;">${hiveloanslogo}<br>${versionwarning}</h6>`);
  $("#jumbotron").center();
  $('#loadingscreenblack').fadeOut('slow');
  if($(`#usernamestore`).val().length > 0) logout();
});

socket.on('siteaudit', function(data){
  if(debug === true) console.log(`siteaudit data: ${JSON.parse(JSON.stringify(data))}`);
  data = JSON.parse(JSON.stringify(data));
  siteAudit = data;
  siteAuditData();
});

socket.on('walletdata', function(data){


  if(data) {
    data = data[0];
    userWalletFetchData = data;
  } else {
    return;
  }
  console.log(`walletdata data:`)
  console.log(data);

  user = data.username;
  var address = data.address;
  let walletContent = `<center>` +
  `<table style="width:90%;">` +
  `<tbody>` +
  `<tr>` +
  `<td>HIVE Balance</td>` +
  `</tr>` +
  `<tr>` +
  `<td>` +
  `<center>` +
  `<div class="casperInput input-group" style="">` +
  `<input type="number" id="userhivebalance" readonly aria-describedby="basic-addon2">` +
  `<span class="input-group-append">` +
  `<span class="input-group-text" id="basic-addon2">` +
  `<b><i class="fab fa-hive" style="color:#E31337;"></i></b>` +
  `</span>` +
  `</span>` +
  `</div>` +
  `</center>` +
  `</td>` +
  `</tr>` +
  `<tr>` +
  `<td>` +
  `<button type="button" style="" class="button" id="depositbuttonwallet" onClick="depositButtonWallet(\'${user}\', 'HIVE')" title="Click here to begin a deposit to Hive.Loans">` +
  `DEPOSIT ` +
  `<span class="activeName">HIVE</span> ` +
  `<span class="activeLogo"><i class="fab fa-hive" style="color:#E31337;"></i></span>` +
  `</button>` +
  `<button type="button" style="" class="button" id="withdrawhiveshithere" onClick="withdrawButtonWallet(user, 'HIVE')" title="Click here to begin a Withdraw from Hive.Loans">` +
  `WITHDRAW ` +
  `<span class="activeName">HIVE</span> ` +
  `<span class="activeLogo"><i class="fab fa-hive" style="color:#E31337;"></i></span>` +
  `</button>` +
  `</td>` +
  `</tr>` +
  `</tbody>` +
  `</table>` +
  `</center>` +
  `<center>` +
  `<h4>` +
  `Manual Deposit Information` +
  `<br>` +
  `<sub>` +
  `Include the Address and Memo below in your Transfer` +
  `</sub>` +
  `</h4>` +
  `Address:` +
  `<br>` +
  `<input type="text" id="depositName"  title="click to copy to clipboard" onmouseover="this.select()" onclick="copyStringToClipboard(this.value)" readonly>` +
  `<br>` +
  `Memo:` +
  `<br>` +
  `<input type="text" id="depositMemo" onmouseover="this.select()" onclick="copyStringToClipboard(this.value)" onload="$(this.val(uAddress))" readonly>` +
  `<hr class="allgrayeverythang">` +
  `<sub><span id="withhistswitch" class="paintitwhite">Withdrawals</span> - <a href="#" id="showWalletHistory" onClick="showWalletHistory();">Click Here to Show Your Wallet History</a> - <span id="depohistswitch" class="paintitwhite">Deposits</span></sub>` +
  `<br>` +
  `<span id="wallethistoryspan">` +
  `<div id="walletHistoryInset" class=" hidden">` +
  `<span id="walletHistoryTableHolder">` +
  `</span>` +
  `</div>` +
  `</span>` +
  `</center>`;
  $("#jumbotron").promise().done(function(){
    $("#jumboBack").show();
    $("#jumboMove").show();
    $("#jumboForward").show();
    $("#jumboHead").show();
    $("#jumboBack").removeClass("hidden");
    $("#jumboMove").removeClass("hidden");
    $("#jumboForward").removeClass("hidden");
    $("#jumboTitle").text(`Your Hive.Loans Wallet`);
    $("#jumboWrapper").html(walletContent);
    $('#loginDataSave').val(address);
    $('#userhivebalance').val((data.hivebalance / 1000).toFixed(3));
    $('#walletHistoryInset').fadeOut();
    //$('#userhbdbalance').val((data.hbdbalance / 1000).toFixed(3));
    $('#depositName').val('hive.loans');
    $('#depositMemo').val(data.address);
    $("#jumbotron").css({'top':'10%','height':'auto','width':'25%'});
    $("#jumbotron").center();
    $("#jumbotron").fadeIn();
  });
});

socket.on('token', function(data){
  token = data.token;
});
//(data, name, elementid, tablename, tableheadname)
var walletHistoryTable  = `<table class="" id="wht" style="">` +
`</table>`;

socket.on('wallethistory', function(data){
  if(data) {
    console.log(`wallethistory data:`);
    console.log(data);
    $('#walletHistoryTableHolder').html(walletHistoryTable);
    CreateTableFromJSON(data, 'withdrawhistory', 'walletHistoryTableHolder', 'wht', 'whth');

  }
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


socket.on('loadmyloans', async function(err, data){
  console.log(`socket.on('loadmyloans',`)
  if(err) showErr(err);
  if(data) {
    usersLoanDataFetch = data;
    openMainLoanTab();
    //showSuccess(data);
  }
});

socket.on('loadallloans', async function(data) {
  console.log(`loadallloans fired!`);
  if(data){
    var untappeddata = data[0];
      //if(data.error) return showErr(data.error);
      console.log(data);
      var lendMax;
      var hpFloat;


      let loansContent =`<span id="loadAllLoans" style="width:100% !important; height:100% !important; overflow-y:scroll;">` +
      `</span>` +
      `<table id="header-fixed" style="max-height:30% !important;">` +
      `</table>`+ //<span id="contractcount"></span>Available HIVE Lending Contracts</b><br>
      `<b>Lending Contract Information:</b>` +
      `<span id="loadloaninfo"></span>` +
      `<br>` +
      `<br>` +
      `<table style="text-align: center; width: 90%;">` +
      `<tbody>` +
      `<tr>` +
      `<td>` +
      `<b>Your Current HIVE Power Level:</b>` +
      `<br>` +
      `<span id="loansHPdisplay"></span>` +
      `</td>` +
      `<td>` +
      `<code><span id="loanEnabled"></span></code>` +
      `</td>` +
      `<td>` +
      `<b>Lending Credit Maximum:</b>` +
      `<br>` +
      `<span id="loanMax" value=""></span> HIVE` +
      `<br>` +
      `<br>` +
      `<b>Currently Delegated:</b>` +
      `<br>` +
      `<span id="loanDelegation"></span> HIVE` +
      `<br>` +
      `<br>` +
      `<b>Max Weekly Powerdown:</b>` +
      `<br>` +
      `<span id="loanMax7"></span> HIVE` +
      `</td>` +
      `</tr>` +
      `<tr>` +
      `<td>` +
      `<b>Active Loan Browser:</b>` +
      `<br>` +
      `<span id="loadActiveloans"></span>` +
      `</td>` +
      `</tr>` +
      `</tbody>` +
      `</table>` +
      `<br>`+
      `<br>`+
      //`<b>Leverage your HIVE account as collateral and get liquid HIVE into your Hive.Loans Account in less than 30 seconds!</b><br>` +
      `<br><br>`+
      `<br></center>`;
      $("#jumbotron").promise().done(function(){
          $("#jumboWrapper").html(loansContent);
          $("#jumbotron").css({'top':'7%','height':'85%','width':'60%'});
          $("#jumbotron").center();
          $("#jumboTitle").text(`Lending Contract Pool Overview`);
            var hyperdatatable = `<table id="hyperdatatable" id="loadloans" class=" " style="background: #444444; border-radius: 10px; border: inset 2px grey; width: 100% !important; height: 5% !important;"><tbody><tr><td><code>Loan ID</code><br>~</td><td><code>Lender</code><br>~</td><td><code>Amount</code><br>~</td><td><code>Interest Rate</code><br>~</td><td><code>Repayment Total</code><br>~</td><td><code>Duration</code><br>~</td><td><code>Borrower</code><br>~</td><td><code>Payments</code><br>~ / ~</td><td><code>Active</code><br>~</td></tr></tbody></table>`; //<td><code>Completed</code><br>~</td><td><code>Created</code><br>~</td>
            $('#loadloaninfo').html(`${hyperdatatable}`);

            var activeLoanTable = `<table class="ourloans" id="ourloans" style="background: #444444; border-radius: 10px; border: inset 2px grey; width: 100% !important; height: 10% !important;"><tbody><tr><td><code>Loan ID</code><br>~</td><td><code>Lender</code><br>~</td><td><code>Amount</code><br>~</td><td><code>Interest Rate</code><br>~</td><td><code>Repayment Total</code><br>~</td><td><code>Duration</code><br>~</td><td><code>Borrower</code><br>~</td><td><code>Payments</code><br>~ / ~</td><td><code>Active</code><br>~</td><td><code>Completed</code><br>~</td><td><code>Created</code><br>~</td></tr></tbody></table>`;
            $('#loadActiveloans').html(`${activeLoanTable}`);

                  $(`#contractcount`).html(`${data.loans.length}`);
                  var loans = data.loans;
                  var ourloans = [];
                 untappeddata.loans.map(function(key) {
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
      var getthedelegation= await getHiveDelegations(uUsername);
      gettheaccount = JSON.parse(gettheaccount);
      getthedelegation = getthedelegation;
      var hiveDele = getthedelegation[getthedelegation.length - 1]['hivedelegated'];
      console.log(hiveDele);
      console.log(gettheaccount);
      console.log(getthedelegation);
      loanMax = Math.floor(gettheaccount.credit);
      var hpNow = gettheaccount.hp;
      $('span#loanMax').val(`${loanMax.toFixed(3)}`);
      $('span#loanMax').html(`${loanMax.toFixed(3)}`);
      $('span#loanMax7').val(`${(loanMax / 13).toFixed(3)}`);
      $('span#loanMax7').html(`${(loanMax / 13).toFixed(3)}`);
      $('span#loanDelegation').val(`${hiveDele.toFixed(3)}`);
      $('span#loanDelegation').html(`${hiveDele.toFixed(3)}`);
  }
});

socket.on('loadedShares', async function(data){
  console.log(`socket.on('loadedShares', async`)
  if(data){
    let sharesContent = `` +
    `<table style="width:80%;">` +
    `<tbody>` +
    `<tr>` +
    `<td><b>Purchase HLSHARE:</b>` +
    `<br>` +
      `<div class="casperInput input-group">` +
      `<input type="number" onchange="$('#newamount').val(this.value); createLoanPreview();" onkeyup="$('#newamount').val(this.value); createLoanPreview();" id="newLendAmount" min="10" max="30" step="1" placeholder="10 to 30" required="" aria-label="Interest Rate" aria-describedby="basic-addon2">` +
        `<span class="input-group-append">` +
          `<span class="input-group-text" id="basic-addon2">` +
            `<b><i class="fab fa-hive" style="color:#E31337;"></i></b>` +
          `</span>` +
        `</span>` +
      `</div>` +
    `</td>` +
    `<td>` +
    `<b>Duration</b>` +
    `<br>` +
    `<select onchange="$('#newdays').val(this.value); createLoanPreview();" class="casperInput" style="width:4vw !important;" onchange="$('#newdays').val(this.value);" value="7" id="newLendDays" min="7" max="91" step="7" name="newLendDays" placeholder="7 to 91" required>` +
    `<option value="7">7 Days</option>` +
    `<option value="14">14 Days</option>` +
    `<option value="21">21 Days</option>` +
    `<option value="28">28 Days</option>` +
    `<option value="35">35 Days</option>` +
    `<option value="42">42 Days</option>` +
    `<option value="49">49 Days</option>` +
    `<option value="56">56 Days</option>` +
    `<option value="63">63 Days</option>` +
    `<option value="70">70 Days</option>` +
    `<option value="77">77 Days</option>` +
    `<option value="84">84 Days</option>` +
    `<option value="91">91 Days</option>` +
    `</select>` +
    `</td>`+
    `<td>` +
    `<b>Interest Rate</b>` +
    `<br>` +
    `<div class="casperInput input-group">` +
    `<input type="number" onchange="$('#newfee').val(this.value); createLoanPreview();" onkeyup="$('#newfee').val(this.value); createLoanPreview();" id="newLendFee" min="10" max="30" step="1" placeholder="10 to 30" required placeholder="Interest Rate" aria-label="Interest Rate" aria-describedby="basic-addon2">` +
    `<span class="input-group-append">` +
    `<span class="input-group-text" id="basic-addon2">` +
    `<b>%</b>` +
    `</span>` +
    `</span>` +
    `</div>` +
    `</td>` +
    `</tr>` +
    `<tr><td><code>Contract Preview:</code><br><span id="createLoanPreview">Select Some Values above to see Preview</span></td></tr>` +
    `<tr><td><button type="button" style="font-size:larger;font-weight:900;" class="button" id="createNewLend" onClick="createNewLendCont();" title="Click here to create a new lending contract">Create Contract <i class="fas fa-fw fa-vote-yea" style="color:lawngreen;"></i></button></td></tr></tbody></table><br>`;

        //$("#jumbotron").fadeOut('fast');
        $("#jumbotron").promise().done(function(){
            $("#jumboWrapper").html(sharesContent); //lendingContent
            $("#jumbotron").css({'top':'7%','height':'85%','width':'60%'});
            $("#jumbotron").center();
            //CreateTableFromJSON(data.loans, 'loans', 'activeLendView', 'activeLendTable', 'activeLendHead');
            //$("#jumbotron").fadeIn();
            if(dataGrab){
              $("#loanPreviewBalance").html((dataGrab.hivebalance / 1000));
            }
            $("#jumboTitle").text(`Hive.Loans Share Exchange`);
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

socket.on('loadedLoans', async function(data){
  if(data){
    var dataGrab = await getUserSiteBalance(uUsername).then(res => { return res }).catch(error => {console.log(error)});
    console.log(`loadedLoans`);
    usersLoanDataFetch = dataGrab;
    console.log(usersLoanDataFetch)
    if (data.loans.length == 0){
      showErr(`Fetched No Loans from History!`);
    } else if (data.loans.length == 1){
      //showSuccess(`Fetched ${data.loans.length} Loan from History!`);
    } else {
      //showSuccess(`Fetched ${data.loans.length} Loans from History!`);
    }

    /*
    let lendingContent =`<center><span id="activeLendView"></span>` +
    `<table id="header-fixed" style="max-height:30% !important;"></table><br>` +
    `<b>Create New Lending Contract</b>` +
    `<table style="width:80%;"><tbody><tr>` +
    `<td><b>Amount of HIVE:</b><br>` +
    `<div class="casperInput input-group"><input type="number" onchange="$('#newamount').val(this.value); createLoanPreview();" onkeyup="$('#newamount').val(this.value); createLoanPreview();" id="newLendAmount" min="10" max="30" step="1" placeholder="10 to 30" required="" aria-label="Interest Rate" aria-describedby="basic-addon2"><span class="input-group-append"><span class="input-group-text" id="basic-addon2"><b><i class="fab fa-hive" style="color:#E31337;"></i></b></span></span></div></td>` +
    `<td><b>Duration</b><br><select onchange="$('#newdays').val(this.value); createLoanPreview();" class="casperInput" style="width:4vw !important;" onchange="$('#newdays').val(this.value);" value="7" id="newLendDays" min="7" max="91" step="7" name="newLendDays" placeholder="7 to 91" required><option value="7">7 Days</option> <option value="14">14 Days</option> <option value="21">21 Days</option> <option value="28">28 Days</option> <option value="35">35 Days</option> <option value="42">42 Days</option> <option value="49">49 Days</option> <option value="56">56 Days</option> <option value="63">63 Days</option> <option value="70">70 Days</option> <option value="77">77 Days</option> <option value="84">84 Days</option> <option value="91">91 Days</option></select></td>`+
    `<td><b>Interest Rate</b><br><div class="casperInput input-group"><input type="number" onchange="$('#newfee').val(this.value); createLoanPreview();" onkeyup="$('#newfee').val(this.value); createLoanPreview();" id="newLendFee" min="10" max="30" step="1" placeholder="10 to 30" required placeholder="Interest Rate" aria-label="Interest Rate" aria-describedby="basic-addon2"><span class="input-group-append"><span class="input-group-text" id="basic-addon2"><b>%</b></span></span></div></td></tr>` +
    `<tr><td><code>Contract Preview:</code><br><span id="createLoanPreview">Select Some Values above to see Preview</span></td></tr>` +
    `<tr><td><button type="button" style="font-size:larger;font-weight:900;" class="button" id="createNewLend" onClick="derp();" title="Click here to create a new lending contract">Create Contract <i class="fas fa-fw fa-vote-yea" style="color:lawngreen;"></i></button></td></tr></tbody></table><br>` +
    `<br><hr class="allgrayeverythang">`+
    `Your HIVE Balance:<br><span id="loanPreviewBalance">0.000</span> HIVE`+
    `<br><br>`+
    //`<table style="align-items: center !important; padding: 0px; margin: 0px; width: 100%;"><tbody><tr><td><h4><b>Active HIVE Lending Contracts</b></h4></td><td><h4><b>Completed HIVE Lending Contracts</b></h4></td></tr><tr><td><span id="activeLendView" class=""></span><table id="header-fixed"></table></td><td><div id="oldLendView">Loading Completed HIVE Lending Contracts</div></td></tr></tbody></table>`+
    `</center>`;

    */

    let newLendingContent = `<center><span id="activeLendView"></span><table id="header-fixed" style="max-height:30% !important;"></table><br>` +
    `<b>Create New Lending Contract</b><br><br>` +
    `<b>Amount of HIVE to Lend:</b><br>` +
    `<div class="casperInput input-group"><input type="number" onchange="$('#newamount').val(this.value); createLoanPreview();" onkeyup="$('#newamount').val(this.value); createLoanPreview();" id="newLendAmount" min="10" max="30" step="1" placeholder="10 to 30" required="" aria-label="Interest Rate" aria-describedby="basic-addon2"><span class="input-group-append"><span class="input-group-text" id="basic-addon2"><b><i class="fab fa-hive" style="color:#E31337;"></i></b></span></span></div>` +
    `<b>Duration of Contract:</b><br><select onchange="$('#newdays').val(this.value); createLoanPreview();" class="casperInput" style="width:4vw !important;" onchange="$('#newdays').val(this.value);" value="7" id="newLendDays" min="7" max="91" step="7" name="newLendDays" placeholder="7 to 91" required><option value="7">7 Days</option> <option value="14">14 Days</option> <option value="21">21 Days</option> <option value="28">28 Days</option> <option value="35">35 Days</option> <option value="42">42 Days</option> <option value="49">49 Days</option> <option value="56">56 Days</option> <option value="63">63 Days</option> <option value="70">70 Days</option> <option value="77">77 Days</option> <option value="84">84 Days</option> <option value="91">91 Days</option></select><br>` +
    `<b>Lending Interest Rate</b><br><div class="casperInput input-group"><input type="number" onchange="$('#newfee').val(this.value); createLoanPreview();" onkeyup="$('#newfee').val(this.value); createLoanPreview();" id="newLendFee" min="10" max="30" step="1" placeholder="10 to 30" required placeholder="Interest Rate" aria-label="Interest Rate" aria-describedby="basic-addon2"><span class="input-group-append"><span class="input-group-text" id="basic-addon2"><b>%</b></span></span></div><br>` +
    `<code>Contract Preview:</code><br><span id="createLoanPreview">Select Some Values above to see Preview</span><br>` +
    `<button type="button" style="font-size:larger;font-weight:900;" class="button" id="createNewLend" onClick="createNewLendCont();" title="Click here to create a new lending contract">Create Contract <i class="fas fa-fw fa-vote-yea" style="color:lawngreen;"></i></button><br>` +
    `` +
    `</center>`;

    //$("#jumbotron").fadeOut('fast');
    $("#jumbotron").promise().done(function(){
        $("#jumboWrapper").html(newLendingContent); //lendingContent
        $("#jumbotron").css({'top':'7%','height':'85%','width':'60%'});
        $("#jumbotron").center();
        CreateTableFromJSON(data.loans, 'loans', 'activeLendView', 'activeLendTable', 'activeLendHead');
        //$("#jumbotron").fadeIn();
        if(dataGrab){
          $("#loanPreviewBalance").html((dataGrab.hivebalance / 1000));
        }
        $("#jumboTitle").text(`Lending Contract Overview`);
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
  showSuccess(`Deposit of ${data.amount / 1000} ${data.coin} Arrived!`);
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
  $('#blocknumber').html(`<a href="https://hiveblocks.com/b/${data.block}" target="_blank" title="Click this to view the block on HiveBlocks.com in a new window!" style="color:white !important; text-decoration: none !important;"><code>#</code>${data.block}</a>`);
  flashwin($('#blocknumber'));
});

var blockssynced = '';

socket.on('latestblock', function(data){
  console.log(data);
  if(data.behind) {
    depositDelaySec = (data.behind * 3);
    $('#depsecs').html(depositDelaySec);
  }
  if(data.synced === false){
    blockssynced = `&nbsp;<i class="fa fa-fw fa-exclamation-triangle sexyblackoutline" style="color:gold;" aria-hidden="true" title="Site is Currently Syncing! Deposits May be Delayed! ${data.behind} Behind Latest HIVE Block"></i>`;
  }
  if(data.synced === true){
    blockssynced = `&nbsp;<i class="far fa-fw fa-check-square sexyblackoutline" style="font-weight:100 !important; color:lawngreen;" aria-hidden="true" title="Connected to Latest HIVE Blocks! Deposits Should Arrive in Around ${(data.behind * 3)} Seconds!"></i>`;
  }
  $('#blocknumber').html(`<a href="https://hiveblocks.com/b/${data.block}" target="_blank" title="Click this to view the block on HiveBlocks.com in a new window!" style="color:white !important; text-decoration: none !important;"><code>#</code>${data.block}</a>${blockssynced}`);
});


var scrollspeed = 5;

function startScrollbar() {

  var items, scroller = $('#scroller');
  var width = 0;
  scroller.children().each(function(){
      width += $(this).outerWidth(true);
  });
  scroller.css('width', width);

  function scroll(){
      items = scroller.children();
      var scrollWidth = items.eq(0).outerWidth();
      scroller.animate({'left' : 0 - scrollWidth}, scrollWidth * 100 / scrollspeed, 'linear', changeFirst);
  }
  function changeFirst(){
      scroller.append(items.eq(0).remove()).css('left', 0);
      scroll();
  }
  scroll();
}



var pricechartInit = 0;
var scrollInit = 0;
var old_percent_change_1h = 0;
var old_percent_change_24h = 0;
var old_percent_change_7d = 0;
var old_percent_change_30d = 0;

socket.on('hivepriceupdate', function(data){
  console.log(`hivepriceupdate data:`);
  console.log(data);

  var arrow1;
  var arrow7;
  var arrow24;
  var arrow30;

  if(data.percent_change_1h > 0){
    arrow1 = "<i class='fas fa-caret-up' style='color:lawngreen;'></i>";
  } else {
    arrow1 = "<i class='fas fa-caret-down' style='color:red;'></i>";
  }

  if(data.percent_change_24h > 0){
    arrow24 = "<i class='fas fa-caret-up' style='color:lawngreen;'></i>";
  } else {
    arrow24 = "<i class='fas fa-caret-down' style='color:red;'></i>";
  }

  if(data.percent_change_7d > 0){
    arrow7 = "<i class='fas fa-caret-up' style='color:lawngreen;'></i>";
  } else {
    arrow7 = "<i class='fas fa-caret-down' style='color:red;'></i>";
  }

  if(data.percent_change_30d > 0){
    arrow30 = "<i class='fas fa-caret-up' style='color:lawngreen;'></i>";
  } else {
    arrow30 = "<i class='fas fa-caret-down' style='color:red;'></i>";
  }

  $('#pricepercentticker').html(commaNumber((data.total_supply).toFixed(3)) + "&nbsp;HIVE");
  $('#pricepercentticker1').html(commaNumber((data.market_cap).toFixed(2)) + "&nbsp;<code>USD</code>");
  $('#pricepercentticker2').html(commaNumber((data.volume_24h).toFixed(2)) + "&nbsp;<code>USD</code>");
  $('#pricepercentticker3').html((data.percent_change_1h).toFixed(2) + "%");
  $('#pricepercentticker4').html((data.percent_change_24h).toFixed(2) + "%");
  $('#pricepercentticker5').html((data.percent_change_7d).toFixed(2) + "%");
  $('#pricepercentticker6').html((data.percent_change_30d).toFixed(2) + "%");
  //$('#pricepercentticker3').html(arrow1 + $('#pricepercentticker3').html());
  //$('#two').html(arrow24);
  //$('#three').html(arrow7);
  //$('#four').html(arrow30);
  if(scrollInit != 1){
    startScrollbar();
    scrollInit = 1;
  }
});


socket.on('hivepriceupdatebackup', function(data){
  console.log(data);
  $('#pricepercentticker').html(`Total Supply: --------.--- | Market Cap: $-------.-- USD | Daily Volume: $-.-- USD | Last Hour: -.--% | Last Day: -.--% | Past Week: -.--% | Past Month:-.--%`)
});


var lastHiveShortPrice;
var lastHiveLongPrice;
var pricecheckinit = false;


socket.on('priceupdate', function(data){
  console.log(`priceupdate`);
  console.log(`tickercurrency`);
  console.log(tickercurrency);
  if(!hiveprice) oldhiveusdprice = 0;
  var type = tickercurrency.toUpperCase();
  if(!data.hiveusdprice) return;
  if(!data.hiveshortprice) return;
  if(!data.hivelongprice) return;
  console.log(data);
  /*
  if(pricechartInit == 0) {
    if(data.datasets == undefined) return;
    renderChart(data.datasets, 0, "myChart");
    pricechartInit++;
  } else {
    addData(data.datasets, data.labelssend, "myChart");
  }
  */



  //if(hivechart) {
    //mergeTickToBar(data.datasets);
    //dataChart = dataChart.slice(20, dataChart.length - 1);
    //var chartshitstuff = data.chart[0];
    //var newprice = chartshitstuff.close;
    //var newtimestuff = chartshitstuff.time;
    //var theAnswer = {time:newtimestuff, price:newprice};
    //if(dataChart != undefined && dataChart.length > 0){
    //  console.log(`currentBar`);
    //  console.log(currentBar);
    //  mergeNewTickToBar(theAnswer);
    //  console.log(`currentBar Now`);
    //  console.log(currentBar);
      //if (firstCFDrun == false) dataChart.push(dataChart);
    //}


  data.hiveusdprice = parseFloat((data.hiveusdprice).toFixed(6));
  data.hivebtcprice = parseFloat((data.hivebtcprice).toFixed(8));

  if(!lastHivePrice) lastHivePrice = data.hiveusdprice;
  if(!lastHiveShortPrice) lastHiveShortPrice = data.hiveshortprice;
  if(!lastHiveLongPrice) lastHiveLongPrice = data.hivelongprice;
  if(!lastHiveBTCPrice) lastHiveBTCPrice = data.hivebtcprice;

  if(lastHivePrice != data.hiveusdprice) {
    lastHivePrice = data.hiveusdprice;
  }

  if(lastHiveBTCPrice != data.hivebtcprice) {
    lastHiveBTCPrice = data.hivebtcprice;
  }

  if(lastHiveShortPrice != data.hiveshortprice) {
    lastHiveShortPrice = data.hiveshortprice;
  }

  if(lastHiveLongPrice != data.hivelongprice) {
    lastHiveLongPrice = data.hivelongprice;
  }

  $('#shortSpotPrice').val((data.hiveshortprice).toFixed(6));
  $('#longSpotPrice').val((data.hivelongprice).toFixed(6));
  if(lastHivePrice) oldhiveusdprice = lastHivePrice;


  if(pricecheckinit != true) {
    $('#pricecheckcaret').html('<i class="fas fa-caret-right hidden" style="color:lightblue;" title="This Price is Recently Fetched"></i>');
    if(tickercurrency == 'usd'){
      $('#footerprice').val(data.hiveusdprice);
      $('#footerprice').html((data.hiveusdprice).toFixed(6));
    } else if (tickercurrency == 'btc') {
      $('#footerprice').val(data.hivebtcprice);
      $('#footerprice').html((data.hivebtcprice).toFixed(8));
    }
    oldhiveusdprice = data.hiveusdprice;
    pricecheckinit = true;
  } else {
    if($('#footerprice').val() == data.hiveusdprice) {
      if(debug ===true) console.log(`PRICES ARE EQUAL`);
      return;
    } else {
      if(debug ===true) console.log(`PRICES ARE NOT EQUAL`);
      if($('#footerprice').val() > data.hiveusdprice) {
        $('#pricecheckcaret').html('<i class="fas fa-caret-down" style="color:red;" title="This Price is Lower Than Last Update"></i>');
        if(tickercurrency == 'usd'){
          $('#footerprice').val(data.hiveusdprice);
          $('#footerprice').html((data.hiveusdprice).toFixed(6));
        } else if (tickercurrency == 'btc') {
          $('#footerprice').val(data.hivebtcprice);
          $('#footerprice').html((data.hivebtcprice).toFixed(8));
        }
        flashlose($('#footerprice'));
      } else {
        $('#pricecheckcaret').html('<i class="fas fa-caret-up" style="color:lawngreen;" title="This Price is Higher Than Last Update"></i>');
        if(tickercurrency == 'usd'){
          $('#footerprice').val(data.hiveusdprice);
          $('#footerprice').html((data.hiveusdprice).toFixed(6));
        } else if (tickercurrency == 'btc') {
          $('#footerprice').val(data.hivebtcprice);
          $('#footerprice').html((data.hivebtcprice).toFixed(8));
        }
        flashwin($('#footerprice'));
      }
    }
  }




/*
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
