//========================================================================================
// Page contents and whatnot
//========================================================================================

let moverAddon = `<span id="jumboMove" title="Click and Drag to Move Window"><i class="fas fa-arrows-alt"></i></span>`;

async function loadingjumbo() {
  var loadingContent = `<i class="fas fa-spin fa-3x fa-sync"></i>`;
  $("#jumbotron").promise().done(function(){
      $("#jumbotron").html(loadingContent);
      $("#jumbotron").css({'height':'auto','width':'auto'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
  });
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
        title: `<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>Tip Another User Instantly</center>`,
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
              title: `<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>Users Currently Online: ${usercount}</center>`,
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
          showSuccess('Deposit Success!');
          $('#depositView').click();
          bootbox.hideAll();
      } else {
        showErr(`Deposit Failed!`);
        console.log(response.error);
      }
  }, true);
}


function wdnow(coin, fee, security) {

      console.log('withdrawit!');

      showSuccess('Processing Withdraw - Please Wait!');

      $('#sending').html('<i style="color:grey" class="fa fa-spinner fa-pulse fa-2x fa-fw"></i>');

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
              showWallet();
              bootbox.hideAll();
          }
      })
  };

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
           `<h3 style="margin: none !important;"><table style="width:100%;align-content:center;"><tbody><tr><td style="width:40%;"><a href="https://hiveblocks.com/@hive.loans" target="_blank" style="text-decoration:none !important;">hive.loans</a></td><td><i class="fas fa-long-arrow-alt-right"></i></td><td style="width:40%;"><a href="https://hiveblocks.com/@${user}" style="text-decoration: none !important;" target="_blank">${user}</a></td></tr></tbody></table></h3>`+
         //  `<h3 style="margin: none !important;"><a href="https://hiveblocks.com/@${user}" style="text-decoration: none !important;" target="_blank">${user}</a> <i class="fas fa-long-arrow-alt-right"></i> <a href="https://hiveblocks.com/@hive.loans" target="_blank" style="text-decoration:none !important;">hive.loans</a></h3><br>`+
           `<b id="acctflash1">Specify Amount of ${coin} to Withdraw:</b><br><input type="number" min="0" step="0.001" decimal="3" id="withdrawInteger" style="background: white;color: black;text-align: center;width: 18vw;height: 3vh;font-size: large; border-radius:10px;" placeholder="0.000" onkeyup="calctotal($('#rawfee').val(), '${coin}')" ><br>` +
           `<sub>( Account Balance: <span id="tipbalance" placeholder="0.000" onClick="$('#withdrawInteger').val($('#tipbalance').val());calctotal(${data.fee}, '${coin}')"></span> ${coin} <span id="tipBalspan"></span> )</sub><br><br>`+
           `<span id="rawfee"></span><span id="wdfee">Calculating fee..</span><br><br>` +
           `<span id="wdtotal"></span><br><br>` +
           `<b id="acctflash1">Account to Withdraw to:</b><br><input type="text" readonly id="withdrawAcct" style="background: white;color: black;text-align: center;width: 18vw;height: 3vh;font-size: large; border-radius:10px;" value="${user}" onkeyup="console.log($(this).val())" ><br><sub>( <span id="underAcctText"></span> )</sub><br><br>` +
           `<b id="acctflash1">Transfer Memo:</b><br><input type="text" id="withdrawMemo" style="background: white;color: black;text-align: center;width: 18vw;height: 3vh;font-size: large; border-radius:10px;" placeholder="( optional )"><br><br>` +
           `<button type="button" style="font-size: normal; padding: 10px; line-height: 1vh; background: #000; color: white; width: 55% !important;border-radius:5px;" onclick="if($(this).prop('disabled')){console.log('Invalid Withdraw Request!')} else {wdnow('${coin}', ${data.fee}, '${data.security}')};" class="btn push_button2" id="withdrawit" title="Click here withdraw from Hive.Loans"><span id="wdbuttontex">Enter Amount</span></button><br><br>` +
           `<sub><i class="fa fa-exclamation-triangle" style="color:gold;" aria-hidden="true"></i> Withdrawal Address <b><u>MUST</u></b> be Correct, We Cannot Refund ${coin} Sent to a Wrong Account!</sub></center>`;
            $("#jumbotron").fadeOut('fast');
            $("#jumbotron").promise().done(function(){
                $("#jumbotron").html(moverAddon + sendingContent);

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
    `<h3 style="margin: none !important;"><table style="width:100%;align-content:center;"><tbody><tr><td style="width:40%;"><a href="https://hiveblocks.com/@${user}" style="text-decoration: none !important;" target="_blank">${user}</a></td><td><i class="fas fa-long-arrow-alt-right"></i></td><td style="width:40%;"><a href="https://hiveblocks.com/@hive.loans" target="_blank" style="text-decoration:none !important;">hive.loans</a></td></tr></tbody></table></h3>`+
  //  `<h3 style="margin: none !important;"><a href="https://hiveblocks.com/@${user}" style="text-decoration: none !important;" target="_blank">${user}</a> <i class="fas fa-long-arrow-alt-right"></i> <a href="https://hiveblocks.com/@hive.loans" target="_blank" style="text-decoration:none !important;">hive.loans</a></h3><br>`+
    `<b id="acctflash1">Specify Amount of ${coin} to Deposit:</b><br><input type="number" min="0" step="0.001" decimal="3" id="depositInteger" style="background: white;color: black;text-align: center;width: 18vw;height: 3vh;font-size: large; border-radius:10px;" placeholder="0.000" onkeyup="console.log($(this).val())" ><br>` +
    `<sub>( External Account Balance: <span id="tipbalance" placeholder="0.000" onClick="$('#depositInteger').val($('#tipbalance').val())"></span> ${coin} <span id="tipBalspan"></span> )</sub>`+
    `<br><center><table><tbody><tr><td style="float: right; width: 45%;">Deposit using Keychain: <button type="button" style="font-size: normal; padding: 10px; line-height: 1vh; background: #000; color: white; width: 55% !important;border-radius:5px;" class="btn push_button2" id="skclogologin" onClick="depositAmount = parseFloat($('#depositInteger').val()).toFixed(3); keychainSend('${user}', 'hive.loans', depositAmount, '${uAddress}', '${coin}')" title="Click here Deposit with Hive KeyChain"><img src="/img/keychaintext.png" class="keychainlogo" style="width:80%"></button></td><td style="float: left; width: 45%;">Deposit using HiveSigner<button type="button" style="font-size: normal; padding: 10px; line-height: 1vh; background: #000; color: white; width: 55% !important;border-radius:5px;" class="btn push_button2" id="hivesignerdeposit" onClick="deposit($('#depositInteger').val(), '${coin}', '${uAddress}')" title="Click here to Deposit with HiveSigner"><img src="/img/hivesigner.svg" class="hivesignerlogo" style="width:85%"></button></td></tr></tbody></table></center>`+
    `<h4 style="margin: none !important;">Manual Deposit Information<br><sub>Include the Address and Memo below in your Transfer</sub></h4>`+
    `Address:<br><input type="text" id="depositName" style="background: white;  color: black;  text-align: center;  width: 9vw;  height: 3vh;  font-size: large;border-radius: 10px;" readonly=""><br>Memo:<br><input type="text" id="depositMemo" style="background: white;  color: black;  text-align: center;  width: 14vw;  height: 3vh;  font-size: large;border-radius: 10px;"  readonly=""></center>`;
     $("#jumbotron").fadeOut('fast');
     $("#jumbotron").promise().done(function(){
         $("#jumbotron").html(moverAddon + sendingContent);
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

function addressvalidater() {
  var addressvalue = $('#withdrawAddress').val();
  if(verbose == true) console.log(addressvalue.length);
  $('#addresstype').css({'color':'white'});
  if (addressvalue.length == 34) {
    $('#addresstype').css({'color':'white'});
    $('#withdrawAddress').css({'font-size':'x-large'});
    $('#addresstype').val(`Standard`);
    $('#addresstype').html(`Standard`);
    $('.withdrawit').prop('disabled', false);
  } else if (addressvalue.length == 102) {
    $('#addresstype').css({'color':'white'});
    $('#withdrawAddress').css({'font-size':'smallest'});
    $('#addresstype').val(`Stealth`);
    $('#addresstype').html(`Stealth`);
    $('.withdrawit').prop('disabled', false);
  } else {
    $('#addresstype').css({'color':'white'});
    $('#withdrawAddress').css({'font-size':'x-large'});
    $('#addresstype').val(`None`);
    $('#addresstype').html(`None`);
    //$('#addresstype').html(`<i class="fa fa-exclamation-triangle" style="color:gold;" aria-hidden="true"></i> Invalid`);
    $('.withdrawit').prop('disabled', true);
  }
  if (addressvalue != '') {
    $('#addressIsValid').css({'color':'grey'});
    $('#addressIsValid').html(`Checking...`);
    $('.withdrawit').prop('disabled', true);
  } else if(addressvalue == '') {
    $('#addressIsValid').css({'color':'grey'});
    $('#addressIsValid').html(`Waiting...`);
    $('.withdrawit').prop('disabled', true);
  }
  if (addressvalue.length >= 34){
    setTimeout(function(){
      if (verbose = true) console.log(`ValidateAddy Fired!`);
      socket.emit('validateAddy', {address: addressvalue});
    },1000);
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
            `<button type="button" style="width: 33%;margin-top:0.5em;" class="btn push_button2 sextext" id="withdrawit" class="withdrawit" onmouseover="checkbalval();" title="Withdraw">Withdraw</button>`,
        title: `<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>Withdraw RHOM From Your Account</center>`,
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
        $('#sending').html('<i style="color:grey" class="fa fa-spinner fa-pulse fa-2x fa-fw"></i>');
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
            '<br><table class="blueTable" style="width:100%;text-align:center;"><tbody style="background-color:transparent;"><tr style="border:none !important;"><td><button type="button" class="btn  push_button2 sextext" style="" id="Register" onClick="regDialog();">Register</button></td><td><span id="loginfeedback" style="width: 20%; text-align: center;"><input type="text" style="visibility:hidden;" id="chatloadpercent" value="0.0%" readonly><i id="loadingring" style="color:limegreen;visibility:hidden;" class="fa fa-circle-notch fa-spin fa-2x fa-fw"></i></span></td><td><button type="button" class="btn  push_button2 sextext" style=";" id="Login" onClick="submitLogin();">Login</button></td></tr></tbody></table><br>' +
            '<br><br><center><b><i class="fa fa-exclamation-triangle" style="color:gold;" aria-hidden="true"></i> Disclaimer</b>: You must be 18+ in order to play, invest and stake here.</center><br><br>' +
            '<center><font size="1">(<i>Please ensure that crypto currency based gaming sites are legal in your country or state before play/invest.</i>)</font></center>' +
            '<center><font size="1">(<i>By logging in / registering you are verifying you are of legal age and gaming sites are legal in your country or state.</i>)</font></center><br>' +
            '<center>Need help or forgotten your account password? Please join our <i class="fab fa-discord"></i> <a style="color:#337ab7;" href="https://discord.gg/mtwvCpS" target="_blank">Discord</a><br></center>' +
            '<script>$("#password").keypress(function(event){loginKey(event);});$("#2fa").keypress(function(event){loginKey(event);});$("#username").keypress(function(event){loginKey(event);});</script>',
        title: '<center><span id="sexymodaltitle">Rhom-Roller.com</span><br><b id="titletext">The Best Provably Fair 1% Dice & Investment Vehicle on Rhombus</b></center>',
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
  //        $('#loginfeedback').html('<input type="text" readonly id="chatloadpercent"><i style="color:grey; visibility: hidden;" class="fa fa-spinner fa-2x fa-fw"></i>');
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
          showSuccess(`Keychain Intitation Success`);
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
                    showSuccess(`Click Button Again to Login!`);
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
                  window.localStorage.setItem("user", user);
                  showSuccess('Login Completed');
                  if (data.token !== 0) token = data.token;
                  chatToken = data.chatToken;
                  uid = data.uid;
                  socketid = data.socketid;
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
                      message: "Welcome to Hive.Loans v0.0.7",
                      time: Date.now()
                  });
                  alertChatMessage({
                      message: "Note that this is an incomplete placeholder demo and not an accurate representation of the final release version.",
                      time: Date.now()
                  });
                  showWallet()
                  getAcct();
                  $('#userhivebalance').val(uHIVEbalance / 1000);
                  $('#userhbdbalance').val(uHBDbalance / 1000);
                  $("#depositName").html('hive.loans');
                  $("#depositName").val('hive.loans');
                  $("#useraddress").val(data.address);
                  $("#userhivebalance").val(data.hivebalance);
                  $("#userhbdbalance").val(data.hbdbalance);
                  $('#usernamestore').val(data.username);
                  $('#userrank').val(data.rank);
                  $("#userstats").removeClass('hidden');
                  $("#sitestats").removeClass('hidden');
                  $('#chatName').html(`Hive.Loans Site Messaging`);
                  $("#chatpanel").css({'height':'80%','width':'13%','top':'5%','left':'85%'});
                  $("#chatpanel").removeClass('hidden');
                  $("#acct").removeClass('hidden');
                  $("#loans").removeClass("hidden");
                  $("#lend").removeClass("hidden");
                  $("#tools").removeClass("hidden");
                  $("#faq").removeClass("hidden");
                  $("#blocknumberholder").removeClass('hidden');
                  $("#wallet").removeClass("hidden");
                  $("#profile").removeClass("hidden");
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
                  $("#tools").show();
                  $("#login").addClass('hidden');
                  $("#logout").show();
                  $("#arrowin").show();
                  $('#userhivebalance').val(data.hivebalance);
                  $('#userhbdbalance').val(data.hbdbalance);
                }
                  };//END Else data == true
                });
            };
        } else {
            showErr("Something Went Wrong!");
        }
    });
};

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
                showSuccess(`Welcome to Rhom-Roller.com ${data.user}`);
                $(".gamegui").removeClass("gameguiActive");
                $(".gameguideactiveC").css("display", "none");
                if (data.token !== 0) token = data.token;
                chatToken = data.chatToken;
                uid = data.uid;
                socketid = data.socketid;
                $('#usernamestore').val(data.user);
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
                    message: `<i class="fas fa-exclamation-triangle sexyblackoutline" style="color:yellow;"></i> <b>NOTE</b>: This is <b><u>EXPERIMENTAL</u></b> software alpha testing!\n\nBy using the site past this point you agree Rhom-Roller.com is entirely free from any liability including financial responsibility or injuries incurred, regardless of whether injuries are caused by negligence or due to malfunction. Only roll, invest and stake what you can afford to lose. Please report bugs or any exploits you find to KLYE. Thanks for Helping Alpha Test!`, // \n===========================================================\n*** NOTICE: This is Experimental Software, Use at Your Own Risk! ***\n===========================================================
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
                $('#reflink').val(`Rhom-Roller.com/?r=${userlog}`);
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
        title: '<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>Change Account Password</center>',
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

