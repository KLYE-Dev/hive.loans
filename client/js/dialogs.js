//========================================================================================
// Page contents and whatnot
//========================================================================================
var loanMax;
let moverAddon = `<span id="jumboMove" title="Click and Drag to Move Window" onclick="$("#jumbotron").draggable();"><i class="fas fa-arrows-alt"></i></span><center><span id="jumboTitle" class="jumboTitle" style="max-width: 75%;"></span></center></span><span id="jumboClose" title="Click to Close this Panel" onclick="$('#jumbotron').fadeOut();" onmouseover="$(this).css({'color':'red'})" onmouseout="$(this).css({'color':'white'})"><i class="fas fa-times"></i></span>`;
 function loadingjumbo() {
  var loadingContent = `<center><i id="loadingring" style="color:limegreen;" class="fa fa fa-cog fa-pulse fa-3x fa-fw"></i><br><b>Loading</b></center>`;
      $("#jumboWrapper").html("<br>" + loadingContent);
      $("#jumbotron").css({'height':'auto','width':'auto'});

      $("#jumbotron").fadeIn('slow');
      $("#jumboTitle").html(``);
      $("#jumboHead").hide();
      $("#jumbotron").center();
}

if (window.hive_keychain) {
    hive_keychain.requestHandshake(function() {
        console.log("Handshake received!");
    });
}

//========================================================================================
// Legacy modals and whatnot
//========================================================================================


//Tip Modal
$("#tipdialog").on('click', function() {
    username = ('');
    bootbox.dialog({
        message:
            '<center><span class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style=""><i class="fa fa-at fa-2x"></i></span>' +
            '<b><input type="text" class="form-control" placeholder="User" aria-describedby="basic-addon1" id="tipto" style="" ></b><span class="input-group-addon addon-sexy" style="">User</span></span>' +
            '<br><span class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style=""><b>Tip</b></span>' +
            '<b><input type="number" class="form-control" placeholder="0.000" id="tipamount" aria-describedby="basic-addon1"></b>' +
            '<span class="input-group-addon addon-sexy currencychanger" style="padding:5px;"><img src="img/rhom.svg" class="modalLogo"></span></span>' +
            `<sub>( Balance: <span id="tipbalance">0.0000000</span> <span id="tipBalspan"></span> )</sub>`,
        title: `<center><span id="sexymodaltitle">Hive.Loans</span><br>Tip Another User Instantly</center>`,
        buttons: {
            main: {
                label: "Send",
                className: "push_button2",
                callback: function() {
                    socket.emit('tip', {
                        amount: parseInt($("#tipamount").val() * 100000000),
                        to: $("#tipto").val(),
                        token: token
                    }, function(err, data) {
                        if (err) {
                            return showErr(`Tip Send Failed! Error: ${err}`);
                        }
                        console.log(data)
                        if (data.token !== 0) token = data.token; //token is always returned
                        $("#balance").val((data.balance / 100000000).toFixed(8));
                        showSuccess("Tip Sent!");
                    });
                }
            }
        }
    });
    $('#tipbalance').html($('#balance').val());
});

$("#numClient").on('click', function(e) {
  socket.emit('userlist', {
      token: token
  }, function(err, data) {
      if (err) {showErr(err);}
      if (data) {
          let userslist;
          let usercount = 0;
          userslist = Object.keys(data.usersonline);
          var ulist = [];
          userslist.forEach((user, i) => {
            ulist.push(` ${user}`);
            usercount++;
          });
          bootbox.dialog({
              message:`<center>${ulist}</center><br>`,
              title: `<center><span id="sexymodaltitle">Hive.Loans</span><br>Users Currently Online: ${usercount}</center>`,
              buttons: {
                  main: {
                      label: "Close",
                      className: "push_button2"
                  }
              }
          });
      }
  });
});



/*
requestSendToken
Requests a token transfer

Parameters
account String Hive account to perform the request
to String Hive account to receive the transfer
amount String Amount to be transfered. Requires 3 decimals.
memo String Memo attached to the transfer
currency String Token to be sent
callback function Keychain's response to the request
rpc String Override user's RPC settings (optional, default null)



account String Hive account to perform the request
to String Hive account to receive the transfer
amount String Amount to be transfered. Requires 3 decimals.
memo String The memo will be automatically encrypted if starting by '#' and the memo key is available on Keychain. It will also overrule the account to be enforced, regardless of the 'enforce' parameter
currency String 'HIVE' or 'HBD'
callback function Keychain's response to the request
enforce boolean If set to true, user cannot chose to make the transfer from another account (optional, default false)
rpc String Override user's RPC settings (optional, default null)

*/

function keychainSend(from, to, amount, memo, coin){
  hive_keychain.requestTransfer(from, to, amount, memo, coin.toUpperCase(), function(response) {
      console.log(response);
      if (response.success == true) {
          showSuccess('Deposit Transfer Success! It Will Arrive Soon');
          $('#depositView').click();
          bootbox.hideAll();
      } else {
        showErr(`Deposit Failed to Send!`);
        console.log(response.error);
      }
  }, true);
}


function wdnow(coin, fee, security) {

      console.log('withdrawit!');

      showSuccess('Processing Withdraw - Please Wait!');

      $('#sending').html('<i style="color:grey" class="fa fa-pulsener fa-pulse fa-2x fa-fw"></i>');

      if($('#withdrawAmount').val() < 1){
                return showErr(`Must Withdraw Atleast 1 ${coin}`);
      }
      socket.emit("withdraw", {
          amount: $('#withdrawInteger').val(),
          account: $('#withdrawAcct').val(),
          memo: $('#withdrawMemo').val(),
          type: coin,
          fee: fee,
          security: security,
          token: token
      }, function(err, cb) {
          if (err) {

              $('#sending').html(`<br><b style='color:red;'>${err}</b>`);
              return showErr(`${err}`);
          }
          if (cb) {
              console.log(cb);
              token = cb.token;
              showSuccess('Withdrawal Success!');
              showWallet(uUsername);
              bootbox.hideAll();
          }
      })
  }

function calctotal(fee, coin){
  var thetotal;
  var thisval = parseFloat($("#withdrawInteger").val());
  var balance = parseFloat($("#tipbalance").val());

  thetotal = thisval - fee;

  if (thetotal <= balance) {
      flashwin($("#wdtotal"))
      $("#wdtotal").html(`You'll receive ${thetotal} ${coin}`);
      $("#wdbuttontex").html(`Withdraw`);
      $('#withdrawit').attr("disabled", false);
  } else {
      flashlose($("#wdtotal"))
      $("#wdtotal").html(`Insufficient Funds!`);
      $("#wdbuttontex").html(`Error`);
      $('#withdrawit').attr("disabled", true);
  }
}

var withdrawButtonWallet = async(user, coin) => {
  console.log(`withdrawButtonWallet(${user}, ${coin})`)
  //var fromLength =
  //var toLength =


  socket.emit('withdrawopen', {
      coin: coin,
      token: token
  }, function(err, data) {
      if (err) {
          console.error(e);
          return showErr(`An Error Occured Fetching Account Data!`);
      }
      if (data) {
        console.log(data);
        let feefetch;
        feefetch = data.fee
          var rawHiveBalance;
          var userHiveBalance;
          var rawHbdBalance;
          var userHbdBalance;

          if(typeof coin == undefined){
            coin = 'HIVE';
          }

          coin = coin.toUpperCase();
          let moverAddon = `<div style="font-size:1.5em;width:100%;font-weight:500;"><span id="jumboMove" title="Click and Drag to Move Window"><i class="fas fa-arrows-alt"></i></span><span id="refreshJumboStats" style-"float:right" title="Click to Refresh" onClick="getJumboStats();"></div>`;
          function showSend() {



            let sendingContent = `<center><h4 style="margin: none !important;">Withdraw ${coin} from ${user}'s Hive.Loans Account</h4>` +
           `<h3 style="margin: none !important;"><table style="width:100%;align-content:center;font-size: larger !important;"><tbody><tr><td style="width:40%;"><a href="https://hiveblocks.com/@hive.loans" target="_blank" style="text-decoration:none !important;">hive.loans</a></td><td><i class="fas fa-long-arrow-alt-right"></i></td><td style="width:40%;"><a href="https://hiveblocks.com/@${user}" style="text-decoration: none !important;" target="_blank">${user}</a></td></tr></tbody></table></h3>`+
         //  `<h3 style="margin: none !important;"><a href="https://hiveblocks.com/@${user}" style="text-decoration: none !important;" target="_blank">${user}</a> <i class="fas fa-long-arrow-alt-right"></i> <a href="https://hiveblocks.com/@hive.loans" target="_blank" style="text-decoration:none !important;">hive.loans</a></h3><br>`+
           `<b id="acctflash1">Specify Amount of ${coin} to Withdraw:</b><br><input type="number" min="0" step="0.001" decimal="3" id="withdrawInteger" style="background: white;color: black;text-align: center;width: 18vw;height: 3vh;font-size: large; border-radius:10px;" placeholder="0.000" onkeyup="calctotal($('#rawfee').val(), '${coin}')" ><br>` +
           `<sub>( Account Balance: <span id="tipbalance" placeholder="0.000" onClick="$('#withdrawInteger').val($('#tipbalance').val());calctotal(${data.fee}, '${coin}')"></span> ${coin} <span id="tipBalspan"></span> )</sub><br><br>`+
           `<span id="rawfee"></span><span id="wdfee">Calculating fee..</span><br><br>` +
           `<span id="wdtotal"></span><br><br>` +
           `<b id="acctflash1">Account to Withdraw to:</b><br><input type="text" readonly id="withdrawAcct" style="background: white;color: black;text-align: center;width: 18vw;height: 3vh;font-size: large; border-radius:10px;" value="${user}" onkeyup="console.log($(this).val())" ><br><sub>( <span id="underAcctText"></span> )</sub><br><br>` +
           `<b id="acctflash1">Transfer Memo:</b><br><input type="text" id="withdrawMemo" style="background: white;color: black;text-align: center;width: 18vw;height: 3vh;font-size: large; border-radius:10px;" placeholder="( optional )"><br><br>` +
           `<button type="button" style="font-size: normal; padding: 10px; line-height: 1vh; background: #000; color: white; width: 55% !important;border-radius:5px;" onclick="if($(this).prop('disabled')){console.log('Invalid Withdraw Request!')} else {wdnow('${coin}', ${data.fee}, '${data.security}')}" class="button" id="withdrawit" title="Click here withdraw from Hive.Loans"><span id="wdbuttontex">Enter Amount</span></button><br><br>` +
           `<sub><i class="fa fa-exclamation-triangle" style="color:gold;" aria-hidden="true"></i> Withdrawal Address <b><u>MUST</u></b> be Correct, We Cannot Refund ${coin} Sent to a Wrong Account!</sub></center>`;
            $("#jumbotron").fadeOut('fast');
            $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
                $("#jumboWrapper").html( sendingContent);
                $('#withdrawAcct').val(uUsername);
                $("#tipbalance").val(data.balance);
                $("#tipbalance").html(data.balance);
                $("#rawfee").val(data.fee);
                if(data.fee != 0) {
                  if (data.rank == 'founder') {
                    $('#wdfee').html(`Account Rank: ${data.rank} - -50% Withdraw Fee: ${data.fee} ${coin}`);
                  } else if (data.rank == 'user') {
                    $('#wdfee').html(`Account Rank: ${data.rank} - Withdraw Fee: ${data.fee} ${coin}`);
                  }
                } else {
                  $('#wdfee').html(`Account Rank: ${data.rank} - Zero Withdraw Fees`);
                }
                if (data.rank == 'user') {
                  $('#underAcctText').html(`Your HIVE account has been locked in for security`);
                } else if (data.rank == 'owner') {
                  $('#underAcctText').html(`You're the fucking owner, do what you want man`);
                  $('#withdrawAcct').attr("readonly", false);
                } else if (data.rank == 'founder') {
                  $('#underAcctText').html(`As a founder you can edit your withdrawal account field`);
                  $('#withdrawAcct').attr("readonly", false);
                }
                $("#jumbotron").fadeIn();
            });
          }
        showSend();

          try{
            isVip = data.vip;
            fee = data.fee;
            balance = data.balance;
            security = data.security;

          } catch(e){
            showErr(`Error Fetching Withdraw Data! Please Try Again Shortly!`);
          }
          $('#wdfee').html(fee);
          $('#wdfee').val(fee);
          if(isVip == true){
            $('#vipfeesub').html(`<i class="fas fa-fire-alt" style="color:gold;" title="VIP Feature"></i> No Withdraw Fee for VIP Members!`);
          }
          $("#withdrawbalance").val((balance).toFixed(8));
          $('#addresstype').val('None');
          $('#addresstype').html('None');
      }
  });

}

 var depositButtonWallet = async(user, coin) => {
   //var fromLength =
   //var toLength =
   var rawHiveBalance;
   var userHiveBalance;
   var rawHbdBalance;
   var userHbdBalance;

   if(typeof coin == undefined){
     coin = 'HIVE';
   }

   coin = coin.toUpperCase();

   let moverAddon = `<div style="font-size:1.5em;width:100%;font-weight:500;"><span id="jumboMove" title="Click and Drag to Move Window"><i class="fas fa-arrows-alt"></i></span><span id="refreshJumboStats" style-"float:right" title="Click to Refresh" onClick="getJumboStats();"></div>`;

   function showSend() {
     let sendingContent = `<center><h4 style="margin: none !important;">Deposit ${coin} into ${user}'s Hive.Loans Account</h4>` +
    `<h3 style="margin: none !important;"><table style="width:100%;align-content:center;font-size:larger;"><tbody><tr><td style="width:40%;"><a href="https://hiveblocks.com/@${user}" style="text-decoration: none !important;" target="_blank">${user}</a></td><td><i class="fas fa-long-arrow-alt-right"></i></td><td style="width:40%;"><a href="https://hiveblocks.com/@hive.loans" target="_blank" style="text-decoration:none !important;">hive.loans</a></td></tr></tbody></table></h3>`+
  //  `<h3 style="margin: none !important;"><a href="https://hiveblocks.com/@${user}" style="text-decoration: none !important;" target="_blank">${user}</a> <i class="fas fa-long-arrow-alt-right"></i> <a href="https://hiveblocks.com/@hive.loans" target="_blank" style="text-decoration:none !important;">hive.loans</a></h3><br>`+
    `<b id="acctflash1">Specify Amount of ${coin} to Deposit:</b><br><input type="number" min="0" step="0.001" decimal="3" id="depositInteger" style="background: white;color: black;text-align: center;width: 18vw;height: 3vh;font-size: large; border-radius:10px;" placeholder="0.000" onkeyup="console.log($(this).val())" ><br>` +
    `<sub>( External Account Balance: <span id="tipbalance" placeholder="0.000" onClick="$('#depositInteger').val($('#tipbalance').val())"></span> ${coin} <span id="tipBalspan"></span> )</sub>`+
    `<br><center><table><tbody><tr><td style="float: right; width: 45%;">Deposit using Keychain:<br><button type="button" class="button" style="font-size: normal; padding: 10px; line-height: 1vh; background: #000; color: white; width: 55% !important;border-radius:5px;" class="button" id="skclogologin" onClick="depositAmount = parseFloat($('#depositInteger').val()).toFixed(3); keychainSend('${user}', 'hive.loans', depositAmount, '${uAddress}', '${coin}')" title="Click here Deposit with Hive KeyChain"><img src="/img/keychaintext.png" class="keychainlogo" style="width:80%"></button></td><td style="float: left; width: 45%;">Deposit using HiveSigner<br><button type="button" style="font-size: normal; padding: 10px; line-height: 1vh; background: #000; color: white; width: 55% !important;border-radius:5px;" class="button" id="hivesignerdeposit" onClick="deposit($('#depositInteger').val(), '${coin}', '${uAddress}')" title="Click here to Deposit with HiveSigner"><img src="/img/hivesigner.svg" class="hivesignerlogo" style="width:85%"></button></td></tr></tbody></table></center>`+
    `<h4 style="margin: none !important;">Manual Deposit Information<br><sub>Include the Address and Memo below in your Transfer</sub></h4>`+
    `Address:<br><input type="text" id="depositName" style="background: white;  color: black;  text-align: center;  width: 9vw;  height: 3vh;  font-size: large;border-radius: 10px;" readonly=""><br>Memo:<br><input type="text" id="depositMemo" style="background: white;  color: black;  text-align: center;  width: 14vw;  height: 3vh;  font-size: large;border-radius: 10px;"  readonly=""></center>`;
     $("#jumbotron").fadeOut('fast');
     $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
         $("#jumboWrapper").html( sendingContent);
         $("#jumbotron").fadeIn();
          hive.api.getAccounts([user], function(err, result) {
           if(err){ console.log(err)}
           if(result){
             result = result[0];
             console.log(`getAccounts: ${user}`);
             console.log(result);
             rawHiveBalance = result.balance;
             userHiveBalance = parseFloat(rawHiveBalance);
             console.log(`userHiveBalance: ${userHiveBalance}`)
             rawHbdBalance = result.hbd_balance;
             userHbdBalance = parseFloat(rawHbdBalance);
             console.log(`userHbdBalance: ${userHbdBalance}`)
             if(coin == 'HIVE'){
               $(`span#tipbalance`).html(userHiveBalance);
               $(`span#tipbalance`).val(userHiveBalance);
             }
             if(coin == 'HBD'){
               $(`span#tipbalance`).html(userHbdBalance);
               $(`span#tipbalance`).val(userHbdBalance);
             }
             $("#depositName").html('hive.loans');
             $("#depositName").val('hive.loans');
             $("#depositMemo").html(uAddress);
             $("#depositMemo").val(uAddress);
           }
         });
     });
   }
