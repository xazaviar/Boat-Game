//Data from server
var firstData = false;
var map;
var players;
var game;
var shop;
var baseList;
var teamList;
var battleLog;
var activeAttacks;
var me = {"token":null,"loc":[],"id":-1};


//Chat data
var chatMode = false;
var chatMsg = '';


//*****************************************************************************
//Other functions
//*****************************************************************************
function requestRespawn(token,id){
    var dat = {
        "token": token,
        "id": id
    };

    $.ajax({
        url: "/requestRespawn",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
        }
    });
}

function sendChatMsg(token, id, msg, type){
    var dat = {
        "token": token,
        "id": id,
        "msg": msg,
        "type": type
    };

    $.ajax({
        url: "/postChatMsg",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
            chatMsg = '';
            // chatMode = false;
        }
    });
}


//*****************************************************************************
//Shop/Base functions
//*****************************************************************************
function makePurchase(token, id, item){
    var dat = {
        "token": token,
        "id": id,
        "item": item
    };

    $.ajax({
        url: "/makePurchase",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
        }
    });
}

function changeLoadout(token, id, slot, item){
    var dat = {
        "token": token,
        "id": id,
        "slot": slot,
        "item": item
    };

    $.ajax({
        url: "/changeLoadout",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
        }
    });
}


//*****************************************************************************
//Queue functions
//*****************************************************************************
function updateQueue(token, id, action){
    var dat = {
        "token": token,
        "id": id,
        "action": action
    };

    $.ajax({
        url: "/updateQueue",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
        }
    });
}

function removeFromQueue(token, id, i){
    var dat = {
        "token": token,
        "id": id,
        "remove": i
    };

    $.ajax({
        url: "/removeFromQueue",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
        }
    });
}


//*****************************************************************************
//Team functions
//*****************************************************************************
function createTeam(token, id, tName, aColor, bColor, bShape, teamList){
    var valid = teamValidation($("#color-picker1").val(),$("#color-picker2").val(), tName, teamList);
    if(valid==true){
        var dat = {
            "token": token,
            "id": id,
            "teamName": tName,
            "areaColor": aColor,
            "baseColor": bColor,
            "baseShape": bShape
        };

        $.ajax({
            url: "/createTeam",
            type:'POST',
            dataType: 'json',
            cache: false,
            contentType: 'application/json',
            data: JSON.stringify(dat),
            success: function(msg)
            {
                console.log('Sent');
            },
            error: function(xhr, status, error){
                createTeamError = "";
                $(".input1").toggle(false);
                $(".input2").toggle(false);
                openWindow = "teamMenu";
                curTeamTab = 3;
            }
        });
    }else{
        createTeamError = valid;
    }
}

function joinTeam(token, id, tid, type){
    var dat = {
        "token": token,
        "id": id,
        "tid": tid,
        "type": type
    };

    $.ajax({
        url: "/joinTeam",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
            openWindow = "";
        }
    });
}

function declineInvite(token, id, tid){
    var dat = {
        "token": token,
        "id": id,
        "tid": tid
    };

    $.ajax({
        url: "/declineInvite",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
        }
    });
}

function setObjective(token, id, baseID){
    var dat = {
        "token": token,
        "id": id,
        "baseID": baseID
    };

    $.ajax({
        url: "/setObjective",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
        }
    });
}

function upgradeBase(token, id, baseID){
    var dat = {
        "token": token,
        "id": id,
        "baseID": baseID
    };

    $.ajax({
        url: "/upgradeBase",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
        }
    });
}

//*****************************************************************************
//Team Management functions
//*****************************************************************************
function updateTeamSettings(token, id, settings){
    var dat = {
        "token": token,
        "id": id,
        "settings": settings
    };

    $.ajax({
        url: "/updateTeamSettings",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
            teamSetSaved = true;
        }
    });
}

function promote(token, id, pid){
    var dat = {
        "token": token,
        "id": id,
        "target": pid
    };

    $.ajax({
        url: "/promote",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
            confirmDialog = -1;
            valueLock = -1;
        }
    });
}

function demote(token, id, pid){
    var dat = {
        "token": token,
        "id": id,
        "target": pid
    };

    $.ajax({
        url: "/demote",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
            confirmDialog = -1;
            valueLock = -1;
        }
    });
}

function remove(token, id, pid){
    var dat = {
        "token": token,
        "id": id,
        "target": pid
    };

    $.ajax({
        url: "/remove",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
            confirmDialog = -1;
            valueLock = -1;
        }
    });
}

function invite(token, id, pid){
    var dat = {
        "token": token,
        "id": id,
        "target": pid
    };

    $.ajax({
        url: "/invite",
        type:'POST',
        dataType: 'json',
        cache: false,
        contentType: 'application/json',
        data: JSON.stringify(dat),
        success: function(msg)
        {
            console.log('Sent');
        },
        error: function(xhr, status, error){
            confirmDialog = -1;
            valueLock = -1;
        }
    });
}