$("#investinfo").on('click', function() {
    bootbox.dialog({
        message: '<center>' +
            'This site allows all users to become the house by allowing the opportunity to invest in the community bankroll. By offering instant asset investment as well as divestment coupled with the ability to deploy real-time leverage / multiplier adjustments up to 99x, users can easily make profit on their Tokens while retaining a high degree of liquidity due to being able to instantly get your capital returned when you wish to do something else with it.' +
            '<br><br><center><b style="font-size:1.25em;">How does Investment Gain Profit?</b></center><br>' +
            'Investment gains are credited as profit on each roll lost by any gambler assuming the amount earned by the investors capital is greater than 0.00000001 Token after calculating percentage of bankroll share owned by invested amount times the investment margin mulitplier. However if gamblers win their bet the opposite happens and investors may lose some of their capital, however unless you\'re highly leveraged it is unlikely you will ever lose all of your investment.' +
            '',
        title: '<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>Bankroll Investing Information</center>',
        buttons: {
            main: {
                label: "Close",
                className: "push_button2"
            }
        }
    });
});

var tos = function() {
    bootbox.dialog({
        message: '<center><h2 style="color: #165098 !important;">Introduction</h2></center>' +
            '<p>These Website Standard Terms and Conditions written on this webpage shall manage your use of our website, Rhom-Roller.com accessible at https://www.Rhom-Roller.com.</p>' +
            '<p>These Terms will be applied fully and affect to your use of this Website. By using this Website, you agreed to accept all terms and conditions written in here. You must not use this Website if you disagree with any of these Website Standard Terms and Conditions.</p>' +
            '<center><p><b>Minors or people below 18 years old are not allowed to use this Website!</b></p></center>' +
            '<center><h2 style="color: #165098 !important;">Intellectual Property Rights</h2></center>' +
            '<p>Other than the content you own, under these Terms, Rhom-Roller.com and/or its licensors own all the intellectual property rights and materials contained in this Website.</p>' +
            '<p>You are granted limited license only for purposes of viewing the material contained on this Website.</p>' +
            '<center><h2 style="color: #165098 !important;">Restrictions</h2></center>' +
            '<p>You are specifically restricted from all of the following:</p>' +
            '<ul>' +
            '<li>publishing any Website material in any other media;</li>' +
            '<li>selling, sublicensing and/or otherwise commercializing any Website material;</li>' +
            '<li>publicly performing and/or showing any Website material;</li>' +
            '<li>using this Website in any way that is or may be damaging to this Website;</li>' +
            '<li>using this Website in any way that impacts user access to this Website;</li>' +
            '<li>using this Website contrary to applicable laws and regulations, or in any way may cause harm to the Website, or to any person or business entity;</li>' +
            '<li>engaging in any data mining, data harvesting, data extracting or any other similar activity in relation to this Website;</li>' +
            '<li>using this Website to engage in any advertising or marketing.</li>' +
            '</ul>' +
            '<p>Certain areas of this Website are restricted from being access by you and Rhom-Roller.com may further restrict access by you to any areas of this Website, at any time, in absolute discretion. Any user ID and password you may have for this Website are confidential and you must maintain confidentiality as well.</p>' +
            '<center><h2 style="color: #165098 !important;">Your Content</h2></center>' +
            '<p>In these Website Standard Terms and Conditions, "Your Content" shall mean any audio, video text, img or other material you choose to display on this Website. By displaying Your Content, you grant Rhom-Roller.com a non-exclusive, worldwide irrevocable, sub licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.</p>' +
            '<p>Your Content must be your own and must not be invading any third-partyâ€™s rights. Rhom-Roller.com reserves the right to remove any of Your Content from this Website at any time without notice.</p>' +
            '<center><h2 style="color: #165098 !important;">Your Privacy</h2></center>' +
            '<p>Rhom-Roller.com will not share your name, username, email, login information, account status or any other information with any party regardless of inquiry. Under no circumstance will we give any information to any government agency, police department or tax collector even if they have proper warrants and paperwork.<br><center>We respect your privacy and information, confidentiality is important!</center></p>' +
            '<center><h2 style="color: #165098 !important;">No warranties</h2></center>' +
            '<p>This Website is provided "as is," with all faults, and Rhom-Roller.com express no representations or warranties, of any kind related to this Website or the materials contained on this Website. Also, nothing contained on this Website shall be interpreted as advising you.</p>' +
            '<center><h2 style="color: #165098 !important;">Limitation of liability</h2></center>' +
            '<p>In no event shall Rhom-Roller.com, nor any of its officers, directors and employees, shall be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract. Â Rhom-Roller.com, including its officers, directors and employees shall not be held liable for any indirect, consequential or special liability arising out of or in any way related to your use of this Website.</p>' +
            '<center><h2 style="color: #165098 !important;">Indemnification</h2></center>' +
            '<p>You hereby indemnify to the fullest extent Rhom-Roller.com from and against any and/or all liabilities, costs, demands, causes of action, damages and expenses arising in any way related to your breach of any of the provisions of these Terms.</p>' +
            '<center><h2 style="color: #165098 !important;">Severability</h2></center>' +
            '<p>If any provision of these Terms is found to be invalid under any applicable law, such provisions shall be deleted without affecting the remaining provisions herein.</p>' +
            '<center><h2 style="color: #165098 !important;">Variation of Terms</h2></center>' +
            '<p>Rhom-Roller.com is permitted to revise these Terms at any time as it sees fit, and by using this Website you are expected to review these Terms on a regular basis.</p>' +
            '<center><h2 style="color: #165098 !important;">Assignment</h2></center>' +
            '<p>The Rhom-Roller.com is allowed to assign, transfer, and subcontract its rights and/or obligations under these Terms without any notification. However, you are not allowed to assign, transfer, or subcontract any of your rights and/or obligations under these Terms.</p>' +
            '<center><h2 style="color: #165098 !important;">Entire Agreement</h2></center>' +
            '<p>These Terms varitute the entire agreement between Rhom-Roller.com and you in relation to your use of this Website, and supersede all prior agreements and understandings.</p>' +
            '<center><h2 style="color: #165098 !important;">Governing Law & Jurisdiction</h2></center>' +
            '<p>These Terms will be governed by and interpreted in accordance with the laws of the State of Belize, and you submit to the non-exclusive jurisdiction of the state and federal courts located in Belize for the resolution of any disputes.</p>',
        title: '<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>Terms & Conditions</center>',
        buttons: {
            main: {
                label: "Close",
                className: "push_button2"
            }
        }
    })

};