showSend();
}



//Withdraw Modal
function checkbalval() {
  var balval = parseFloat($('#withdrawbalance').val());
  var wdval = parseFloat($('#withdrawAmount').val());
  if($('#withdrawAmount').val() != ""){
    if(wdval > balval) {
      flashlose($('#withdrawAmount'));
      showErr('Cannot Withdraw More Than Balance!');
      setTimeout(function(){
        $('#withdrawAmount').val($('#withdrawbalance').val());
      }, 100);
    }
  }
}

var sendcomplete;
$("#withdrawdialog").on('click', function(e) {
    var balance;
    var security;
    var fee;
    var newfee;
    var isVIP;
    var sent = false;

    $('#withdrawdialog').ready(function() {
      $('.withdrawit').prop('disabled', true);
        socket.emit('withdrawopen', {
            token: token
        }, function(err, data) {
            if (err) {
                if(verbose == true) console.error(e);
                return showErr(`An Error Occured Fetching Account Data!`);
            }
            if (data) {
                if(verbose == true) console.log(data);
                try{
                  isVip = data.vip;
                  fee = data.fee;
                  balance = data.balance;
                  security = data.security;
                  $("#withdrawbalance").val(data.balance);
                } catch(e){
                  showErr(`Error Fetching Withdraw Data! Please Try Again Shortly!`);
                }
                $('#wdfee').html(fee);
                $('#wdfee').val(fee);
                if(isVip == true){
                  $('#vipfeesub').html(`<i class="fas fa-fire-alt" style="color:gold;" title="VIP Feature"></i> No Withdraw Fee for VIP Members!`);
                }
                $("#withdrawbalance").val((balance).toFixed(8));
                $('#addresstype').val('None');
                $('#addresstype').html('None');
            }
        });
    });

    bootbox.dialog({
        message: '<center>Balance:</center>' +
        `<center><div class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style="">RHOM</span><a href="#" title="Clicking Will Copy Amount Below"><input type="text" class="form-control" aria-describedby="basic-addon1" id="withdrawbalance" readonly onfocus="this.blur()" "></a><span class="input-group-addon addon-sexy" style="padding:0px;"><img src="img/rhom.svg" class="modalLogo"></span></div></center><br>` +
            `<center>Amount of RHOM to Withdraw:</center>` +
            `<center><div class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style="">RHOM</span><a href="#" title="Clicking Will Copy Amount Below"><input type="text" class="form-control" aria-describedby="basic-addon1" id="withdrawAmount" onkeyup="wdCalc(); validate(this, 9);" onkeypress="return isNumberKey(event);"></a><span class="input-group-addon addon-sexy" style="padding:0px;"><img src="img/rhom.svg" class="modalLogo"></span></div></center>` +
            `<center><sub id="vipfeesub"><span id="wdfee"></span> RHOM will be Deducted from Requested Amount <i class="fa fa-info-circle" title="Roughly $0.50 worth of RHOM - Get VIP for Zero Fee Withdrawals!"></i></sub><br><span id="sending"></span><sub><span id="feeerror"></span></sub></center>` +
            '<center>Withdrawal Address:</center>' +
            '<center><div class="input-group autoBettitleC" style="width:95%;background:#181E28;"><input type="text" class="form-control" placeholder="" aria-describedby="basic-addon1" id="withdrawAddress" onkeyup="addressvalidater();"></div><sub>Address Type: <span id="addresstype"></span><br><span id="addressIsValid"></span></sub></center><br>' +
            `<center><br><sub><i class="fa fa-exclamation-triangle" style="color:gold;" aria-hidden="true"></i> Withdrawal Address <b><u>MUST</u></b> be Correct, We Cannot Refund RHOM Sent to a Wrong Address!</sub></center>` +
            `<button type="button" style="width: 33%;margin-top:0.5em;" class="button sextext" id="withdrawit" class="withdrawit" onmouseover="checkbalval();" title="Withdraw">Withdraw</button>`,
        title: `<center><span id="sexymodaltitle">Hive.Loans</span><br>Withdraw RHOM From Your Account</center>`,
    });

    var wdCalc = () => {
      setTimeout(function(){
        console.log($('#wdfee').val());
        if($('#wdfee').val() == undefined){
          $('#wdfee').val(0);
        }
        if(parseFloat($('#wdfee').val()) > parseFloat($('#withdrawbalance').val())){
          showErr(`Not Enough RHOM to Pay Withdraw Fee!`);
          $('#feeerror').html(`<i class="fa fa-exclamation-triangle" style="color:gold;" aria-hidden="true"></i> Not Enough RHOM to Pay Withdraw Fee!`);
          flashlose($('#feeerror'));
          var balThreed = parseFloat($('#withdrawbalance').val()).toFixed(8);
          $('#withdrawAmount').val(balThreed);
          flashlose($('#withdrawbalance'));
          flashlose($('#wdfee'));
        } else {
          showSuccess('Withdrawing Full Balance!');
          var balThreed = parseFloat($('#withdrawbalance').val()).toFixed(8);
          $('#withdrawAmount').val(balThreed);
          flashwin($('#withdrawAmount'));
          $('#feeerror').html(`You'll Recieve ${(balThreed - fee).toFixed(8)} RHOM after Withdrawal Fee is Deducted`);
        }
      }, 50);
    }

    $('#withdrawit').on('click', function(e) {
        console.log('withdrawit!');
        showSuccess('Processing Withdraw - Please Wait!');
        $('#sending').html('<i style="color:grey" class="fa fa-pulsener fa-pulse fa-2x fa-fw"></i>');
        if($('#withdrawAmount').val() < 1){
          return showErr('Must Withdraw Atleast 1 RHOM');
        }
        socket.emit("withdraw", {
            amount: $('#withdrawAmount').val(),
            account: $('#withdrawAddress').val(),
            type: $('#addresstype').val(),
            fee: fee,
            security: security,
            token: token
        }, function(err, cb) {
            if (err) {
                $('#sending').html(`<br><b style='color:red;'>${err}</b>`);
                return showErr('Withdrawal Failed');
            }
            if (cb) {
                console.log(cb);
                var newBalance = cb.balance / 100000000;
                newBalance = newBalance.toFixed(8);
                $("#balance").val(newBalance);
                showSuccess('Withdrawal Success!');
                bootbox.hideAll();
            }
        })
    });

$('#withdrawbalance').on('click',function(){
  wdCalc();
});

}); //END withdrawdialog.on("click")
//Login Modal
var loginFail = 0;
var loginDialog = function() {
    if ($(".gamegui").hasClass('gameguiActive') != true) {
        $(".gamegui").addClass("gameguiActive");
        $(".gameguideactiveC").css("display", "block");
    }
    $("#trollbox").html("");
    var loginpopup = bootbox.dialog({
        message: '<center><form><div class="input-group autoBettitleLogin" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style="max-width: 2em !important;padding: 0.4em;"><i class="fa fa-user fa-2x"></i></span><input type="text" class="form-control" placeholder="username" autocomplete="off" aria-describedby="basic-addon1" id="username" style="text-align:center;"><span class="input-group-addon addon-sexy" style="max-width: 3.3em !important;padding: 0.5em;">User <span id="saveUser"></span></div></center>' +
            '<br><center><div class="input-group autoBettitleLogin" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style="max-width: 3.3em !important;padding: 0.3em;"><i class="fa fa-key fa-2x"></i></span><input type="password" class="form-control passwordfield" placeholder="password" autocomplete="off" aria-describedby="basic-addon1" id="password" style="text-align:center;"><span class="input-group-addon addon-sexy" style="max-width: 3.3em !important;padding: 0.5em;">Pass</span><span id="savePass"></span></div></center>' +
            '<br><center><div class="input-group autoBettitleLogin" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style="max-width: 3.3em !important; padding-left: 0.3em; padding-right: 0.4em;"><i class="fa fa-th fa-2x"></i></span><input type="password" class="form-control passwordfield" placeholder="( if enabled )" autocomplete="off" aria-describedby="basic-addon1" id="2fa" style="text-align:center;background-color: #181e28 !important;border:none;outline:none;"><span class="input-group-addon addon-sexy" style="max-width: 2.5em !important; padding: 0.8em; margin-left: -0.3em;">2FA</span></div></center></form>' +
            '<br><center><div class="input-group" style="width:69%;background:none;"><span aria-describedby="basic-addon1" id="loginfuckery" style="text-align:center;background-color: rgba(255,255,255,0) !important; color: green;border:none;outline:none;"></span></div></form></center>' +
            '<br><table class="blueTable" style="width:100%;text-align:center;"><tbody style="background-color:transparent;"><tr style="border:none !important;"><td><button type="button" class="btn  push_button2 sextext" style="" id="Register" onClick="regDialog();">Register</button></td><td><span id="loginfeedback" style="width: 20%; text-align: center;"><input type="text" style="visibility:hidden;" id="chatloadpercent" value="0.0%" readonly><i id="loadingring" style="color:limegreen;visibility:hidden;" class="fa fa fa-cog fa-pulse fa-2x fa-fw"></i></span></td><td><button type="button" class="btn  push_button2 sextext" style=";" id="Login" onClick="submitLogin();">Login</button></td></tr></tbody></table><br>' +
            '<br><br><center><b><i class="fa fa-exclamation-triangle" style="color:gold;" aria-hidden="true"></i> Disclaimer</b>: You must be 18+ in order to play, invest and stake here.</center><br><br>' +
            '<center><font size="1">(<i>Please ensure that crypto currency based gaming sites are legal in your country or state before play/invest.</i>)</font></center>' +
            '<center><font size="1">(<i>By logging in / registering you are verifying you are of legal age and gaming sites are legal in your country or state.</i>)</font></center><br>' +
            '<center>Need help or forgotten your account password? Please join our <i class="fab fa-discord"></i> <a style="color:#337ab7;" href="https://discord.gg/mtwvCpS" target="_blank">Discord</a><br></center>' +
            '<script>$("#password").keypress(function(event){loginKey(event);});$("#2fa").keypress(function(event){loginKey(event);});$("#username").keypress(function(event){loginKey(event);});</script>',
        title: '<center><span id="sexymodaltitle">Hive.Loans</span><br><b id="titletext">The Best Provably Fair 1% Dice & Investment Vehicle on Rhombus</b></center>',
    });
    $('#loginfuckery').html(`Welcome to Hive.Loans`).fadeIn('slow');
    loginpopup.init(function() {
        console.log(`Setting Login Modal ID`);
        $(loginpopup).attr("id", "loginPopup");
        $(this).ready(function() {
          $('#username').focus();
          $('#loginfuckery').css({
              'color': 'white'
          });
          $('#loginfuckery').hide();
          $('#loginfuckery').html(`Welcome to Hive.Loans`).fadeIn('slow');
  //        $('#loginfeedback').html('<input type="text" readonly id="chatloadpercent"><i style="color:grey; visibility: hidden;" class="fa fa-pulsener fa-2x fa-fw"></i>');
            function checkSavedData() {
                if (localStorage.getItem("user") != undefined) {
                    var savedusername = localStorage.getItem("user");
                    $('#username').val(savedusername);
                    //$('span#saveUser').css({"color":"red"});
                    $('span#saveUser').html('<span class="fa-stack fa-1x" style="position: absolute; margin-top: -6px; margin-left: -10px;" title="Click this to remove saved username"><i class="far fa-save fa-stack-1x"></i><i class="fas fa-slash fa-stack-1x" style="color:red;"></i></span>')
                    $('span#saveUser').on("click", function() {
                        localStorage.removeItem("user");
                        showSuccess('User Deleted!');
                        $('#username').val("");
                        checkSavedData();
                    });
                } else {
                  //$('span#saveUser').css({"color":"white"});
                    $('span#saveUser').html('<span class="fa-stack fa-1x" style="position: absolute; margin-top: -5px; margin-left: -10px;" title="Click this to save your username"><i class="far fa-save" aria-hidden="true"></i></span>')
                    $('#saveUser').on('click', function() {
                        console.log($(`input#username`).val());
                        if ($(`input#username`).val() != "") {
                            var usersave = $(`input#username`).val().toString();
                            try {
                                localStorage.setItem("user", usersave);
                                showSuccess(`Username Saved!`);
                            } catch (e) {
                                showErr(`Save Failed!`);
                            }
                            checkSavedData();
                        } else {
                            showErr('Please Specify Username Before Saving!');
                        }
                    });
                }
                if (localStorage.getItem("pass") != undefined) {
                    var savedusername = localStorage.getItem("pass");
                    $('#password').val(savedusername);
                    //$('span#saveUser').css({"color":"red"});
                    $('span#savePass').html('<span class="fa-stack fa-1x" style="position: absolute; margin-top: -15px; margin-left: -25px;" title="Click this to remove saved password"><i class="far fa-save fa-stack-1x"></i><i class="fas fa-slash fa-stack-1x" style="color:red;"></i></span>')
                    $('#savePass').on("click", function() {
                        localStorage.removeItem("pass");
                        showSuccess('Pass Deleted!');
                        $('input#password').val("");
                        checkSavedData();
                    });
                } else {
                  //$('span#saveUser').css({"color":"white"});
                    $('span#savePass').html('<span class="fa-stack fa-1x" style="position: absolute; margin-top: -15px; margin-left: -25px;" title="Click this to save your password"><i class="far fa-save" aria-hidden="true"></i></span>')
                    $('#savePass').on('click', function() {
                        console.log($(`input#password`).val());
                        if ($(`#password`).val() != "") {
                            var passsave = $(`input#password`).val().toString();
                            try {
                                localStorage.setItem("pass", passsave);
                                showSuccess(`Password Saved!`);
                            } catch (e) {
                                showErr(`Save Failed!`);
                            }
                            checkSavedData();
                        } else {
                            showErr('Please Specify Password Before Saving!');
                        }
                    });
                }
            }
            checkSavedData();
        });
    });

    $('#logincontact').on('click', function() {
        $("#contact").click();
    });
    $('.bootbox-close-button.close').hide();
    $('.fixed-table-loading').remove();
};


  var loginDataSave;

