/****************************************************************************
* On document load
***************************************************************************/
let userLocalCheck = window.localStorage.getItem("user");
let tokenLocalcheck = window.localStorage.getItem("token");
$(document).ready(function() {
  try {
    userLocalCheck = window.localStorage.getItem("user");
    tokenLocalcheck = window.localStorage.getItem("token");
  } catch (e){
    console.log(`Couldn't get user or token`);
  }
});

/****************************************************************************
* Mouse actions
***************************************************************************/
/*Active button stay down hack */
jQuery('push_button2').click(function(){
   jQuery(this).toggleClass('push_button2:active');
});

//Login button function 2FA needs to be implemented..?
/*
$("#login").on('click',function(){
  console.log(`Logging in?`);
  if (typeof userLocalCheck != undefined) {
      showSuccess(`${userLocalCheck} Account Found!`);
      socket.emit("loginopen", {username: userLocalCheck},function(err, data){
        if (err) return showErr(err);
        showSuccess(data);
      });
  }
});
*/

window.onload = function() {
  $("#username").focus();
};

//Logout button
$("#logout").on('click',function(){
	socket.close();
  socket.open();
});



$("#betOdds").keyup(function (e) {
	if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57 ) ) {
      return false;
  }
 //if the letter is not digit then display error and don't type anything *** Line 17 is giving us some problems for sure...
  if ((($("#betOdds").val()<=99) && ($("#betOdds").val()>0.01)) || $("#betOdds").val()!==""){
		$("#multiplier").val(round(99/$("#betOdds").val(),8));
		$("#toWin").val(floor($("#betAmount").val()*($("#multiplier").val()*1),8));
		$("#hiNum").text("> " + ceil((99.9999-$("#betOdds").val()),4));
		$("#loNum").text("< " + round(($("#betOdds").val()),4));
  }else{
		$("#hiNum").text("> " + ceil((99.9999-$("#betOdds").val()),4));
		$("#loNum").text("< " + round(($("#betOdds").val()),4));
		$("#toWin").val("0");
	}
});

$('.maxWager').click(function(e){
	if ($('#sound').hasClass("soundon")){
		clicksound.play();
	}
	var yolobet = $("#balance").val();
	showErr('<i class="fa fa-2x far-2x fa-exclamation-circle" style="color:red;float:left;margin-top:-1%;"></i> Warning: Betting it All!');
	var yoloAnim = new CountUp("betAmount", $("#betAmount").val(), $("#balance").val(), 8, .1, options);
  yoloAnim.start(updatebet($("#betAmount"), yolobet));
});
var updatebet = function(el, amount){
  el.val(amount).keyup();
}

$('.minChance').click(function(e){
	if ($('#sound').hasClass("soundon")){
		clicksound.play();
	}

	showErr('Warning: Low Chance');
	$("#betOdds").val(0.0001);
  if ((($("#betOdds").val()<=99) && ($("#betOdds").val()>0.01)) || $("#betOdds").val()!==""){
		$("#multiplier").val(round(99/$("#betOdds").val(),4));
		$("#toWin").val(floor($("#betAmount").val()*($("#multiplier").val()*1),8));
		$("#hiNum").text("> " + ceil((99.9999-$("#betOdds").val()),4));
		$("#loNum").text("< " + round(($("#betOdds").val()),4));
  }else{
		$("#betOdds").val(0.01);
	}
});

$('.halfChance').click(function(e){
	if ($('#sound').hasClass("soundon")){
		clicksound.play();
	}

  if ($("#betOdds").val()>=1.0001){
	$("#betOdds").val($("#betOdds").val() - 1);
  }else{
    $("#betOdds").val(0.0001),4;
    showErr("Chance Must Be >= 0.0001%");
  }


  if ((($("#betOdds").val()<=99) && ($("#betOdds").val()>0.01)) || $("#betOdds").val()!==""){
		$("#multiplier").val(round(99/$("#betOdds").val(),4));
		$("#toWin").val(floor($("#betAmount").val()*($("#multiplier").val()*1),8));
		$("#hiNum").text("> " + ceil((99.9999-$("#betOdds").val()),4));
		$("#loNum").text("< " + round(($("#betOdds").val()),4));
  }else{
	    $("#betOdds").val(0.0001);
  }
  });