$("#contact").on('click', function() {
    bootbox.dialog({
        message: '<center><b>Your Username:</b><br>' +
            '<input type="text" class="form-control" placeholder="Enter Your Name or Username" aria-describedby="basic-addon1" id="contactName" style="width:50%;"><br>' +
            '*<b>Your Email</b>:<br>' +
            '<input type="text" class="form-control" placeholder="Enter Your Valid Email" aria-describedby="basic-addon1" id="contactEmail" style="width:50%;" required><br>' +
            '*<b>Message:</b><br>' +
            '<textarea class ="form-control" id="contactMessage" rows="10" cols="100" placeholder="Type your message here. (required)" style="width:70%;height:5em;" required></textarea><br>' +
            '</font>' +
            'If you have Discord you can always come ask your question on our server!<br><a href="https://discord.gg/mtwvCpS" style="color:#337ab7;" >Offical Rhom-Roller.com Discord Server</a>' +
            '</center><br>' +
            '<center><span><b>Want to encrypt your message?</b><br><a href="#" style="color:#337ab7;" id="showpgp">Click here to view our PGP key!</a></span><div id="pgpshow" style="display:none;">-----BEGIN PGP PUBLIC KEY BLOCK-----<br><a href="#" title="Click to Copy to Clipboard"><input class="form-control" readonly onmouseover="this.select()" style="" onclick="copyStringToClipboard(this.value)" value="xsBNBFytr30BCAC7ZgvCfqTGpyuw5eYB3CyQENdqtgSBhmIStI/TCoBJ5sqwr5qEraByxVRh1zToUF3gcJc4U6UeE4ylmukmR2v/6FdDVvvG6Fm3gy2K0J2bDnPllmvpbde8ml04L0cQhLEO7yp4VnuDuAg+tgS2SStlqLFQ8MXfOor8HFhtrKpU4BJuuFXnjNZyLXzgjwTe1eV5swamcnP5MZnxd2jJEWmE2+mXVjhwMWTNe0jRMMrOZ4pt8Fi4WgosP5/n9YpoymtVexR7JXdDGZtjdvAdHTCrS66OYlLIDtZp0KplV+aWYVo2+C17ZQqymkjZb/oKrEgEh0dnU/THABz+CGWM+B3jABEBAAHNLEtMWUUgKE15IFBHUCBLZXkpIDxreWxlanJ0dXJuYnVsbEBnbWFpbC5jb20+wsBtBBMBCgAXBQJcra99AhsvAwsJBwMVCggCHgECF4AACgkQNItJahc92qoSmAgAhleyjvTRnD3i0cUs0IYzEd0b3oMPXfU2y0U5FwliqEKvaE9OO9HDiOBs2CahD+61DeYr42OK8xm+H4cC9xkpEAAXSwGl5ldeF9I1PdnZ5Y7ZzzWXZBcN0vi6CVq4svmTXMGEc7oEuMD9E6Y3ZGEfGu5FPQjAyn/CXQZXUQuHW7iMN2YhdaiMk8ZM9SbgZiGizTBYnSQDN3Nx9fTYbCTpZsYH/23nJkEessSDbA61OI/r2JSE429yKm5KleBjntlN8paOVaUNuNzuWOlyt4lguO2ZxQOf8oe6rF9EY60Di4sep9dLgT6ZL9VJpY7D278/7StTOB97R81d2lBzkaocF87ATQRcra99AQgAtLz7SnVEAtYJTSbQ7jxy3QHlOvAD/WWQsncl5KBUJAp6YIuSwCX5z78uNgzuUSvhHK2oAr9HHprSRYTsyTv5efDwWR+IpFvJLvybGaQGhPB+z7DxfSXix32bMrvzCLGn2JJQDarSK3IRkOM1uxJbwY141FLJHvpkJQcDN/OHOlaUCHFxPCMmxPd+gOTdDT2u44VNMBjkAVOtPDw+pwvnQt4IasXfLstBgbvoKp/pw8THEdp6uT88OlG2iKjZtw2ror5zwr2TJJtHzqFMYODlMEEFdpTFqrJaw7EkYs9IsqowW9Tqa6Ep1QS9S1gY0AwPpQ30wojq1bSKMlC2YbW1DwARAQABwsGEBBgBCgAPBQJcra99BQkPCZwAAhsuASkJEDSLSWoXPdqqwF0gBBkBCgAGBQJcra99AAoJENiB3vM3iy++F3EH/0hoOohOmzaJOM57ov1keEuxLnArW4FG0/sGEdZz0EQgNn7fHCh7SIW4y3hYWGiu5+QIfeLB/jmw2q9pVwyVZzbRzvx6P+nfnHiqIoz8uMrCcRfD90wXFP9khQ1w93SYfJg+gBkS+8h9uSgx0PuipdBx5evRzPuFzYXCzHDQtHR1bQ0Y2C5Dv9bG0F6Dy5KPiti21fBWJh4/Dgg6A4naNt3oKtyU0HMYUTqwN9AvD+O6dV9EVcvxaRdKQAkrVEaeXMh6fZQJsGcZ42xIRfxvnZM4pHRd3OhqXmAQMTqNZzC90U+0ohLqeG2PA/7b2tkajdlAeilhTjt11lTuSZgBfutgxwf/Q6e/dra1Ls48tz57PwlK8bFEP+wnk9T3T73goaXI/ZvwjWcavPV5zUO3yxxSaNZ6E/Fvq65zwheqxJd3wXBu1pprc8k0+aOzoenJv6jLhpOkbRYrl8CU+5sV0nhaPuqM9yKKh+FqOev57O7rB8EbMCG8YYUPMA6oWI/DaCaiHhy1I0gW2blqxRWCREkxlc7fyEStUButdw8rwg5nLjiakmZ/8xP3FXIWB+D/uzVBGSDx5QfHqR4QY9qgY3JHZgIghClsMXwsjJlifdPIa1QJSb4USxDyacBRlTQj5gYNc0sJdvFblW6Vw9gDYw/TZtY6uwwbsLKbLmnpgIW85W9wsc7ATQRcra99AQgA1UpVOUnM1X+i+IhchbhXzK/Fd+iZVbSHGo9eN0zrGCcprzX8tFS4Vm9AWqyR+9vhwCO4OY2nTMEZZ0mG1Lfiv4RcrB0C9te1F1V1+ru+dQnmq1b+wQFdHkQR1lYSuFjrq1v3dp+A9fI5PRK28PEayA+07bDLaToQs8CZLkmvd2wdiK617YrcOClCW4TRYJAs56h19DsRKQ245L6yFaNpoQcaAaLogyCZy/AChjtqIHvNADcfvn+PDPC8R3xP1Y1M6D8zq2jCuKUED5xqBTS9S0H6fTW7VU+t/gpmetrNyuTQ+30sQClCmgMYEKRuQZIAKjDIDwj+UalKAVn3OIUo1wARAQABwsGEBBgBCgAPBQJcra99BQkPCZwAAhsuASkJEDSLSWoXPdqqwF0gBBkBCgAGBQJcra99AAoJEABanYRVBM7T4FYH/3BrnSIXGyHlQkf/Bnj0eapx7In0UzGufrJNk/+SlXBBn4EQ6rYnYtDQMcxBPuVpAHHVi1ZKeaqxciRCzfrA7o84mAUozEFV8upXJCCJmhlSCodjOeupU+N+RzoS3VFkhzY0lds67iAhjg8GY4IvJigIFFdeCmNirmK1AercSjEiRiAFVk7ULbVQ0HBHir0JKJMDLxeQ0Gxo/1uEtuZ0AvpDVCjin8rU9iHStx36wqlB7DyviUaA5VxuHwTyK0QIBKByokr0oa9RSgtMah1nD1hk/eWH/3GTmCfs2ouvX1A0Lq/1F8XMmDXDTYaMCejb9Lyz5aU5R4Jyufce4XaPNJIY0wf/R1C4Ca386NDMu4lHyp7VIgdWj5aCTbdBVmjybTOAlG/zflD2q9bOY1ndfEiiBKr4lKdo5HVPD7Ikvjx8/OgqYhudq+g/yypOpjFmMPhhboXZ/21w2zdfK24Ezy3FE0/Nz1p0Ik5L4EKNjUCzgx8PedMAqfOavBUSIQm/9qIc/G5WSgM2xsd3FSWBPMtQu0x1NeboXMuM0p0zfvU/07wIhznB85LRr6BGaNfSkywrktBL6zUu5fVHsHDeZ96mq0C9Tu6nR1vo6g1PJck2Sbm/PyQGEPmZMupnyHL5lg6ENMNXPSz1YbqX77QNxKjjaA7FZ5j/8CC98OxmMRTkDjdpLw===xIpc"></a><br>-----END PGP PUBLIC KEY BLOCK-----</div><br>&nbsp;<br><sub>( Please ensure e-mail provided is valid! Expect a reply to your email within a day! )</sub></center>',
        title: '<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>Need Assistance or Have a Question? Contact Us!</center>',
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
                title: '<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>2FA Security Settings Setup</center>'
            });
        } else {
            bootbox.dialog({
                message: '<div><center><b>Scan the Code Below With Any TOTP Type 2FA Application:</b><br><img style="margin-right:5px" src="' + data.qrcode + '"><br><b>Secret:</b><br>' + data.secret + '</center></div><br><center>Input 2FA Code From Your Authenicator App to Enable 2FA:</center>' +
                    '<center><input type="text" class="form-control" style="" placeholder="" aria-describedby="basic-addon1" id="confirm2fanumber"/><br><br>' +
                    '<center><button type="button" class="btn  push_button2 sextext" style="" onClick="confirm2fa();">Confirm</button></center>' +
                    '</div><br><div id="2faresponse"></center>',
                title: '<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>2FA Security Settings Setup</center>'
            });
        }
        window.scrollTo(0, 0);
    });
});