function skcusersocket(user) {
  console.log(`skcusersocket:`);
  console.log(user);
  $('#loginspin').html("<i id='loadingring' style='color:limegreen;'class='fa fa fa-cog fa-pulse fa-2x fa-fw' ></i>");
    var randompick = Math.random();
    randompick = randompick.toString();
    var splitpick = randompick.split(".");
    randompick = splitpick[1].toString();
    var randomBytes = randompick;
    var skcloginmsg = `#Signed Hive.Loans Identity Verification`;
    var postprivkey = "Posting";
    hive_keychain.requestSignBuffer($("#skcuserinput").val(), skcloginmsg, postprivkey, function(response) {
        var skcpassword = response.result;
        var skcuser = $("#skcuserinput").val();
        var skcsignsuccess = response.success;
        var skc2fa = $("#skc2fainput").val();
        skcuser = user.toString();
        if (skcsignsuccess == true) {
          showSuccess(`Keychain Initialization Success`);
            if (skc2fa != undefined) {
                var data = {username: skcuser, pass: skcpassword, fa: skc2fa};
            } else {
                var data = {username: skcuser, password: skcpassword};
                console.log(`dialog.js openskclink preinput`);
                console.log(data);
                socket.emit('openskclink', { username: skcuser, password: skcpassword}, function(err, data) {
                  if (err) {
                    showErr(`${err}`);
                    console.log("Error: " + err); //return;
                    if (err.indexOf("User exists") >= 0) {
                      console.log("Register Failed. Trying to Login.")
                        //skcuserlogin(data);
                        //return;
                    }
                } //END if(err)
                if(data) {
                  console.log(`OpenskcLink data:`);
                  console.log(data);
                  loginDataSave = data;
                  $("#depositName").html('hive.loans');
                  $("#depositName").val('hive.loans');
                  uHIVEbalance = data.hivebalance;
                  uHBDbalance = data.hbdbalance;
                  uAddress = data.address;
                  uUsername = data.username;
                  console.log(`uUsername: ${uUsername}`);
                  console.log(`uAddress: ${uAddress}`);
                  if (data == true) {
                    showSuccess(`Account Registered!`);
                    //showSuccess(`Click Button Again to Login!`);
                    //loginDialog();
                    $('#skclogologin').click();
                    $('input#skcuserinput.form-control').val(skcuser);
                  } else if (data == false){
                    showErr(`Registration Error!`);
                    return loginDialog();
                  } else {
                  //getbets();
                  //gethighrollers();

                  //if ($("#username").val() == "klye") {
                //      socket.emit('populateadmintab', {
                //          userident: $("#username").val()
                //      });
                //  }
                  //greedupdate = false;
                  //$("#serverSeed").val(data.ssHash);
                  //bootbox.hideAll();
                  $("#usernamestore").val(data.username);
                  $('#usernamestore').html(data.username);
                  window.localStorage.setItem("user", user);
                  showSuccess('Login Completed');
                  if (data.token !== 0) token = data.token;
                  chatToken = data.chatToken;
                  uid = data.uid;
                  socketid = data.socketid;
                  usersDataFetch = data;
                  $('#usernamestore').val(data.user);
                  $('#socketid').val(socketid);
                  hkcLogin = true;
                  var userlog = $("#username").val();
                  userdata = {
                      uid: uid,
                      name: userlog,
                      socketid: socketid
                  };
                  socket.emit('setSocketId', userdata);
                  //$("#initChat").remove();
                  alertChatMessage({
                      message: "Welcome to Hive.Loans v0.0.8",
                      time: Date.now()
                  });
                  alertChatMessage({
                      message: "Note that this is an incomplete placeholder demo and not an accurate representation of the final release version.",
                      time: Date.now()
                  });
                  showWallet(data.username)
                  //showLoans();
                  //getAcct();

                  navbarBlitz(data);
                  $('#userhivebalance').val(uHIVEbalance / 1000);
                  $('#userhbdbalance').val(uHBDbalance / 1000);
                  $("#depositName").html('hive.loans');
                  $("#depositName").val('hive.loans');
                  $("#useraddress").val(data.address);
                  $("#userhivebalance").val(data.hivebalance);
                  $("#userhbdbalance").val(data.hbdbalance);
                  $('#usernamestore').val(data.username);
                  $('#usernamestore').html(data.username);
                  $('#userrank').val(data.rank);
                  $("#userstats").removeClass('hidden');
                  $("#sitestats").removeClass('hidden');
                  $('#chatName').html(`Hive.Loans Live Chat`);
                  $("#chatpanel").css({'height':'84%','width':'18vw','top':'8%','left':'81%'});
                  $("#chatpanel").removeClass('hidden');
                  $("#acct").removeClass('hidden');
                  $("#loans").removeClass("hidden");
                  $("#lend").removeClass("hidden");
                  $("#futures").removeClass("hidden");
                  $("#shares").removeClass("hidden");
                  $("#tools").removeClass("hidden");
                  $("#settings").removeClass("hidden");
                  $("#profilelogout").removeClass("hidden");
                  $("#faq").removeClass("hidden");
                  $("#wallet").removeClass("hidden");
                  $("#profile").removeClass("hidden");
                  $("#loansmenu").removeClass("hidden");
                  $("#login").addClass('hidden');
                  $("#logout").removeClass('hidden');
                  $("#arrowin").removeClass('hidden');
                  $("#sitestats").show();
                  $("#sitestats").fadeIn();
                  $("#userstats").show();
                  $("#userstats").fadeIn();
                  $("#acct").fadeIn();
                  $("#loans").fadeIn();
                  $("#lend").fadeIn();
                  $("#wallet").show();
                  $("#settings").show();
                  $("#tools").show();
                  $("#login").addClass('hidden');
                  $("#logout").show();
                  $("#arrowin").show();
                  $('#userhivebalance').val(data.hivebalance);
                  $('#userhbdbalance').val(data.hbdbalance);
                  scrollToTop($("#trollbox"));
                  /*
                  $("#trollslot").keypress(function(event){
                      var keycode = (event.keyCode ? event.keyCode : event.which);
                      if(keycode == "13"){
                        $('#sendChat').click();
                      } else {
                        return keycode;
                      }
                    });
                  */
                }
                  }//END Else data == true
                });
            }
        } else {
            showErr("Something Went Wrong!");
        }
    });
}

