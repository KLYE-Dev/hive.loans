
var banlist = ["test", "test2"];

var loginKey = function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == "13"){
        submitLogin();
    }

};

function changenode(){
  console.log(`changenode!`);
  socket.emit('changenode', {username: $('#usernamestore').val()});
}

// time rewuired format: 'MM/DD/YYYY 0:0 AM'
//CountDownTimer('02/19/2012 10:1 AM', 'countdown');
//CountDownTimer('02/20/2012 10:1 AM', 'newcountdown');
//<div id="countdown"></div>
//<div id="newcountdown"></div>

function getUserBlog(user) {
  window.open(`https://peakd.com/@${user}`);
}

async function withdrawButton() {
  socket.emit('withdrawopen', {user: $('#usernamestore').val()}, function(err, data){
    if(err) {
      console.log(err);
      showErr(`Something Went Wrong! Reloading!`);
      logout();
    }
    if(data) {
      console.log(data);
    }
  })
}

function CountDownTimer(dt, id) {
    var end = new Date(dt);

    var _second = 1000;
    var _minute = _second * 60;
    var _hour = _minute * 60;
    var _day = _hour * 24;
    var timer;

    function showRemaining() {
          flashsec($('#countdown'));
        var now = new Date();
        var distance = end - now;
        if (distance < 0) {

            clearInterval(timer);
            document.getElementById(id).innerHTML = 'EXPIRED!';

            return;
        }
        var days = Math.floor(distance / _day);
        var hours = Math.floor((distance % _day) / _hour);
        var minutes = Math.floor((distance % _hour) / _minute);
        var seconds = Math.floor((distance % _minute) / _second);

        document.getElementById(id).innerHTML = days + 'days ';
        document.getElementById(id).innerHTML += hours + 'hrs ';
        document.getElementById(id).innerHTML += minutes + 'mins ';
        document.getElementById(id).innerHTML += seconds + 'secs';
    }

    timer = setInterval(showRemaining, 1000);
}


let hiveprice;

var pricecheck = async() => {
  try {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=hive&vs_currencies=usd&include_market_cap=false')
    .then(res => res.json()).then(json => {
      response = json["hive"];
      response = response["usd"];
      hiveprice = response;
      console.log(`PRICE: 1 HIVE / $${hiveprice} USD`);
      return hiveprice;
    }).catch(function (error) {
      log("Error: " + error);
    });
  } catch(e) {
    console.log(`pricefetch error: ${e}`)
  }
};

pricecheck();

//========================================================================

function minTwoDigits(n) {
  return (n < 10 ? '0' : '') + n;
}

function getNumber(theNumber)
{
    if(theNumber > 0){
        return "+" + theNumber;
    }else{
        return "&nbsp;" + theNumber;
    }
}

//JS generated sound shit
var context = new AudioContext()
var o = null
var g = null

document.addEventListener('DOMContentLoaded', function(){
  $(".js_play_sound").on("click", function(e){
    e.preventDefault()
    var $target = $(e.target)
    eval($target.data("source"))
  })

  $(".js_stop_sound").on("click", function(e){
    e.preventDefault()
    o.stop()
  })
}, false)

function soundgen(frequency, type){
  o = context.createOscillator()
   g = context.createGain()
   o.type = type
   o.connect(g)
   o.frequency.value = frequency
   g.connect(context.destination)
   o.start(0)

   g.gain.exponentialRampToValueAtTime(
     0.00001, context.currentTime + 1
   )
}
//END JS sound shit

var showErr = function(text){
  alertify.closeAll()
  alertify.error('<i class="fa fa-2x fag-2x fa-exclamation-circle" style="color:red;float:left;    margin-left: 0.5vw;"></i>' + text).dismissOthers();
}
var showSuccess = function(text){
  alertify.closeAll()
  alertify.success('<i class="fa fa-2x fag-2x fa-check-circle" style="color:green;float:left;    margin-left: 0.5vw;"></i>' + text).dismissOthers();
}


var populateMyBets = function(data){
    var i,j,direction;
    var $mybets =  $("#myBets");
    for (i=0;i<data.length;i++){

      data[i]['betIDSmall']=data[i].betid.slice(37);
      data[i]['amount']='';
      data[i]['target']='';
      for (j=0;j<data[i].bet.length;j++){
        direction = '';
        if (data[i].bet[j].direction==='hi') direction+=" > ";
        if (data[i].bet[j].direction==='lo') direction+=" < ";
        direction += (data[i].bet[j].num).toFixed(4) + '<br>';
        data[i]['target'] += (direction).toFixed(4);
        data[i]['amount'] += (data[i].bet[j].amount).toFixed(8) + '<br>';

      }
    }

    var tableContents = $mybets.bootstrapTable('load', data);
};