$("#rtos").on('click', function() {
    tos();
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

var userstatsDialog = function(data) {
    console.log(data);
    socket.emit('userstats', {
        user: data
    }, function(err, d) {
        if (err) {
            console.log(err);
            return showErr('Error Fetching User Stats!');
        }
        if (d) {
            console.log("userstatsDialog data");
            console.log(d);
            var wager = d.wagered / 100000000;
            var profit = d.profit / 100000000;
            var bigwin = d.largestWin / 100000000;
            var bigloss = d.largestLoss / 100000000;
            var rolls = commaNumber(d.betid);
            bootbox.dialog({
              message:
              `<center>Rolls:<br>${d.bets}<br><br>`+
              `Wagered:<br>${wager.toFixed(8)} RHOM<br><br>`+
              `Profit:<br>${profit.toFixed(8)} RHOM<br><br>`+
              `Biggest Win:<br>${bigwin.toFixed(8)} RHOM<br><br>`+
              `Biggest Loss:<br>${bigloss.toFixed(8)} RHOM</center>`,
              title: '<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>@' + data + ' Gambling Statistics</b></center>',
              buttons: {
                  main: {
                      label: "Close",
                      className: "push_button2"
                  }
              }
            });
        }
    });
};

var userstatsDialogAdmin = function(data) {
  console.log(data);
    socket.emit('adminuserstats', {
        user: data
    }, function(err, d) {
        if (err) {
            showErr('Error Fetching Stats');
        }
        if (d) {
          console.log(d);
            var balance = d.balance / 100000000;
            var wager = d.wagered / 100000000;
            var profit = d.profit / 100000000;
            var bigwin = d.largestWin / 100000000;
            var bigloss = d.largestLoss / 100000000;
            var invested = d.invested / 100000000;
            bootbox.dialog({
              message:
              `<center>Balance:<br>${balance.toFixed(8)}<br><br>`+
              `Rolls:<br>${d.bets}<br><br>`+
              `Wagered:<br>${wager.toFixed(8)} RHOM<br><br>`+
              `Profit:<br>${profit.toFixed(8)} RHOM<br><br>`+
              `Biggest Win:<br>${bigwin.toFixed(8)} RHOM<br><br>`+
              `Biggest Loss:<br>${bigloss.toFixed(8)} RHOM<br><br>`+
              `Invested:<br>${(invested).toFixed(8)} RHOM</center>`,
              //`Invest Profit: ${(invested.investedProfit / 100000000).toFixed(8)} RHOM<br>`+
              //`Leverage: ${(invested.investedMultiplier / 100000000).toFixed(8)}x<br>`,
              title: '<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>@' + data + ' Gambling Statistics</b></center>',
              buttons: {
                  main: {
                      label: "Close",
                      className: "push_button2"
                  }
              }
            });
        }
    });
};

var betPublicDialog = function(row) {
  console.log(`betPublicDialog`);
  console.log(row);
    bootbox.dialog({
        message: '<div id="betDetail"></div>',
        title: `<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>Bet Summary for <b id="rollstatslink">@${row.username}</b></center>`, //Bet ID# ' + row.betnumber + '
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
    };

    $("#rollstatslink").on('click', function() {
        userstatsDialog(row.username);
    });
};

var betDetailDialog = function(row) {
    console.log(`betDetailDialog`);
  console.log(row);
    bootbox.dialog({
        message: '<div id="betDetail"></div>',
        title: `<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>Bet Summary for #${row.betid}</center>`, //Bet ID# ' + row.betnumber + '
        buttons: {
            main: {
                label: "Close",
                className: "push_button2"
            }
        }
    });
    var provablystring;
    var $betDetail = $("#betDetail");
    var wincheck = parseFloat(row.win);
    if (row.ssHash == undefined && row.serverSeedHash == undefined) {
        provablystring = "";
    } else {
      /*
      if (typeof row.serverSeedHash != undefined){
        row.ssHash = row.serverSeedHash;
      }
      if (typeof row.clientSeed != undefined){
        row.cs = row.clientSeed;
      }
      */
        //provablystring = `Bet ID:<br><input type="text" id="checkbetid" readonly class="form-control" style="width:69%;text-align:center" value="${row.betid}"><br>Server Seed:<br><input type="text" readonly class="form-control oldserverseed" style="width:69%;" id="oldserverseed" value="Seed Currently Hidden"><br>Server Seed Hash:<br><input type="text" readonly class="form-control" style="width:69%;" value="${row.ssHash}"><br>Client Seed:<br><input type="text" readonly class="form-control" style="width:69%;text:align:center" value="${row.cs}"><br>Nonce:<br><input type="text" readonly class="form-control" style="width:69%;text-align:center" value="${row.nonce}"><br><a href="#" title="Click Here to Show Server Seed for This Roll. This WILL Change the Current Server Seed to a Newly Generated One" onClick="checkServerSeed();">Click Here to Show Server Seed</a><br><sub>(if you show server seed a new one will be generated)</sub><br><br><a href="https://rgbkey.github.io/just-dice/">Check Provability of Roll on 3rd Party Website</a>`;
        provablystring = `Bet ID:<i class="fa fa-info-circle" title="The BetID is the number of this bet"></i><br><input type="text" id="checkbetid" readonly class="form-control" style="width:95%;text-align:center" value="${row.betid}"><br>Server Seed Hash:<i class="fa fa-info-circle" title="The server seed hash is a SHA-512 hash of the current server seed we're using to help generate your rolls"></i><br><input type="text" readonly class="form-control" style="width:95%;" id="ssHash" value="${row.ssHash}"><br>Server Seed:<i class="fa fa-info-circle" title="The server seed is a hexidecimal string which is part of the data used to generate your rolls"></i><br><input type="text" readonly class="form-control oldserverseed" style="width:95%;" id="oldserverseed" value="Seed Currently Hidden"><br>Client Seed:<i class="fa fa-info-circle" title="The client seed is a value you can specify to help randomize the generation of your rolls"></i><br><input type="text" readonly class="form-control" style="width:95%;text:align:center" id="clientS33d" value="${row.cs}"><br>Nonce:<i class="fa fa-info-circle" title="The nonce is the amount of rolls you've completed with this server & client seed combination"></i><br><input type="text" id="checknonce" readonly class="form-control" style="width:95%;text-align:center" value="${row.nonce}"><br>Actual Hash:<i class="fa fa-info-circle" title="A hash used to help verify roll integrity on the 3rd party site below"></i><br><input type="text" id="actualHash" readonly class="form-control" style="width:95%;text-align:center" value="Used to Help Verify on 3rd Party Sites"><br>Provability Quick Check Value:<br><textarea rows="6" style="height:12vh !important; overflow:hidden;" id="returnedprovability" class="form-control" wrap="hard" placeholder="Your provably fair data will be displayed here when the server responds with the data. You can input this in the top field of the checking site. Note that with large amounts of bets on an account it can take several minutes to fetch the bet data. Copy all of this into the top box on the roll verifier site in order to quickly verify your bets were fair." onmouseover="this.select()" onclick="copyStringToClipboard(this.value)"></textarea><br><a href="#" title="Click Here to Show Server Seed for This Roll. This WILL Change the Current Server Seed to a Newly Generated One" onClick="checkServerSeed();">Click Here to Show Server Seed</a><br><sub>( showing seed will change current server seed )</sub><br><br><a href="https://rgbkey.github.io/just-dice/" target="_blank">Check Provability of Roll on 3rd Party Website</a>`;
    }
    if (wincheck >= 0) {
        $betDetail.html(`<center><b style="font-size:2em;color:green;">WON!</b><br><h4>Bet: <b>${row.amount}</b> RHOM aiming for <b>${row.target}</b><br>Won: <b style='color:green;'>${row.win}</b> RHOM with a Roll of <b>${row.result}</b></h4>${provablystring}</center>`);
    } else {
        $betDetail.html(`<center><b style="font-size:2em;color:red;">LOST!</b><br><h4>Bet: <b>${row.amount}</b> RHOM aiming for <b>${row.target}</b><br>Lost: <b style='color:red;'>${row.win}</b> RHOM with a Roll of <b>${row.result}</b></h4>${provablystring}</center>`);
    }
    $("#rollstatslink").on('click', function() {
        userstatsDialog(row.username);
    });
};



var singlebetDetailDialog = function(row) {
      console.log(`singlebetDetailDialog`);
    if (row == undefined) {
        showErr("No Bet Found in Database!");
        return;
    }
    if (row.username == undefined) {
        row.username = "";
    }
    if (row.ssHash == undefined) {
        provablystring = "";
    } else {
        provablystring = `Bet ID:<br><input type="text" id="checkbetid" readonly class="form-control" style="width:69%;text-align:center" value="${row.betid}"><br>Server Seed:<br><input type="text" readonly class="form-control oldserverseed" style="width:69%;" id="oldserverseed" value="Seed Currently Hidden"><br>Server Seed Hash:<br><input type="text" readonly class="form-control" style="width:69%;" value="${row.serverSeedHash}"><br>Client Seed:<br><input type="text" readonly class="form-control" style="width:69%;text:align:center" value="${row.clientSeed}"><br>Nonce:<br><input type="text" readonly class="form-control" style="width:69%;text-align:center" value="${row.nonce}"><br><a href="#" title="Click Here to Show Server Seed for This Roll. This WILL Change the Current Server Seed to a Newly Generated One" onClick="checkServerSeed();">Click Here to Show Server Seed</a><br><br><a href="https://rgbkey.github.io/just-dice/">Check Provability of Roll on 3rd Party Website</a>`;
    }
    bootbox.dialog({
        message: '<div id="betDetail"></div>',
        title: '<center><span id="sexymodaltitle">Rhom-Roller.com</span><br>Bet #' + row.betid + ' Summary</center>',
        buttons: {
            main: {
                label: "Close",
                className: "push_button2"
            }
        }
    });
    var $betDetail = $("#betDetail");
    var wincheck = parseFloat(row.win);
    var direction;
    if (row.high == "above") {
        direction = ">";
    }
    if (row.high == "below") {
        direction = "<";
    }
    if (wincheck >= 0) {
        $betDetail.html(`<center><b style="font-size:2em;color:green;">WON!</b><br>${row.username} tested Their Luck on the Dice<br>Betting <b>${(row.betAmount / 100000000)}</b> RHOM Aiming for <b>${direction} ${row.number}</b><br>Winning <b style='color:green;'>${(row.win/ 100000000)}</b> RHOM with a Roll of <b>${row.result}</b><br>${provablystring}</center>`);
    } else {
        $betDetail.html(`<center><b style="font-size:2em;color:red;">LOST!</b><br>${row.username} tested Their Luck on the Dice<br>Betting <b>${(row.betAmount / 100000000)}</b> RHOM Aiming for <b>${direction} ${row.number}</b><br>Losing <b style='color:red;'>${(row.win/ 100000000)}</b> RHOM with a Roll of <b>${row.result}</b><br>${provablystring}</center>`);
    }
    $("#rollstatslink").on('click', function() {
        userstatsDialog(row.username);
    });
};

//===========================================================
// Moved site contente down here



async function showWallet() {
  loadingjumbo();
//alert(`Wallet functions not set to route destinations currently!\n\nDO NOT DEPOSIT ANY HIVE\nUnless you mean to deposit it to support the project development`)
  console.log(`showWallet() called:`);
  var statsBalTop;
  var statsHBDBal;
  $("#jumbotron").fadeOut('fast');
  var resultData;
  user = window.localStorage.getItem("user");
      let walletContent = `<center><h3 class="pagehead" style="color:white !important;">Hive.Loans Web Wallet</h3><table><tbody><tr><td>HIVE Balance</td><td>HBD Balance</td></tr><tr><td><input type="text" id="userhivebalance" class="casperInput" readonly></td><td><input type="text" id="userhbdbalance" style="background: white;color: black;text-align: center;width: 9vw;height: 3vh;font-size: large; border-radius:10px;" readonly></td></tr><tr><td><button type="button" style="font-size: larger; padding: 10px; line-height: 1vh; background: #000; color: white; width: 25%;border-radius:5px; border-top-left-radius: 90px !important; border-top-right-radius: 90px !important;float:left !important;" class="btn curvyuptop push_button3" id="depositbuttonwallet" onClick="depositButtonWallet(user, 'HIVE')" title="Click here to begin a deposit to Hive.Loans"><i class="fas fa-sort-up"></i><br>Deposit</button><button type="button" style="float:right !important;font-size: larger; padding: 10px; line-height: 1vh; background: #000; color: white; width: 10%;border-radius:5px; border-bottom-left-radius: 90px !important; border-bottom-right-radius: 90px !important;" class="btn curvyuptop push_button3" id="withdrawhiveshithere" onClick="withdrawButtonWallet(user, 'HIVE')" title="Click here to begin a Withdraw from Hive.Loans">Withdraw<br><i class="fas fa-sort-down"></i></button></td><td><button type="button" style="font-size: larger; padding: 10px; line-height: 1vh; background: #000; color: white; width: 10%;border-radius:5px; border-bottom-left-radius: 90px !important; border-bottom-right-radius: 90px !important;float:left !important;" class="btn push_button3" id="withdrawhbdshithere" onClick="withdrawButtonWallet(user, 'HBD')" title="Click here to begin a Withdraw from Hive.Loans">Withdraw<br><i class="fas fa-sort-down"></i></button><button type="button" style="font-size: larger; padding: 10px; line-height: 1vh; background: #000; color: white; width: 10%;border-radius:5px;float:right !important; border-top-left-radius: 90px !important; border-top-right-radius: 90px !important;" class="btn push_button3" id="depositbuttonhbdwallet" onClick="depositButtonWallet(user, 'HBD')" title="Click here to begin a deposit to Hive.Loans"><i class="fas fa-sort-up"></i><br>Deposit</button></td></tr><tr><td><input id="userouthivebalance" style="background: white;color: black;text-align: center;width: 9vw;height: 3vh;font-size: large; border-radius:10px;" readonly></td><td><input id="userouthbdbalance" style="background: white;color: black;text-align: center;width: 9vw;height: 3vh;font-size: large; border-radius:10px;"  readonly></td></tr><tr><td>@${user} HIVE Wallet</td><td>@${user} HBD Wallet</td></tr></tbody></table></center><center><h4>Manual Deposit Information<br><sub>Include the Address and Memo below in your Transfer</sub></h4>Address:<br><input type="text" id="depositName"  title="click to copy to clipboard" onmouseover="this.select()" onclick="copyStringToClipboard(this.value)" style="background: white;color: black;text-align: center;width: 9vw;height: 3vh;font-size: large; border-radius:10px;" readonly><br>Memo:<br><input type="text" id="depositMemo" style="background: white;color: black;text-align: center;width: 80%;height: 3vh;font-size: large; border-radius:10px;" title="click to copy to clipboard" onmouseover="this.select()" onclick="copyStringToClipboard(this.value)" onload="$(this.val(uAddress))" readonly><hr><a href="#" style="text-decoration:none !important;color:white !important;" onClick="showWalletHistory();"></sub>click here to view your wallet history</sub></a></center>`;
//<span id="sendPopup" onClick="sendPopup();"><button class="btn">Deposit</button></span>
//<span id="withdrawPopup" onClick="withdrawPopup($('#username').val());"><button class="btn">Withdraw</button></span>
  await hive.api.getAccounts([user], async function(err, result) {
    if(err){ console.log(err)}
    if(result){
      resultData = result;
      resultData = resultData[0];
      console.log(resultData);
      statsBalTop = resultData.balance;
      statsHBDBal = resultData.hbd_balance;
      await $("#jumbotron").promise().done(function(){
          $("#jumbotron").html(moverAddon + walletContent);
          $("#jumbotron").css({'height':'auto','width':'25%'});
          $("#jumbotron").center();
          $("#jumbotron").fadeIn();
          //$("#userhivebalance").html((uHIVEbalance / 1000 ).toFixed(3) + " HIVE");
          //$("#userhivebalance").val((uHIVEbalance / 1000).toFixed(3) + " HIVE");
          //$("#userhbdbalance").html((uHBDbalance / 1000).toFixed(3) + " HBD");
          //$("#userhbdbalance").val((uHBDbalance / 1000).toFixed(3) + " HBD");
          $("#userouthivebalance").html(statsBalTop);
          $("#userouthivebalance").val(statsBalTop);
          $("#userouthbdbalance").html(resultData.hbd_balance);
          $("#userouthbdbalance").val(resultData.hbd_balance);
          $("#useraddress").html(result.address);
          $("#depositName").html('hive.loans');
          $("#depositName").val('hive.loans');
          $("#depositMemo").html(uAddress);
          $("#depositMemo").val(uAddress);
            getUserData();
          //$("#userouthivebalance").html(`${statsBalTop}`);
          //$("#userouthbdbalance").html(`${statsHBDBal}`);
      });

    }
  })


}

async function showProfile() {
  loadingjumbo();
  var userDelegations = []
  var total_vesting_shares;
  var total_vesting_fund;

  await hive.api.getDynamicGlobalProperties(function(err, result) {
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
      $("#recoverAcct").html(`<b>Recovery Account</b>:<br><span id="recName">${recoverAcct}</span><br>`);
      $("#profileRecoverAcct").html(`<span id="precacct">${recoverAcct}</span>`);
      $("#showRecAcct").html(`@${recoverAcct}`);
      $("#hivePowerHeld").html(`<b>HIVE Power</b>:<br>${toThree(hiveVested)}<br>`);
      $("#loansHPdisplay").html(`<span id="hplevel">${toThree(hiveVested)}</span> HP<br>`);
      $("#urank").html(`${$('#userrank').val()}`);
      loanMax = parseFloat(hiveVested * 0.7);
      if(recoverAcct !== 'hive.loans' && recoverAcct !== 'anonsteem' && recoverAcct !== 'beeanon' && recoverAcct !== 'blocktrades') {
        $("#recName").css({"color":"red"});
        $("#precacct").css({"color":"red"});
        $("#prawarn").css({"color":"red"});
        $("#showRecAcct").css({"color":"red"});
        $("#prawarn").html(`❌ Incompatible Recovery Account! <b><a href="#" id="changeRecoveryAcct" style="color:white !important; text-decoration:none !important;" onClick="showRecoveryPanel();">Change Recovery Account</a></b>`);
        $("#recAlert").html(`<sub><b style="color:red;">Recovery Account Invalid!</b><br>Please set @hive.loans as recovery account!<br><br>Click here to change recovery account<br><sub>( This will take 30 days to complete )</sub></sub>`);
      } else {
        $("#recName").css({"color":"lawngreen"});
        $("#precacct").css({"color":"lawngreen"});
        $("#prawarn").css({"color":"white"});
        $("#showRecAcct").css({"color":"lawngreen"});
        $("#prawarn").html(`✔️`);
        $("#recAlert").html(`<sub><b style="color:black;">Recovery Account Valid!</b><br>You're ready to borrow! Remember to follow the site guidelines while lending.<br><sub>( Attempts to cheat the system have fees )</sub></sub>`);
      }
    }
  });

/*
  await hive.api.getAccounts([user], async function(err, result) {

  })
*/

  await hive.api.getWithdrawRoutes(`"${user}"`, 1, function(err, data) {
  	console.log(err, data);
  });




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

  let profileContent = `<center><h3 class="pagehead"  style="color:white !important;">Profile & Settings</h3></center>` +
  `Information about your account as well as various settings and options to customize your experience on the Hive.Loans Application.<hr>` +
  `Username: <a href="https://peakd.com/@${user}" title="click here to view account in a new tab" target="_blank" style="text-decoration:none !important; color:white !important;">@${user} <i class="fas fa-external-link-square-alt"></i></a><br><br>` +
  `Status: Active<br><br>` +
  `Rank: <span id="urank">User</span><br><br>` +
  `Level: 1 - noob<br><br>` +
  `XP: 1 / 1000<br><br>` +
  //`HIVE Account Balances: <span id="statsBalTop"></span><br><br>`+
  `HIVE Power: ${hiveVested.toFixed(3)} HIVE<br><br>` +
  `Recovery Account: <span id="profileRecoverAcct">Loading</span> <span id="prawarn"></span><br><br>` +
  `Last Login: Unknown<br><br>` +
  `Active Delegations:<br>`+
  `<span id="delegationShow"></span><br>`+
  `<br><br>`+
  `<hr>`+
  `Show Chatroom on Login?<br>`;
  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
      $("#jumbotron").html(moverAddon + profileContent);
      $('#delegationShow').html(userDelegations);
      $('#urank').val($('#userrank').val());
      $("#jumbotron").css({'height':'90%','width':'25%'});
      $("#jumbotron").center();
        //getAcct();
      $("#jumbotron").fadeIn();
  });
}