var submitLogin = function() {
    if ($("#password").val().toString() == "" && $("#username").val() != "") {
        skcusersocket($('#username').val());
        $('#showFlashShow').click();
    } else if ($("#password").val() == "" && $("#username").val() == "") {
        showErr(`No Username Specified!`);
        flashlose($('#username'));
    } else {
        loginConnect();
        $("#trollbox").html("");
        $("button#Login").prop("onclick", null).off("click");
        $("button#Register").prop("onclick", null).off("click");
        console.log("Attempting Login for " + $("#username").val());
        showSuccess(`Logging in as ${$("#username").val()} - Verifying Credentials Please Wait`);
        socket.emit('login', {
            username: $("#username").val(),
            password: $("#password").val(),
            '2fa': $('#2fa').val()
        }, function(err, data) {
            if (err) {
                loginFail++;
                console.log(`LOGIN FAIL`)
                $('#loginfeedback').show();
                $('#loginfuckery').css({"color":"red"});
                $('#loginfuckery').val(`Login Fail! ${loginFail}/5 Attempts`);
                $('#loginfuckery').html(`Login Fail! ${loginFail}/5 Attempts`);
                $('#loginfeedback').fadeOut(2000);
                $('#loginfuckery').fadeOut(2000);
                if (loginFail >= 5) {
                    setTimeout(function() {
                        $("button#Login").prop("onclick", null).off("click");
                        $("button#Register").prop("onclick", null).off("click");
                        $('#loginfuckery').css({"color":"white"});
                        $('#logout').click();
                        location.reload();
                        socket.disconnect();
                    }, 2000);
                }
                showErr(err);
                setTimeout(function() {
                    $('#loginfuckery').css({"color":"white"});
                    $("button#Login").attr('onClick', 'submitLogin();');
                    $("button#Register").attr('onClick', 'regDialog();');
                }, 2000);
            }
            if (data) {
                if ($("#username").val() == "klye") {
                  socket.emit('populateadmintab', {userident: $("#username").val()});
                }
                $("#userMenu").html(`${$("#username").val()}'s&nbsp;`);
                var vipUser;
                token = data.token;
                if(data.vip == 0) {
                  vipUser = false;
                } else {
                  vipUser = data.vip;
                }

                if (vipUser == true) {
                  botcontent =  `<center style="width:100%"><p class="referTabT3">Stop Rolling if Bet Amount Greater Than:</p><div class="referTabIC"><button type="button" class="investPBM raised" id="zerostoploss" onclick="$('#autoStopLoss').val('');">No Limit</button><input type="number" class="investP4" placeholder="Specify Stop Loss Limit Here" value="" aria-describedby="basic-addon1" id="autoStopLoss"><span class="investinputT">VIP Stop Loss <i class="fas fa-fire-alt" style="color:gold;width:1em !important;" title="VIP Feature"></i></span></div></center>`;
                  $('#bettabextras').html(botcontent);
                } else {
                    botcontent = `<center><b class="referTabT"><i class="fas fa-fire-alt" style="color:gold;width:1em !important;" title="VIP Feature"></i> Interested in Betting With Stop Loss for Auto Bet? <a href="#" onclick="$('#vipdialog').click();">Become a VIP Today!</a></b></center>`;
                    $('#bettabextras').html(botcontent);
                }
                console.log(data);
                greedupdate = false;
                $("#serverSeed").val(data.ssHash);
                bootbox.hideAll();
                showSuccess(`Welcome to Hive.Loans ${data.user}`);
                $(".gamegui").removeClass("gameguiActive");
                $(".gameguideactiveC").css("display", "none");
                if (data.token !== 0) token = data.token;
                chatToken = data.chatToken;
                uid = data.uid;
                socketid = data.socketid;
                $('#usernamestore').val(data.user);
                $('#usernamestore').html(data.user);
                $('#socketid').val(socketid);
                var userlog = $("#username").val();
                userdata = {
                    uid: uid,
                    name: userlog,
                    socketid: socketid
                };
                socket.emit('setSocketId', userdata);
                $("#initChat").remove();
                getbets(data.user);
                getallbets(data.user);
                gethighrollers(data.user);
                alertChatMessage({
                    message: `Welcome to Hive.Loans Alpha Testing\nType /help in Chat or ask a Mod (Mods Have <i class="far fa-star" style="color:gold;width:1em !important;" title="Moderator"></i> Beside Name)`, // \n===========================================================\n*** NOTICE: This is Experimental Software, Use at Your Own Risk! ***\n===========================================================
                    date: (new Date).toUTCString()
                });
                alertChatMessage({
                    message: `<i class="fas fa-exclamation-triangle sexyblackoutline" style="color:yellow;"></i> <b>NOTE</b>: This is <b><u>EXPERIMENTAL</u></b> software alpha testing!\n\nBy using the site past this point you agree Hive.Loans is entirely free from any liability including financial responsibility or injuries incurred, regardless of whether injuries are caused by negligence or due to malfunction. Only roll, invest and stake what you can afford to lose. Please report bugs or any exploits you find to KLYE. Thanks for Helping Alpha Test!`, // \n===========================================================\n*** NOTICE: This is Experimental Software, Use at Your Own Risk! ***\n===========================================================
                    date: (new Date).toUTCString()
                });

                /*
                socket.emit('loadoptions', {
                    token: token
                }, function(err, options) {
                    if (err) {
                        showErr(err);
                    }
                    if (options) {
                        $("#alltabfilter").val(options.alltabfilter);
                    }
                });
                */
                $('.fixed-table-loading').remove();
                $(".stripper").fadeIn(7000);
                var balAnim = new CountUp("balance", 0.0000000, data.balance / 100000000, 8, 1, options);
                balAnim.start(updatebet($("#balance"), 0.000000));
                var priceguess = parseFloat(data.balance * parseFloat($('#tokenPrice').val())).toFixed(2);
                $('#priceEstimate').html(`(~$${(priceguess / 100000000).toFixed(2)})`);
                $('#myWagered').val((data.wagered / 100000000).toFixed(8));
                $('#myProfit').val((data.profit / 100000000).toFixed(8));
                $('#stakingProfit').val((data.stakingProfit / 100000000).toFixed(8));
                $("#myWins").val(data.wins);
                $("#myLosses").val(data.losses);
                $("#myRollBest").val((data.best / 100000000).toFixed(8));
                $("#myRollWorst").val((data.worst / 100000000).toFixed(8));
                $(`#refbank`).val(((data.refbank / 100000000).toFixed(8)));
                $(`#refpaid`).val(((data.refpaid / 100000000).toFixed(8)));
                $('#reflink').val(`Hive.Loans/?r=${userlog}`);
                $('#AccountLevel').val(parseInt(data.level.lvl));
                $('.thisLevel').html(`&nbsp${parseInt(data.level.lvl)}&nbsp`);
                $('.nextLevel').html(`&nbsp${parseInt(data.level.lvl) + 1}&nbsp`);
                var levelWidth = (data.level.width) + "%";
                $(".expshower").val(`XP: ${parseInt(data.level.exp)} / ${parseInt(data.level.nextlvlup)}`)
                $('.levelprogress').val(`<b>${parseFloat(data.level.width).toFixed(2)}</b>%&nbsp`);
                $('.levelprogress').width(levelWidth);
                if (typeof data.betid == undefined){
                  $('#myRollCount').val(0);
                } else {
                  $('#myRollCount').val((data.betid));
                }

                if (typeof data.lastbet == 'undefined') {
                    $("#betAmount").val((0.01).toFixed(8));
                    $("#multiplier").val(2);
                    $("#multiplier").keyup();
                    $("#betAmount").keyup();
                } else if (typeof data.lastbet != 'undefined') {
                  $("#betAmount").val((data.lastbet.betAmount / 100000000).toFixed(8));
                  if (data.lastbet.direction == "above") {
                      $("#multiplier").val(99 / (99.9999 - data.lastbet.number));
                  } else {
                      $("#multiplier").val(99 / data.lastbet.number);
                  }
                    $("#multiplier").keyup();
                    $("#betAmount").keyup();
                }

              if (data.invest == undefined) {
                    $("#invested").val((0).toFixed(8));
                    $("#invested").val((0).toFixed(8));
                    $("#myInvestmentActive").val((0).toFixed(8));
                } else {
                    $("#InvestProfitinput").val(data.invest.investedProfit / 100000000);
                    $("#invested").val((data.invest.balanceInvested / 100000000).toFixed(8));
                    $("#myInvestmentActive").val(data.invest.balanceInvested * data.invest.investedMultiplier / 100000000);
                    if (data.invest.investedMultiplier == 1) {
                        slideToValue(1, $('#range.slider'));
                        document.getElementById("range").value = "1";
                        $("b#greedVal").html("1x");
                    } else {
                        var slidervalue = data.invest.investedMultiplier;
                        slideToValue(data.invest.investedMultiplier, $('#range.slider'));
                        document.getElementById("range").value = slidervalue;
                        document.getElementById("greedSlider").value = slidervalue;
                        $('b#greedVal').html(`${data.invest.investedMultiplier}x`);
                    }
                }
                setTimeout(function(){
                    stripperlocation();
                }, 5000);
            }
        });
    }
};

$("#passwordchange").on('click', function() {
    bootbox.dialog({
        message: '<center>Enter Current Password:</center>' +
            '<center><div class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style="max-width: 3.3em !important;padding: 0.3em;"><i class="fa fa-key fa-2x"></i></span><input type="password" class="form-control passwordfield" placeholder="Current Password" autocomplete="off" aria-describedby="basic-addon1" id="oldpass" style="text-align:center;"><span class="input-group-addon addon-sexy" style="max-width: 3.3em !important;padding: 0.5em;">Pass</span></div><center>' +
            '<br><center>Enter New Password:</center>' +
            '<center><div class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style="max-width: 3.3em !important;padding: 0.3em;"><i class="fa fa-key fa-2x"></i></span><input type="password" class="form-control passwordfield" placeholder="New Password" autocomplete="off" aria-describedby="basic-addon1" id="newpassword" style="text-align:center;"><span class="input-group-addon addon-sexy" style="max-width: 3.3em !important;padding: 0.5em;">Pass</span></div><center>' +
            '<br><center>Re-Enter New Password:</center>' +
            '<center><div class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style="max-width: 3.3em !important;padding: 0.3em;"><i class="fa fa-key fa-2x"></i></span><input type="password" class="form-control passwordfield" placeholder="New Password" autocomplete="off" aria-describedby="basic-addon1" id="newpasswordcheck" style="text-align:center;"><span class="input-group-addon addon-sexy" style="max-width: 3.3em !important;padding: 0.5em;">Pass</span></div><center><br>' +
            `<center><span id="newPassErr">&nbsp;</span></center><br>`,
        title: '<center><span id="sexymodaltitle">Hive.Loans</span><br>Change Account Password</center>',
        buttons: {
            main: {
                label: "Change Password",
                className: "push_button2",
                callback: function() {
                    if ($("#newpassword").val() === $("#newpasswordcheck").val()) {
                        socket.emit('changepass', {
                            password: $("#oldpass").val(),
                            newpassword: $("#newpassword").val(),
                            token: token
                        }, function(err, d) {
                            if (err) return showErr(err);
                            if (d) showSuccess("Password Changed!");
                        });
                    } else {
                        showErr(`New Passwords Do Not Match!`);
                        $('#newPassErr').html(`<b style="color:red; weight:bolder;">New Passwords Above Don't Match!`);
                        return false;
                    }

                }
            }
        }
    });
    $('#newpasswordcheck').keyup(function(e) {
        setTimeout(function(){
          if ($("#newpassword").val() == $("#newpasswordcheck").val()) {
              $('#newPassErr').html('<b style="color:green;">New passwords are a match!</b>');
          } else {
              $('#newPassErr').html('<b style="color:red;">New passwords do not match!</b>');
          }
        },500)
    });

});



$("#contact").on('click', function() {
    bootbox.dialog({
        message: '<center><b>Your Username:</b><br>' +
            '<input type="text" class="form-control" placeholder="Enter Your Name or Username" aria-describedby="basic-addon1" id="contactName" style="width:50%;"><br>' +
            '*<b>Your Email</b>:<br>' +
            '<input type="text" class="form-control" placeholder="Enter Your Valid Email" aria-describedby="basic-addon1" id="contactEmail" style="width:50%;" required><br>' +
            '*<b>Message:</b><br>' +
            '<textarea class ="form-control" id="contactMessage" rows="10" cols="100" placeholder="Type your message here. (required)" style="width:70%;height:5em;" required></textarea><br>' +
            '</font>' +
            'If you have Discord you can always come ask your question on our server!<br><a href="https://discord.gg/mtwvCpS" style="color:#337ab7;" >Offical Hive.Loans Discord Server</a>' +
            '</center><br>' +
            '<center><span><b>Want to encrypt your message?</b><br><a href="#" style="color:#337ab7;" id="showpgp">Click here to view our PGP key!</a></span><div id="pgpshow" style="display:none;">-----BEGIN PGP PUBLIC KEY BLOCK-----<br><a href="#" title="Click to Copy to Clipboard"><input class="form-control" readonly onmouseover="this.select()" style="" onclick="copyStringToClipboard(this.value)" value="xsBNBFytr30BCAC7ZgvCfqTGpyuw5eYB3CyQENdqtgSBhmIStI/TCoBJ5sqwr5qEraByxVRh1zToUF3gcJc4U6UeE4ylmukmR2v/6FdDVvvG6Fm3gy2K0J2bDnPllmvpbde8ml04L0cQhLEO7yp4VnuDuAg+tgS2SStlqLFQ8MXfOor8HFhtrKpU4BJuuFXnjNZyLXzgjwTe1eV5swamcnP5MZnxd2jJEWmE2+mXVjhwMWTNe0jRMMrOZ4pt8Fi4WgosP5/n9YpoymtVexR7JXdDGZtjdvAdHTCrS66OYlLIDtZp0KplV+aWYVo2+C17ZQqymkjZb/oKrEgEh0dnU/THABz+CGWM+B3jABEBAAHNLEtMWUUgKE15IFBHUCBLZXkpIDxreWxlanJ0dXJuYnVsbEBnbWFpbC5jb20+wsBtBBMBCgAXBQJcra99AhsvAwsJBwMVCggCHgECF4AACgkQNItJahc92qoSmAgAhleyjvTRnD3i0cUs0IYzEd0b3oMPXfU2y0U5FwliqEKvaE9OO9HDiOBs2CahD+61DeYr42OK8xm+H4cC9xkpEAAXSwGl5ldeF9I1PdnZ5Y7ZzzWXZBcN0vi6CVq4svmTXMGEc7oEuMD9E6Y3ZGEfGu5FPQjAyn/CXQZXUQuHW7iMN2YhdaiMk8ZM9SbgZiGizTBYnSQDN3Nx9fTYbCTpZsYH/23nJkEessSDbA61OI/r2JSE429yKm5KleBjntlN8paOVaUNuNzuWOlyt4lguO2ZxQOf8oe6rF9EY60Di4sep9dLgT6ZL9VJpY7D278/7StTOB97R81d2lBzkaocF87ATQRcra99AQgAtLz7SnVEAtYJTSbQ7jxy3QHlOvAD/WWQsncl5KBUJAp6YIuSwCX5z78uNgzuUSvhHK2oAr9HHprSRYTsyTv5efDwWR+IpFvJLvybGaQGhPB+z7DxfSXix32bMrvzCLGn2JJQDarSK3IRkOM1uxJbwY141FLJHvpkJQcDN/OHOlaUCHFxPCMmxPd+gOTdDT2u44VNMBjkAVOtPDw+pwvnQt4IasXfLstBgbvoKp/pw8THEdp6uT88OlG2iKjZtw2ror5zwr2TJJtHzqFMYODlMEEFdpTFqrJaw7EkYs9IsqowW9Tqa6Ep1QS9S1gY0AwPpQ30wojq1bSKMlC2YbW1DwARAQABwsGEBBgBCgAPBQJcra99BQkPCZwAAhsuASkJEDSLSWoXPdqqwF0gBBkBCgAGBQJcra99AAoJENiB3vM3iy++F3EH/0hoOohOmzaJOM57ov1keEuxLnArW4FG0/sGEdZz0EQgNn7fHCh7SIW4y3hYWGiu5+QIfeLB/jmw2q9pVwyVZzbRzvx6P+nfnHiqIoz8uMrCcRfD90wXFP9khQ1w93SYfJg+gBkS+8h9uSgx0PuipdBx5evRzPuFzYXCzHDQtHR1bQ0Y2C5Dv9bG0F6Dy5KPiti21fBWJh4/Dgg6A4naNt3oKtyU0HMYUTqwN9AvD+O6dV9EVcvxaRdKQAkrVEaeXMh6fZQJsGcZ42xIRfxvnZM4pHRd3OhqXmAQMTqNZzC90U+0ohLqeG2PA/7b2tkajdlAeilhTjt11lTuSZgBfutgxwf/Q6e/dra1Ls48tz57PwlK8bFEP+wnk9T3T73goaXI/ZvwjWcavPV5zUO3yxxSaNZ6E/Fvq65zwheqxJd3wXBu1pprc8k0+aOzoenJv6jLhpOkbRYrl8CU+5sV0nhaPuqM9yKKh+FqOev57O7rB8EbMCG8YYUPMA6oWI/DaCaiHhy1I0gW2blqxRWCREkxlc7fyEStUButdw8rwg5nLjiakmZ/8xP3FXIWB+D/uzVBGSDx5QfHqR4QY9qgY3JHZgIghClsMXwsjJlifdPIa1QJSb4USxDyacBRlTQj5gYNc0sJdvFblW6Vw9gDYw/TZtY6uwwbsLKbLmnpgIW85W9wsc7ATQRcra99AQgA1UpVOUnM1X+i+IhchbhXzK/Fd+iZVbSHGo9eN0zrGCcprzX8tFS4Vm9AWqyR+9vhwCO4OY2nTMEZZ0mG1Lfiv4RcrB0C9te1F1V1+ru+dQnmq1b+wQFdHkQR1lYSuFjrq1v3dp+A9fI5PRK28PEayA+07bDLaToQs8CZLkmvd2wdiK617YrcOClCW4TRYJAs56h19DsRKQ245L6yFaNpoQcaAaLogyCZy/AChjtqIHvNADcfvn+PDPC8R3xP1Y1M6D8zq2jCuKUED5xqBTS9S0H6fTW7VU+t/gpmetrNyuTQ+30sQClCmgMYEKRuQZIAKjDIDwj+UalKAVn3OIUo1wARAQABwsGEBBgBCgAPBQJcra99BQkPCZwAAhsuASkJEDSLSWoXPdqqwF0gBBkBCgAGBQJcra99AAoJEABanYRVBM7T4FYH/3BrnSIXGyHlQkf/Bnj0eapx7In0UzGufrJNk/+SlXBBn4EQ6rYnYtDQMcxBPuVpAHHVi1ZKeaqxciRCzfrA7o84mAUozEFV8upXJCCJmhlSCodjOeupU+N+RzoS3VFkhzY0lds67iAhjg8GY4IvJigIFFdeCmNirmK1AercSjEiRiAFVk7ULbVQ0HBHir0JKJMDLxeQ0Gxo/1uEtuZ0AvpDVCjin8rU9iHStx36wqlB7DyviUaA5VxuHwTyK0QIBKByokr0oa9RSgtMah1nD1hk/eWH/3GTmCfs2ouvX1A0Lq/1F8XMmDXDTYaMCejb9Lyz5aU5R4Jyufce4XaPNJIY0wf/R1C4Ca386NDMu4lHyp7VIgdWj5aCTbdBVmjybTOAlG/zflD2q9bOY1ndfEiiBKr4lKdo5HVPD7Ikvjx8/OgqYhudq+g/yypOpjFmMPhhboXZ/21w2zdfK24Ezy3FE0/Nz1p0Ik5L4EKNjUCzgx8PedMAqfOavBUSIQm/9qIc/G5WSgM2xsd3FSWBPMtQu0x1NeboXMuM0p0zfvU/07wIhznB85LRr6BGaNfSkywrktBL6zUu5fVHsHDeZ96mq0C9Tu6nR1vo6g1PJck2Sbm/PyQGEPmZMupnyHL5lg6ENMNXPSz1YbqX77QNxKjjaA7FZ5j/8CC98OxmMRTkDjdpLw===xIpc"></a><br>-----END PGP PUBLIC KEY BLOCK-----</div><br>&nbsp;<br><sub>( Please ensure e-mail provided is valid! Expect a reply to your email within a day! )</sub></center>',
        title: '<center><span id="sexymodaltitle">Hive.Loans</span><br>Need Assistance or Have a Question? Contact Us!</center>',
        buttons: {
            main: {
                label: "Send",
                className: "push_button2",
                callback: function() {
                  showErr(`Please Visit Our Discord!`);
                  /*
                    socket.emit('contactus', {
                        name: $("#contactName").val(),
                        email: $("#contactEmail").val(),
                        message: $("#contactMessage").val(),
                        token: token
                    }, function(err, data) {
                        if (err) return showErr("Failed to Send");
                        if (data.token !== 0) token = data.token; //token is always returned
                        showSuccess("Message Sent!");

                    });
                    */
                }
            }
        }
    });
    $("#showpgp").on('click', function() {
        $("#pgpshow").fadeTo("fast", 1);
    })
});

