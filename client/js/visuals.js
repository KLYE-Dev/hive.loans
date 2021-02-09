
/*****************************************************************************
* TABLES
*****************************************************************************/
$('#myBets').bootstrapTable({
    columns: [{
        field: 'betid',
        title: 'Bet ID'
    }, {
        field: 'amount',
        title: 'Amount'
    }, {
        field: 'target',
        title: 'Target'
    }, {
        field: 'result',
        title: 'Roll'
    }, {
        field: 'win',
        title: 'Result'
    }],
    data: [],
    onClickRow: function(row, $element){
      //float a dialog with all data.
      //function is in dialogs.js
      betDetailDialog(row);
    }
});

var rowStyle = function(row, index) {
    var classes = ['active', 'success greent', 'info', 'warning', 'danger redt'];

    if (row.win>0) {
        return {
            classes: classes[1]
        };
    }else{
      return {
          classes: classes[4]
      };
    }
    return {};
}


$('#bets').bootstrapTable({
    columns: [{
        field: 'betid',
        title: 'Bet ID'
    }, {
        field: 'username',
        title: 'Player'
    }, {
        field: 'amount',
        title: 'Bet'
    }, {
        field: 'target',
        title: 'Target'
    },
    {
        field: 'result',
        title: 'Roll'
    }, {
        field: 'win',
        title: 'Result'
    }],
    data: []
});

$('#highRollerBets').bootstrapTable({
    columns: [{
        field: 'betid',
        title: 'Bet ID'
    }, {
        field: 'username',
        title: 'Player'
    }, {
        field: 'amount',
        title: 'Bet'
    }, {
        field: 'target',
        title: 'Target'
    }, {
        field: 'result',
        title: 'Roll'
    }, {
        field: 'win',
        title: 'Result'
    }],
    data: []
});
var rowStyle = function(row, index) {
    var classes = ['active', 'success greent', 'info', 'warning', 'danger redt'];

    if (row.win>0) {
        return {
            classes: classes[1]
        };
    }else{
      return {
          classes: classes[4]
      };
    }

    return {};
};