var flashsec = function(elements) {
  $(elements).css({'color':'#cc0000 !important'});
  $(elements).animate({'color':'#000000 !important'},900);
  $(elements).css({'color':'#000000 !important'});
  return;
};

var flashwin = function(elements) {
  $(elements).css({'color':'#00ff00 !important'});
  $(elements).animate({'color':'#FFFFFF !important'},900);
  $(elements).css({'color':'#FFFFFF !important'});
  return;
};

var flashlose = function(elements) {
  $(elements).css({'color':'#cc0000 !important'});
  $(elements).animate({'color':'#FFFFFF !important'},900);
  $(elements).css({'color':'#FFFFFF !important'});
  return;
};


var updateQRCODE = function(v){
    $('#qrcode').qrcode({
		render: "table",
        text	: v
	});
    $("#qrtext").text(v);
};

var floor = function(n, decimalPlaces){
    var m = Math.pow(10,decimalPlaces);
    return (Math.floor(n*m)/m).toFixed(decimalPlaces);
};

var ceil = function(n, decimalPlaces){
    var m = Math.pow(10,decimalPlaces);
    return (Math.ceil(n*m)/m).toFixed(decimalPlaces);
};

var round = function(n, decimalPlaces){
    var m = Math.pow(10,decimalPlaces);
    return (Math.round(n*m)/m).toFixed(decimalPlaces);
};

function getUserData(){
  socket.emit('getuserdata', {data: true}, function(err, data){
    if(err) {
      console.log(err);
      //showErr(`Something Went Wrong! Reloading!`);
      //logout();
    }
    if(data) {
      data = data.userdata
      $("#userhivebalance").val((data.hivebalance  / 1000).toFixed(3) + " HIVE");
      $("#userhbdbalance").val((data.hbdbalance  / 1000).toFixed(3) + " HBD");
      showSuccess(`Fetched Account Data!`);
    }
  })
}

function createLoanPreview() {
  var newAmount = parseInt($('#newLendAmount').val());
  var newDays = parseInt($('#newLendDays').val());
  var newFee =  parseInt($('#newLendFee').val());
  if(newAmount < 1){
  //  $('#newLendAmount').val(1);
  }
  if(newAmount > $('#statsBal').val()){
  //  $('#createLoanWarning').val(`Deposit More HIVE to Afford Loan Creation of This Size!`);
  }
  if(newFee < 10){
    //$('#newLendFee').val(10);
  }
  if(newFee > 10){
    //$('#newLendFee').val(30);
  }
  newFee = (newFee / 100);
  var commission = (newFee * 10);
  var preview = (newAmount * newFee);
  var dailypreview = (preview / newDays);
  var weeklyrepay = (dailypreview * 7)
 ;
  var previewparse = parseFloat(preview);
  previewparse = previewparse.toString();
   console.log(previewparse)
  if(previewparse != 'NaN' ) {
    $('#createLoanPreview').html(`This Lending Contract will Earn ${preview.toFixed(3)} HIVE <i class="fas fa-fw fa-info-circle" title="( minus a ${commission.toFixed(3)} HIVE site commission fee (10%) )"></i> over ${newDays} Days. ${dailypreview.toFixed(3)} HIVE Profit per Day, Recieving ${weeklyrepay.toFixed(3)} HIVE Weekly Repayments.`);
  } else {
    $('#createLoanPreview').html(`Please enter valid amounts in the fields above to get a preview of the loan contract`);
  }
}

function cancelContract(contractID) {
  socket.emit('cancelloan', {loanId: contractID, token: token}, function(err, data){
      if(err) {
        console.log(err)
      }
      if(data) {
        showSuccess(`Destroyed Contract #${contractID}`);
      }
  })
}

function acceptContract(contractID) {
  socket.emit('acceptloan', {loanId: contractID, token: token}, function(err, data){
      if(err) {
        console.log(err)
      }
      if(data) {
        showSuccess(`Accepted Contract #${contractID}`);
      }
  })
}

function infoContract(contractID) {
  socket.emit('infoloan', {loanId: contractID, token: token}, function(err, data){
      if(err) {
        console.log(err)
      }
      if(data) {
        showSuccess(`Fetched Contract #${contractID} Data!`);
      }
  })
}