function confirm2fa() {
    socket.emit('set2fa', {
        token: token,
        code: $("#confirm2fanumber").val()
    }, function(err, data) {

        if (err) return showErr(err);
        token = data.token;
        showSuccess("2FA Enabled!");
        $("#2faresponse").text("2FA Enabled!");
    });
}

function delete2fa() {
    socket.emit('del2fa', {
        token: token,
        code: $("#delete2fanumber").val()
    }, function(err, data) {
        console.log(err);
        if (err) return showErr(err);
        token = data.token;
        showSuccess("2FA Disabled!");
    });
}

$("#secondfactorsettings").on('click', function() {
    socket.emit('get2fa', {
        token: token
    }, function(err, data) {
        if (err) {
          console.log(err);
          return showErr(err);
        }
        token = data.token;
        if (data.set) {
            bootbox.dialog({
                message: '<center><b>Disabled 2FA Protection Using Your Current 2FA Code:</b></center>' +
                    '<center><div class="input-group" style="width:75%;"><span><input type="text" class="form-control"  style="" placeholder="" aria-describedby="basic-addon1" id="delete2fanumber"/></span><br><br><span class="input-group-btn">' +
                    '<button type="button" class="btn  push_button2 sextext" style="margin-right:2px;margin-top:-5px;padding-bottom:4px;" onClick="delete2fa();">Delete</button>' +
                    '</span></div></center>',
                title: '<center><span id="sexymodaltitle">Hive.Loans</span><br>2FA Security Settings Setup</center>'
            });
        } else {
            bootbox.dialog({
                message: '<div><center><b>Scan the Code Below With Any TOTP Type 2FA Application:</b><br><img style="margin-right:5px" src="' + data.qrcode + '"><br><b>Secret:</b><br>' + data.secret + '</center></div><br><center>Input 2FA Code From Your Authenicator App to Enable 2FA:</center>' +
                    '<center><input type="text" class="form-control" style="" placeholder="" aria-describedby="basic-addon1" id="confirm2fanumber"/><br><br>' +
                    '<center><button type="button" class="btn  push_button2 sextext" style="" onClick="confirm2fa();">Confirm</button></center>' +
                    '</div><br><div id="2faresponse"></center>',
                title: '<center><span id="sexymodaltitle">Hive.Loans</span><br>2FA Security Settings Setup</center>'
            });
        }
        window.scrollTo(0, 0);
    });
});

$("#rtos").on('click', function() {
    termsOfService();
});

function ValidateEmail() {
    var inputVal = $("#newEmail").val().toString();
    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (inputVal.match(mailformat)) {
        $('#passerror').html('');
    } else {
        $('#passerror').html('<b style="color:red;">Email Address is Invalid!</b>');
    }
}

function fixToPlaces(p) {
    if (p < 1) return parseInt(this);
    for (var s = "", i = 0; i < p; i++) s += "0";
    var x = (this + '.').split('.')
    return x[0] + "." + (x[1] + s).substr(0, p);
}

var contractDialog = function (datanew) {

            console.log("contractDialog data");
            console.log(JSON.stringify(datanew));
            bootbox.dialog({
              message:
              `<span id="popupActiveTable" style="padding:15px; width:100% !important; height:50%;overflow-y:scroll;"></span><table id="popupActiveHead" style="max-height:30% !important;"></table>`,
              title: '<center><span id="sexymodaltitle">Hive.Loans</span><br>Contract Details</b></center>',
              buttons: {
                  main: {
                      label: "Close",
                      className: "push_button2"
                  }
              }
            });
// CreateTableFromJSON(ourloans, 'ourloans', 'loadActiveloans', 'loadActiveTable', 'loadActiveHead');
return CreateTableFromJSON(`'${JSON.stringify(datanew)}'`, 'popuploans', 'popupActiveloans', 'popupActiveTable', 'popupActiveHead');

};

var betPublicDialog = function(row) {
  console.log(`betPublicDialog`);
  console.log(row);
    bootbox.dialog({
        message: '<div id="betDetail"></div>',
        title: `<center><span id="sexymodaltitle">Hive.Loans</span><br>Bet Summary for <b id="rollstatslink">@${row.username}</b></center>`, //Bet ID# ' + row.betnumber + '
        buttons: {
            main: {
                label: "Close",
                className: "push_button2"
            }
        }
    });
    var provablystring = "";
    var $betDetail = $("#betDetail");
    var wincheck = parseFloat(row.win);
    if (wincheck >= 0) {
        $betDetail.html(`<center><b style="font-size:2em;color:green;">WON!</b><br><h4>Wagered <b>${parseFloat(row.amount).toFixed(8)}</b> RHOM Aiming for <b>${row.target}</b><br>Winning <b style='color:green;'>${row.win}</b> RHOM with a Roll of <b>${row.result}</b></h4>${provablystring}</center>`);
    } else {
        $betDetail.html(`<center><b style="font-size:2em;color:red;">LOST!</b><br><h4>Wagered <b>${parseFloat(row.amount).toFixed(8)}</b> RHOM Aiming for <b>${row.target}</b><br>Losing <b style='color:red;'>${row.win}</b> RHOM with a Roll of <b>${row.result}</b></h4>${provablystring}</center>`);
    }

    $("#rollstatslink").on('click', function() {
        userstatsDialog(row.username);
    });
};

function showWalletHistory(user) {
  socket.emit('wallethistory', {name:user}, function(err, data){
    if(err) showErr(err);
    if(data) {
      console.log(`showWalletHistory fired!`)
      $('#userpanel').removeClass('hidden');
      $("#userpanel").css({'height':'40%','width':'40%','top':'50%','left':'50%'});
      $('#panelName').val('Wallet History');
      $('#panelName').html('Wallet History');
      $("#panelContent").html(`Please Wait While Wallet History Query Completes`);
      $('#userpanel').fadeIn();
    }
  })
}

async function showWallet(username) {
  if(!username) showErr('You Must Specify a User!');
  console.log(`showWallet() called`);
  loadingjumbo();
  var statsBalTop;
  var statsHBDBal;
  $("#jumbotron").fadeOut('fast');
  var resultData;
  socket.emit('walletdata', {username: username}, function(err, data){
    if(err) showErr(err);
    //if(data) showSuccess(data);
  });
};//END showWallet

async function viewUserProfile(user) {
  console.log(`viewUserProfile() called`);
  loadingjumbo();
  //var userDelegations = []

  await hive.api.getDynamicGlobalProperties( async function(err, result) {
    if(err){console.log(err)}
    total_vesting_shares = parseInt(result.total_vesting_shares);
    total_vesting_fund = parseInt(result.total_vesting_fund_hive);
  });
  await hive.api.getAccounts([user], async function(err, result) {
    console.log(`getAccounts`)
    if(err){
      console.log(err)
    }
    if(result){
      console.log(result);
      var recoverAcct = resultData.recovery_account;
      var hivePower = parseInt(resultData.vesting_shares);
      var recoverAcct = resultData.recovery_account;
      var hivePower = parseInt(resultData.vesting_shares);

      await hive.api.getVestingDelegations(`'${user}'`, '', 0, function(err, result) {
        if(err !== null) {
          console.log(`Error: ${err}`);
        }
        if(result.length > 0){
          result.forEach((item, i) => {
            var user = item.delegatee;
            var vests = parseFloat(item.vesting_shares);
            var hiveVested = ( Number(total_vesting_fund) *  Number(vests) ) / Number(total_vesting_shares);
            var entry = ` <span class="profileDelegateUsr"><a href="https://hiveblocks.com/@${user}" class="histuserlink" style="color: white !important; text-decoration:none !important;" target="_blank" title="Click to View This Account on HiveBlocks.com in a New Window">@${user} <i class="fas fa-external-link-square-alt" title=""></i></a></span> <span class="profileDelegateAmt">${hiveVested.toFixed(3)} HIVE</span><br>`; //- ${item.id}
            userDelegations.push(entry)
          });
        }
      });

    if(userDelegations.length == 0){
      userDelegations = `No Active Delegations`;
    }
    hypertabletwo = `<table style="width:100%;"><tbody><tr><td colspan="3"><span id="metaprofile"><span id="userpic" style="float:right;"></span><br><span id="nameid"></span> <code>( @${user} )</code><br><i class="fas fa-fw fa-globe"></i><span id="locationid"></span><br><b style="font-size:larger;">Rank: ${$('#userrank').val()}</b><br><span id="profilestring"></span></td></tr><tr><td colspan="3"><div class="autoBettitleC2 autoBettitleC2p levelHolder" style="position:relative">
            <span class="thisLevel" id="thisLevel" style="margin: 0vh 0 0vh 0.5vh;color: white;">&nbsp;13&nbsp;</span>
            <span class="levelprogress" title="Progress to next Account Level" style="width: 34.95%;"></span>
            <span class="autoBettitleTT Logoml nextLevel" id="nextLevel">&nbsp;14&nbsp;</span>
            </div></td></tr><tr><td><span id="statsBal"></span></td><td><p id="hivePowerHeld"></p></td><td><span id="statHBDsBal"></span></td></tr><tr><td  id="recoverAcct">REcovery shit here</td><td>last login</td><td>Date Created:<br>${dateCreated}</td></tr><tr><td colspan="3"><span id="recAlert"></span><hr><b style="font-size:smaller;">Scope Keys & Permissions:<br><br><code>Posting Public Key:</code><br>${posting_key} <i class="far fa-fw fa-eye"></i><br><br><code>Active Public Key:</code><br>${active_key} <i class="far fa-fw fa-eye"></i><br><br><code>Owner Public Key:</code><br>${owner_key} <i class="far fa-fw fa-eye"></i><br><br><code>Memo Public Key:</code><br>${memo_key} <i class="far fa-fw fa-eye"></i></td></tr></tbody></table>`;
            $("#jumbotron").fadeOut('fast');
          $("#jumbotron").promise().done(function(){
          $("#jumboHead").show();
          $("#jumboWrapper").html( hypertabletwo);
          $("#jumboTitle").html(`Hive.Loans - @${user} Profile`);
          $("#metaprofile").val(profiledata['profile']);
          $('#delegationShow').html(userDelegations);
          $('#urank').val($('#userrank').val());
          $("#jumbotron").css({'height':'70%','width':'25%'});
          $("#jumbotron").center();
          $("#jumbotron").fadeIn();
            getAcct();
          profiledata = JSON.parse(profiledata);


          console.log("profiledata");
          console.log(profiledata);
          var userc = profiledata.profile.profile_image;
          var userabout = profiledata.profile.about;
          var userlocation = profiledata.profile.location;
          var username = profiledata.profile.name;
          $("#userpic").css({"background-image":`url("${userc}")`}); // `<img src="${userc}" style="width:5vw;height:5vw;border-radius:15px;border: inset 2px grey;">`
          $("#locationid").html(`${profiledata.profile.location}`);
          $("#nameid").html(`${username}`);
          $("#profilestring").html(`${userabout}`);
          $("#recoverAcct").html(`<span><b>Recovery Account</b>:<br><span id="recName">${recoverAcct}</span><span id="prawarn"></span></span>`);
          $("#profileRecoverAcct").html(`<span id="precacct">${recoverAcct}</span>`);
          $("#showRecAcct").html(`@${recoverAcct}`);
          $("#hivePowerHeld").html(`<b>HIVE Power</b>:<br>${toThree(hiveVested)} HP`);
          $("#loansHPdisplay").html(`<span id="hplevel">${toThree(hiveVested)}</span> HP`);
          $("#urank").html(`${$('#userrank').val()}`);
          loanMax = parseFloat(hiveVested * 0.7);

          if(recoverAcct !== 'hive.loans' && recoverAcct !== 'anonsteem' && recoverAcct !== 'beeanon' && recoverAcct !== 'blocktrades') {
            $("#recName").css({"color":"red"});
            $("#precacct").css({"color":"red"});
            $("#prawarn").css({"color":"red"});
            $("#showRecAcct").css({"color":"red"});
            $("#prawarn").html(`❌ Incompatible Recovery Account! <b><a href="#" id="changeRecoveryAcct" style="color:white !important; text-decoration:none !important;" onClick="showRecoveryPanel();">Change Recovery Account</a></b>`);
            $(".acceptButton").hide();
            $("#recAlert").html(`<sub><b style="color:red;">Recovery Account Invalid!</b><br>Please set @hive.loans as recovery account!<br><br>Click here to change recovery account<br><sub>( This will take 30 days to complete )</sub></sub>`);
          } else {
            $("#recName").css({"color":"lawngreen"});
            $("#precacct").css({"color":"lawngreen"});
            $("#prawarn").css({"color":"white"});
            $("#showRecAcct").css({"color":"lawngreen"});
            $("#prawarn").html(`✔️`);
            $(".acceptButton").show();
            $("#recAlert").html(`<sub><b style="color:lawngreen;">Recovery Account Valid!</b><br><code onclick="showLoans()">You're ready to borrow! Remember to follow the site guidelines while lending..</code></sub>`);

          }
      });
    }

  });
}