$('.doubleChance').click(function(e){
		if ($('#sound').hasClass("soundon")){
		    clicksound.play();
		}

    if ($("#betOdds").val()<=98){
      $("#betOdds").val( function(i, oldval) {
        return ++oldval;
      });
    }else{
    	$("#betOdds").val(98.99);
      $("#toWin").val(floor($("#betAmount").val()*($("#multiplier").val()*0.00010101),8));
      showErr("Chance Must Be <= 98.99%");
    }


		if ((($("#betOdds").val()<=99) && ($("#betOdds").val()>0.0001)) || $("#betOdds").val()!==""){
  		$("#multiplier").val(round(99/$("#betOdds").val(),4));
  		$("#toWin").val(floor($("#betAmount").val()*($("#multiplier").val()*1),8));
  		$("#hiNum").text("> " + ceil((99.9999-$("#betOdds").val()),4));
  		$("#loNum").text("< " + round(($("#betOdds").val()),4));
    }else{
		  $("#betOdds").val(98.99);
	  }
});

$('.maxChance').click(function(e){
	if ($('#sound').hasClass("soundon")){
		clicksound.play();
	}
	$("#betOdds").val(98.99);
	if ((($("#betOdds").val()<=99) && ($("#betOdds").val()>0.0001)) || $("#betOdds").val()!==""){
		$("#multiplier").val(round(99/$("#betOdds").val(),4));
		$("#toWin").val(floor($("#betAmount").val()*($("#multiplier").val()*0.00010101),8));
		$("#hiNum").text("> " + ceil((99.9999 - $("#betOdds").val()),4));
		$("#loNum").text("< " + round(($("#betOdds").val()),4));
    }else{
		$("#toWin").val(0);
	}
});


$("#clearDebug").on('click',function (e) {
    $("#output").html('');
});

$("#invest").on('click',function(e){
  socket.emit('invest', {token: token, amount: parseInt($("#investamount").val()*100000000)}, function(err, data){
    if (err) return showErr(err);
    showSuccess("Invest Accepted");
  });
});

$('#investall').on('click', function(){
  var balancetoinvest = $("#balance").val();
  $('#investamount').val(balancetoinvest);
});

$("#divest").on('click',function(e){
  socket.emit('divest', {token: token, amount: parseInt($("#divestamount").val()*100000000)}, function(err,d){
    if (err) showErr(err);
  });
});

$("#divestall").on('click',function(e){
  $("#divestamount").val($("#invested").val());
  socket.emit('divest', {token: token, amount: parseInt($("#divestamount").val()*100000000)}, function(err,d){
    if (err) showErr(err);
  });
});

//All Bets Tab buttons
$("#allbetsTabbed").on('click', function(){

	 $("#globalbetsdefault").fadeOut('fast');
	 $("#globalbetsOn").fadeIn('fast');
	 //startallbets();
});

$("#tip").on('click',function(e){
  socket.emit('tip', {token: token, to: $("#tipto").val(), amount: parseInt($("#tipamount").val()*100000000)}, function(err, data){

    token = data.token;
    if (err) return showErr(err);
  });
});

//Chat input hotkey disabler - needs work still
$('#chatText.trollslot').click(function()  {
	if($('#hotkeyToggle').hasClass('on') && $('#hotkeyToggle').hasClass('enabled')) {
	$('#hotkeyToggle')[0].click();
			$('#hotkeyToggle').addClass('enabled');
	}
});

$('#chatText.trollslot').blur(function(){
	if($('#hotkeyToggle').hasClass('enabled')) {
	$('#hotkeyToggle')[0].click();
}});