async function showRecoveryPanel() {
  loadingjumbo();
  let newRecAcctVar = '';
  let newRecAcctVarlink;
  let recoveryContent = `<center><h3 class="pagehead" style="color:white !important;">Change HIVE Recovery Account</h3></center>` +
  `<center>Current Recovery Account:<br><b><span id="showRecAcct"></span></b></center><br>`+
  `In order to borrow on Hive.Loans your recovery account must be set to an account featured on the Accepted Recovery Accounts list below:<br>` +
  `<br><center><b>Accepted Recovery Accounts:</b><br><br>`+
  `@hive.loans<br><sub><b>preferred</b> recovery account, enables automated key recovery</sub><br><br>@blocktrades<br><sub>a long time trusted HIVE witness and exchange operator</sub><br><br>@beeanon<br><sub>an anonymous account creator by @someguy123</sub><br><br>@someguy123<br><sub>trustworthy long time HIVE witness</sub><br><br>@anonsteem<br><sub>an anonymous account creator by @someguy123</sub></center><br><br>` +
  `<br><center><input type="text" id="recoveryAcctInput" style="background: white;color: black;text-align: center;width: 15vw;height: 3vh;font-size: large; border-radius:10px;" placeholder="enter name of new recovery account" onkeyup="return newRecAcctVar = $('#recoveryAcctInput').val();"><br><sub>( enter your new recovery account above without the @ )</sub><br>` +
  `<button type="button" style="font-size: small; padding: 10px; line-height: 1vh; background: #000; color: white; width: 40%;border-radius:5px;" class="btn push_button2" id="setRecoverAccountButton" onClick=" newRecAcctVarlink = 'https://hivesigner.com/sign/change_recovery_account?new_recovery_account=' + newRecAcctVar; window.open(newRecAcctVarlink);" title="Click here to set Recovery Account">Set Recovery Account</button></center><br><br>` +
  `<span style="font-size: smaller;"><i class="fas fa-exclamation-triangle sexyblackoutline" style="color:yellow;"></i> <b>NOTE</b>: To maintain the security necessary to provide automated lending and borrowing, it will take 30 days from the time of changing your recovery account to one listed above for the system to allow you to borrow. Any attempts to change your recovery account while actively borrowing will result in your account being locked down for the remainder of your loan repayment, and a 10% loan tampering fee will be added to your repayment total.`;
  //`<br>By setting the @hive.loans account as your recovery account you'll gain access to automated account recovery offered here under the "Tools" page. As for handling of account recovery if you've selected any of the other Featured Recovery Accounts you'll have to look up their account recovery handling methods.</span><br><br>`;

  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
      $("#jumbotron").html(moverAddon + recoveryContent);
      $("#jumbotron").css({'height':'85%','width':'25%'});
      getAcct();
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
  });
}