var termsOfService = function() {

var tosContent = 'Introduction\n\n\n' +
      'These Website Standard Terms and Conditions written on this webpage shall manage your use of our website, Hive.Loans accessible at https://Hive.Loans.\n\n\n' +
      'These Terms will be applied fully and affect to your use of this Website. By using this Website, you agreed to accept all terms and conditions written in here. You must not use this Website if you disagree with any of these Website Standard Terms and Conditions.\n\n\n' +
      'Minors or people below 18 years old are not allowed to use this Website!\n\n\n' +
      'Intellectual Property Rights\n\n' +
      'Other than the content you own, under these Terms, Hive.Loans and/or its licensors own all the intellectual property rights and materials contained in this Website.\n\n' +
      'You are granted limited license only for purposes of viewing the material contained on this Website.\n\n' +
      'Restrictions\n\n' +
      'You are specifically restricted from all of the following:\n\n' +
      '\n\n' +
      'publishing any Website material in any other media;\n\n' +
      'selling, sublicensing and/or otherwise commercializing any Website material;\n\n' +
      'publicly performing and/or showing any Website material;\n\n' +
      'using this Website in any way that is or may be damaging to this Website;\n\n' +
      'using this Website in any way that impacts user access to this Website;\n\n' +
      'using this Website contrary to applicable laws and regulations, or in any way may cause harm to the Website, or to any person or business entity;\n\n' +
      'engaging in any data mining, data harvesting, data extracting or any other similar activity in relation to this Website;\n\n' +
      'using this Website to engage in any advertising or marketing.\n\n' +
      '\n\n' +
      'Certain areas of this Website are restricted from being access by you and Hive.Loans may further restrict access by you to any areas of this Website, at any time, in absolute discretion. Any user ID and password you may have for this Website are confidential and you must maintain confidentiality as well.\n\n' +
      'Your Content\n\n' +
      'In these Website Standard Terms and Conditions, "Your Content" shall mean any audio, video text, img or other material you choose to display on this Website. By displaying Your Content, you grant Hive.Loans a non-exclusive, worldwide irrevocable, sub licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.\n\n' +
      'Your Content must be your own and must not be invading any third-partyâ€™s rights. Hive.Loans reserves the right to remove any of Your Content from this Website at any time without notice.\n\n' +
      'Your Privacy\n\n' +
      'Hive.Loans will not share your name, username, email, login information, account status or any other information with any party regardless of inquiry. Under no circumstance will we give any information to any government agency, police department or tax collector even if they have proper warrants and paperwork.<br>We respect your privacy and information, confidentiality is important!\n\n' +
      'No warranties\n\n' +
      'This Website is provided "as is," with all faults, and Hive.Loans express no representations or warranties, of any kind related to this Website or the materials contained on this Website. Also, nothing contained on this Website shall be interpreted as advising you.\n\n' +
      'Limitation of liability\n\n' +
      'In no event shall Hive.Loans, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. Â Hive.Loans, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.\n\n' +
      'Indemnification\n\n' +
      'You hereby indemnify to the fullest extent Hive.Loans from and against any and/or all liabilities, costs, demands, causes of action, damages and expenses arising in any way related to your breach of any of the provisions of these Terms.\n\n' +
      'Severability\n\n' +
      'If any provision of these Terms is found to be invalid under any applicable law, such provisions shall be deleted without affecting the remaining provisions herein.\n\n' +
      'Variation of Terms\n\n' +
      'Hive.Loans is permitted to revise these Terms at any time as it sees fit, and by using this Website you are expected to review these Terms on a regular basis.\n\n' +
      'Assignment\n\n' +
      'The Hive.Loans is allowed to assign, transfer, and subcontract its rights and/or obligations under these Terms without any notification. However, you are not allowed to assign, transfer, or subcontract any of your rights and/or obligations under these Terms.\n\n' +
      'Entire Agreement\n\n' +
      'These Terms varitute the entire agreement between Hive.Loans and you in relation to your use of this Website, and supersede all prior agreements and understandings.\n\n' +
      'Governing Law & Jurisdiction\n\n' +
      'These Terms will be governed by and interpreted in accordance with the laws of the State of Belize, and you submit to the non-exclusive jurisdiction of the state and federal courts located in Belize for the resolution of any disputes.';

  var termsofContent = '<textarea style="width:100%; height:91%;font-size:smaller;overflow-x:hidden;" id="termsoftextarea" readonly></textarea>' +
      '<center><button class="button" onclick="showLogin();"><b style="font-weight:900;font-size:larger;">Return to Login</b></button></center>';
        $("#jumbotron").fadeOut('fast');
        $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
            $("#jumboWrapper").html(termsofContent);
            $("#termsoftextarea").val(tosContent);
            $("#jumbotron").css({'height':'90%','width':'25%'});
            $("#jumbotron").center();
            $("#jumbotron").fadeIn();
            $("#jumboTitle").html(`Hive.Loans - Terms of Service`);
        });

};

async function showProfile() {
  console.log(`showProfile() called`);
  loadingjumbo();
  var result = await getUserAccount(uUsername);
  result = result[0];
  console.log(result)

  recoverAcct = result.recovery_account;
  hivePower = parseInt(result.vesting_shares);
  recoverAcct = result.recovery_account;
  hivePower = parseInt(result.vesting_shares);
  memo_key = result.memo_key;
  owner_key = result.owner.key_auths[0].toString();
  active_key = result.active.key_auths[0].toString();
  posting_key = result.posting.key_auths[0].toString();
  owner_key = owner_key.split(',')[0];
  active_key = active_key.split(',')[0];
  posting_key = posting_key.split(',')[0];
  profiledata = result.posting_json_metadata;
  dateCreated = result.created;

    hypertabletwo = `<table style="width:100%;"><tbody><tr><td colspan="3"><span id="metaprofile"><span id="userpic" style="float:right;"></span><br><span id="nameid"></span> <code>( @${uUsername} )</code><br><i class="fas fa-fw fa-globe"></i><span id="locationid"></span><br><b style="font-size:larger;">Rank: ${$('#userrank').val()}</b><br><span id="profilestring"></span></td></tr><tr><td colspan="3"><div class="autoBettitleC2 autoBettitleC2p levelHolder" style="position:relative">
            <span class="thisLevel" id="thisLevel" style="margin: 0vh 0 0vh 0.5vh;color: white;">&nbsp;13&nbsp;</span>
            <span class="levelprogress" title="Progress to next Account Level" style="width: 34.95%;"></span>
            <span class="autoBettitleTT Logoml nextLevel" id="nextLevel">&nbsp;14&nbsp;</span>
            </div></td></tr><tr><td><span id="statsBal"></span></td><td><p id="hivePowerHeld"></p></td><td><span id="statHBDsBal"></span></td></tr><tr><td  id="recoverAcct">REcovery shit here</td><td>last login</td><td>Date Created:<br>${dateCreated}</td></tr><tr><td colspan="3"><span id="recAlert"></span><hr><b style="font-size:smaller;">Scope Keys & Permissions:<br><br><code>Posting Public Key:</code><br>${posting_key} <i class="far fa-fw fa-eye"></i><br><br><code>Active Public Key:</code><br>${active_key} <i class="far fa-fw fa-eye"></i><br><br><code>Owner Public Key:</code><br>${owner_key} <i class="far fa-fw fa-eye"></i><br><br><code>Memo Public Key:</code><br>${memo_key} <i class="far fa-fw fa-eye"></i></td></tr></tbody></table>`;
                $("#jumbotron").fadeOut('fast');
                $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
                $("#jumboWrapper").html( hypertabletwo);
                $("#recoverAcct").html(`<b>Recovery Account</b>:<br><span id="recName"><a href='https://hiveblocks.com/@${recoverAcct}' target="_blank" style="color:${linkColor};">@${recoverAcct}</span?</span><br>`);
                if(recoverAcct != 'hive.loans' && recoverAcct != 'anonsteem' && recoverAcct != 'beeanon' && recoverAcct != 'blocktrades') {
                  $("#recName").css({"color":"red"});
                  linkColor = "red";
                  $("#recAlert").html(`<sub><b style="color:red;">Recovery Account Invalid!</b><br>Please set @hive.loan as recovery account! Click here to change recovery account<br><sub>( This will take 30 days to complete )</sub></sub>`);
                } else {
                  $("#recName").css({"color":"lawngreen !important","font-weight":"700"});
                  linkColor = "lawngreen";
                  $("#recAlert").html(`<sub><b style="color:black;">Recovery Account Valid!</b><br>You're ready to borrow! Don't change your recovery account during while borrowing!<br><sub>( Harsh penalties for scam attempts )</sub></sub>`);
                }
               $("#metaprofile").val(profiledata['profile']);
               $('#delegationShow').html(userDelegations);
                $('#urank').val($('#userrank').val());
                $("#jumbotron").css({'height':'70%','width':'25%'});
                $("#jumbotron").center();
                $("#jumbotron").fadeIn();
                $("#jumboTitle").html(`Hive.Loans - @${uUsername} Profile`);
            });

            //getAcct();
            var userc;
            var userabout;
            var userlocation;
            var username;
            var hiveVested;
            var vests;
            try {
              profiledata = JSON.parse(profiledata);
              console.log(profiledata);
               vests = parseFloat(profiledata.vesting_shares);
               userc = profiledata.profile.profile_image;
               userabout = profiledata.profile.about;
               userlocation = profiledata.profile.location;
               username = profiledata.profile.name;
               hiveVested = ( Number(total_vesting_fund) *  Number(vests) ) / Number(total_vesting_shares);
            } catch(e) {
              console.log(e);
            }



          $("#userpic").css({"background-image":`url("${userc}")`});
          $("#locationid").val(`${profiledata.profile.location}`);
          $("#nameid").html(`${username}`);
          $("#profilestring").html(`${userabout}`);
          $("#recoverAcct").html(`<span><b>Recovery Account</b>:<br><span id="recName">${recoverAcct}</span><span id="prawarn"></span></span>`);
          $("#profileRecoverAcct").html(`<span id="precacct">${recoverAcct}</span>`);
          $("#showRecAcct").html(`@${recoverAcct}`);
          $("#hivePowerHeld").html(`<b>HIVE Power</b>:<br>${toThree(hiveVested)} HP`);
          $("#loansHPdisplay").html(`<span id="hplevel">${toThree(hiveVested)}</span> HP`);
          $("#urank").html(`${$('#userrank').val()}`);
          loanMax = parseFloat(hiveVested * 0.7);


          if(recoverAcct !== 'hive.loans' && recoverAcct !== 'anonsteem' && recoverAcct !== 'beeanon' && recoverAcct !== 'blocktrades') {
            $("#recName").css({"color":"red"});
            $("#precacct").css({"color":"red"});
            $("#prawarn").css({"color":"red"});
            $("#showRecAcct").css({"color":"red"});
            $("#prawarn").html(`❌ Incompatible Recovery Account! <b><a href="#" id="changeRecoveryAcct" style="color:white !important; text-decoration:none !important;" onClick="showRecoveryPanel();">Change Recovery Account</a></b>`);
            $(".acceptButton").hide();
            $("#recAlert").html(`<sub><b style="color:red;">Recovery Account Invalid!</b><br>Please set @hive.loans as recovery account!<br><br>Click here to change recovery account<br><sub>( This will take 30 days to complete )</sub></sub>`);
          } else {
            $("#recName").css({"color":"lawngreen"});
            $("#precacct").css({"color":"lawngreen"});
            $("#prawarn").css({"color":"white"});
            $("#showRecAcct").css({"color":"lawngreen"});
            $("#prawarn").html(`✔️`);
            $(".acceptButton").show();
            $("#recAlert").html(`<sub><b style="color:lawngreen;">Recovery Account Valid!</b><br><code onclick="showLoans()">You're ready to borrow! Remember to follow the site guidelines while lending..</code></sub>`);

          }

      }


function showKeysRecoveryPanel() {
  console.log(`showKeysRecoveryPanel() called`);
  loadingjumbo();
  var keyrecoveryContent = `<iframe src='../recovery/index.html' id="frame1" name="frame1" style="width:100%;height:100%;"></iframe>`;
  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
      $("#jumboWrapper").html(keyrecoveryContent);
      $("#jumbotron").css({'height':'85%','width':'25%'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
      $("#jumboTitle").html(`Hive.Loans - Account Recovery Center`);
  });
}