function createNewLendingContract(amount, days, fee, token) {
  console.log(`createNewLendingContract(${amount}, ${days}, ${fee}, ${token})`);
  $('#createLoanWarning').css({'color':'lawngreen'});
  $('#createLoanWarning').val(`Attempting to Create Lending Contract...`);
  socket.emit('createloan', {
    amount: amount,
    days: days,
    interest: fee,
    token: token
  }, function(err, data){
    if(err){
      console.log(err);
      $('#createLoanWarning').css({'color':'red'});
      $('#createLoanWarning').val(`Error Creating Loan: ${err}`);
      showErr(`Error: ${err}`);
    }
    if(data){
      token = data.token;
      showSuccess(`Loan Contract Succesfully Created!`);
      $('#createLoanWarning').css({'color':'green'});
      $('#createLoanWarning').val(`Lending Contract has been Deployed!`);
      showWallet();
      console.log(data);
    }
  });
}

/** CHAT **/

function writeBufferToChatBox(message){

    if( $.inArray(message.user, banlist) != -1){
       alert("You're Currently Banned From Chat... Please Contact KLYE to Appeal Your Ban!");
    } else {
      message.forEach(function(msg){
        formatChatMessage(msg, true);
        scrollToTop($("#trollbox"));
      });
    };
}; // END writeBufferToChatBox

function writeToChatBox(message){
    formatChatMessage(message, false);
}

var formatChatMessage = function(message, prepend){

    var date = new Date(message.createdAt);
    var hours = date.getHours();
    var minutes = (date.getMinutes()<10?'0':'') + date.getMinutes()
    var seconds = (date.getSeconds()<10?'0':'') + date.getSeconds()
    var timeCombo = hours + ":" + minutes + ":" + seconds;

    if (message.username == 'klye') {
        message.username = 'klye';
        message.flair = '<b title="Owner">🧙</b>';
    } else {
      if(message.rank == 'founder'){
        message.flair = '<b title="Founder">⚡</b>';
      } else if(message.rank == 'backer'){
        message.flair = '<b title="Backer">💸</b>';
      } else if(message.rank == 'user'){
        message.flair = ' ';
      } else if(message.rank == 'benefactor'){
        message.flair = '<b title="Benefactor">💰</b>';
      } else {
        message.flair = ' ';
      }
    }

    if (prepend == true) {
        $("#trollbox").prepend(`<div class="chatList" id="${message.rng}"><span class="chatTime"><a href="#" title="${date}"><i class="far fa-clock" style="color:grey; text-decoration: none !important;"> </i></a></span> <span class="modspan ${message.rng}"></span> <span class="vipspan ${message.rng}"></span><span class="uid sextext" title="User Identification Number">(${message.userId})</span><span class="chatFlair">${message.flair}</span><span class="chatUser" onClick='userMenu(this, \"${message.username}\", \"${message.rng}\");'><a href="#" class="chatUserName" title="Double Click to Open Trollbox Menu" onClick='userMenu(this, \"${message.username}\", \"${message.id}\");'>@<b>${message.username}</b></a></span><span class="userLvL ${message.rng}" title="Account Level"></span> <span class="pchat" style="color: white"></span></div>`);
        $(".pchat").eq(0).text(message.msg);
    } else if (prepend == false){
        $("#trollbox").append(`<div class="chatList" id="${message.rng}"><span class="chatTime"><a href="#" title="${date}"><i class="far fa-clock" style="color:grey; text-decoration: none !important;"> </i></a></span> <span class="modspan ${message.rng}"></span> <span class="vipspan ${message.rng}"></span><span class="uid sextext" title="User Identification Number">(${message.userId})</span><span class="chatFlair">${message.flair}</span><span class="chatUser" onClick='userMenu(this, \"${message.username}\", \"${message.rng}\");'><a href="#" class="chatUserName" title="Double Click to Open Trollbox Menu" onClick='userMenu(this, \"${message.username}\", \"${message.id}\");'>@<b>${message.username}</b></a></span><span class="userLvL ${message.rng}" title="Account Level"></span> <span class="pchat" style="color: white"></span></div>`);
        $(".pchat").eq(-1).text(message.msg);
    }
}