/*

index

<div class="container pt-3">
    <h1 class="text-center mb-5">Hive Account Recovery</h1>
    <hr>

    <div class="row">
        <div class="col-md-4 text-center">
            <a href="recover-account.html" class="box blue">
                Recover Account
            </a>
            <p>If you need to recover access to a lost account click this box.</p>
        </div>
        <div class="col-md-4 text-center">
            <a href="request-recovery.html" class="box green">
                Request Recovery
            </a>
            <p>If you are trusty or recovery account of any other Hive account, this is for you.</p>
        </div>
        <div class="col-md-4 text-center">
            <a href="change-recovery.html" class="box red">
                Change Recovery Account
            </a>
            <p>If you want to change your account's recovery account checkout this page.</p>
        </div>
    </div>

    <hr>
    <p class="text-center">
        Brought to you by <a href="https://hive.blog/@reazuliqbal">@reazuliqbal</a>
    </p>
</div>
*/


/*
change-recovery.HTML

<div class="container pt-3">
       <a href="./">
           <h1 class="text-center">Hive Account Recovery</h1>
       </a>
       <hr>
       <h2 class="text-center mb-5">Change Recovery Account</h2>

       <div class="row">
           <div class="offset-md-2 col-md-8">
               <p class="text-muted">Each account lists another account as their recovery account. The recovery account
                   has the ability to create account_recovery_requests for the account to recover. An account can
                   change their recovery account at any time with a 30 day delay.</p>

               <div class="alert" id="alert-change-rec"></div>

               <form id="change-recovery-account" class="mt-5 mb-5">
                   <div class="form-group">
                       <label for="change-rec-atr">Account To Recover</label>
                       <input type="text" name="change-rec-atr" id="change-rec-atr" class="form-control"
                           autocomplete="no">
                       <p class="form-text text-muted">Hive username of account you are trying to change recovery
                           account.</p>
                   </div>

                   <div class="form-group">
                       <label for="change-rec-new">New Recovery Account</label>
                       <input type="text" name="change-rec-new" id="change-rec-new" class="form-control"
                           autocomplete="no">
                       <p class="form-text text-muted">Hive username of the new recovery account. <span
                               class="text-info">Be careful this account can request account recovery.</span></p>
                   </div>

                   <div class="form-group">
                       <label for="change-rec-pass" class="control-label">Master Password</label>
                       <input type="password" name="change-rec-pass" id="change-rec-pass" class="form-control">
                       <p class="form-text text-muted">MASTER PASSWORD of account to recover.</p>
                   </div>

                   <button class="btn btn-success btn-block">Change Account Recovery</button>
               </form>
           </div>
       </div>

       <hr>
       <p class="text-center">
           Brought to you by <a href="https://hive.blog/@reazuliqbal">@reazuliqbal</a>
       </p>
   </div>


*/