function showRecoveryPanel() {
  console.log(`showRecoveryPanel() called`);
  loadingjumbo();
  let newRecAcctVar = '';
  let newRecAcctVarlink;
  let recoveryContent = `<center><h3 class="pagehead" style="color:white !important;">Change HIVE Recovery Account</h3></center>` +
  `<center>Current Recovery Account:<br><b><span id="showRecAcct"></span></b></center><br>`+
  `In order to borrow on Hive.Loans your recovery account must be set to an account featured on the Accepted Recovery Accounts list below:<br>` +
  `<br><center><b>Accepted Recovery Accounts:</b><br><br>`+
  `@hive.loans<br><sub><b>preferred</b> recovery account, enables automated key recovery</sub><br><br>@blocktrades<br><sub>a long time trusted HIVE witness and exchange operator</sub><br><br>@beeanon<br><sub>an anonymous account creator by @someguy123</sub><br><br>@someguy123<br><sub>trustworthy long time HIVE witness</sub><br><br>@anonsteem<br><sub>an anonymous account creator by @someguy123</sub></center><br><br>` +
  `<br><center><input type="text" id="recoveryAcctInput" style="background: white;color: black;text-align: center;width: 15vw;height: 3vh;font-size: large; border-radius:10px;" placeholder="enter name of new recovery account" onkeyup="return newRecAcctVar = $('#recoveryAcctInput').val();"><br><sub>( enter your new recovery account above without the @ )</sub><br>` +
  `<button type="button" style="font-size: larger; padding: 10px; line-height: 1vh; background: #000; color: white; width: 40%;border-radius:5px;" class="button" id="setRecoverAccountButton" onClick=" newRecAcctVarlink = 'https://hivesigner.com/sign/change_recovery_account?new_recovery_account=' + newRecAcctVar; window.open(newRecAcctVarlink);" title="Click here to set Recovery Account">Set Recovery Account</button></center><br><br>` +
  `<span style="font-size: smaller;"><i class="fas fa-exclamation-triangle sexyblackoutline" style="color:yellow;"></i> <b>NOTE</b>: To maintain the security necessary to provide automated lending and borrowing, it will take 30 days from the time of changing your recovery account to one listed above for the system to allow you to borrow. Any attempts to change your recovery account while actively borrowing will result in your account being locked down for the remainder of your loan repayment, and a 10% loan tampering fee will be added to your repayment total.`;
  //`<br>By setting the @hive.loans account as your recovery account you'll gain access to automated account recovery offered here under the "Tools" page. As for handling of account recovery if you've selected any of the other Featured Recovery Accounts you'll have to look up their account recovery handling methods.</span><br><br>`;

  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
      $("#jumboWrapper").html( recoveryContent);
      $("#jumbotron").css({'height':'85%','width':'25%'});
      getAcct();
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
      $("#jumboTitle").html(`Hive.Loans - Establish New Account Recovery Warden`);
  });
}

function showAcctSurrenderPanel(user, contractID, limit, loanData, pgp) {
  //console.log(`showAcctSurrenderPanel(${user}, ${contractID}, ${limit}, ${JSON.stringify(loanData)}) `);
  if (typeof user !== 'string') return console.log('user');
  if (typeof contractID !== 'string') return console.log('contractID Must be a Number!');
  if (typeof loanData == undefined) return console.log('loanData Must be Defined!');
  if (typeof pgp != 'string') return console.log('pgp Must be a Number!');
  try {
    //loanData = JSON.parse(loanData);
  } catch (e) {
    console.log(e);
    showErr(e)
  }
  var newinterest = (loanData.interest / 100);
  var totalpayments = (loanData.days / 7);
  var totalrepay =  loanData.amount + (loanData.amount * newinterest);
  var paymentSum = (totalrepay / totalpayments);

  var encrypted;

  //window.location.href = '../recovery/index.html'; //one level uphive.auth.isWif(privWif);
  var surrendercontent = `<script>var validPass = async(keyinput) => {await hive.auth.verify(${user}, keyinput, auths);};var validkey = async(keyinput) => {hive.auth.isWif(keyinput);};</script><h3 class="pagehead" style="color:white !important;">Finalize Lending Contract Agreement<br><sup><code>Lending Contract #<span id="contractsurrenderID"></span><br><br><span id="contractFinalizeData"></span></code></sup></h3><input type="textbox" id="afterSurrenderButtonClick" style="background: white; color: black; text-align: center; width: 80%; height: 10vh; font-size: large; border-radius: 10px;" class="hidden"><table id="surrenderKeysTable"><tbody><tr><td>Account Accepting Contract and Offered as Collateral:<br><input type="text" readonly id="userAcctPass" style="background: white; color: black; text-align: center; width: 80%; height: 3vh; font-size: large; border-radius: 10px;"></td></tr><tr><td><br>Account Master Password or Owner Private Key Below:</td></tr><tr><td><input type="password" id="masterAcctPass" style="background: white; color: black; text-align: center; width: 80%; height: 3vh; font-size: large; border-radius: 10px;"></td></tr><tr><td><br><i class="fa fa-exclamation-triangle" style="color:gold;" aria-hidden="true" title="Notice"></i> Note: Your account will automatically begin a powerdown (or modify an existing one) and will continue to withdraw Hive Power weekly until all outstanding lending contract balances are settled<br><br>You will be provided new posting, active and memo scope keys to retain usage of your account.<br>You'll have to update your keys to the new ones provided wherever the old ones were currently being used, such as in the Hive Keychain</td></tr><tr><td><button class="push_button3" id="submitaccountkeys" onclick="encrypt('${contractID}', \`${pgp}\`)">Accept Loan &amp; Provide Collateral</button></td></tr><tr><td><span id="acceptTitle"></span></td></tr><tr><td><span id="acceptOutcome"></span></td></tr></tbody></table>`;


  var newsurrendercontent = `<script>var validPass = async(keyinput) => {await hive.auth.verify(${user}, keyinput, auths);};var validkey = async(keyinput) => {hive.auth.isWif(keyinput);};</script>` +
  `<h3 class="pagehead" style="color:white !important;">Finalize Lending Contract Agreement<br><sup><code>Lending Contract #<span id="contractsurrenderID"></span><br><br><span id="contractFinalizeData"></span></code></sup></h3>` +
  `<input type="textbox" id="afterSurrenderButtonClick" style="background: white; color: black; text-align: center; width: 80%; height: 10vh; font-size: large; border-radius: 10px;" class="hidden"><br>` +
  `Account Accepting Contract and Offered as Collateral:<br>` +
  `<input type="text" readonly id="userAcctPass" style="background: white; color: black; text-align: center; width: 80%; height: 3vh; font-size: large; border-radius: 10px;"><br><br>` +
  `Account Master Password or Owner Private Key Below:<br>` +
  `<input type="password" id="masterAcctPass" style="background: white; color: black; text-align: center; width: 80%; height: 3vh; font-size: large; border-radius: 10px;"><br><br>` +
  `<b style="font-size:smaller"><i class="fa fa-exclamation-triangle" style="color:gold;" aria-hidden="true" title="Notice"></i> Note: Your account will automatically begin a powerdown (or modify an existing one) and will continue to withdraw Hive Power weekly until all outstanding lending contract balances are settled<br><br>You will be provided new posting, active and memo scope keys to retain usage of your account.<br>You'll have to update your keys to the new ones provided wherever the old ones were currently being used, such as in the Hive Keychain</b><br><br>` +
  `<button class="button" style="font-size:larger;font-weight:900;" id="submitaccountkeys" onclick="encrypt('${contractID}', \`${pgp}\`)">Accept Loan &amp; Provide Collateral</button><br>` +
  `<span id="acceptTitle"></span><br>` +
  `<span id="acceptOutcome"></span><br>` +
  `` +
  `` +
  `` +
  ``;

  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
    $("#jumboHead").show();
      $("#jumboWrapper").html(newsurrendercontent);
      $("#userAcctPass").val(user);
      $("#contractsurrenderID").html(contractID);
      $("#contractFinalizeData").html(`${(loanData.amount / 1000).toFixed(3)} HIVE being Loaned by this Lending Contract<br>requiring ${totalpayments} <span id="surrenderpayments"></span> of ${(paymentSum / 1000).toFixed(3)} HIVE Paid Weekly<br>to the Sum of ${(totalrepay / 1000).toFixed(3)} HIVE over ${loanData.days} Days<br>`);
      if (totalpayments == 1) {
        $("#surrenderpayments").html('payment');
      } else {
        $("#surrenderpayments").html('payments');
      }
      $("#jumbotron").css({'height':'65%','width':'25%'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
      $("#jumboTitle").html(`Hive.Loans - Finalize Lending Contract Claim`);
  });

  $("input#masterAcctPass").keyup(function (e) {
    log(e + " " + e.which);
  	 if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57 ) ) {
        return false;
      }
    });

};//END showAcctRecoverPanel