var alertChatMessage = function(message) {
    var date = message.date
    $("#trollbox").append('<div class="chatList"><span class="chatTime"><a href="#" title="' + date + '"><i class="far fa-clock" style="color:grey; text-decoration: none !important;"></i></a></span> <span class="chatAlert sexyoutline" style="color:grey;" title="System"><i class="fas fa-fw fa-robot"></i></span><span class="pchat" style="color: white"></span></div>'); //<b>System</b>
    $(".pchat").eq(-1).html(message.message);
    scrollToTop($("#trollbox"));
};

var scrollToTop=function(el){
    var height = el[0].scrollHeight;
    el.scrollTop(height);
};

var limitTrollBox =function(){
    var msgs = document.querySelectorAll('#trollbox li');

    for(var i=1; i<msgs.length-100; i++) {
        msgs[i].parentNode.removeChild(msgs[i]);
    }
};


function copyStringToClipboard(str) {
    // Create new element
    var el = document.createElement('textarea');
    // Set value (string to be copied)
    el.value = str;
    // Set non-editable to avoid focus and move outside of view
    el.setAttribute('readonly', '');
    el.style = {
        position: 'absolute',
        left: '-9999px'
    };
    document.body.appendChild(el);
    // Select text inside element
    el.select();
    // Copy text to clipboard
    document.execCommand('copy');
    showSuccess("Copied to Clipboard!");
    // Remove temporary element
    document.body.removeChild(el);
}

function isNumberKey(evt) {
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57)) {
        showErr("Numbers & Decimals Only!");
        return false;
    }
    return true;
}

function isNearSeven(val) {
  if(val % 7){
    return Math.round(val / 7);
  } else {
    console.log(`not multiple of 7`);
  }
}

function between(value, start, end){
  if(value < start){
    return 10;
  } else if (value > end){
    return 30;
  }
}