$('#sound').click(function() {
		// on odd clicks do this
		if (!$('#sound').hasClass("soundon")) {
			$('#sound').html('<i class="fa fa-volume-up fa-2x" aria-hidden="true" style="padding-right:0px;"></i>');
			$('#sound').toggleClass("soundon");
      soundgen('440.0', 'triangle');
			//clicksound.play();
			showSuccess('<i class="fa fa-2x fag-2x fa-check-circle" style="color:lawngreen;float:left;margin-top:-1%;"></i> Sound Enabled').dismissOthers();
			var soundon = true;
		}	 else {
			$('#sound').html('<i class="fa fa-volume-off fa-2x" aria-hidden="true" style="padding-right:14px;"></i>');
			$('#sound').toggleClass("soundon");
			showErr('<i class="fa fa-2x far-2x fa-exclamation-circle" style="color:red;float:left;margin-top:-1%;"></i> Sound Disabled').dismissOthers();
			var soundon = false;
		}
});


$("#autoBetAmount").keyup( function (e) {
 //if the letter is not digit then display error and don't type anything
		$("#autoToWin").val(floor($("#autoBetAmount").val()*($("#autoMultiplier").val()-1),8));
});

$("#autoOdds").keyup(function (e) {
	if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57 ) ) {
        return false;
    }
 //if the letter is not digit then display error and don't type anything *** Line 17 is giving us some problems for sure...
    if ((($("#autoOdds").val()<=99) && ($("#autoOdds").val()>0.01)) || $("#autoOdds").val()!==""){
		    $("#autoMultiplier").val(round(99/$("#autoOdds").val(),10));
    }
    		$("#autoToWin").val(floor($("#autoBetAmount").val()*($("#autoMultiplier").val()-1),8));
});

$("#autoMultiplier").keyup(function (e) {
	$("#autoOdds").val((99/$("#autoMultiplier").val()).toFixed(4));
  $("#autoToWin").val(floor($("#autoBetAmount").val()*($("#autoMultiplier").val()-1),8));

});
$("#autoToWin").keyup(function (e) {
	$("#autoBetAmount").val(ceil($("#autoToWin").val()/($("#autoMultiplier").val()-1),8));
});
$("#setAutoLo").on('click',function(){
  $("#autoBetType").val("lo");
});

$("#betAmount").keyup( function (e) {
 //if the letter is not digit then display error and don't type anything
    if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57 ) ) {
        return false;
    }
     $("#autoToWin").val($("#autoBetAmount").val()*$("#autoMultiplier").val()-$("#autoBetAmount").val());

});

function openLendingTab() {
    socket.emit('loadmyloans', {token: token});
}

function openAllLoansTab() {
    socket.emit('loadallloans', {token: token});
}

function derp() {
  createNewLendingContract(parseInt($("#newamount").val()), parseInt($("#newdays").val()), parseInt($("#newfee").val()), token);
}

function loginPush(username, token) {
  console.log(`loginPush(${username}, ${token})`);
  socket.emit('login', {
      username: username,
      password: token,
      '2fa': $('#2fa').val()
  }, function(err, data) {
    if(err)console.log(err);
    if(data){
      console.log(data);
    }
  })
}

$("#newLendAmount").change(function (e) {
 //if the letter is not digit then display error and don't type anything
    if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57 ) ) {
        return false;
    } else {
      if(parseFloat($("#newLendAmount").val()) < 0){
        $("#newLendAmount").val(0);
      }
    }
});

/*******************************************************************************************************************
* Key presses actions
*******************************************************************************************************************/

function getBackers() {
  socket.emit('getbackers', {data: 'lol'}, function(err, data){
    if(err){console.log(err)}
    if(data){
      data = data.deposits;
      console.log(data);
      $('.lendingtable').css({'width':'100%'})
      CreateTableFromJSON(data, 'backers', 'activeBackerView');
    }
  })
}


/*********************************************************************************
* CHAT
********************************************************************************/

