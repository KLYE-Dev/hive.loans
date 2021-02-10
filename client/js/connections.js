socket = io();

socket.on('connect', function(data){
  bootbox.hideAll();
  showSuccess('Welcome to the Hive.Loans');
  console.log($(`#usernamestore`).val());
  if($(`#usernamestore`).val().length > 0){
    logout();
  }
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
    data.active = 'Active';
  }
  if(data.conpleted === 0){
    data.conpleted = 'Waiting';
  }

  var date = new Date(data.createdAt);
  date = date.toString();
  date = date.slice(0, (date.length - 20));

  var hyperdatatable = `<table class=" " style="background: #444444; border-radius: 10px; border: inset 2px grey; width: 100% !important; height: 5% !important;"><tbody><tr><td><code>Contract #</code><br>${data.id}</td><td><code>Contract ID:</code><br>${data.loanId}</td><td><code>Lender:</code><br>@${data.username}</td><td><code>Amount:</code><br>${(data.amount / 1000)} HIVE</td><td><code>Interest Rate:</code><br>${data.interest}%</td><td><code>Repayment Total:</code><br>${(totalrepay / 1000)} HIVE</td><td><code>Duration:</code><br>${data.days} days</td><td><code>Borrower:</code><br>${data.borrower}</td><td><code>Payments:</code><br>${data.currentpayments} / ${data.totalpayments} <i class="far fa-fw fa-question-circle" title="Payment Amounts of ${(paymentSum / 1000)} HIVE Weekly"></i></td><td><code>Active:</code><br>${data.active}</td><td><code>Completed:</code><br>${data.completed}</td><td><code>Created:</code><br>${date}</td></tr></tbody></table>`;
    $('#loadloaninfo').html(`${hyperdatatable}`);
});


socket.on('backersupdate', function(data){
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
  CreateTableFromJSON(data, 'backers', 'activeBackerView');
});

socket.on('newloanmade', function(data){
  token = data.token;
  showSuccess(`Loan from ${data.username} Created!`);
  setTimeout(function(){
    showLend()
  }, 250);
});

socket.on('loannuked', function(data){
  token = data.token;
  showSuccess(`Loan ${data.loanId} Deleted!`);
  setTimeout(function(){
    showLend()
  }, 250);
});

socket.on('loadallloans', function(data){
  if (data.loans.length == 0){
    showSuccess(`Fetched No Loans from Server!`);
  } else if (data.loans.length == 1){
    showSuccess(`Fetched ${data.loans.length} Loan from Server!`);
  } else {
    showSuccess(`Fetched ${data.loans.length} Loans from Server!`);
  }

  setTimeout(function(){
      $(`#contractcount`).html(`${data.loans.length} `);
       CreateTableFromJSON(data.loans, 'loadloans', 'loadAllLoans');
  }, 250);
});

socket.on('loadedLoans', function(data){
  if (data.loans.length == 0){
    showSuccess(`Fetched No Loans from History!`);
  } else if (data.loans.length == 1){
    showSuccess(`Fetched ${data.loans.length} Loan from History!`);
  } else {
    showSuccess(`Fetched ${data.loans.length} Loans from History!`);
  }
  setTimeout(function(){
       CreateTableFromJSON(data.loans, 'loans', 'activeLendView');
  }, 250);
});

socket.on('depositcredit', function(data){
  showSuccess(`Deposit of ${data.amount / 1000} ${data.coin} Credited!`);
  if (data.coin == 'HIVE'){
    uHIVEbalance = data.balance;
    $('#userhivebalance').val(uHIVEbalance / 1000);
    showWallet();
  } else {
    uHBDbalance = data.balance;
    $('#userhbdbalance').val(uHBDbalance / 1000);
    showWallet();
  }
});

socket.on('latestblock', function(data){
  $('#blocknumber').html(`<a href="https://hiveblocks.com/b/${data.block}" target="_blank" title="Click this to view the block on HiveBlocks.com in a new window!" style="color:white !important; text-decoration: none !important;">#${data.block} <i class="fas fa-external-link-square-alt"></i></a>`);
  flashwin($('#blocknumber'));
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


socket.on('greedupdate', function(data){
  //console.log(data);
  showSuccess('Updated Leverage to ' + data.greed + 'x');
  token = data.token;
  $("#invested").val((data.invested/100000000).toFixed(8));
  $("#myInvestmentActive").val((data.invested*data.greed/100000000).toFixed(8));
  console.log('greedupdate', data);
});

socket.on('adminlogin', function(userident){
  showSuccess('Welcome Back Lord ' + userident).dismissOthers();
  $('#adminpagetab').css({'display':'block'});
  socket.emit('populateadmintab', userident);
});

socket.on('makeadmintab', function(admintabcontents){
  $('#adminTab').html(admintabcontents);
  return;
});

socket.on('sharesitetake', function(data){
  log(data);
  var siteshare = (data/100000000).toFixed(3);
$('#sitetake').val(siteshare);
});