/*
$('input#newLendFee.casperInput').on('onkeyup', function () {
    console.log(`INPUT DETECTED`)
  setTimeout(function(){
    var value = $(this).val();
    if ((value !== '') && (value.indexOf('.') === -1)) {
        $(this).val(Math.max(Math.min(value, 30), 10));
    }
  },500);
});
*/
/*EDIT BELOW TO ADD NEW COIN*/
function CreateTableFromJSON(data, name, elementid) {
    if (data == undefined) {
        return showErr('Something fucked up!');
    }
    //console.log(data, name);
    var loanIDstore = [];
    var tableLimit = 200;
    var tableLength = data.length;
    var tableAmount = (data.length - tableLimit);
    if (tableLength >= tableLimit) {
        data = data.slice(tableAmount, tableLength);
    }
    //data.pop();

    var col = [];
    for (var i = 0; i < data.length; i++) {
        for (var key in data[i]) {
            if (col.indexOf(key) === -1) {
                col.push(key);
            }
        }
    }
    // CREATE DYNAMIC TABLE.
    var table = document.createElement("table");
    table.setAttribute("id", "newHistoryTable");
    table.classList.add("lendingtable");
    table.classList.add("table");
    var header = table.createTHead();
    header.setAttribute("id", "historyhead");
    // CREATE HTML TABLE HEADER ROW USING THE EXTRACTED HEADERS ABOVE.
    var tr = header.insertRow(-1); // TABLE ROW.
    for (var i = 0; i < col.length; i++) {
        if (col[i] == undefined) {
            console.log(`Undefined entry!`)
        } else {
            var th = document.createElement("th");
            //th.classList.add(name + "-" +col[i]);      // TABLE HEADER.
            th.innerHTML = col[i];
            tr.appendChild(th);
        }

    }

    // ADD JSON DATA TO THE TABLE AS ROWS.
    for (var i = 0; i < data.length; i++) {
        if (data == undefined) {
            console.log(`Undefined History Data`);
        } else {
            tr = table.insertRow(-1);
            for (var j = 0; j < col.length; j++) {

                if (data[i][col[j]] == undefined) {
                    //data[i][col[j]] = '';
                }

                  if (name == 'backers') {
                        if (col[j] == 'amount') {
                            if (data[i][col[j]] == undefined) {
                                data[i][col[j]] = "Non Integer";
                            } else {
                                data[i][col[j]] = (data[i][col[j]] / 1000).toFixed(3) + " HIVE";
                            }
                        }
                        if (col[j] == 'username') {
                                if((i + 1) == 1) {
                                  $('#currentWinner').html(`@${data[i][col[j]]}`)
                                }
                                data[i][col[j]] = `<span style="float:left;">#${i + 1}</span> <a href="https://hiveblocks.com/@${data[i][col[j]]}" class="histuserlink" style="color:black !important;" target="_blank" title="Click to View This Account on HiveBlocks.com in a New Window">@${data[i][col[j]]}</a>`;
                        }

                        if (col[j] == 'block') {
                                data[i][col[j]] = `<a href="https://hiveblocks.com/b/${data[i][col[j]]}" class="histuserlink" style="color:black !important;" target="_blank" title="Click to View This Block on HiveBlocks.com in a New Window">#${data[i][col[j]]}</a>`;
                        }
                      }

                if (name == 'loans') {

                  if (col[j] == 'loanId') {
                      //loanIDstore.push(data[i][col[j]]);
                      //console.log(loanIDstore);
                      let thisID = data[i][col[j]];
                      data[i][col[j]] = `<button class="cancelButton push_button4" style="float:left;" id="cancelButton${data[i][col[j]]}" onclick="cancelContract('${data[i][col[j]]}');">Delete <i class="far fa-fw fa-times-circle" style="color:red;"></i></button> <span id="${data[i][col[j]]}">${data[i][col[j]]}</span>`;
                  }
                    if (col[j] == 'username') {
                        data[i][col[j]] = `<a href="#" class="histuserlink" title="Click to Open User Menu" onClick="userMenu(this, \'${data[i][col[j]]}\');">@${data[i][col[j]]}</a>`;
                    }
                    if (col[j] == 'amount') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "Non Integer";
                        } else {
                            data[i][col[j]] = (data[i][col[j]] / 1000).toFixed(3) + " HIVE";
                        }
                    }
                    if (col[j] == 'interest') {
                          data[i][col[j]] = data[i][col[j]] + "%";
                    }
                    if (col[j] == 'borrower') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "None Yet";
                        } else {
                            data[i][col[j]] = `<a href="https://hiveblocks.com/@${data[i][col[j]]}" class="histuserlink" target="_blank" title="Click to View This Account on HiveBlocks.com in a New Window">@${data[i][col[j]]} <i class="fas fa-external-link-alt"></i></a>`;
                        }
                    }
                    if (col[j] == 'collected') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "None Yet";
                        } else {
                            data[i][col[j]] = `${data[i][col[j]]} HIVE`;
                        }
                    }
                    if (col[j] == 'currentpayments') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "None Yet";
                        } else {
                            data[i][col[j]] = `${data[i][col[j]]} HIVE`;
                        }
                    }
                    if (col[j] == 'totalpayments') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "None Yet";
                        } else {
                            data[i][col[j]] = `${data[i][col[j]]} HIVE`;
                        }
                    }
                    if (col[j] == 'active') {
                      if(data[i][col[j]] === 0){
                        data[i][col[j]] = `❌`;
                      }
                      if(data[i][col[j]] === 1){
                        data[i][col[j]] = true;
                        $(`#cancelButton${data[i][col[j]]}`).hide();
                      }
                    }
                    if (col[j] == 'completed') {
                      if(data[i][col[j]] === 0){
                        data[i][col[j]] = '❌';
                      }
                      if(data[i][col[j]] === 1){
                        data[i][col[j]] = true;
                      }
                    }
                     //else {
                    //  }
                    if (col[j] == 'createdAt') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "No Date on Record";
                        } else {
                            var datestring = data[i][col[j]].toString();
                            var newdate = datestring.substring(0, datestring.length - 5);
                            var splitdate = newdate.split("T");

                            data[i][col[j]] = splitdate[1] + " " + splitdate[0];
                        }
                    }
                    if (col[j] == 'updatedAt') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "No Date on Record";
                        } else {
                            var datestring = data[i][col[j]].toString();
                            var newdate = datestring.substring(0, datestring.length - 5);
                            var splitdate = newdate.split("T");

                            data[i][col[j]] = splitdate[1] + " " + splitdate[0];
                        }
                    }
                }


                if (name == 'loadloans') {

                  if (col[j] == 'loanId') {
                      let thisID = data[i][col[j]];
                      data[i][col[j]] = `<button class="acceptButton push_button4" style="float:left;" id="acceptButton${data[i][col[j]]}" onclick="acceptContract('${data[i][col[j]]}');">Accept <i class="fas fa-fw fa-coins" style="color:gold;"></i></button> <span id="${data[i][col[j]]}">${data[i][col[j]]}</span> <button class="infoButton push_button4" style="float:right;" id="infoContract${data[i][col[j]]}" onclick="infoContract('${data[i][col[j]]}');">Info <i class="far fa-question-circle" title="More information on this contract" style="color:lightblue;"></i></button>`;
                  }
                    if (col[j] == 'username') {
                        data[i][col[j]] = `hidden`;
                    }
                    if (col[j] == 'amount') {
                            data[i][col[j]] = (data[i][col[j]] / 1000).toFixed(3) + " HIVE";
                    }
                    if (col[j] == 'interest') {
                          data[i][col[j]] = data[i][col[j]] + "%";
                    }
                    if (col[j] == 'borrower') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "None Yet";
                        } else {
                            data[i][col[j]] = `<a href="https://hiveblocks.com/@${data[i][col[j]]}" class="histuserlink" target="_blank" title="Click to View This Account on HiveBlocks.com in a New Window">@${data[i][col[j]]} <i class="fas fa-external-link-alt"></i></a>`;
                        }
                    }
                    if (col[j] == 'collected') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "None Yet";
                        } else {
                            data[i][col[j]] = `${data[i][col[j]]} HIVE`;
                        }
                    }
                    if (col[j] == 'currentpayments') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "None Yet";
                        } else {
                            data[i][col[j]] = `${data[i][col[j]]} HIVE`;
                        }
                    }
                    if (col[j] == 'totalpayments') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "None Yet";
                        } else {
                            data[i][col[j]] = `${data[i][col[j]]} HIVE`;
                        }
                    }
                    if (col[j] == 'active') {
                      if(data[i][col[j]] === 0){
                        data[i][col[j]] = `<b style="color:lawngreen !important;">Available</b>`;
                      }
                      if(data[i][col[j]] === 1){
                        data[i][col[j]] = true;
                        $(`#acceptButton${data[i][col[j]]}`).hide();
                      }
                    }
                    if (col[j] == 'completed') {
                      if(data[i][col[j]] === 0){
                        data[i][col[j]] = '❌';
                      }
                      if(data[i][col[j]] === 1){
                        data[i][col[j]] = true;
                      }
                    }
                     //else {
                    //  }
                    if (col[j] == 'createdAt') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "No Date on Record";
                        } else {
                            var datestring = data[i][col[j]].toString();
                            var newdate = datestring.substring(0, datestring.length - 5);
                            var splitdate = newdate.split("T");

                            data[i][col[j]] = splitdate[1] + " " + splitdate[0];
                        }
                    }
                    if (col[j] == 'updatedAt') {
                        if (data[i][col[j]] == undefined) {
                            data[i][col[j]] = "No Date on Record";
                        } else {
                            var datestring = data[i][col[j]].toString();
                            var newdate = datestring.substring(0, datestring.length - 5);
                            var splitdate = newdate.split("T");

                            data[i][col[j]] = splitdate[1] + " " + splitdate[0];
                        }
                    }
                }


                if (col[j] == 'account') {
                    if (data[i][col[j]] == undefined) {
                        data[i][col[j]] = "Unknown";
                    } else {
                        data[i][col[j]] = `<a href="https://hiveblocks.com/@${data[i][col[j]]}" class="histuserlink" target="_blank" title="Click to View This Account on HiveBlocks.com in a New Window">@${data[i][col[j]]} <i class="fas fa-external-link-alt"></i></a>`;
                    }
                }

                if (col[j] == 'date') {
                    if (data[i][col[j]] == undefined) {
                        data[i][col[j]] = "No Date on Record";
                    } else {
                        var datestring = data[i][col[j]].toString();
                        var newdate = datestring.substring(0, datestring.length - 4);
                        data[i][col[j]] = newdate;
                    }
                }
                var tabCell = tr.insertCell(-1);
                tabCell.innerHTML = data[i][col[j]];
                //}
            }
        }
    }

    // FINALLY ADD THE NEWLY CREATED TABLE WITH JSON DATA TO A CONTAINER.
    var divContainer = document.getElementById(elementid);
    divContainer.innerHTML = "";
    divContainer.appendChild(table);

    var tableOffset = $("#newHistoryTable").offset().top;
    var $header = $("#newHistoryTable > #historyhead").clone();
    //var $fixedHeader = $("#header-fixed").append($header);

    $(window).bind("scroll", function() {
        var offset = $(this).scrollTop();

        if (offset >= tableOffset && $fixedHeader.is(":hidden")) {
            $fixedHeader.show();
        } else if (offset < tableOffset) {
            $fixedHeader.hide();
        }
    });

}