var userMenu = function(el, data, msgid){

    var menutype = data.menu;
    var socketid = data.socketid;
    socket.emit("chatmenu", {
        username: data,
        socketid: socketid
    }, function(err, data) {
        if (err) {
            showErr("Something Messed Up!");
        }
        if (data) {
            //console.log(data);
            menutype = data.menu;
            user = data.user;
            source = data.source;
            uid = data.uid;
            messageid = data.messageid;
        }

        if (menutype === "admin") {

            menud = [
              {
                  name: '🔎Blog',
                  fun: function () {
                          getUserBlog(user)
                  }
              },
              {
                    name: '<b>💲Tip</b>',
                    fun: function() {
                        $("#tipbalance").val($("#balance").val());

                        bootbox.dialog({
                            message: '<center><span class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style=""><i class="fa fa-at fa-2x"></i></span>' +
                                '<b><input type="text" class="form-control" placeholder="User" aria-describedby="basic-addon1" id="tipto" style="" ></b><span class="input-group-addon addon-sexy" style="">User</span></span>' +
                                '<br><span class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style=""><b>Tip</b></span>' +
                                '<b><input type="number" class="form-control" placeholder="0.000" id="tipamount" aria-describedby="basic-addon1"></b>' +
                                '<span class="input-group-addon addon-sexy" style="padding:5px;"><img src="img/rhom.svg" class="modalLogo"></span></span>' +
                                "<script>var currencyLogo = $('img.dd-selected-image').attr('src');$('img.modalLogo').attr('src', currencyLogo);</script>",
                            title: `<center><b class="sexytitle">Rhom-Roller.com</b><br>Tip Some ${$('#currentCurrency').val().toUpperCase()} to Another User Instantly</center>`,
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
                                                token = data.token;
                                                return showErr("Tip Send Failed!");
                                            }
                                            //console.log(data);
                                            token = data.token; //token is always returned
                                                $("#balance").val((data.balance / 100000000).toFixed(8));
                                            showSuccess("Tip Sent!");
                                        });
                                    }
                                }
                            }
                        });
                        $("#tipto").val(user);
                    }
                },

                {
                    name: '<b>💬Message</b>',
                    fun: function() {
                        $("#chatText").val(`/msg ${user} `);
                        $("#chatText").focus();
                    }, //END fun:function

                },

                {
                    name: '<b>📊Stats</b>',
                    fun: function() {
                        userstatsDialogAdmin(data.user);
                    }
                },
                {
                    name: '<b>🗑️Delete</b>',
                    fun: function() {
                        //console.log("ADMIN MENU: DELETE " + user);
                        //console.log(`data`);
                        //console.log(data);

                        socket.emit('deletemsg', {
                            msgid: msgid,
                            token: token
                        }, function(err, data) {
                            if (err) {
                              token = data.token;
                                alertChatMessage({
                                    message: err,
                                    date: (new Date).toUTCString()
                                });
                            }
                            if (data) {
                                token = data.token;
                                showSuccess(`Chat Message Deleted`);
                            }

                        });
                    }
                },
                {
                    name: '<b>🔒Lock</b>',
                    fun: function() {
                        //console.log("ADMIN MENU: LOCK " + user);
                        //console.log(`data`);
                        //console.log(data);

                        socket.emit('lockuser', {
                            username: user,
                            token: token
                        }, function(err, data) {
                            if (err) {
                                token = data.token;
                                alertChatMessage({
                                    message: err,
                                    time: Date.now()
                                });
                            }
                            if (data) {
                              token = data.token;
                                //showSuccess(`${JSON.parse(data)}`);
                            }

                        });
                    }
                },
                {
                    name: '<b>🔓Unlock</b>',
                    fun: function() {
                        //console.log("ADMIN MENU: UNLOCK " + user);
                        //console.log(`data`);
                        //console.log(data);

                        socket.emit('unlockuser', {
                          username: user,
                          token: token
                        }, function(err, data) {
                            if (err) {
                              token = data.token;
                                alertChatMessage({
                                    message: err,
                                    time: Date.now()
                                });
                            }
                            if (data) {
                              token = data.token;
                                //showSuccess(`${JSON.parse(data)}`);
                            }

                        });
                    }
                },
                {
                    name: '<b>🔇Mute</b>',
                    fun: function() {
                        socket.emit('mute', {
                            username: user,
                            token: token
                        }, function(err, data) {
                            if (err) {
                              token = data.token;
                                alertChatMessage({
                                    message: err,
                                    date: (new Date).toUTCString()
                                });
                            }
                            if (data) {
                              token = data.token;
                                showSuccess(`User Muted!`);
                            }

                        });
                    }
                }, {
                    name: '<b>🔊Unmute</b>',
                    fun: function() {
                        socket.emit('unmute', {
                            username: user,
                            token: token
                        }, function(err, data) {
                            if (err) {
                              token = data.token;
                                alertChatMessage({
                                    message: err,
                                    date: (new Date).toUTCString()
                                });
                            }
                            if (data) {
                              token = data.token;
                                showSuccess(`User Unmuted`);
                            }

                        });
                    }
                },
                {
                    name: '<b>👞Kick</b>',
                    fun: function() {
                        console.log("ADMIN MENU: KICK " + user);
                        socket.emit('getSocketId', {
                            username: user,
                            token: token
                        }, function(err, data) {
                            if (err) {
                              token = data.token;
                                return showErr(err);
                            }
                            if (data) {
                              token = data.token;
                                var socketmsgid = data;
                                socket.emit('kickuser', {
                                    username: user,
                                    socketid: data.socketid,
                                    msg: "Admin Menu Kicked You!",
                                    token: token
                                }, function(err, data) {
                                    if (err) {
                                      token = data.token;
                                        console.log(err);
                                        return showErr("Unable to Find IP!").dismissOthers;
                                    }
                                    if (data) {
                                      token = data.token;
                                        var msg = data.msg;
                                        alertChatMessage({
                                            message: msg,
                                            date: (new Date).toUTCString()
                                        });
                                    }
                                });
                            }
                        });
                    }
                },
                {
                    name: '<b>⛔Ban</b>',
                    fun: function() {
                        console.log("ADMIN MENU: BAN " + user);
                        alertChatMessage({
                            message: "This Function isn't Implemented Yet!",
                            date: (new Date).toUTCString()
                        });
                    }
                },
                {
                    name: '<b>🌐IP</b>',
                    fun: function() {
                        console.log("ADMIN MENU: IP " + user);
                        socket.emit('getIP', {
                            username: user,
                            token: token
                        }, function(err, data) {
                            if (err) {
                              token = data.token;
                              return showErr(err);
                            }
                            if (data) {
                                token = data.token;
                                var userip = data.ip;
                                var username = data.username;
                                userip = ipParse(userip);
                                alertChatMessage({
                                    message: `${username}'s IP Address: ${userip}`,
                                    date: (new Date).toUTCString()
                                });
                            }
                        });
                    }
                },
                {
                    name: '<b>☂️RainBan</b>',
                    fun: function() {
                        socket.emit('rainban', {
                            user: user,
                            token: token
                        }, function(err, data) {
                            if (err) {
                              token = data.token;
                                showErr("RainBan Failed!");
                                return;
                            }
                            if(data){
                              token = data.token;
                              alertChatMessage({
                                  message: `User Given RainBan!`,
                                  date: (new Date).toUTCString()
                              });
                            }
                        });
                    }
                },
                {
                    name: '<b>☔RainAdd</b>',
                    fun: function() {
                        socket.emit('rainadd', {
                            user: user,
                            token: token
                        }, function(err, data) {
                            if (err) {
                                token = data.token;
                                showErr("RainAdd Failed!");
                                return;
                            }
                            if(data){
                              token = data.token;
                              alertChatMessage({
                                  message: `User Given RainAdd!`,
                                  date: (new Date).toUTCString()
                              });
                            }
                        });
                    }
                },
                {
                    name: '<b>🏆Promote</b>',
                    fun: function() {
                        socket.emit('promote', {
                            username: user,
                            token: token
                        }, function(err, data) {
                            if (err) {
                              token = data.token;
                              showErr("Promote User Failed!");
                            }
                            if (data) {
                              token = data.token;
                              showSuccess(data);
                            }
                        });
                    }
                },
                {
                    name: '<b>⬇Demote</b>',
                    fun: function() {
                        socket.emit('demote', {
                            username: user,
                            token: token
                        }, function(err, data) {
                            if (err) {
                                token = data.token;
                                showErr("Demote User Failed!");
                            }
                            if (data) {
                                token = data.token;
                                showSuccess(data);
                            }
                        });
                    }
                },
                {
                    name: '<b>🧊Freeze</b>',
                    fun: function() {
                        socket.emit('freeze', {
                            token: token
                        }, function(err, data) {
                            if (err) {
                                token = data.token;
                                showErr("Site Freeze Failed!");
                            }
                            if (data) {
                                token = data.token;
                                showSuccess(`Site is Frozen!`);
                            }
                        });
                    }
                },
                {
                    name: '<b>💦Unfreeze</b>',
                    fun: function() {
                        socket.emit('unfreeze', {
                            token: token
                        }, function(err, data) {
                            if (err) {
                                token = data.token;
                                showErr("Site Unfreeze Failed!");
                            }
                            if (data) {
                                token = data.token;
                                showSuccess(`Site is Unfrozen!`);
                            }
                        });
                    }
                }
            ];
        } else if (menutype === "moderator") {
            menud = [
              {
                  name: '🔎Blog',
                  fun: function () {
                          getUserBlog(user)
                  }
              },
              {
              name: '<b>💲Tip</b>',
              fun: function() {
                  $("#tipbalance").val($("#balance").val());

                  bootbox.dialog({
                      message: '<center><span class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style=""><i class="fa fa-at fa-2x"></i></span>' +
                          '<b><input type="text" class="form-control" placeholder="User" aria-describedby="basic-addon1" id="tipto" style="" ></b><span class="input-group-addon addon-sexy" style="">User</span></span>' +
                          '<br><span class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style=""><b>Tip</b></span>' +
                          '<b><input type="number" class="form-control" placeholder="0.000" id="tipamount" aria-describedby="basic-addon1"></b>' +
                          '<span class="input-group-addon addon-sexy" style="padding:5px;"><img src="img/rhom.svg" class="modalLogo"></span></span>' +
                          "<script>var currencyLogo = $('img.dd-selected-image').attr('src');$('img.modalLogo').attr('src', currencyLogo);</script>",
                      title: `<center><b class="sexytitle">Rhom-Roller.com</b><br>Tip Some ${$('#currentCurrency').val().toUpperCase()} to Another User Instantly</center>`,
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
                                          token = data.token;
                                          return showErr("Tip Send Failed!");
                                      }
                                      //console.log(data);
                                      token = data.token; //token is always returned
                                      $("#balance").val((data.balance / 100000000).toFixed(8));
                                      showSuccess("Tip Sent!");
                                  });
                              }
                          }
                      }
                  });
                  $("#tipto").val(user);
              }
          },

          {
              name: '<b>💬Message</b>',
              fun: function() {
                  $("#chatText").val(`/msg ${user} `);
                  $("#chatText").focus();
              }, //END fun:function

          },

          {
              name: '<b>📊Stats</b>',
              fun: function() {
                  userstatsDialogAdmin(data.user);
              }
          },
          {
              name: '<b>🗑️Delete</b>',
              fun: function() {
                  //console.log("ADMIN MENU: DELETE " + user);
                  //console.log(`data`);
                  //console.log(data);
                  socket.emit('deletemsg', {
                      msgid: msgid,
                      token: token
                  }, function(err, data) {
                      if (err) {
                        token = data.token;
                          alertChatMessage({
                              message: err,
                              date: (new Date).toUTCString()
                          });
                      }
                      if (data) {
                          token = data.token;
                          showSuccess(`Chat Message Deleted`);
                      }

                  });
              }
          },
          {
              name: '<b>🔒Lock</b>',
              fun: function() {
                  //console.log("ADMIN MENU: LOCK " + user);
                  //console.log(`data`);
                  //console.log(data);

                  socket.emit('lockuser', {
                      username: user,
                      token: token
                  }, function(err, data) {
                      if (err) {
                          token = data.token;
                          alertChatMessage({
                              message: err,
                              time: Date.now()
                          });
                      }
                      if (data) {
                        token = data.token;
                          //showSuccess(`${JSON.parse(data)}`);
                      }

                  });
              }
          },
          {
              name: '<b>🔓Unlock</b>',
              fun: function() {
                  //console.log("ADMIN MENU: UNLOCK " + user);
                  //console.log(`data`);
                  //console.log(data);

                  socket.emit('unlockuser', {
                    username: user,
                    token: token
                  }, function(err, data) {
                      if (err) {
                        token = data.token;
                          alertChatMessage({
                              message: err,
                              time: Date.now()
                          });
                      }
                      if (data) {
                        token = data.token;
                          //showSuccess(`${JSON.parse(data)}`);
                      }

                  });
              }
          },
          {
              name: '<b>🔇Mute</b>',
              fun: function() {
                  socket.emit('mute', {
                      username: user,
                      token: token
                  }, function(err, data) {
                      if (err) {
                        token = data.token;
                          alertChatMessage({
                              message: err,
                              date: (new Date).toUTCString()
                          });
                      }
                      if (data) {
                        token = data.token;
                          showSuccess(`User Muted!`);
                      }

                  });
              }
          }, {
              name: '<b>🔊Unmute</b>',
              fun: function() {
                  socket.emit('unmute', {
                      username: user,
                      token: token
                  }, function(err, data) {
                      if (err) {
                        token = data.token;
                          alertChatMessage({
                              message: err,
                              date: (new Date).toUTCString()
                          });
                      }
                      if (data) {
                        token = data.token;
                          showSuccess(`User Unmuted`);
                      }

                  });
              }
          },
          {
              name: '<b>👞Kick</b>',
              fun: function() {
                  console.log("ADMIN MENU: KICK " + user);
                  socket.emit('getSocketId', {
                      username: user,
                      token: token
                  }, function(err, data) {
                      if (err) {
                        token = data.token;
                          return showErr(err);
                      }
                      if (data) {
                        token = data.token;
                          var socketmsgid = data;
                          socket.emit('kickuser', {
                              username: user,
                              socketid: data.socketid,
                              msg: "Admin Menu Kicked You!",
                              token: token
                          }, function(err, data) {
                              if (err) {
                                token = data.token;
                                  console.log(err);
                                  return showErr("Unable to Find IP!").dismissOthers;
                              }
                              if (data) {
                                token = data.token;
                                  var msg = data.msg;
                                  alertChatMessage({
                                      message: msg,
                                      date: (new Date).toUTCString()
                                  });
                              }
                          });
                      }
                  });
              }
          },
          {
              name: '<b>⛔Ban</b>',
              fun: function() {
                  console.log("ADMIN MENU: BAN " + user);
                  alertChatMessage({
                      message: "This Function isn't Implemented Yet!",
                      date: (new Date).toUTCString()
                  });
              }
          },
          {
              name: '<b>🌐IP</b>',
              fun: function() {
                  console.log("ADMIN MENU: IP " + user);
                  socket.emit('getIP', {
                      username: user,
                      token: token
                  }, function(err, data) {
                      if (err) {
                        token = data.token;
                        return showErr(err);
                      }
                      if (data) {
                          token = data.token;
                          var userip = data.ip;
                          var username = data.username;
                          userip = ipParse(userip);
                          alertChatMessage({
                              message: `${username}'s IP Address: ${userip}`,
                              date: (new Date).toUTCString()
                          });
                      }
                  });
              }
          },
          {
              name: '<b>☂️RainBan</b>',
              fun: function() {
                  socket.emit('rainban', {
                      user: user,
                      token: token
                  }, function(err, data) {
                      if (err) {
                        token = data.token;
                          showErr("RainBan Failed!");
                          return;
                      }
                      if(data){
                        token = data.token;
                        alertChatMessage({
                            message: `User Given RainBan!`,
                            date: (new Date).toUTCString()
                        });
                      }
                  });
              }
          },
          {
              name: '<b>☔RainAdd</b>',
              fun: function() {
                  socket.emit('rainadd', {
                      user: user,
                      token: token
                  }, function(err, data) {
                      if (err) {
                          token = data.token;
                          showErr("RainAdd Failed!");
                          return;
                      }
                      if(data){
                        token = data.token;
                        alertChatMessage({
                            message: `User Given RainAdd!`,
                            date: (new Date).toUTCString()
                        });
                      }
                  });
              }
          },
            ];
        } else {
            menud = [
              {
                  name: '🔎Blog',
                  fun: function () {
                          getUserBlog(user)
                  }
              },
              {
              name: '<b>💲Tip</b>',
              fun: function() {
                  $("#tipbalance").val($("#balance").val());
                  bootbox.dialog({
                      message: '<center><span class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style=""><i class="fa fa-at fa-2x"></i></span>' +
                          '<b><input type="text" class="form-control" placeholder="User" aria-describedby="basic-addon1" id="tipto" style="" ></b><span class="input-group-addon addon-sexy" style="">User</span></span>' +
                          '<br><span class="input-group autoBettitleC" style="width:69%;background:#181E28;"><span class="input-group-addon addon-sexy" style=""><b>Tip</b></span>' +
                          '<b><input type="number" class="form-control" placeholder="0.000" id="tipamount" aria-describedby="basic-addon1"></b>' +
                          '<span class="input-group-addon addon-sexy" style="padding:5px;"><img src="img/rhom.svg" class="modalLogo"></span></span>' +
                          "<script>var currencyLogo = $('img.dd-selected-image').attr('src');$('img.modalLogo').attr('src', currencyLogo);</script>",
                      title: `<center><b class="sexytitle">Rhom-Roller.com</b><br>Tip Some ${$('#currentCurrency').val().toUpperCase()} to Another User Instantly</center>`,
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
                                          token = data.token;
                                          return showErr("Tip Send Failed!");
                                      }
                                      //console.log(data);
                                      token = data.token; //token is always returned
                                      $("#balance").val((data.balance/ 100000000).toFixed(8));
                                      showSuccess("Tip Sent!");
                                  });
                              }
                          }
                      }
                  });
                  $("#tipto").val(user);
              }
          },
          {
              name: '<b>💬Message</b>',
              fun: function() {
                  $("#chatText").val(`/msg ${user} `);
                  $("#chatText").focus();
              }, //END fun:function

          },
          {
              name: '<b>📊Stats</b>',
              fun: function() {
                  userstatsDialog(user);
              }
          }
            ];
        }
        $(el).contextMenu(menud);
    });


};

$("#sendChat").on('click',function(){
    socket.emit('chatmessage', {message: $("#chatText").val(), token: chatToken}, function(err, data){
      if (err) showErr(err);
      $("#chatText").val("");
    });

});

$("#chatText").keypress(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == "13"){
        socket.emit('chatmessage', {message: $("#chatText").val(), token: chatToken}, function(err, data){
          if (err) showErr(err);
          $("#chatText").val("");
        });
    }
});

function copyStringToClipboard (str) {
   // Create new element
   var el = document.createElement('textarea');
   // Set value (string to be copied)
   el.value = str;
   // Set non-editable to avoid focus and move outside of view
   el.setAttribute('readonly', '');
   el.style = {position: 'absolute', left: '-9999px'};
   document.body.appendChild(el);
   // Select text inside element
   el.select();
   // Copy text to clipboard
   document.execCommand('copy');
   showSuccess("Copied to Clipboard!");
   // Remove temporary element
   document.body.removeChild(el);
}