function showFutures() {
  console.log(`showFutures() called`);
  loadingjumbo();
  let futuresContent = `<center><div id="hiveChart"></div></center>` +
  `<br>In an upcoming update sometime after v1.0.0 launch Hive.Loans will offer CFD / Futures on HIVE prices and perhaps other commodities.`;
  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
      $("#jumboWrapper").html(futuresContent);
      $("#jumbotron").css({'height':'85%','width':'50%'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
      $("#jumboTitle").html(`Hive.Loans - HIVE CFD Futures`);
      const hivechart = LightweightCharts.createChart(document.getElementById('hiveChart'), {
        width: $(this).outerWidth() / 1.1 ,
        height: $(this).outerHeight() / 2,
        rightPriceScale: {
          scaleMargins: {
            top: 0.3,
            bottom: 0.25,
          },
          borderVisible: false,
        },
        layout: {
          backgroundColor: '#131722',
          textColor: '#d1d4dc',
        },
        grid: {
          vertLines: {
            color: 'rgba(42, 46, 57, 0)',
          },
          horzLines: {
            color: 'rgba(42, 46, 57, 0.6)',
          },
        }

      });

      var areaSeries = hivechart.addCandlestickSeries({
        topColor: 'rgba(245, 124, 0, 0.4)',
        bottomColor: 'rgba(245, 124, 0, 0.1)',
        lineColor: 'rgba(245, 124, 0, 1)',
        lineWidth: 2,
      });

      const candlestickSeries = hivechart.addCandlestickSeries({
        title: 'Hive Price',
      });
      var dataChart = [];

//coinmarketcap API key
//244cc503-bcc0-4412-8009-63297908f9f8


/*
$url = 'https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=USD';
  $data = file_get_contents($url);
  $priceInfo = json_decode($data);
*/

      var exchangecheck = async(limit) => {
        if(limit == undefined) limit = 10;
        try {
          await fetch(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=HIVE&tsym=USD&limit=${limit}&api_key=8d1b444726cc1a6c8ee8bfed73908ea3734215abf7bd85c8180930b28b64a9e2`)
          .then(res => res.json()).then(json => {
            console.log(json)
            dataChart = json.Data.Data;
            var chartlength = dataChart.length - 1;
            console.log(chartlength);
            var lastClose = dataChart[chartlength]['close'];
            var lastIndex = dataChart.length - 1;
            var currentIndex = lastIndex + 1;
            var currentBusinessDay = { day: 29, month: 5, year: 2019 };
            var ticksInCurrentBar = 0;
            var currentBar = {
            	open: null,
            	high: null,
            	low: null,
            	close: null,
            	time: currentBusinessDay,
            };

            function mergeTickToBar(price) {
              //var newChartData = []
              //console.log(price)

              price.forEach((item, i) => {
                if (price.open === null) {
                  price.open = price;
                  price.high = price;
                  price.low = price;
                  price.close = price;
                } else {
                  price.close = price.close;
                  price.high = Math.max(price.high);
                  price.low = Math.min(price.low);
                }
                //newChartData.push(price);
                //return newChartData;
                areaSeries.update(dataChart[i]);
              });




            }



            areaSeries.setData(dataChart);
                        dataChart = mergeTickToBar(dataChart);
            /*
            response = json;
            response = response["usd"];
            hiveprice = response;
            if(oldhiveusdprice > hiveprice) {
              $('#pricecheck').html(`1 HIVE = $${ hiveprice} <span id="pricetype">USD</span>`);
              flashlose($('#pricecheck'));
            } else if (oldhiveusdprice < hiveprice ){
              $('#pricecheck').html(`1 HIVE = $${ hiveprice} <span id="pricetype">USD</span>`);
              flashwin($('#pricecheck'));
            } else if (oldhiveusdprice ==  hiveprice){
              $('#pricecheck').html(`1 HIVE = $${ hiveprice} <span id="pricetype">USD</span>`);
            } else {
              $('#pricecheck').html(`1 HIVE = $${ hiveprice} <span id="pricetype">USD</span>`);
            }
            if(hiveprice) oldhiveusdprice = hiveprice;
            return hiveprice;
            */
          }).catch(function (error) {
            console.log(error)
            showErr("Error: " + error);
          });

        } catch(e) {
          console.log(`pricefetch error: ${e}`)
        }
      };

      exchangecheck(1440);

function nextBusinessDay(time) {
	var d = new Date();
	d.setUTCFullYear(time.year);
	d.setUTCMonth(time.month - 1);
	d.setUTCDate(time.day + 1);
	d.setUTCHours(0, 0, 0, 0);
	return {
		year: d.getUTCFullYear(),
		month: d.getUTCMonth() + 1,
		day: d.getUTCDate(),
	};
}
  });

};//END showFutures


async function showAcctRecoverPanel() {
  console.log(`showAcctRecoverPanel() called`);
  loadingjumbo();
  let newRecAcctVar = '';
  let newRecAcctVarlink;
  let recoveryContent = `<center><h3 class="pagehead" style="color:white !important;">Change HIVE Recovery Account</h3></center>` +
  `<center>Current Recovery Account:<br><b><span id="showRecAcct"></span></b></center><br>`+
  `In order to borrow on Hive.Loans your recovery account must be set to an account featured on the Accepted Recovery Accounts list below:<br>` +
  `<br><center><b>Accepted Recovery Accounts:</b><br><br>`+
  `@hive.loans<br><sub><b>Preferred</b> recovery account, enables automated key recovery</sub><br><br>@someguy123<br><sub>trustworthy long time HIVE witness</sub><br><br>@beeanon<br><sub>an anonymous account creator by @someguy123</sub><br><br>@anonsteem<br><sub>an anonymous account creator by @someguy123</sub></center><br><br>` +
  `<br><center><input type="text" id="recoveryAcctInput" style="background: white;color: black;text-align: center;width: 15vw;height: 3vh;font-size: large; border-radius:10px;" placeholder="enter name of new recovery account" onkeyup="return newRecAcctVar = $('#recoveryAcctInput').val();"><br><sub>( enter your new recovery account above without the @ )</sub><br>` +
  `<button type="button" style="font-size: larger; padding: 10px; line-height: 1vh; background: #000; color: white; width: 40%;border-radius:5px;" class="button" id="setRecoverAccountButton" onClick=" newRecAcctVarlink = 'https://hivesigner.com/sign/change_recovery_account?new_recovery_account=' + newRecAcctVar; window.open(newRecAcctVarlink);" title="Click here to set Recovery Account">Set Recovery Account</button></center><br><br>` +
  `<span style="font-size: smaller;"><i class="fas fa-exclamation-triangle sexyblackoutline" style="color:yellow;"></i> <b>NOTE</b>: To maintain the security necessary to provide automated lending and borrowing, it will take 30 days from the time of changing your recovery account to one listed above for the system to allow you to borrow. Any attempts to change your recovery account while actively borrowing will result in your account being locked down for the remainder of your loan repayment, and a 10% loan tampering fee will be added to your repayment total.<br>` +
  `<br>By setting the @hive.loans account as your recovery account you'll gain access to automated account recovery offered here under the "Tools" page. As for handling of account recovery if you've selected any of the other Accepted Recovery Accounts you'll have to look up their account recovery handling methods.</span><br><br>`;

  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
      $("#jumboWrapper").html(recoveryContent);
      $("#jumbotron").css({'height':'85%','width':'25%'});
      //getAcct();
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
      $("#jumboTitle").html(`Hive.Loans - Establish New Account Recovery Warden`);
  });
}//END showAcctRecoverPanel


async function showLend() {
  console.log(`showLend() called`);
  openLendingTab();
}

async function showLoans() {
  console.log(`showLoans() called`);
  openAllLoansTab();
}

async function showFaq() {
  console.log(`showFaq() called`);
  loadingjumbo();
  getFounders();
  let faqContent = `<center>` +
  `This is an unfinished DEMO of the Hive.Loans project and is in no way meant to represent the launch version<br>` +
  `Many feautures may be broken, bugged, unstable or just straight up missing. It's advised to not use this version<br>` +
  `<a href="https://peakd.com/coding/@klye/a-quick-look-at-an-early-working-prototype-of-the-upcoming-hive-loans-account-as-collateral-community-lending-pool">Check out this post for more information</a><br>`+
  `Hive.Loans will allow users to create lending contracts loaning out their liquid HIVE against the colalteral of an account<br>` +
  `This site is scheduled for release on or before the 15th of April 2021 if all goes well in development.<br>` +
  `<br>` +
  `The <span id="foundercount"></span> Users who Voted in Support of Proposal #154 (⚡ Founder Rank):<br><sup>( Founders get 50% off of fees site wide )</sup></center><h5><span id="founderslist"></span></h5><br>` +
  `<br>` +
  `<center>The <span id="backercount"></span> Users who Pledged HIVE or HBD Developement Capital Directly (💸 Backer Rank):<br><sup>( Backers get an enhanced interest rate cap of 35% )</sup><h5><span id="backerslist"></span></h5></center><br>` +
  `<br>` +
  `<center>The Ultra Exclusive One-of-a-Kind Project Benefactor (💰 Benefactor Rank):<br>( Get a monthly payment of 10% of the service revenue! )</sup><h5><span id="benefactorlist">@coininstant</span></h5></center><br>` +
  `<br>`;
  var backersnames = '';
  backerlist.forEach((item, i) => {
    backersnames += `&nbsp;<a href="https://peakd.com/@${item}" style="text-decoration:none !important; color:white;font-size:larger;">@${item}</a>&nbsp;`;
  });

  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
      $("#jumboWrapper").html( faqContent);
      console.log(foundercount)
      console.log(founderlist)
      $('#founderslist').html(founderlist);
      $('#foundercount').html(foundercount);
      $('#backerslist').html(backersnames);
      $("#jumbotron").css({'height':'85%','width':'60%'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
      $("#jumboTitle").html(`Hive.Loans - Frequently Asked Questions`);
  });
}

async function showTools() {
  loadingjumbo();
  let toolsContent = `<center>` +
  `<h4><b>Set Recovery Account Tools and Private Key Recovery</b></h4>`+
  `<a href="#" style="text-decoration: none !important;color:white !important;" onClick="showRecoveryPanel();"><b><i class="fas fa-fw fa-users-cog"></i> Change Recovery Account</b></a>&nbsp;&nbsp;<i class="fas fa-fw fa-info-circle" title="Use the tool linked below to change your recovery account"></i><br><br>` +
  `<a href="#" style="text-decoration: none !important;color:white !important;" onClick="showKeysRecoveryPanel();"><b><i class="fas fa-fw fa-user-check"></i> Recovery Account Keys</b></a>&nbsp;&nbsp;<i class="fas fa-fw fa-info-circle" title="Use the tool linked below to recover keys to your account"></i><br><br>` +
  `<h4><b>Utilize Hive.Loans to Facilitate a Secure Escrow Instance</b></h4>`+
  `<a href="#" style="text-decoration: none !important;color:white !important;" onClick="showRecoveryPanel();"><b><i class="fas fa-fw fa-handshake"></i> Create Escrow Trade</b></a>&nbsp;&nbsp;<i class="fas fa-fw fa-info-circle" title="Use the tool linked below to create a secure escrow instance"></i><br><br>` +
  `<a href="#" style="text-decoration: none !important;color:white !important;" onClick="showRecoveryPanel();"><b><i class="fas fa-fw fa-handshake-slash"></i> Cancel Escrow Trade</b></a>&nbsp;&nbsp;<i class="fas fa-fw fa-info-circle" title="Use the tool linked below to cancel an existing escrow instance"></i><br><br>` +
  `<h4><b>Modify Account Hive Power Delegations</b></h4>`+
  `<a href="#" style="text-decoration: none !important;color:white !important;" onClick="showDelegationPanel();"><b><i class="fas fa-fw fa-tasks"></i> View / Modify Account Delegations</b></a>&nbsp;&nbsp;<i class="fas fa-fw fa-info-circle" title="Use the tool linked below view and modify delegations"></i><br><br>` +
  `and another<br></center>`;
  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
      $("#jumboWrapper").html( toolsContent);
      $("#jumbotron").css({'height':'85%','width':'25%'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
      $("#jumboTitle").html(`Hive.Loans - Account Tools & Resources`);
  });
}


var isValidUsername;
function showLogin() {
  loadingjumbo();
  let loginContent = `<center style="font-weight: 600;"><h3 class="pagehead" style="color:white;">HIVE Account Identity Verification</h3>` + //Accessing Hive.Loans Requires a Quick
  `<b id="acctflash1">To Access this Service Specify an Account Below:</b><br>` + //o Login or Register Type a HIVE Account Below
  `<br><input type="text" id="usernameinput" style="background: white; color: black; text-align: center; width: 15vw; height: 4vh; font-size: xx-large; border-radius: 10px;" value="testdummy" ><br>` +
  `<code><span id="loginfuckery"></span></code><br>`+
  `<a href="#" onClick="$('#2fa').removeClass('hidden'); $(this).hide();" style="color:white !important;text-decoration: none !important;"><sub>Click here if you have 2FA enabled</a></sub>` +
  `<br><input type='text' style="background: white;color: black;text-align: center;width: 9vw;height: 3vh;font-size: large; border-radius:10px;" class="hidden" placeholder="2FA Code Here" id='2fa'>` +
  `<br>Choose a Verification Method:<br><br>` +
  `<center><table><tbody>` +
  `<tr><td style="width: 45% !important;"><button type="button" class="button" style="font-size: large;padding: 0;line-height: 1vh;background: #000;color: white;width:55% !important;border-radius:5px;min-width: 8vw !important;" class="button" id="login" onclick="login();" title="Click here to verify identify with Hive KeyChain"><img src="/img/hivesigner.svg" class="hivesignerlogo" style="width:100%"></button></td>` +
  `<td style="width:10%" id="loginspin"></td>` +
  `<td style="width: 45% !important;"><button type="button" style=" font-size: large; padding: 3px; line-height: 1vh; background: #000; color: white; width:55% !important;border-radius:5px; min-width: 8vw !important;" class="button" id="skclogologin" onclick="$('#loginfuckery').html('Please See Keychain Popup to Continue').css({'color':'lawngreen', 'font-weight':'900'}); showSuccess('Initializing Keychain.. Please Wait'); skcusersocket($('#usernameinput').val());" title="Click here to verify identify with Hive KeyChain"><img src="/img/keychaintext.png" class="keychainlogo" style="width:80%"></button></td></tr></tbody></table></center>`+
  `<br><br><hr><a style="color:white;" href="https://hivesigner.com/" target="_blank">HiveSigner</a> and <a style="color:white;" href="https://chrome.google.com/webstore/detail/hive-keychain/jcacnejopjdphbnjgfaaobbfafkihpep?hl=en" target="_blank">Hive Keychain</a><br>are Accepted for Verification<br><br>`+
  `<br>We'll never ask for government ID or implement<br>any Form of KYC Record Keeping Compliance<br><br>`+
  `<br><b style="font-size: smaller;"><i class="fa fa-exclamation-triangle sexyblackoutline" style="color:gold;" aria-hidden="true"></i> By Logging in you Agree to our <a href="#" style="color:white !important;" onclick="termsOfService();">Terms of Service</a></b>`+
  `<br><sub style="position: absolute; bottom: 0; width: 100%; left: 0; text-shadow: none !important; color: black;">Our hosting is provided by an extremely privacy savvy company <a style="color:white !important;" class="sexyblackoutline" href="https://pay.privex.io/order?r=klye"><b><u>Privex.io</u></b> <img src="/img/privex.svg" style="max-width: 25px !important; max-height: 25px !important; bottom: 0; right: 0; position: absolute; "></a></sub>`;

 //$('#sending').html('<i style="color:grey" class="fa fa-pulsener fa-pulse fa-2x fa-fw"></i>');
//<span id="loginspin"></span>

  $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
      $("#jumboWrapper").html( loginContent);
      $("#jumbotron").css({'height':'55%','width':'20%'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
      $("#jumboTitle").html(`Hive.Loans - Welcome to Hive.Loans v0.0.8`);
      $("#usernameinput").focus();
      $("#usernameinput").keypress(function(event){
          var keycode = (event.keyCode ? event.keyCode : event.which);
          if(keycode == "13"){
            skcusersocket($('#usernameinput').val());
          } else {
            $('#loginfuckery').fadeOut();
            $('#loginfuckery').css('white');
            $('#loginfuckery').html();

            setTimeout(function(){
              var isValidUsername = hive.utils.validateAccountName($('#usernameinput').val());
              console.log(isValidUsername)
              if(isValidUsername !== null){
                $('#loginfuckery').css('red');
                $('#loginfuckery').html(isValidUsername);
                $('#loginfuckery').fadeIn();
              }
            }, 200);
          }
      });
  });
}

async function showRepayWindow(loanData) {
  console.log(`showRepayWindow(loanData)`);
  console.log(loanData)
  loadingjumbo();
  try {
    //loanData = JSON.stringify(loanData);
  } catch (e) {console.log(e);showErr(`Failed to Parse Loan Data!`)};

  var newinterest = (loanData.interest / 100);
  var totalpayments = (loanData.days / 7);
  var totalrepay =  loanData.amount + (loanData.amount * newinterest);
  var paymentSum = (totalrepay / totalpayments);
  var collected = loanData.collected;
  var outstandingDebt = (totalrepay - collected);
  var encrypted;
  var superamtvar;
  //console.log(`showRepayWindow(${user}, ${contractID}, ${limit}, ${loanData}) `);

  var paymentcontent = `<h3 class="pagehead" style="color:white !important;">Manual Payment of Lending Contract Debt<br><sup><code>Lending Contract #<span id="contractsurrenderID"></span><br><br><span id="contractFinalizeData"></span></code></sup></h3><table><tbody><tr><td>Amount of HIVE to Repay:<br><input type="text" onchange="return manualPay = $(this).val();" id="paymentAmt" style="background: white; color: black; text-align: center; width: 80%; height: 3vh; font-size: large; border-radius: 10px;"></td></tr><tr><td>Once the Outstanding Contract Balance is Paid you're given your Owner Key</td></tr><tr><td><button class="button" id="submitmanualpayment" onclick="payloan('${loanData.borrower}', '${loanData.loanId}', document.getElementById('paymentAmt').value)">Submit Payment</button></td></tr><tr><td><span id="acceptTitle"></span></td></tr><tr><td><span id="acceptOutcome"></span></td></tr></tbody></table>`;
  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
$("#jumboHead").show();
  $("#jumboWrapper").html( paymentcontent);
  $("#userAcctPass").val(user);
      $("#contractsurrenderID").html(loanData.loanId);
      $("#contractFinalizeData").html(`${(loanData.amount / 1000).toFixed(3)} HIVE being Loaned by this Lending Contract<br>requiring ${totalpayments} <span id="surrenderpayments"></span> of ${(paymentSum / 1000).toFixed(3)} HIVE Paid Weekly<br>to the Sum of ${(totalrepay / 1000).toFixed(3)} HIVE over ${loanData.days} Days<br><br><br>Outstanding Contract Balance:<br>${((outstandingDebt / 1000).toFixed(3))} HIVE`);
      if (totalpayments == 1) {
      $("#surrenderpayments").html('payment');
      } else {
        $("#surrenderpayments").html('payments');
      }
      $("#jumbotron").css({'height':'auto','width':'25%'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
      $("#jumboTitle").html(`Hive.Loans - Manual Repayment`);
  });

}