/*
recover-account.html
<div class="container pt-3">
  <a href="./">
    <h1 class="text-center">Hive Account Recovery</h1>
  </a>
  <hr>
  <h2 class="text-center mb-5">Recover Account</h2>

  <div class="row">
    <div class="offset-md-2 col-md-8">

      <form id="get-owner-key" method="post" class="mt-5 mb-5">
        <h4 class="mb-2">Step 1: Generate New Password</h4>

        <div class="alert" id="alert-get-owner-key"></div>

        <div class="form-group">
          <label for="atr" class="control-label">Account To Recover</label>
          <input type="text" name="atr" id="atr" class="form-control">
          <p class="form-text text-muted">Hive username of the account need recovery.</p>
        </div>

        <div class="form-group">
          <label for="new-password" class="control-label">New Password</label>
          <div class="input-group">
            <input type="text" name="new-password" id="new-password" class="form-control">
            <div class="input-group-append">
              <button class="btn btn-success" id="regen-password"><svg width="24" height="24"
                  xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd">
                  <path style="fill:#ffffff"
                    d="M7 9h-7v-7h1v5.2c1.853-4.237 6.083-7.2 11-7.2 6.623 0 12 5.377 12 12s-5.377 12-12 12c-6.286 0-11.45-4.844-11.959-11h1.004c.506 5.603 5.221 10 10.955 10 6.071 0 11-4.929 11-11s-4.929-11-11-11c-4.66 0-8.647 2.904-10.249 7h5.249v1z" />
                </svg></button>
            </div>
          </div>
          <p class="form-text text-muted">New PASSWORD for the account need recovery. <span
              class="text-info">Please save it somewhere safe before sending the PUBLIC OWNER KEY to
              the Trustee.</span></p>
        </div>

        <div class="form-group">
          <label for="public-owner-key" class="control-label">New Public Owner Key</label>
          <input type="text" name="public-owner-key" id="public-owner-key" class="form-control" readonly>
          <p class="form-text text-muted">PUBLIC OWNER KEY generated using username and password. Please
            check if the username is correct and backup the password and send it to the Trustee account.
          </p>
        </div>

        <button class="btn btn-success btn-block">Get Owner Key</button>
      </form>

      <hr>
      <h4>Step 2: Send PUBLIC OWNER KEY to the Trustee</h4>
      <hr>

      <form id="recover-account" method="POST" class="mt-5 mb-5">
        <h4 class="mb-2">Step 3: Recover Account</h4>

        <div class="alert" id="alert-recover-account"></div>

        <div class="form-group">
          <label for="user-atr">Account To Recover</label>
          <input type="text" name="user-atr" id="user-atr" class="form-control">
          <p class="form-text text-muted">Hive username of the account need recovery and a request
            already been placed by the recovery account.</p>
        </div>

        <div class="form-group">
          <label for="user-new-pass" class="control-label">New Password</label>
          <input type="password" name="user-new-pass" id="user-new-pass" class="form-control">
          <p class="form-text text-muted">New PASSWORD that you have generated when generating PUBLIC
            OWNER KEY.</p>
        </div>

        <div class="form-group">
          <label for="user-old-pass" class="control-label">Recent Password</label>
          <input type="password" name="user-old-pass" id="user-old-pass" class="form-control">
          <p class="form-text text-muted">Recent PASSWORD of the account but must not be older than 30
            days.</p>
        </div>

        <button class="btn btn-success btn-block">Recover Account</button>
      </form>
    </div>
  </div>

  <hr>
  <p class="text-center">
    Brought to you by <a href="https://hive.blog/@reazuliqbal">@reazuliqbal</a>
  </p>
</div>

*/

/*
request-recovery.html

<div class="container pt-3">
		<a href="./">
			<h1 class="text-center">Hive Account Recovery</h1>
		</a>
		<hr>
		<h2 class="text-center mb-5">Request Recovery</h2>

		<div class="row">
			<div class="offset-md-2 col-md-8">

				<form id="create-recovery-request" class="mt-5 mb-5" method="POST">
					<div class="alert" id="alert-create-recovery"></div>

					<div class="form-group">
						<label for="trustee-atr" class="control-label">Account To Recover</label>
						<input type="text" name="trustee-atr" id="trustee-atr" class="form-control" autocomplete="no"
							required>
						<p class="form-text text-muted">Hive username of the account need recovery.</p>
					</div>

					<div class="form-group">
						<label for="atr-new-key" class="control-label">New Public Owner Key</label>
						<input type="text" name="atr-new-key" id="atr-new-key" class="form-control" autocomplete="no"
							required>
						<p class="form-text text-muted">PUBLIC OWNER KEY for the account need recovery provided by the
							real owner of the account.</p>
					</div>

					<div class="form-group">
						<label for="trustee-account" class="control-label">Trustee Account</label>
						<input type="text" name="trustee-account" id="trustee-account" class="form-control" required>
						<p class="form-text text-muted">Hive username of the trustee account (recovery account).</p>
					</div>

					<div class="form-group">
						<label for="trustee-key" class="control-label">Active Private Key</label>
						<input type="password" name="trustee-key" id="trustee-key" class="form-control">
						<p class="form-text text-muted">PRIVATE ACTIVE KEY of the trustee account (recovery account).
							<strong>Leave it blank to use Hive Keychain.</strong>
						</p>
					</div>

					<button class="btn btn-success btn-block">Submit Recovery Request</button>
				</form>
			</div>
		</div>

		<hr>
		<p class="text-center">
			Brought to you by <a href="https://hive.blog/@reazuliqbal">@reazuliqbal</a>
		</p>
	</div>

*/

async function showAcctRecoverPanel() {
  loadingjumbo();
  let newRecAcctVar = '';
  let newRecAcctVarlink;
  let recoveryContent = `<center><h3 class="pagehead" style="color:white !important;">Change HIVE Recovery Account</h3></center>` +
  `<center>Current Recovery Account:<br><b><span id="showRecAcct"></span></b></center><br>`+
  `In order to borrow on Hive.Loans your recovery account must be set to an account featured on the Accepted Recovery Accounts list below:<br>` +
  `<br><center><b>Accepted Recovery Accounts:</b><br><br>`+
  `@hive.loans<br><sub><b>Preferred</b> recovery account, enables automated key recovery</sub><br><br>@beeanon<br><sub>an anonymous account creator by @someguy123</sub><br><br>@someguy123<br><sub>trustworthy long time HIVE witness</sub><br><br>@anonsteem<br><sub>an anonymous account creator by @someguy123</sub></center><br><br>` +
  `<br><center><input type="text" id="recoveryAcctInput" style="background: white;color: black;text-align: center;width: 15vw;height: 3vh;font-size: large; border-radius:10px;" placeholder="enter name of new recovery account" onkeyup="return newRecAcctVar = $('#recoveryAcctInput').val();"><br><sub>( enter your new recovery account above without the @ )</sub><br>` +
  `<button type="button" style="font-size: small; padding: 10px; line-height: 1vh; background: #000; color: white; width: 40%;border-radius:5px;" class="btn push_button2" id="setRecoverAccountButton" onClick=" newRecAcctVarlink = 'https://hivesigner.com/sign/change_recovery_account?new_recovery_account=' + newRecAcctVar; window.open(newRecAcctVarlink);" title="Click here to set Recovery Account">Set Recovery Account</button></center><br><br>` +
  `<span style="font-size: smaller;"><i class="fas fa-exclamation-triangle sexyblackoutline" style="color:yellow;"></i> <b>NOTE</b>: To maintain the security necessary to provide automated lending and borrowing, it will take 30 days from the time of changing your recovery account to one listed above for the system to allow you to borrow. Any attempts to change your recovery account while actively borrowing will result in your account being locked down for the remainder of your loan repayment, and a 10% loan tampering fee will be added to your repayment total.<br>` +
  `<br>By setting the @hive.loans account as your recovery account you'll gain access to automated account recovery offered here under the "Tools" page. As for handling of account recovery if you've selected any of the other Accepted Recovery Accounts you'll have to look up their account recovery handling methods.</span><br><br>`;

  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
      $("#jumbotron").html(moverAddon + recoveryContent);
      $("#jumbotron").css({'height':'85%','width':'25%'});
      getAcct();
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
  });
}

/*
`<b>Borrowers accounts must hold atleast 130% of the loans worth</b><br><br>When a Borrower selects an available loan contract their account is turned over to the Hive.Loans service and the account keys are changed.<br>At this point the Borrowing account is granted new posting and active keys allowing them to still utilize the account.<br>` +
`Our system now effectively owns the borrowers account and uses the keys to automate weekly payouts to the lender until the loan is paid back in full plus interest<br>` +
`All keys will be return to the borrower upon completion of the loan so they may take ownership of their account back.<br>`+
*/
 async function showLend() {
  loadingjumbo();
  openLendingTab();
  let lendingContent = `<center><h3 class="pagehead" style="color:white !important;">Lending Contract Overview Console</h3>` +
  `<b>Put your crypto holdings to work for you and lend out your HIVE or HBD (Hive Backed Dollars) supplying capital to the lending pool</b><br>` +
  `Supply low to mid duration loans with interest rates of your choice and get a guaranteed automated repayment every week from the borrower<br>` +
  `When a borrower accepts a loan the Hive.Loans service requires them to hand over their account keys as collateral for access to the loan.<br><br>` +
  //`Your Current Hive.Loans Account Balance:<br><span id="lendingBalance"></span>` +
  `<h3 style="color:white !important;"><b>Create New Lending Contract:</b></h3>` +
  `<table><tbody><tr><td><b>Amount of HIVE to Lend:</b><br><input type="number" onkeyup="$('#newamount').val(this.value); createLoanPreview();" onkeypress="isNumberKey(this)" class="casperInput" id="newLendAmount" min="1" step="1" placeholder="100" required></td>`+
  `<td><b>Duration of Contract:</b> (in days)<br><input type="number" onkeyup="$('#newdays').val(this.value); createLoanPreview();" onkeypress="isNumberKey(this);" onkeyup"isNearSeven($(this).val());" class="casperInput" id="newLendDays" min="7" max="91" step="7" list="defaultNumbers" placeholder="7 to 91" required> <datalist id="defaultNumbers"> <option value="7"> <option value="14"> <option value="21"> <option value="28"> <option value="35"> <option value="42"> <option value="49"> <option value="56"> <option value="63"> <option value="70"> <option value="77"> <option value="84"> <option value="91"> </datalist></td>`+
  `<td><b>Interest Rate:</b> (in percentage %)<br><input type="number" onkeyup="$('#newfee').val(this.value); createLoanPreview();" id="newLendFee" class="casperInput"  min="10" max="30" step="1" placeholder="10 to 30" required></td>` +
  `<td><button type="button" style="font-size: larger; padding: 10px; line-height: 1vh; background: #000; color: white; width: 20%;border-radius:5px;" class="btn push_button3 createLoanButton1" id="createNewLend" onClick="derp();" title="Click here to create a new lending contract">Create <i class="fas fa-fw fa-vote-yea" style="color:lawngreen;"></i></button></td></tr></tbody></table><br>` +
  `<span id="createLoanPreview"></span><br><hr>`+
  `<h4><b>Your HIVE Lending Contracts</b></h4><br><span id="activeLendView"></span><table id="header-fixed"></table><br><br>`+
  //`<table style="align-items: center !important; padding: 0px; margin: 0px; width: 100%;"><tbody><tr><td><h4><b>Active HIVE Lending Contracts</b></h4></td><td><h4><b>Completed HIVE Lending Contracts</b></h4></td></tr><tr><td><span id="activeLendView" class=""></span><table id="header-fixed"></table></td><td><div id="oldLendView">Loading Completed HIVE Lending Contracts</div></td></tr></tbody></table>`+
  `</center>`;
  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
      $("#jumbotron").html(moverAddon + lendingContent);
      $("#jumbotron").css({'height':'85%','width':'60%'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
  });
}

