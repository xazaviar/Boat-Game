//Data from server
var firstData = false;
var map;
var players;
var queue;
var game;
var shop;
var store;
var baseList;
var teamList;
var battleLog;
var activeAttacks;
var me = {"token":null,"loc":[],"id":-1};


//Chat data
var chatMode = false;
var chatMsg = '';

//*****************************************************************************
//Server Data functions
//*****************************************************************************
function newUserData(_callback){
    $.get("/userdata/"+me.token+"/"+me.id, function(data) {
        me.abilitySlots = data.user.abilitySlots;
        me.loc = data.user.loc;
        activeAttacks = data.user.activeAttacks
        _callback();
    });
}
function newUserStatData(_callback){
    $.get("/userstatdata/"+me.token+"/"+me.id, function(data) {
        me.info = data.user.info;
        me.invites = data.user.invites;
        me.storage = data.user.storage;
        me.stats = data.user.stats;
        _callback();
    });
}
function newqueueData(_callback){
    $.get("/queuedata/"+me.token+"/"+me.id, function(data) {
        queue = data.queue;
        _callback();
    });
}
function newBattleLogData(_callback){
    $.get("/batlelogdata/"+me.token+"/"+me.id, function(data) {
        battleLog = data.battleLog;
        _callback();
    });
}
function newBaseData(_callback){
    $.get("/basedata/"+me.token+"/"+me.id, function(data) {
        baseList = data.baseList;
        _callback();
    });
}
function newTeamData(_callback){
    $.get("/teamdata/"+me.token+"/"+me.id, function(data) {
        teamList = data.teamList;
        _callback();
    });
}
function newMapData(_callback){
    $.get("/mapdata/"+me.token+"/"+me.id, function(data) {
        map = data.map;
        _callback();
    });
}
function newGameData(_callback){
    $.get("/gamedata", function(data) {
        game = data;
        _callback();
    });
}
function newPlayerData(_callback){
    $.get("/playerdata/"+me.token+"/"+me.id, function(data) {
        players = data.players;
        _callback();
    });
}
function newShopData(_callback){
    $.get("/shopdata/"+me.token+"/"+me.id, function(data) {
        shop = data.shop;
        store = [
            [
                {
                    "pLabel":   "hpF",
                    "label":    "Full Ship Repair",
                    "canBuy":   shop.hpF.canBuy,
                    "price":{
                        "gold":     shop.hpF.price.gold,
                        "iron":     shop.hpF.price.iron,
                        "uranium":  shop.hpF.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                },
                {
                    "pLabel":   "hp5",
                    "label":    "Small Ship Repair",
                    "canBuy":   shop.hp5.canBuy,
                    "price":{
                        "gold":     shop.hp5.price.gold,
                        "iron":     shop.hp5.price.iron,
                        "uranium":  shop.hp5.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                },
                {
                    "pLabel":   "insurance",
                    "label":    "Purchase Insurance  [lv"+me.stats.insurance+"]",
                    "canBuy":   shop.insurance.canBuy,
                    "price":{
                        "gold":     shop.insurance.price.gold,
                        "iron":     shop.insurance.price.iron,
                        "uranium":  shop.insurance.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                },
                {
                    "pLabel":   "hpU",
                    "label":    "Upgrade Health",
                    "canBuy":   shop.hpU.canBuy,
                    "price":{
                        "gold":     shop.hpU.price.gold,
                        "iron":     shop.hpU.price.iron,
                        "uranium":  shop.hpU.price.uranium
                    },
                    "level":    me.stats.hpUpgrades,
                    "maxLvl":   me.stats.hpUpgradesMAX
                },
                {
                    "pLabel":   "enU",
                    "label":    "Upgrade Energy",
                    "canBuy":   shop.enU.canBuy,
                    "price":{
                        "gold":     shop.enU.price.gold,
                        "iron":     shop.enU.price.iron,
                        "uranium":  shop.enU.price.uranium
                    },
                    "level":    me.stats.energyUpgrades,
                    "maxLvl":   me.stats.energyUpgradesMAX
                },
                {
                    "pLabel":   "atkU",
                    "label":    "Upgrade Attack",
                    "canBuy":   shop.atkU.canBuy,
                    "price":{
                        "gold":     shop.atkU.price.gold,
                        "iron":     shop.atkU.price.iron,
                        "uranium":  shop.atkU.price.uranium
                    },
                    "level":    me.stats.attackUpgrades,
                    "maxLvl":   me.stats.attackUpgradesMAX
                },
                {
                    "pLabel":   "radU",
                    "label":    "Upgrade Radar",
                    "canBuy":   shop.radU.canBuy,
                    "price":{
                        "gold":     shop.radU.price.gold,
                        "iron":     shop.radU.price.iron,
                        "uranium":  shop.radU.price.uranium
                    },
                    "level":    me.stats.radarUpgrades,
                    "maxLvl":   me.stats.radarUpgradesMAX
                }
            ],
            [
                {
                    "pLabel":   "canU",
                    "label":    (me.stats.cannon==0?"Purchase Cannon.":"Upgrade Cannon."),
                    "canBuy":   shop.canU.canBuy,
                    "price":{
                        "gold":     shop.canU.price.gold,
                        "iron":     shop.canU.price.iron,
                        "uranium":  shop.canU.price.uranium
                    },
                    "level":    me.stats.cannonUpgrades,
                    "maxLvl":   me.stats.cannonUpgradesMAX
                },
                {
                    "pLabel":   "railU",
                    "label":    (me.stats.railgun==0?"Purchase Railgun.":"Upgrade Railgun."),
                    "canBuy":   shop.railU.canBuy,
                    "price":{
                        "gold":     shop.railU.price.gold,
                        "iron":     shop.railU.price.iron,
                        "uranium":  shop.railU.price.uranium
                    },
                    "level":    me.stats.railgunUpgrades,
                    "maxLvl":   me.stats.railgunUpgradesMAX
                },
                {
                    "pLabel":   "trapU",
                    "label":    (me.stats.trap==0?"Purchase Trap Module.":"Upgrade Trap Module."),
                    "canBuy":   shop.trapU.canBuy,
                    "price":{
                        "gold":     shop.trapU.price.gold,
                        "iron":     shop.trapU.price.iron,
                        "uranium":  shop.trapU.price.uranium
                    },
                    "level":    me.stats.trapUpgrades,
                    "maxLvl":   me.stats.trapUpgradesMAX
                },
                {
                    "pLabel":   "quickHeal",
                    "label":    "Purchase Quick Heal (Consumable).",
                    "canBuy":   shop.quickHeal.canBuy,
                    "price":{
                        "gold":     shop.quickHeal.price.gold,
                        "iron":     shop.quickHeal.price.iron,
                        "uranium":  shop.quickHeal.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                }
            ],
            [
                {
                    "pLabel":   "bliU",
                    "label":    (me.stats.blink==0?"Purchase Blink Module.":"Upgrade Blink Module."),
                    "canBuy":   shop.bliU.canBuy,
                    "price":{
                        "gold":     shop.bliU.price.gold,
                        "iron":     shop.bliU.price.iron,
                        "uranium":  shop.bliU.price.uranium
                    },
                    "level":    me.stats.blinkUpgrades,
                    "maxLvl":   me.stats.blinkUpgradesMAX
                },
                {
                    "pLabel":   "steU",
                    "label":    (me.stats.stealth==0?"Purchase Stealth Module.":"Upgrade Stealth Module."),
                    "canBuy":   shop.steU.canBuy,
                    "price":{
                        "gold":     shop.steU.price.gold,
                        "iron":     shop.steU.price.iron,
                        "uranium":  shop.steU.price.uranium
                    },
                    "level":    me.stats.stealthUpgrades,
                    "maxLvl":   me.stats.stealthUpgradesMAX
                },
                {
                    "pLabel":   "engModU",
                    "label":    (me.stats.engMod==0?"Purchase Energy Module.":"Upgrade Energy Module."),
                    "canBuy":   shop.engModU.canBuy,
                    "price":{
                        "gold":     shop.engModU.price.gold,
                        "iron":     shop.engModU.price.iron,
                        "uranium":  shop.engModU.price.uranium
                    },
                    "level":    me.stats.engModUpgrades,
                    "maxLvl":   me.stats.engModUpgradesMAX
                }
            ],
            [
                {
                    "pLabel":   "statAtk",
                    "label":    "Purchase Attack+ Module.",
                    "canBuy":   shop.statAtk.canBuy,
                    "price":{
                        "gold":     shop.statAtk.price.gold,
                        "iron":     shop.statAtk.price.iron,
                        "uranium":  shop.statAtk.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                },
                {
                    "pLabel":   "statRdr",
                    "label":    "Purchase Radar+ Module.",
                    "canBuy":   shop.statRdr.canBuy,
                    "price":{
                        "gold":     shop.statRdr.price.gold,
                        "iron":     shop.statRdr.price.iron,
                        "uranium":  shop.statRdr.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                },
                {
                    "pLabel":   "statHP",
                    "label":    "Purchase HP+ Module.",
                    "canBuy":   shop.statHP.canBuy,
                    "price":{
                        "gold":     shop.statHP.price.gold,
                        "iron":     shop.statHP.price.iron,
                        "uranium":  shop.statHP.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                },
                {
                    "pLabel":   "statEng",
                    "label":    "Purchase Energy+ Module.",
                    "canBuy":   shop.statEng.canBuy,
                    "price":{
                        "gold":     shop.statEng.price.gold,
                        "iron":     shop.statEng.price.iron,
                        "uranium":  shop.statEng.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                },
                {
                    "pLabel":   "statDR",
                    "label":    "Purchase DR Module.",
                    "canBuy":   shop.statDR.canBuy,
                    "price":{
                        "gold":     shop.statDR.price.gold,
                        "iron":     shop.statDR.price.iron,
                        "uranium":  shop.statDR.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                }
            ],
            [
                {
                    "pLabel":   "loadout",
                    "label":    "Purchase Mod Slot.",
                    "canBuy":   shop.loadout.canBuy,
                    "price":{
                        "gold":     shop.loadout.price.gold,
                        "iron":     shop.loadout.price.iron,
                        "uranium":  shop.loadout.price.uranium
                    },
                    "level":    me.stats.loadoutSize,
                    "maxLvl":   2
                },
                {
                    "pLabel":   "carryU",
                    "label":    "Upgrade Uranium Carry Capacity.",
                    "canBuy":   shop.carryU.canBuy,
                    "price":{
                        "gold":     shop.carryU.price.gold,
                        "iron":     shop.carryU.price.iron,
                        "uranium":  shop.carryU.price.uranium
                    },
                    "level":    me.stats.urCarryUpgrades,
                    "maxLvl":   me.stats.urCarryUpgradesMAX
                },
                {
                    "pLabel":   "scanU",
                    "label":    "Upgrade Scanner",
                    "canBuy":   shop.scanU.canBuy,
                    "price":{
                        "gold":     shop.scanU.price.gold,
                        "iron":     shop.scanU.price.iron,
                        "uranium":  shop.scanU.price.uranium
                    },
                    "level":    me.stats.scannerUpgrades,
                    "maxLvl":   me.stats.scannerUpgradesMAX
                },
                {
                    "pLabel":   "wallU",
                    "label":    (me.stats.wall>0?"Upgrade Wall License":"Purchase Wall License."),
                    "canBuy":   shop.wallU.canBuy,
                    "price":{
                        "gold":     shop.wallU.price.gold,
                        "iron":     shop.wallU.price.iron,
                        "uranium":  shop.wallU.price.uranium
                    },
                    "level":    me.stats.wallUpgrades,
                    "maxLvl":   me.stats.wallUpgradesMAX
                },
                {
                    "pLabel":   "insuranceU",
                    "label":    "Upgrade Insurance.",
                    "canBuy":   shop.insuranceU.canBuy,
                    "price":{
                        "gold":     shop.insuranceU.price.gold,
                        "iron":     shop.insuranceU.price.iron,
                        "uranium":  shop.insuranceU.price.uranium
                    },
                    "level":    me.stats.insuranceUpgrades,
                    "maxLvl":   me.stats.insuranceUpgradesMAX
                },
                {
                    "pLabel":   "uranium",
                    "label":    "Purchase Uranium.",
                    "canBuy":   shop.uranium.canBuy,
                    "price":{
                        "gold":     shop.uranium.price.gold,
                        "iron":     shop.uranium.price.iron,
                        "uranium":  shop.uranium.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                },
                {
                    "pLabel":   "wall",
                    "label":    "Purchase Wall.",
                    "canBuy":   shop.wall.canBuy,
                    "price":{
                        "gold":     shop.wall.price.gold,
                        "iron":     shop.wall.price.iron,
                        "uranium":  shop.wall.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                },
                {
                    "pLabel":   "wall5",
                    "label":    "Purchase 5 Walls.",
                    "canBuy":   shop.wall5.canBuy,
                    "price":{
                        "gold":     shop.wall5.price.gold,
                        "iron":     shop.wall5.price.iron,
                        "uranium":  shop.wall5.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                },
                {
                    "pLabel":   "wall10",
                    "label":    "Purchase 10 Walls.",
                    "canBuy":   shop.wall10.canBuy,
                    "price":{
                        "gold":     shop.wall10.price.gold,
                        "iron":     shop.wall10.price.iron,
                        "uranium":  shop.wall10.price.uranium
                    },
                    "level":    0,
                    "maxLvl":   0
                }
            ]
        ];

        _callback();
    });
}

function lowchangedata(_callback){
    $.get("/lowchangedata/"+me.token+"/"+me.id, function(data) {
        map = data.map;
        baseList = data.baseList;
        me.abilitySlots = data.user.abilitySlots;
        me.loc = data.user.loc;
        me.info = data.user.info;
        activeAttacks = data.user.activeAttacks
        _callback();
    });
}
function medchangedata(_callback){
    $.get("/medchangedata/"+me.token+"/"+me.id, function(data) {
        players = data.players;
        me.invites = data.user.invites;
        me.storage = data.user.storage;
        me.stats = data.user.stats;
        teamList = data.teamList;
        _callback();
    });
}
function highchangedata(_callback){
    $.get("/highchangedata/"+me.token+"/"+me.id, function(data) {
        queue = data.queue;
        game = data.game;
        _callback();
    });
}


//*****************************************************************************
//Other functions
//*****************************************************************************
function requestRespawn(token,id, baseID){
    var dat = {
        "token": token,
        "id": id,
        "baseID": baseID
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



//*****************************************************************************
//Webiste functions
//*****************************************************************************
function getMap(_callback){
    $.get("/map", function(data) {
        _callback(data);
    });
}

function getWikiInfo(_callback){
    $.get("/wikiInfo", function(data) {
        _callback(data);
    });
}

function getLeaderboard(_callback){
    $.get("/leaderboard", function(data) {
        _callback(data);
    });
}

function getTeamLeaderboard(_callback){
    $.get("/teamLeaderboard", function(data) {
        _callback(data);
    });
}

function getChangelog(_callback){
    $.get("/changelog", function(data){
        _callback(data);
    });
}

function getFeedback(_callback){
    $.get("/feedback", function(data){
        _callback(data);
    });
}

function sendFeedback(type, title, desc){
    if(title!=="" && desc!==""){
        var dat = {
            "type": type,
            "title": title,
            "desc": desc
        };

        $.ajax({
            url: "/userFeedback",
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
        return true;
    }
    return false;
}