var loanMax;

async function showLoans() {
  loadingjumbo();
  openAllLoansTab();
  var lendMax;
    var hpFloat;
  let borrowContent = `<center><h3 class="pagehead"  style="color:white !important;">Loans Contract Pool Overview</h3>` +
  `<b>Leverage your HIVE account as collateral and get liquid HIVE into your Hive.Loans Account in less than 30 seconds!</b><br>` +
  `If your account is cleared to accept Lending Contracts you may pick a loan offer below by clicking "Accept Loan" beside the entry you choose.<br>` +
  `Be aware that at this time you may only have 1 loan contract accepted and you'll not be able to cancel the contract until full repayment is complete<br><br>` +
  `<table style="text-align: center; width: 90%;"><tbody><tr><td><b>Your Current HIVE Power Level:</b><br><span id="loansHPdisplay"></span></td><td><b>Maximum HIVE Loan Allowed:</b><br><b><span id="loanMax" value=""></span> HIVE</b></td></tr></tbody></table><br>`+
  `<h4><b>Available HIVE Loan Contracts</b></h4><br><span id="loadAllLoans"></span><table id="header-fixed"></table><br><br>`+
  `<br></center>`;
  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
      $("#jumbotron").html(moverAddon + borrowContent);
      $("#jumbotron").css({'height':'85%','width':'60%'});
      $("#jumbotron").center();
        getAcct();
        console.log(loanMax);
        loanMax = Math.floor(loanMax);
      $('span#loanMax').val(`${loanMax.toFixed(3)}`);
      $('span#loanMax').html(`${loanMax.toFixed(3)}`);
      $("#jumbotron").fadeIn();
  });
}

async function showFaq() {
  loadingjumbo();
  getFounders();
  let faqContent = `<center><h3 class="pagehead" style="color:white !important;">Frequently Asked Questions</h3>` +
  `This is an unfinished DEMO of the Hive.Loans project and is in no way meant to represent the launch version<br>` +
  `Many feautures may be broken, bugged, unstable or just straight up missing. It's advised to not use this version<br>` +
  `Hive.Loans will allow users to create lending contracts loaning out their liquid HIVE against the colalteral of an account<br>` +
  `This site is scheduled for release on or before the 15th of April 2021 if all goes well in development.<br>` +
  `<br>` +
  `The <span id="foundercount"></span> Users who Voted in Support of Proposal #154 (⚡ Founder Rank):<br><sup>( Founders get 50% off of fees site wide )</sup></center><h5><span id="founderslist"></span></h5><br>` +
  `<br>` +
  `<center>The <span id="backercount"></span> Users who Pledged HIVE or HBD Developement Capital Directly (💸 Backer Rank):<br><sup>( Backers get an enhanced interest rate cap of 35% )</sup><h5><span id="backerslist"></span></h5></center><br>` +
  `<br>` +
  `<center>The Ultra Exclusive One-of-a-Kind Project Benefactor (💰 Benefactor Rank):<br><sup>( The Backer in top spot at the end of the timer becomes Benefactor! )<br>( Get a monthly payment of 10% of the service revenue! )</sup><h5><span id="benefactorlist">@???????</span></h5></center><br>` +
  `<br>`;
  var backersnames = '';
  backerlist.forEach((item, i) => {
    backersnames += `&nbsp;<a href="https://peakd.com/@${item}" style="text-decoration:none !important; color:white;font-size:larger;">@${item}</a>&nbsp;`;
  });

  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
      $("#jumbotron").html(moverAddon + faqContent);
      console.log(foundercount)
      console.log(founderlist)
      $('#founderslist').html(founderlist);
      $('#foundercount').html(foundercount);
      $('#backerslist').html(backersnames);
      $("#jumbotron").css({'height':'85%','width':'60%'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
  });
}

async function showTools() {
  loadingjumbo();
  let toolsContent = `<center><h3 class="pagehead" style="color:white !important;">HIVE Account Tools & Resources</h3>` +
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
      $("#jumbotron").html(moverAddon + toolsContent);
      $("#jumbotron").css({'height':'85%','width':'25%'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
  });
}

async function showLogin() {
alert(`!!! UNSTABLE DEVELOPMENT VERSION WARNING !!!\n\nThis is an UNFINISHED / UNTESTED application that contains functions which have the potential to transfer balances unexpectedly and may potentially do operations related to account ownership without warnings. This live site demo in no way represents the a finalized version of this application and is best avoided if we're to be transparent about this matter.\n\n This is to be treated as a demo only!\n\nTHIS IS AN UNFINISHED ALPHA VERSION\n\nBy continuing forward your entirely on your own! Hive.Loans and it's owners hold no liability if you choose to continue forwards from the point of this warning.`)
  loadingjumbo();
  let loginContent = `<center style="font-weight: 600;"><h3 class="pagehead" style="color:white;">HIVE Account Identity Verification</h3>` + //Accessing Hive.Loans Requires a Quick
  `<b id="acctflash1">To Access this Service Specify an Account Below:</b><br>` + //o Login or Register Type a HIVE Account Below
  `<br><input type="text" id="usernameinput" style="background: white;color: black;text-align: center;width: 15vw;height: 3vh;font-size: large; border-radius:10px;" value="klye" ><br>` +
  `<span id="loginfuckery"></span>`+
  `<a href="#" onClick="$('#2fa').removeClass('hidden'); $(this).hide();" style="color:white !important;text-decoration: none !important;"><sub>Click here if you have 2FA enabled</a></sub>` +
  `<br><input type='text' style="background: white;color: black;text-align: center;width: 9vw;height: 3vh;font-size: large; border-radius:10px;" class="hidden" placeholder="2FA Code Here" id='2fa'>` +
  `<br>Please Choose a Verification Method:<br>` +
  `<center><table><tbody><tr><td style="float: right; width: 45% !important;"><button type="button" style=" font-size: large; padding: 3px; line-height: 1vh; background: #000; color: white; width:55% !important;border-radius:5px; min-width: 8vw !important;" class="btn push_button2" id="skclogologin" onclick="skcusersocket($('#usernameinput').val());" title="Click here to verify identify with Hive KeyChain"><img src="/img/keychaintext.png" class="keychainlogo" style="width:80%"></button></td>` +
  `<td style="float: left; width: 45% !important;"><button type="button" style="font-size: large;padding: 0;line-height: 1vh;background: #000;color: white;width:55% !important;border-radius:5px;min-width: 8vw !important;" class="btn push_button2" id="login" onclick="login();" title="Click here to verify identify with Hive KeyChain"><img src="/img/hivesigner.svg" class="hivesignerlogo" style="width:100%"></button></td></tr></tbody></table></center>`+
  `<hr>HiveSigner and Keychain verification methods are the two currently accepted methods of verifying a HIVE identity<br>`+
  `<br>We will never ask for government ID documents or comply<br>with any KYC record keeping compliance, ever, period.<br><br>`+
  `By Using this site in you Agree to our <a href="#" style="text-decoration: none !important;color:white !important;">Terms of Service</a>`+
  `<br><sub style="position: absolute; bottom: 0; width: 100%; left: 0; text-shadow: none !important; color: black;">Our hosting is provided by an extremely privacy savvy company <a style="color:white !important;" class="sexyblackoutline" href="https://pay.privex.io/order?r=klye"><b><u>Privex.io</u></b> <img src="/img/privex.svg" style="bottom: 0;
    position: absolute;"></a></sub>`;

  $("#jumbotron").fadeOut('fast');
  $("#jumbotron").promise().done(function(){
      $("#jumbotron").html(loginContent);
      $("#jumbotron").css({'height':'55%','width':'20%'});
      $("#jumbotron").center();
      $("#jumbotron").fadeIn();
  });
}

async function showWalletHistory () {
  console.log(`showWalletHistory fired!`)
  $('#userpanel').removeClass('hidden');
        $("#userpanel").css({'height':'40%','width':'40%','top':'50%','left':'50%'});
  $('#panelName').val('Wallet History');
  $('#panelName').html('Wallet History');
  $("#panelContent").html(`Please Wait While Wallet History Query Completes`);
  $('#userpanel').fadeIn();
}
