var jsonfile = require('jsonfile');
var feedback;
var version = "Alpha v1.2";

//Globals
var port = 8080;
var players = [];
var playerSize = 0;
var tokenSize = 200;
var playerNameMaxLength = 16;
var teamNameMaxLength = 25;

//Map Building
var mapSize = 70;
var minMapSize = 30;
var rockSpread = .04;   //decimal as percent
var shopSpread = .007;  //decimal as percent
var map = [];
var spawnList = [];
var rockList = [];
var wallList = [];
var rockHP = 20;
var baseList = [];

var attackFromShop = false;

//Loot Data
var lootSpawnValues;
var lootSpreadMIN = .05; //decimal as percent
var lootSpreadMAX = .10; //decimal as percent
var lootSpawnRate = 2;   //Treasures spawn per round
var lootCount = 0;
var lootSpawns = [];

//Countdown Data
var phase = 0; //0 -> setup , 1,2,3 -> action x
var countdownMax = 100; //always 100
var countdown = countdownMax;
var cTick = 25; //countdownMax * tick =~ 3 secs
var aTick = 800; //action tick
var combatCooldown = 4; //Number of rounds
var dcCountdown = 2; //d/c cooldown
var profitCountdown = 0;
var profitCountdownMax = 5;
var respawnCountdown = 3;

//Saving
var saveCountdown = 0;
var saveRound = 3;
var canDelete = true;

var maxJoinTokens = 2;
var roundsTillJoinToken = 700;

//Stat Data
var statData;

//Energy Usage
var attackEnergyUsage       = 1;
var lootEnergyUsage         = 3;
var scanEnergyUsage         = 5;
var quickHealEnergyUsage    = 10;

var energyModUraniumUsage   = 1;

var cannonEnergyUsage       = 10;
var cannonUraniumUsage      = 1;

var blinkEnergyUsage        = 12;
var blinkUraniumUsage       = 1;

var stealthEnergyUsage      = 5;
var stealthUraniumUsage     = 1;

var trapEnergyUsage         = 5;
var trapUraniumUsage        = 1;

var railgunEnergyUsage      = 10;
var railgunUraniumUsage     = 1;
var railgunRange            = 10;

var stealthDurationPerLevel = 3;
var trapDuration            = 3;

//Action Usage
var lootActionUsage         = 2;
var scanActionUsage         = 3;
var cannonActionUsage       = 2;
var blinkActionUsage        = 1;
var stealthActionUsage      = 3;
var destealthActionUsage    = 1;
var trapActionUsage         = 2;
var railgunActionUsage      = 2;
var quickHealActionUsage    = 1;
var wallActionUsage         = 1;

var shopData;
var shopList = [];
var trapList = [];
var teamData;

init();

function init(){
    //load game data
    jsonfile.readFile("data/statdata.json", function(err, obj) {
        if(err){
            console.log(err);
            process.exit(1);
        }
        statData = obj;
    });
    jsonfile.readFile("data/feedback.json", function(err, obj) {
        if(err){
            console.log(err);
            process.exit(1);
        }
        feedback = obj;
    });
    jsonfile.readFile("data/lootspawnvalues.json", function(err, obj) {
        if(err){
            console.log(err);
            process.exit(1);
        }
        lootSpawnValues = obj;

        //Build the map
        buildMap();
    });
    jsonfile.readFile("data/shopdata.json", function(err, obj) {
        if(err){
            console.log(err);
            process.exit(1);
        }
        shopData = obj;
    });
    jsonfile.readFile("data/gamedata.json", function(err, obj) {
        if(err){
            console.log(err);
            process.exit(1);
        }
        playerSize = obj.playerSize;

        for(var i = 0; i < playerSize; i++){
            players[i] = {"id": i,
                          "name":obj.nameList[i].name,
                          "status":"OFFLINE",
                          "power":obj.nameList[i].power,
                          "changes":obj.nameList[i].changes
                         };
        }

        jsonfile.readFile("data/teamdata.json", function(err, obj) {
            if(err){
                console.log(err);
                process.exit(1);
            }
            teamData = [];
            for(var t in obj){
                teamData[obj[t].id] = obj[t];
            }
            initTeamClean();
        });
    });



    //Start server
    startServer();

    //Start global timer
    setTimeout(function(){setupPhase();},cTick);
}

function startServer(){
    var express = require('express');
    var app = express();
    var bodyParser = require('body-parser');
    app.use(bodyParser.json());
    app.use(express.static('public'));

    //**************************************************************************
    // Requests
    //**************************************************************************
    app.get('/returning_user/:token', function(req,res){
        //Get token
        var token = req.params.token

        var found = false;
        for(var i = 0; i < players.length; i++){
            if(players[i].status!=="OFFLINE")
                if(players[i].token === token){
                    found = true;
                    break;
                }
        }

        if(!found)
        jsonfile.readFile("data/playerData/"+token+".json", function(err, obj) {
            var data;
            if(err){
                // console.log(err);
                console.log("Unknown token requested");
                data = {
                    "error": "Invalid Token"
                }
            }
            else{
                var id = obj.id;
                if(id > playerSize) playerSize = id;
                var changes = players[id].changes;
                players[id] = obj;
                var name = ""
                players[id].battleLog = [];
                if(players[id].stats.hp <=0) players[id].stats.hp = players[id].stats.hpMAX;
                players[id].loc = spawn(-1);
                players[id].knownLocs =  [];
                players[id].scanned =  [];
                players[id].knownTraps =  [];
                players[id].activeAttacks = [];
                map[players[id].loc[0]][players[id].loc[1]].type = "PLAYER";
                map[players[id].loc[0]][players[id].loc[1]].id = id;
                name = players[id].info.name;

                var msg;
                if(changes!=null){
                    players[id].info.teamID = changes.id;
                    players[id].info.teamRole = changes.role;
                    msg = {"type":"action", "msg": "Your team or role has changed."};
                    players[id].battleLog.unshift(msg);
                }
                changeOnlineStatus(players[id], true);

                msg = {"type":"server", "msg": ""+name+" has connected."};
                console.log(msg.msg);
                for(var m = 0; m < players.length; m++){
                    if(players[m].status!=="OFFLINE")
                        players[m].battleLog.unshift(msg);
                }

                data = {
                    "token": obj.token,
                    "id": id,
                    "error":""
                }
            }
            res.send(data);

        });

        if(found)
            res.send(data = {"error": "Already Online"});

    });
    app.get('/new_user/:name', function (req, res) {
        var name = req.params.name;
        if(name==="") name = "random";
        var token =  generateToken();
        var sp = spawn(-1);
        var id = playerSize;
        playerSize++;


        map[sp[0]][sp[1]].type = "PLAYER";
        map[sp[0]][sp[1]].id = id;

        var newP = {
            "id": id,
            "token": token,
            "info":{
                "name": name,
                "teamID": -1,
                "teamRole": "NONE",
                "gold": 0,
                "totalGold":0,
                "iron": 0,
                "totalIron":0,
                "uranium": 0,
                "totalUranium":0,
                "walls": 0,
                "wallsPlaced": 0,
                "kills": 0,
                "deaths": 0,
                "scans": 0,
                "hauls": 0,
                "traps": 0,
                "inCombat": 0,
                "stealthTime": 0,
                "connected": 0,
                "hasInsurance": false,
                "stealthed": false,
                "trapped": 0,
                "shipMass": 0,
                "powerLevel": 0,
                "captures": 0,
                "ping": 20,
                "joinTokens": 2,
                "roundsPlayed": 0,
                "respawnCount": 0
            },
            "loc": sp,
            "queue": [],
            "knownLocs": [], //TODO: merge scanned and knownLocs: use scanned functionality?
            "scanned": [],
            "knownTraps": [],
            "battleLog": [],
            "invites": [],
            "activeAttacks": [],
            "stats": {
                "hp": statData.hpStart,
                "hpMAX": statData.hpStart,
                "hpUpgrades":0,
                "hpUpgradesMAX": (statData.hpMAX-statData.hpStart)/statData.hpINC,

                "energy": statData.energyStart,
                "energyMAX": statData.energyStart,
                "energyUpgrades":0,
                "energyUpgradesMAX": (statData.energyMAX-statData.energyStart)/statData.energyINC,

                "radar": statData.radarStart,
                "radarUpgrades":1,
                "radarUpgradesMAX": (statData.radarMAX-statData.radarStart)/statData.radarINC+1,

                "attack": statData.attackStart,
                "attackUpgrades":1,
                "attackUpgradesMAX": (statData.attackMAX-statData.attackStart)/statData.attackINC+1,

                "loadoutSize": statData.loadoutStart,

                "cannon": statData.cannonStart,
                "cannonUpgrades":0,
                "cannonUpgradesMAX": (statData.cannonMAX-statData.cannonStart)/statData.cannonINC,

                "blink": statData.blinkStart,
                "blinkUpgrades":0,
                "blinkUpgradesMAX": (statData.blinkMAX-statData.blinkStart)/statData.blinkINC,

                "stealth": statData.stealthStart,
                "stealthUpgrades":0,
                "stealthUpgradesMAX": (statData.stealthMAX-statData.stealthStart)/statData.stealthINC,

                "trap": statData.trapStart,
                "trapUpgrades":0,
                "trapUpgradesMAX": (statData.trapMAX-statData.trapStart)/statData.trapINC,

                "engMod": statData.engModStart,
                "engModUpgrades":0,
                "engModUpgradesMAX": (statData.engModMAX-statData.engModStart)/statData.engModINC,

                "scanner": statData.scannerStart,
                "scannerUpgrades":1,
                "scannerUpgradesMAX": (statData.scannerMAX-statData.scannerStart)/statData.scannerINC+1,

                "railgun": statData.railgunStart,
                "railgunUpgrades":0,
                "railgunUpgradesMAX": (statData.railgunMAX-statData.railgunStart)/statData.railgunINC,

                "urCarry": statData.urCarryStart,
                "urCarryUpgrades":1,
                "urCarryUpgradesMAX": (statData.urCarryMAX-statData.urCarryStart)/statData.urCarryINC+1,

                "insurance": statData.insuranceStart,
                "insuranceUpgrades":0,
                "insuranceUpgradesMAX": (statData.insuranceMAX-statData.insuranceStart)/statData.insuranceINC,

                "wall": statData.wallStart,
                "wallUpgrades": 0,
                "wallUpgradesMAX": (statData.wallMAX-statData.wallStart)/statData.wallINC,

                "staticHp":false,
                "staticEng":false,
                "staticAtk":false,
                "staticRdr":false,
                "staticDR":false,

                "quickHeal":false
            },
            "abilitySlots": [{"type":"NONE","canUse":false},{"type":"NONE","canUse":false}],
            "storage":[]
        };

        console.log("New user "+name+" joined.");

        var data = {
            "token": token,
            "id": id
        }

        players[id] = newP;
        res.send(data);

        var msg = {"type":"server", "msg": ""+name+" has connected."};
        for(var m = 0; m < players.length; m++){
            if(players[m].status!=="OFFLINE")
                players[m].battleLog.unshift(msg);
        }
    });

    //Retrieval
    app.get('/data/:token', function (req, res) {
        //Get token
        var token = req.params.token
        var sendPlayers = [];

        var p;
        for(var i = 0; i < players.length; i++){
            if(players[i].status!=="OFFLINE"){
                if(players[i].token===token){
                    p = players[i];
                    p.info.connected = 0;
                    sendPlayers[i] = {};
                }
                else{
                    sendPlayers[i] = {
                        "id":players[i].id,
                        "name":players[i].info.name,
                        "loc":players[i].loc,
                        "stealthed":players[i].info.stealthed,
                        "team":players[i].info.teamID,
                        "powerLevel":players[i].info.powerLevel,
                        "ping":players[i].info.ping,
                        "hp": players[i].stats.hp
                    };
                }
            }
            else{
                sendPlayers[i] = {"id":players[i].id,"name":players[i].name};
            }
        }

        if(p!=null){
            for(var pl in sendPlayers){
                if(sendPlayers[pl].id!=p.id && typeof sendPlayers[pl].loc!=="undefined"){
                    var pid = sendPlayers[pl].id;
                    var isScanned = inScanned(p, sendPlayers[pid].id);
                    var inVision = visionDistance(p.loc, sendPlayers[pid].loc);
                    var sameTeam = sendPlayers[pid].team == p.info.teamID;
                    var onTurf = false;
                    if(map[sendPlayers[pid].loc[0]][sendPlayers[pid].loc[1]].baseID>-1)
                        onTurf = baseList[map[sendPlayers[pid].loc[0]][sendPlayers[pid].loc[1]].baseID].owner == p.info.teamID;
                    var canSee = (inVision || onTurf) && !sendPlayers[pid].stealthed;



                    if((!isScanned && !canSee && !sameTeam) || sendPlayers[pid].hp <= 0){
                        delete sendPlayers[pid].loc;
                        delete sendPlayers[pid].stealthed;

                        // sendMap[x][y].id = -1;
                        // sendMap[x][y].type = "OPEN";
                    }
                    delete sendPlayers[pid].hp;
                }
            }

            var sendTeam = [];
            for(var t in teamData){
                if(t == p.info.teamID){
                    var admins = [];
                    var members = [];
                    for(var a in teamData[t].admins){
                        admins.push({
                            "id":teamData[t].admins[a].id,
                            "name":teamData[t].admins[a].name,
                            "powerLevel":teamData[t].admins[a].powerLevel,
                            "online": teamData[t].admins[a].online
                        });
                    }
                    for(var m in teamData[t].members){
                        members.push({
                            "id":teamData[t].members[m].id,
                            "name":teamData[t].members[m].name,
                            "powerLevel":teamData[t].members[m].powerLevel,
                            "online":teamData[t].members[m].online
                        });
                    }
                    sendTeam[teamData[t].id] = {
                        "id": teamData[t].id,
                        "name": teamData[t].name,
                        "colors": teamData[t].colors,
                        "leader": {
                            "id":teamData[t].leader.id,
                            "name":teamData[t].leader.name,
                            "powerLevel":teamData[t].leader.powerLevel,
                            "online":teamData[t].leader.online,
                        },
                        "admins": admins,
                        "members": members,
                        "vault": teamData[t].vault,
                        "income": teamData[t].income,
                        "settings": teamData[t].settings,
                        "power": teamData[t].power,
                        "mapControl": calculateMapControl(t),
                        "rank": teamData[t].rank,
                        "objective": teamData[t].objective
                    };
                }
                else if(teamData[t].status==="DELETED"){
                    sendTeam[teamData[t].id] = {};
                }
                else{
                    sendTeam[teamData[t].id] = {
                        "id": teamData[t].id,
                        "name": teamData[t].name,
                        "colors": teamData[t].colors,
                        "size": teamData[t].members.length,
                        "joinStatus": teamData[t].settings.membership,
                        "profitDivide": teamData[t].settings.profitDivide,
                        "tax": teamData[t].settings.tax,
                        "power": teamData[t].power,
                        "mapControl": calculateMapControl(t)
                    };
                }
            }

            var sendBase = [];
            for(var b in baseList){
                if(baseList[b].owner===p.info.teamID){
                    sendBase[b] = {
                        "hp": baseList[b].hp,
                        "hpMAX": baseList[b].hpMAX,
                        "id": baseList[b].id,
                        "lvl": baseList[b].lvl,
                        "output": {
                            "gold": baseList[b].output.gold,
                            "credits": baseList[b].output.credits
                        },
                        "owner": baseList[b].owner,
                        "special": baseList[b].special,
                        "tiles": baseList[b].tiles,
                        "upgrade": baseList[b].upgrade,
                        "upgradeCost": baseList[b].upgradeCost,
                        "upgradeMAX": baseList[b].upgradeMAX,
                        "upgrading": baseList[b].upgrading
                    };
                }
                else{
                    sendBase[b] = {
                        "hp": baseList[b].hp,
                        "hpMAX": baseList[b].hpMAX,
                        "id": baseList[b].id,
                        "lvl": baseList[b].lvl,
                        "output": {
                            "gTier": baseList[b].output.gTier,
                            "cTier": baseList[b].output.cTier
                        },
                        "owner": baseList[b].owner,
                        "special": baseList[b].special,
                        "tiles": baseList[b].tiles,
                        "upgrade": baseList[b].upgrade,
                        "upgradeMAX": baseList[b].upgradeMAX,
                        "upgrading": baseList[b].upgrading
                    };
                }
            }

            // //Update canUse
            // p.info.powerLevel = calculateIndividualPower(p);
            // updatePower(p);
            // p.abilitySlots[0].canUse = canUseMod(p,p.abilitySlots[0].type);
            // p.abilitySlots[1].canUse = canUseMod(p,p.abilitySlots[1].type);

            var data = {
                // "user": p,
                //"players": sendPlayers,
                //"map": sendMap,
                //"baseList": sendBase,
                //"teamList": sendTeam,
                //"game":{"countdown":countdown,"phase":phase,"version":version},
                //"shop": buildStore(p)
            }

        }
        else{
            var data = {
                "error": "Invalid token"
            }
        }
        res.send(data);
    });

    app.get('/userdata/:token/:id',function(req,res){
        //TODO: reduce player data sent

        //Get token
        var token = req.params.token
        var id = req.params.id
        var data;


        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            p.info.connected = 0;

            //Update canUse
            p.info.powerLevel = calculateIndividualPower(p);
            updatePower(p);
            p.abilitySlots[0].canUse = canUseMod(p, p.abilitySlots[0].type);
            p.abilitySlots[1].canUse = canUseMod(p, p.abilitySlots[1].type);

            data = {
                "user": p
            }
        }
        else{
            data = {
                "error": "Invalid token"
            }
        }

        res.send(data);
    });
    app.get('/gamedata',function(req,res){
        res.send({"countdown":countdown,"phase":phase,"version":version});
    });
    app.get('/shopdata/:token/:id',function(req,res){
        //Get token
        var token = req.params.token
        var id = req.params.id
        var data;

        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            data = {
                "shop": buildStore(p)
            }
        }
        else{
            data = {
                "error": "Invalid token"
            }
        }

        res.send(data);
    });
    app.get('/batlelogdata/:token/:id',function(req,res){
        //Get token
        var token = req.params.token
        var id = req.params.id
        var data;

        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            data = {
                "battleLog": p.battleLog
            }
        }
        else{
            data = {
                "error": "Invalid token"
            }
        }

        res.send(data);
    });
    app.get('/playerdata/:token/:id',function(req,res){
        //Get token
        var token = req.params.token
        var sendPlayers = [];
        var data;

        var p;
        for(var i = 0; i < players.length; i++){
            if(players[i].status!=="OFFLINE"){
                if(players[i].token===token){
                    p = players[i];
                    p.info.connected = 0;
                    sendPlayers[i] = {};
                }
                else{
                    sendPlayers[i] = {
                        "id":players[i].id,
                        "name":players[i].info.name,
                        "loc":players[i].loc,
                        "stealthed":players[i].info.stealthed,
                        "team":players[i].info.teamID,
                        "powerLevel":players[i].info.powerLevel,
                        "ping":players[i].info.ping,
                        "hp": players[i].stats.hp
                    };
                }
            }
            else{
                sendPlayers[i] = {"id":players[i].id,"name":players[i].name};
            }
        }

        if(p!=null){
            for(var pl in sendPlayers){
                if(sendPlayers[pl].id!=p.id && typeof sendPlayers[pl].loc!=="undefined"){
                    var pid = sendPlayers[pl].id;
                    var isScanned = inScanned(p, sendPlayers[pid].id);
                    var inVision = visionDistance(p.loc, sendPlayers[pid].loc);
                    var sameTeam = sendPlayers[pid].team == p.info.teamID;
                    var onTurf = false;
                    if(map[sendPlayers[pid].loc[0]][sendPlayers[pid].loc[1]].baseID>-1)
                        onTurf = baseList[map[sendPlayers[pid].loc[0]][sendPlayers[pid].loc[1]].baseID].owner == p.info.teamID;
                    var canSee = (inVision || onTurf) && !sendPlayers[pid].stealthed;

                    if((!isScanned && !canSee && !sameTeam) || sendPlayers[pid].hp <= 0){
                        delete sendPlayers[pid].loc;
                        delete sendPlayers[pid].stealthed;
                    }
                    delete sendPlayers[pid].hp;
                }
            }

            data = {
                "players": sendPlayers
            }
        }
        else{
            data = {
                "error": "Invalid token"
            }
        }

        res.send(data);
    });
    app.get('/teamdata/:token/:id',function(req,res){
        //Get token
        var token = req.params.token
        var id = req.params.id
        var data;


        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            var sendTeam = [];
            for(var t in teamData){
                if(t == p.info.teamID){
                    var admins = [];
                    var members = [];
                    for(var a in teamData[t].admins){
                        admins.push({
                            "id":teamData[t].admins[a].id,
                            "name":teamData[t].admins[a].name,
                            "powerLevel":teamData[t].admins[a].powerLevel,
                            "online": teamData[t].admins[a].online
                        });
                    }
                    for(var m in teamData[t].members){
                        members.push({
                            "id":teamData[t].members[m].id,
                            "name":teamData[t].members[m].name,
                            "powerLevel":teamData[t].members[m].powerLevel,
                            "online":teamData[t].members[m].online
                        });
                    }
                    sendTeam[teamData[t].id] = {
                        "id": teamData[t].id,
                        "name": teamData[t].name,
                        "colors": teamData[t].colors,
                        "leader": {
                            "id":teamData[t].leader.id,
                            "name":teamData[t].leader.name,
                            "powerLevel":teamData[t].leader.powerLevel,
                            "online":teamData[t].leader.online,
                        },
                        "admins": admins,
                        "members": members,
                        "vault": teamData[t].vault,
                        "income": teamData[t].income,
                        "settings": teamData[t].settings,
                        "power": teamData[t].power,
                        "mapControl": calculateMapControl(t),
                        "rank": teamData[t].rank,
                        "objective": teamData[t].objective
                    };
                }
                else if(teamData[t].status==="DELETED"){
                    sendTeam[teamData[t].id] = {};
                }
                else{
                    sendTeam[teamData[t].id] = {
                        "id": teamData[t].id,
                        "name": teamData[t].name,
                        "colors": teamData[t].colors,
                        "size": teamData[t].members.length,
                        "joinStatus": teamData[t].settings.membership,
                        "profitDivide": teamData[t].settings.profitDivide,
                        "tax": teamData[t].settings.tax,
                        "power": teamData[t].power,
                        "mapControl": calculateMapControl(t)
                    };
                }
            }


            data = {
                "teamList": sendTeam
            }
        }
        else{
            data = {
                "error": "Invalid token"
            }
        }

        res.send(data);
    });
    app.get('/basedata/:token/:id',function(req,res){
        //Get token
        var token = req.params.token
        var id = req.params.id
        var data;


        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            var sendBase = [];
            for(var b in baseList){
                if(baseList[b].owner===p.info.teamID){
                    sendBase[b] = {
                        "hp": baseList[b].hp,
                        "hpMAX": baseList[b].hpMAX,
                        "id": baseList[b].id,
                        "lvl": baseList[b].lvl,
                        "output": {
                            "gold": baseList[b].output.gold,
                            "credits": baseList[b].output.credits
                        },
                        "owner": baseList[b].owner,
                        "special": baseList[b].special,
                        "tiles": baseList[b].tiles,
                        "upgrade": baseList[b].upgrade,
                        "upgradeCost": baseList[b].upgradeCost,
                        "upgradeMAX": baseList[b].upgradeMAX,
                        "upgrading": baseList[b].upgrading
                    };
                }
                else{
                    sendBase[b] = {
                        "hp": baseList[b].hp,
                        "hpMAX": baseList[b].hpMAX,
                        "id": baseList[b].id,
                        "lvl": baseList[b].lvl,
                        "output": {
                            "gTier": baseList[b].output.gTier,
                            "cTier": baseList[b].output.cTier
                        },
                        "owner": baseList[b].owner,
                        "special": baseList[b].special,
                        "tiles": baseList[b].tiles,
                        "upgrade": baseList[b].upgrade,
                        "upgradeMAX": baseList[b].upgradeMAX,
                        "upgrading": baseList[b].upgrading
                    };
                }
            }


            data = {
                "baseList": sendBase
            }
        }
        else{
            data = {
                "error": "Invalid token"
            }
        }

        res.send(data);
    });
    app.get('/mapdata/:token/:id',function(req,res){
        //Get token
        var token = req.params.token
        var id = req.params.id

        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            var sendMap = [];
            for(var x = 0; x < mapSize; x++){
                sendMap[x] = [];
                for(var y = 0; y < mapSize; y++){
                    sendMap[x][y] = {
                        "type": map[x][y].type,
                        "baseID": map[x][y].baseID,
                        "loot":{
                            "gold": map[x][y].loot.gold > 0,
                            "iron": p.stats.scanner > 1 && map[x][y].loot.iron > 0,
                            "uranium": p.stats.scanner > 2 && map[x][y].loot.uranium > 0
                        },
                        "id": map[x][y].id,
                        "trap": map[x][y].trap,
                        "spawn": map[x][y].zone == 0
                    };
                    if(!isKnown(p.knownLocs,x,y)) delete sendMap[x][y].loot;
                    if(sendMap[x][y].trap>-1){
                        if(!isKnownTrap(p,sendMap[x][y].trap)) sendMap[x][y].trap = -1;
                        else sendMap[x][y].trap = players[trapList[map[x][y].trap].owner].info.teamID;
                    }

                    if(sendMap[x][y].type==="PLAYER"){
                        sendMap[x][y].id = -1;
                        sendMap[x][y].type = "OPEN";
                    }
                    else if(sendMap[x][y].type==="ROCK"){
                        sendMap[x][y]["hp"] = rockList[sendMap[x][y].id].hp;
                        sendMap[x][y]["hpMAX"] = rockList[sendMap[x][y].id].hpMAX;
                    }
                    else if(sendMap[x][y].type==="WALL"){
                        sendMap[x][y]["hp"] = wallList[sendMap[x][y].id].hp;
                        sendMap[x][y]["hpMAX"] = wallList[sendMap[x][y].id].hpMAX;
                        sendMap[x][y]["lvl"] = wallList[sendMap[x][y].id].lvl;
                    }

                }
            }

            var data = {
                "map": sendMap
            }
        }
        else{
            var data = {
                "error": "Invalid token"
            }
        }
        res.send(data);
    });

    //Actions
    app.post('/updateQueue', function(req, res){
        console.log("GOT "+req.body.action);
        //Get token
        var token = req.body.token;
        var id = req.body.id;

        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null && phase==0 ){
            if(p.queue.length < 3 && p.stats.hp>0){
                var inUse = 0, inUseUR = 0, inUseW = 0;
                for(var a = 0; a < p.queue.length; a++){
                    if(p.queue[a].type=="ATTACK")
                        inUse= inUse + attackEnergyUsage;
                    else if(p.queue[a].type=="LOOT"){
                        inUse = inUse + lootEnergyUsage;
                        a++;
                    }
                    else if(p.queue[a].type=="HOLD"){
                        inUse = inUse - statData.energyReg;
                    }
                    else if(p.queue[a].type=="BLINK"){
                        inUse = inUse + (blinkEnergyUsage-2*p.stats.blink);
                        inUseUR = inUseUR + blinkUraniumUsage;
                    }
                    else if(p.queue[a].type=="ENERGY"){
                        inUseUR = inUseUR + energyModUraniumUsage;
                        inUse = inUse - p.stats.engMod*5;
                    }
                    else if(p.queue[a].type=="CANNON"){
                        inUse = inUse + cannonEnergyUsage;
                        inUseUR = inUseUR + cannonUraniumUsage;
                        a++;
                    }
                    else if(p.queue[a].type=="RAILGUN"){
                        inUse = inUse + railgunEnergyUsage;
                        inUseUR = inUseUR + railgunUraniumUsage;
                        a++;
                    }
                    else if(p.queue[a].type=="TRAP"){
                        inUse = inUse + trapEnergyUsage;
                        inUseUR = inUseUR + trapUraniumUsage;
                        a++;
                    }
                    else if(p.queue[a].type=="WALL"){
                        inUseW++;
                    }
                }

                if(3-p.queue.length >= scanActionUsage && req.body.action.type==="SCAN" && p.stats.energy>=scanEnergyUsage+inUse){
                    for(var a = 0; a < scanActionUsage; a++)
                        p.queue.push(req.body.action);
                }
                else if(req.body.action.type==="STEALTH" && p.info.stealthed && !queuedDestealth(p)){
                    p.queue.push({"type":"DESTEALTH"});
                }
                else if(3-p.queue.length >= stealthActionUsage && req.body.action.type==="STEALTH" && p.stats.energy>=stealthEnergyUsage+inUse && p.info.uranium>=stealthUraniumUsage+inUseUR){
                    for(var a = 0; a < stealthActionUsage; a++)
                        p.queue.push(req.body.action);
                }
                else if(req.body.action.type==="MOVE" && p.info.trapped<1)
                    p.queue.push(req.body.action);
                else if(req.body.action.type==="HOLD")
                    p.queue.push(req.body.action);
                else{
                    if(p.info.stealthed && !queuedDestealth(p)){
                        p.queue.push({"type":"DESTEALTH"});
                    }

                    if(3-p.queue.length >= lootActionUsage && req.body.action.type==="LOOT" && p.stats.energy>=lootEnergyUsage+inUse){
                        for(var a = 0; a < lootActionUsage; a++)
                            p.queue.push(req.body.action);
                    }
                    else if(3-p.queue.length >= cannonActionUsage && req.body.action.type==="CANNON" && isEquipped(p,"CAN") && attackDistance(p.loc,req.body.action.location) && p.stats.energy>=cannonEnergyUsage+inUse && p.info.uranium>=cannonUraniumUsage+inUseUR){
                        for(var a = 0; a < cannonActionUsage; a++)
                            p.queue.push(req.body.action);
                    }
                    else if(req.body.action.type==="CANNON" && !attackDistance(p.loc,req.body.action.location)){
                        p.battleLog.unshift({"type":"action", "msg": "Out of range."});
                    }
                    else if(3-p.queue.length >= railgunActionUsage && req.body.action.type==="RAILGUN" && isEquipped(p,"RAIL") && p.stats.energy>=railgunEnergyUsage+inUse && p.info.uranium>=railgunUraniumUsage+inUseUR){
                        for(var a = 0; a < railgunActionUsage; a++)
                            p.queue.push(req.body.action);
                    }
                    else if(3-p.queue.length >= trapActionUsage && req.body.action.type==="TRAP" && isEquipped(p,"TRAP") && p.stats.energy>=trapEnergyUsage+inUse && (p.info.uranium>=trapUraniumUsage+inUseUR || p.stats.trap>2)){
                        for(var a = 0; a < trapActionUsage; a++)
                            p.queue.push(req.body.action);
                    }
                    else if(req.body.action.type==="ATTACK" && p.stats.energy>=attackEnergyUsage+inUse && attackDistance(p.loc,req.body.action.location))
                        p.queue.push(req.body.action);
                    else if(req.body.action.type==="ATTACK" && !attackDistance(p.loc,req.body.action.location))
                        p.battleLog.unshift({"type":"action", "msg": "Out of range."});

                    else if(req.body.action.type==="WALL" && p.info.walls-inUseW>=0 && canPlaceWall(p, req.body.action.location) && wallInRange(p.loc,req.body.action.location))
                        p.queue.push(req.body.action);
                    else if(req.body.action.type==="WALL" && p.info.walls-inUseW<0)
                        p.battleLog.unshift({"type":"action", "msg": "Not enough walls."});
                    else if(req.body.action.type==="WALL" && !wallInRange(p.loc,req.body.action.location))
                        p.battleLog.unshift({"type":"action", "msg": "Wall placement out of range."});
                    else if(req.body.action.type==="WALL" && !canPlaceWall(p, req.body.action.location))
                        p.battleLog.unshift({"type":"action", "msg": "Can't place a wall there."});

                    else if(req.body.action.type==="QUICKHEAL" && isEquipped(p,"HEAL") && p.stats.energy>=quickHealEnergyUsage+inUse)
                        p.queue.push(req.body.action);
                    else if(req.body.action.type==="BLINK" && isEquipped(p,"BLNK") && p.info.trapped<1 && blinkDistance(p,req.body.action.location) && p.stats.energy>=(blinkEnergyUsage-2*p.stats.blink)+inUse && p.info.uranium>=blinkUraniumUsage+inUseUR)
                        p.queue.push(req.body.action);
                    else if(req.body.action.type==="BLINK" && !blinkDistance(p,req.body.action.location))
                        p.battleLog.unshift({"type":"action", "msg": "Out of range. Cheater."});
                    else if(req.body.action.type==="ENERGY" && isEquipped(p,"ENG") && p.info.uranium>=energyModUraniumUsage+inUseUR)
                        p.queue.push(req.body.action);
                    else
                        p.battleLog.unshift({"type":"action", "msg": "You can't perform that action."});
                }
            }
            else if(p.stats.hp>0){
                p.battleLog.unshift({"type":"action", "msg": "No action points available."});
            }
        }


        //TODO: Return correctly
        res.send('');
    });
    app.post('/removeFromQueue', function(req,res){
        //Get token
        var token = req.body.token;
        var id = req.body.id;
        var remove = req.body.remove;

        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null && phase==0){
            if(remove > -1 && remove < p.queue.length){
                if(p.queue[remove].type==="MOVE" || p.queue[remove].type==="HOLD" ||
                   p.queue[remove].type==="BLINK" || p.queue[remove].type==="DESTEALTH" ||
                   p.queue[remove].type==="ATTACK" || p.queue[remove].type==="ENERGY" ||
                   p.queue[remove].type==="QUICKHEAL") //1 Action
                    p.queue.splice(remove,1);
                else if(p.queue[remove].type==="SCAN" || p.queue[remove].type==="STEALTH") //3 actions
                    p.queue = [];
                else{
                    if(p.queue[0].type===p.queue[1].type){
                        p.queue.splice(remove,2);
                    }else
                        p.queue.splice(1,2);

                }
            }

        }

        res.send('');
    });
    app.post('/requestRespawn', function(req, res){
        //Get token
        var token = req.body.token;
        var id = req.body.id;
        var baseID = req.body.baseID;

        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            if(p.stats.hp <= 0 && p.info.respawnCount <= 0){
                if(baseID > 0 && baseID!=baseList.length-1){
                    var owner = baseList[baseID].owner;
                    if(owner == p.info.teamID && baseList[baseID].special==="S"){
                        p.loc = spawn(baseID);
                        map[p.loc[0]][p.loc[1]].type = "PLAYER";
                        map[p.loc[0]][p.loc[1]].id = id;
                        p.stats.hp = p.stats.hpMAX;
                        p.stats.energy = p.stats.energyMAX;
                        p.knownLocs = [];
                        p.battleLog.unshift({"type":"action", "msg": "You have respawned."});
                    }
                    else{
                        var msg = {"type":"action", "msg": "You can't spawn there."};
                        p.battleLog.unshift(msg);
                    }
                }
                else{
                    //Respawn at spawn
                    p.loc = spawn(-1);
                    map[p.loc[0]][p.loc[1]].type = "PLAYER";
                    map[p.loc[0]][p.loc[1]].id = id;
                    p.stats.hp = p.stats.hpMAX;
                    p.stats.energy = p.stats.energyMAX;
                    p.knownLocs = [];
                    p.battleLog.unshift({"type":"action", "msg": "You have respawned."});
                }

            }
            else if(p.stats.hp > 0){
                var msg = {"type":"action", "msg": "You need to be dead to respawn."};
                p.battleLog.unshift(msg);
            }
            else if(p.info.respawnCount > 0){
                var msg = {"type":"action", "msg": "You still have to wait to respawn."};
                p.battleLog.unshift(msg);
            }
        }

        res.send('');
    });
    app.post('/makePurchase', function(req, res){
        //Get token
        var token = req.body.token;
        var id = req.body.id;

        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            var shop = buildStore(p);
            var inventory = {"gold":p.info.gold,"iron":p.info.iron,"uranium":p.info.uranium};
            var messagedUser = false;

            //Regular shop
            if(shop.withinShop!=2 && p.stats.hp>0){
                if(req.body.item==="hpF" && canPurchase(shop.hpF.price,inventory) && shop.hpF.canBuy){
                    messagedUser = true;
                    makePurchase(shop.hpF.price,p);
                    p.stats.hp = p.stats.hpMAX;
                    p.battleLog.unshift({"type":"purchase", "msg": "You repaired your ship."});
                }
                else if(req.body.item==="hpF" && !canPurchase(shop.hpF.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="hpF" && !shop.hpF.canBuy){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "Your ship is at full health."});
                }

                else if(req.body.item==="hp5" && canPurchase(shop.hp5.price,inventory) && shop.hp5.canBuy){
                    messagedUser = true;
                    makePurchase(shop.hp5.price,p);
                    p.stats.hp = p.stats.hp + 5;
                    if(p.stats.hp > p.stats.hpMAX) p.stats.hp = p.stats.hpMAX;
                    p.battleLog.unshift({"type":"purchase", "msg": "You repaired your ship."});
                }
                else if(req.body.item==="hp5" && !canPurchase(shop.hp5.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="hp5" && !shop.hp5.canBuy){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "Your ship is at full health."});
                }

                else if(req.body.item==="insurance" && canPurchase(shop.insurance.price,inventory) && shop.insurance.canBuy){
                    makePurchase(shop.insurance.price,p);
                    messagedUser = true;
                    p.info.hasInsurance = true;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased insurance."});
                }
                else if(req.body.item==="insurance" && !canPurchase(shop.insurance.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="insurance" && !shop.insurance.canBuy){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You are already insured."});
                }

                else if(req.body.item==="hpU" && canPurchase(shop.hpU.price,inventory) && shop.hpU.canBuy){
                    makePurchase(shop.hpU.price,p);
                    messagedUser = true;
                    p.stats.hpUpgrades++;
                    p.info.shipMass++;
                    p.stats.hpMAX = p.stats.hpMAX + statData.hpINC;
                    p.stats.hp = p.stats.hp + statData.hpINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your health."});
                }
                else if(req.body.item==="hpU" && !canPurchase(shop.hpU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="enU" && canPurchase(shop.enU.price,inventory) && shop.enU.canBuy){
                    makePurchase(shop.enU.price,p);
                    messagedUser = true;
                    p.stats.energyUpgrades++;
                    p.info.shipMass++;
                    p.stats.energyMAX = p.stats.energyMAX + statData.energyINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your energy."});
                }
                else if(req.body.item==="enU" && !canPurchase(shop.enU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="radU" && canPurchase(shop.radU.price,inventory) && shop.radU.canBuy){
                    makePurchase(shop.radU.price,p);
                    messagedUser = true;
                    p.stats.radarUpgrades++;
                    p.info.shipMass++;
                    p.stats.radar = p.stats.radar + statData.radarINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your radar."});
                }
                else if(req.body.item==="radU" && !canPurchase(shop.radU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="atkU" && canPurchase(shop.atkU.price,inventory) && shop.atkU.canBuy){
                    makePurchase(shop.atkU.price,p);
                    messagedUser = true;
                    p.stats.attackUpgrades++;
                    p.info.shipMass++;
                    p.stats.attack = p.stats.attack + statData.attackINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your radar."});
                }
                else if(req.body.item==="atkU" && !canPurchase(shop.atkU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }


            }

            //Super Shop
            if(shop.withinShop>1 && p.stats.hp>0){
                if(req.body.item==="wallU" && canPurchase(shop.wallU.price,inventory) && shop.wallU.canBuy){
                    makePurchase(shop.wallU.price,p);
                    messagedUser = true;
                    p.stats.wallUpgrades = p.stats.wallUpgrades+statData.wallINC;
                    p.stats.wall = p.stats.wall+statData.wallINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You increased your wall expertise."});
                }
                else if(req.body.item==="wallU" && !canPurchase(shop.wallU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="wallU" && !shop.wallU.canBuy){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You have already maxed your walls."});
                }

                else if(req.body.item==="wall" && canPurchase(shop.wall.price,inventory) && shop.wall.canBuy){
                    makePurchase(shop.wall.price,p);
                    messagedUser = true;
                    p.info.walls++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased a wall."});
                }
                else if(req.body.item==="wall" && !canPurchase(shop.wall.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="wall" && !shop.wall.canBuy){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You can't carry anymore walls."});
                }

                else if(req.body.item==="wall5" && canPurchase(shop.wall5.price,inventory) && shop.wall5.canBuy){
                    makePurchase(shop.wall5.price,p);
                    messagedUser = true;
                    p.info.walls+=5;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased 5 walls."});
                }
                else if(req.body.item==="wall5" && !canPurchase(shop.wall5.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="wall5" && !shop.wall5.canBuy){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You can't carry anymore walls."});
                }

                else if(req.body.item==="wall10" && canPurchase(shop.wall10.price,inventory) && shop.wall10.canBuy){
                    makePurchase(shop.wall10.price,p);
                    messagedUser = true;
                    p.info.walls+=10;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased 10 walls."});
                }
                else if(req.body.item==="wall10" && !canPurchase(shop.wall10.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="wall10" && !shop.wall10.canBuy){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You can't carry anymore walls."});
                }

                else if(req.body.item==="loadout" && canPurchase(shop.loadout.price,inventory) && shop.loadout.canBuy){
                    makePurchase(shop.loadout.price,p);
                    messagedUser = true;
                    p.stats.loadoutSize = p.stats.loadoutSize+statData.loadoutINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You increased your loadout."});
                }
                else if(req.body.item==="loadout" && !canPurchase(shop.loadout.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="loadout" && !shop.loadout.canBuy){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You have already maxed your loadout."});
                }

                else if(req.body.item==="canU" && canPurchase(shop.canU.price,inventory) && shop.canU.canBuy){
                    makePurchase(shop.canU.price,p);
                    messagedUser = true;
                    p.stats.cannonUpgrades++;
                    p.stats.cannon = p.stats.cannon + statData.cannonINC;
                    p.info.shipMass++;
                    if(p.stats.cannonUpgrades==1){
                        p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Cannon."});
                        p.storage.push({"name":"CAN","val":p.stats.cannon});
                    }else{
                        p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Cannon."});
                        updateStorageItem(p,"CAN",p.stats.cannon);
                    }
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"CAN","canUse":false};
                    else if(p.abilitySlots[1].type!=="CAN") p.abilitySlots[0]={"type":"CAN","canUse":false};

                }
                else if(req.body.item==="canU" && !canPurchase(shop.canU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="bliU" && canPurchase(shop.bliU.price,inventory) && shop.bliU.canBuy){
                    makePurchase(shop.bliU.price,p);
                    messagedUser = true;
                    p.stats.blinkUpgrades++;
                    p.stats.blink = p.stats.blink + statData.blinkINC;
                    p.info.shipMass++;
                    if(p.stats.blinkUpgrades==1){
                        p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Blink Module."});
                        p.storage.push({"name":"BLNK","val":p.stats.blink});
                    }else{
                        p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Blink Module."});
                        updateStorageItem(p,"BLNK",p.stats.blink);
                    }
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"BLNK","canUse":false};
                    else if(p.abilitySlots[1].type!=="BLNK") p.abilitySlots[0]={"type":"BLNK","canUse":false};
                }
                else if(req.body.item==="bliU" && !canPurchase(shop.bliU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="steU" && canPurchase(shop.steU.price,inventory) && shop.steU.canBuy){
                    makePurchase(shop.steU.price,p);
                    messagedUser = true;
                    p.stats.stealthUpgrades++;
                    p.stats.stealth = p.stats.stealth + statData.stealthINC;
                    p.info.shipMass++;
                    if(p.stats.stealthUpgrades==1){
                        p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Stealth Module."});
                        p.storage.push({"name":"HIDE","val":p.stats.stealth});
                    }else{
                        p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Stealth Module."});
                        updateStorageItem(p,"HIDE",p.stats.stealth);
                    }
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"HIDE","canUse":false};
                    else if(p.abilitySlots[1].type!=="HIDE") p.abilitySlots[0]={"type":"HIDE","canUse":false};
                }
                else if(req.body.item==="steU" && !canPurchase(shop.steU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="trapU" && canPurchase(shop.trapU.price,inventory) && shop.trapU.canBuy){
                    makePurchase(shop.trapU.price,p);
                    messagedUser = true;
                    p.stats.trapUpgrades++;
                    p.stats.trap = p.stats.trap + statData.trapINC;
                    p.info.shipMass++;
                    if(p.stats.trapUpgrades==1){
                        p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Trap Module."});
                        p.storage.push({"name":"TRAP","val":p.stats.trap});
                    }else{
                        p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Trap Module."});
                        updateStorageItem(p,"TRAP",p.stats.trap);
                    }
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"TRAP","canUse":false};
                    else if(p.abilitySlots[1].type!=="TRAP") p.abilitySlots[0]={"type":"TRAP","canUse":false};
                }
                else if(req.body.item==="trapU" && !canPurchase(shop.trapU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="engModU" && canPurchase(shop.engModU.price,inventory) && shop.engModU.canBuy){
                    makePurchase(shop.engModU.price,p);
                    messagedUser = true;
                    p.stats.engModUpgrades++;
                    p.stats.engMod = p.stats.engMod + statData.engModINC;
                    p.info.shipMass++;
                    if(p.stats.engModUpgrades==1){
                        p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Energy Module."});
                        p.storage.push({"name":"ENG","val":p.stats.engMod});
                    }else{
                        p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Energy Module."});
                        updateStorageItem(p,"ENG",p.stats.engMod);
                    }
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"ENG","canUse":false};
                    else if(p.abilitySlots[1].type!=="ENG") p.abilitySlots[0]={"type":"ENG","canUse":false};
                }
                else if(req.body.item==="engModU" && !canPurchase(shop.engModU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="railU" && canPurchase(shop.railU.price,inventory) && shop.railU.canBuy){
                    makePurchase(shop.railU.price,p);
                    messagedUser = true;
                    p.stats.railgunUpgrades++;
                    p.stats.railgun = p.stats.railgun + statData.railgunINC;
                    p.info.shipMass++;
                    if(p.stats.railgunUpgrades==1){
                        p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Railgun."});
                        p.storage.push({"name":"RAIL","val":p.stats.railgun});
                    }else{
                        p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Railgun."});
                        updateStorageItem(p,"RAIL",p.stats.railgun);
                    }
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"RAIL","canUse":false};
                    else if(p.abilitySlots[1].type!=="RAIL") p.abilitySlots[0]={"type":"RAIL","canUse":false};
                }
                else if(req.body.item==="railU" && !canPurchase(shop.railU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="carryU" && canPurchase(shop.carryU.price,inventory) && shop.carryU.canBuy){
                    makePurchase(shop.carryU.price,p);
                    messagedUser = true;
                    p.stats.urCarryUpgrades++;
                    p.stats.urCarry = p.stats.urCarry + statData.urCarryINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Uranium Carry Capacity."});
                }
                else if(req.body.item==="carryU" && !canPurchase(shop.carryU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="insuranceU" && canPurchase(shop.insuranceU.price,inventory) && shop.insuranceU.canBuy){
                    makePurchase(shop.insuranceU.price,p);
                    messagedUser = true;
                    p.stats.insuranceUpgrades++;
                    p.stats.insurance = p.stats.insurance + statData.insuranceINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Insurance."});
                }
                else if(req.body.item==="insuranceU" && !canPurchase(shop.insuranceU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="scanU" && canPurchase(shop.scanU.price,inventory) && shop.scanU.canBuy){
                    makePurchase(shop.scanU.price,p);
                    messagedUser = true;
                    p.stats.scannerUpgrades++;
                    p.stats.scanner = p.stats.scanner + statData.scannerINC;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Scanner."});
                }
                else if(req.body.item==="scanU" && !canPurchase(shop.scanU.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="statHP" && canPurchase(shop.statHP.price,inventory) && shop.statHP.canBuy){
                    makePurchase(shop.statHP.price,p);
                    messagedUser = true;
                    p.stats.staticHp = true;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Health+ Module."});
                    p.storage.push({"name":"HP+","val":1});
                    p.info.shipMass++;
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"HP+","canUse":false};
                    else if(p.abilitySlots[1].type!=="HP+") p.abilitySlots[0]={"type":"HP+","canUse":false};
                }
                else if(req.body.item==="statHP" && !canPurchase(shop.statHP.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="statEng" && canPurchase(shop.statEng.price,inventory) && shop.statEng.canBuy){
                    makePurchase(shop.statEng.price,p);
                    messagedUser = true;
                    p.stats.staticEng = true;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Energy+ Module."});
                    p.storage.push({"name":"ENG+","val":1});
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"ENG+","canUse":false};
                    else if(p.abilitySlots[1].type!=="ENG+") p.abilitySlots[0]={"type":"ENG+","canUse":false};
                }
                else if(req.body.item==="statEng" && !canPurchase(shop.statEng.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="statAtk" && canPurchase(shop.statAtk.price,inventory) && shop.statAtk.canBuy){
                    makePurchase(shop.statAtk.price,p);
                    messagedUser = true;
                    p.stats.staticAtk = true;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Attack+ Module."});
                    p.storage.push({"name":"ATK+","val":1});
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"ATK+","canUse":false};
                    else if(p.abilitySlots[1].type!=="ATK+") p.abilitySlots[0]={"type":"ATK+","canUse":false};
                }
                else if(req.body.item==="statAtk" && !canPurchase(shop.statAtk.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="statRdr" && canPurchase(shop.statRdr.price,inventory) && shop.statRdr.canBuy){
                    makePurchase(shop.statRdr.price,p);
                    messagedUser = true;
                    p.stats.staticRdr = true;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Radar+ Module."});
                    p.storage.push({"name":"RDR+","val":1});
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"RDR+","canUse":false};
                    else if(p.abilitySlots[1].type!=="RDR+") p.abilitySlots[0]={"type":"RDR+","canUse":false};
                }
                else if(req.body.item==="statRdr" && !canPurchase(shop.statRdr.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="statDR" && canPurchase(shop.statDR.price,inventory) && shop.statDR.canBuy){
                    makePurchase(shop.statDR.price,p);
                    messagedUser = true;
                    p.stats.staticDR = true;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased the DR Module."});
                    p.storage.push({"name":"DR","val":1});
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"DR","canUse":false};
                    else if(p.abilitySlots[1].type!=="DR") p.abilitySlots[0]={"type":"DR","canUse":false};
                }
                else if(req.body.item==="statDR" && !canPurchase(shop.statDR.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="quickHeal" && canPurchase(shop.quickHeal.price,inventory) && shop.quickHeal.canBuy){
                    makePurchase(shop.quickHeal.price,p);
                    messagedUser = true;
                    p.stats.quickHeal = true;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased a Quick Heal."});
                    p.storage.push({"name":"HEAL","val":1});
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"HEAL","canUse":false};
                    else if(p.abilitySlots[1].type!=="HEAL") p.abilitySlots[0]={"type":"HEAL","canUse":false};
                }
                else if(req.body.item==="quickHeal" && !canPurchase(shop.quickHeal.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="uranium" && canPurchase(shop.uranium.price,inventory) && shop.uranium.canBuy){
                    makePurchase(shop.uranium.price,p);
                    messagedUser = true;
                    p.info.uranium = p.info.uranium + 1;
                    p.info.totalUranium = p.info.totalUranium + 1;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased uranium."});
                }
                else if(req.body.item==="uranium" && !canPurchase(shop.uranium.price,inventory)){
                    messagedUser = true;
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }


                //Check for Changes
                if(isEquipped(p,"RDR+")){
                    p.stats.radar = statData.radarStart+(statData.radarINC*p.stats.radarUpgrades);
                }else{
                    p.stats.radar = statData.radarStart+(statData.radarINC*(p.stats.radarUpgrades-1));
                }

                if(isEquipped(p,"HP+")){
                    p.stats.hpMAX = statData.hpStart+(statData.hpINC*p.stats.hpUpgrades)+5;
                }else{
                    p.stats.hpMAX = statData.hpStart+(statData.hpINC*(p.stats.hpUpgrades));
                    if(p.stats.hp > p.stats.hpMAX) p.stats.hp = p.stats.hpMAX;
                }

                if(isEquipped(p,"ENG+")){
                    p.stats.energyMAX = statData.energyStart+(statData.energyINC*p.stats.energyUpgrades)+5;
                }else{
                    p.stats.energyMAX = statData.energyStart+(statData.energyINC*(p.stats.energyUpgrades));
                    if(p.stats.energy > p.stats.energyMAX) p.stats.energy = p.stats.energyMAX;
                }

                if(!isEquipped(p,"HIDE"))
                    p.info.stealthed = false;
            }


            if(!messagedUser && p.stats.hp>0){
                p.battleLog.unshift({"type":"action", "msg": "You can't purchase that."});
            }
            else if(p.stats.hp<=0){
                p.battleLog.unshift({"type":"action", "msg": "You can't purchase stuff while dead."});
            }
        }
        res.send('');

    });
    app.post('/changeLoadout', function(req, res){
        //Get info
        var token = req.body.token;
        var id = req.body.id;
        var slot = req.body.slot;
        var item = req.body.item;

        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null && item!=null && slot!=null){
            if(p.stats.hp > 0 && withinShop(p.loc, p.info.teamID)>1){
                if(slot == 1 && p.stats.loadoutSize<2){ //Don't have slot
                    p.battleLog.unshift({"type":"action", "msg": "You don't have that slot unlocked yet."});
                }
                else{
                    //Check if valid option, and apply
                    var valid = false;
                    for(var i = 0; i < p.storage.length; i++){
                        if(item===p.storage[i].name){
                            valid = true;
                            if(slot==0 && p.abilitySlots[1].type===item) p.abilitySlots[1]={"type":"NONE","canUse":false};
                            else if(slot==1 && p.abilitySlots[0].type===item) p.abilitySlots[0]={"type":"NONE","canUse":false};
                            p.abilitySlots[slot]={"type":item,"canUse":false};
                            p.battleLog.unshift({"type":"action", "msg": "You equipped "+p.storage[i].name+" in slot "+slot+"."});

                            //Check for Changes
                            if(isEquipped(p,"RDR+")){
                                p.stats.radar = statData.radarStart+(statData.radarINC*p.stats.radarUpgrades);
                            }else{
                                p.stats.radar = statData.radarStart+(statData.radarINC*(p.stats.radarUpgrades-1));
                            }

                            if(isEquipped(p,"HP+")){
                                p.stats.hpMAX = statData.hpStart+(statData.hpINC*p.stats.hpUpgrades)+5;
                            }else{
                                p.stats.hpMAX = statData.hpStart+(statData.hpINC*(p.stats.hpUpgrades));
                                if(p.stats.hp > p.stats.hpMAX) p.stats.hp = p.stats.hpMAX;
                            }

                            if(isEquipped(p,"ENG+")){
                                p.stats.energyMAX = statData.energyStart+(statData.energyINC*p.stats.energyUpgrades)+5;
                            }else{
                                p.stats.energyMAX = statData.energyStart+(statData.energyINC*(p.stats.energyUpgrades));
                                if(p.stats.energy > p.stats.energyMAX) p.stats.energy = p.stats.energyMAX;
                            }

                            if(!isEquipped(p,"HIDE"))
                                p.info.stealthed = false;


                            break;
                        }
                    }
                    if(!valid){
                        p.battleLog.unshift({"type":"action", "msg": "You can't cheat me bitch."});
                        // p.stats.hp--;
                    }
                }

            }
            else{
                p.battleLog.unshift({"type":"action", "msg": "You can't change loadout while dead."});
            }
        }

        res.send('');
    });
    app.post('/postChatMsg', function(req, res){
        var token = req.body.token;
        var id = req.body.id;
        var msg = req.body.msg;
        var type = req.body.type;

        if(msg!==""){
            var p;
            if(players[id].status!=="OFFLINE")
                if(players[id].token===token)
                    p = players[id];

            if(p!=null){
                if(type==="TEAM")
                    messageGroup(teamData[p.info.teamID].members,msg,"","tchat",p);
                else
                    messageGroup(players,msg,"","chat",p);
            }
        }
        res.send('');
    });

    app.post('/createTeam', function(req, res){
        var token = req.body.token;
        var id = req.body.id;
        var teamName = req.body.teamName;
        var areaColor = req.body.areaColor;
        var baseColor = req.body.baseColor;
        var baseShape = req.body.baseShape;

        if(token!=='' && teamName.length>3 && areaColor!=='' && baseColor!=='' && baseShape !== ''){
            //Validate token
            var p;
            if(players[id].status!=="OFFLINE")
                if(players[id].token===token)
                    p = players[id];

            var valid = teamValidation(baseColor, areaColor, teamName);
            if(p!=null && valid == true){
                var tid = teamData.length;
                teamData.push({
                    "id": tid,
                    "name": teamName,
                    "colors":{
                        "baseColor": baseColor,
                        "areaColor": areaColor,
                        "baseShape": baseShape
                    },
                    "leader": {
                        "token": p.token,
                        "id": p.id,
                        "name": p.info.name,
                        "powerLevel": p.info.powerLevel,
                        "online": true
                    },
                    "admins": [],
                    "members": [],
                    "vault":{
                        "gold":0,
                        "credits":0,
                        "iron":0,
                        "uranium":0
                    },
                    "income": {
                        "gold": 0,
                        "credits": 0,
                        "iron": 0,
                        "uranium": 0
                    },
                    "rank": 9999,
                    "power": 0,
                    "Objective": -1,
                    "settings":{
                        "building": "TEAM",
                        "ping": "ADMIN",
                        "upgrading": "ADMIN",
                        "membership": "INVITE",
                        "profitDivide": "FAIR",
                        "tax": 0
                    }
                });

                //Merge previous team
                if(p.info.teamID > -1 && p.info.teamRole==="LEADER")
                    mergeTeams(p.info.teamID, tid, p);
                else{
                    //Remove from previous team
                    if(p.info.teamID>-1)
                        removeFromTeam(p.id, p.info.teamID, "LEAVE");

                    teamData[tid].members.push({
                        "token": p.token,
                        "id": p.id,
                        "name": p.info.name,
                        "powerLevel": p.info.powerLevel,
                        "online": true
                    });
                }


                p.info.teamID = tid;
                p.info.teamRole = "LEADER";

                p.battleLog.unshift({"type":"team", "msg": "You created the team "+teamData[tid].name+"! Good Luck!"});

                saveGameData();
            }
            else if(p!=null){
                //TODO: Error messaging
            }
        }

        res.send('');
    });
    app.post('/joinTeam', function(req, res){
        var token = req.body.token;
        var id = req.body.id;
        var teamID = req.body.tid;
        var type = req.body.type; //merge, split, none

        //Validate token
        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            var setting = teamData[teamID].settings.membership;
            var hasInvite = false;

            for(var inv in p.invites){
                if(p.invites[inv].id===teamID){
                    hasInvite = true;
                    break;
                }
            }

            if((setting==="OPEN" || hasInvite) && teamID!=p.info.teamID && p.info.joinTokens > 0){
                if(type==="MERGE" || (p.info.teamRole==="LEADER" && type==="none")){ //Merge Teams together
                    mergeTeams(p.info.teamID,teamID,p);
                }
                else {
                    if(type==="SPLIT"){
                        //Select new leader
                        if(teamData[p.info.teamID].admins.length>0){
                            var r = parseInt(Math.random()*100)%teamData[p.info.teamID].admins.length;
                            changeRole(teamData[p.info.teamID].admins[r].id, p.info.teamID, "ADMIN", "LEADER");
                            messageGroup(teamData[p.info.teamID].members,
                                         teamData[p.info.teamID].admins[r].name+" is now the leader.",
                                         "", "team", null);
                        }
                        else while(true && teamData[p.info.teamID].members.length>0){
                            var r = parseInt(Math.random()*1000)%teamData[p.info.teamID].members.length;

                            if(teamData[p.info.teamID].members[r].id!==teamData[p.info.teamID].leader.id){
                                changeRole(teamData[p.info.teamID].members[r].id, p.info.teamID, "MEMBER", "LEADER");
                                messageGroup(teamData[p.info.teamID].members,
                                             teamData[p.info.teamID].members[r].name+" is now the leader.",
                                             "", "team", null);
                                break;
                            }
                        }
                    }

                    //Remove from previous team
                    if(p.info.teamID>-1)
                        removeFromTeam(p.id, p.info.teamID, "LEAVE");

                    //Move to new team
                    p.info.teamID = teamID;
                    p.info.teamRole = "MEMBER";
                    p.info.joinTokens--;
                    teamData[teamID].members.push({
                        "token": p.token,
                        "id": p.id,
                        "name": p.info.name,
                        "powerLevel": p.info.powerLevel,
                        "online": true
                    });

                    messageGroup(teamData[teamID].members,
                                 p.info.name+" has joined the team!",
                                 "You are now a member of "+teamData[teamID].name+".",
                                 "team", p);
                }

                if(hasInvite){
                    for(var inv = 0; inv < p.invites.length; inv++){
                        if(p.invites[inv].id===teamID){
                            p.invites.splice(inv,1);
                            inv--;
                        }
                    }
                }
            }
            else if(teamID == p.info.teamID){
                var msg = {"type":"action", "msg": "You are already apart of that team."};
                p.battleLog.unshift(msg);
            }
            else if(setting!=="OPEN" && !hasInvite){
                var msg = {"type":"action", "msg": "You can't join this team without an invite."};
                p.battleLog.unshift(msg);
            }
            else if(p.info.joinTokens <= 0){
                var msg = {"type":"action", "msg": "You have joined to many teams recently. You will have to wait to join. You can still create your own team though."};
                p.battleLog.unshift(msg);
            }
        }

        res.send('');
    });
    app.post('/updateTeamSettings',function(req, res){
        var token = req.body.token;
        var id = req.body.id;

        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            if(p.info.teamRole==='LEADER'){
                teamData[p.info.teamID].settings = req.body.settings;
                messageGroup(teamData[p.info.teamID].members,"Team settings were changed","","team",null);
            }
        }

        res.send('');
    });
    app.post('/promote', function(req,res){
        var token = req.body.token;
        var id = req.body.id;
        var target = req.body.target;

        //Validate token
        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            if(p.info.teamRole==="LEADER"){
                var tid = p.info.teamID;
                var adm = false;
                var mem;
                for(var a in teamData[tid].admins){
                    if(teamData[tid].admins[a].id===target){
                        mem = teamData[tid].admins[a];
                        adm = true;
                        break;
                    }
                }

                if(adm){
                    changeRole(mem.id,tid,"ADMIN","LEADER");
                    changeRole(p.id,tid,"LEADER","ADMIN");
                    messageGroup(teamData[tid].members,mem.name+" has been promoted to leader.","","team",null);
                }
                else{
                    var found = false;
                    for(var m in teamData[tid].members){
                        if(teamData[tid].members[m].id===target){
                            mem = teamData[tid].members[m];
                            found = true;
                            break;
                        }
                    }

                    if(found){
                        //Promote to admin
                        changeRole(mem.id,tid,"MEMBER","ADMIN");
                        messageGroup(teamData[tid].members,mem.name+" has been promoted to admin.","","team",null);
                    }
                    else{
                        var msg = {"type":"action", "msg": "Can't find member to promote."};
                        p.battleLog.unshift(msg);
                    }
                }
            }
            else{
                var msg = {"type":"action", "msg": "You can't cheat me bitch. You know you can't promote people."};
                p.battleLog.unshift(msg);
            }
        }

        res.send('');
    });
    app.post('/demote', function(req,res){
        var token = req.body.token;
        var id = req.body.id;
        var target = req.body.target;

        //Validate token
        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            if(p.info.teamRole==="LEADER"){
                var tid = p.info.teamID;
                var adm = false;
                var mem;
                for(var a in teamData[tid].admins){
                    if(teamData[tid].admins[a].id===target){
                        mem = teamData[tid].admins[a];
                        adm = true;
                        break;
                    }
                }

                if(adm){
                    changeRole(mem.id,tid,"ADMIN","MEMBER");
                    messageGroup(teamData[tid].members,mem.name+" has been demoted.","","team",null);
                }
                else{
                    var msg = {"type":"action", "msg": "You can't demote people of no rank. Even if you want to."};
                    p.battleLog.unshift(msg);
                }

            }
            else{
                var msg = {"type":"action", "msg": "You can't cheat me bitch. You know you can't demote people."};
                p.battleLog.unshift(msg);
            }
        }

        res.send('');
    });
    app.post('/remove', function(req,res){
        var token = req.body.token;
        var id = req.body.id;
        var target = req.body.target;

        //Validate token
        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            if(p.info.teamRole!=="MEMBER"){
                var tid = p.info.teamID;
                var adm = false;
                var mem;
                for(var a in teamData[tid].admins){
                    if(teamData[tid].admins[a].id===target){
                        mem = {
                            "id":teamData[tid].admins[a].id,
                            "name":teamData[tid].admins[a].name};
                        adm = true;
                        break;
                    }
                }

                if(adm && p.info.teamRole==="LEADER"){
                    removeFromTeam(mem.id,tid,"KICK");
                    messageGroup(teamData[tid].members,mem.name+" has been kicked.","","team",null);
                }
                else if(adm){
                    var msg = {"type":"action", "msg": "You can't kick people of the same rank."};
                    p.battleLog.unshift(msg);
                }
                else{
                    var found = false;
                    for(var m in teamData[tid].members){
                        if(teamData[tid].members[m].id===target){
                            mem = {
                                "id":teamData[tid].members[m].id,
                                "name":teamData[tid].members[m].name};
                            found = true;
                            break;
                        }
                    }

                    if(found){
                        removeFromTeam(mem.id,tid,"KICK");
                        messageGroup(teamData[tid].members,mem.name+" has been kicked.","","team",null);
                    }
                    else{
                        var msg = {"type":"action", "msg": "Can't find member to kick."};
                        p.battleLog.unshift(msg);
                    }
                }
            }
            else{
                var msg = {"type":"action", "msg": "You can't cheat me bitch. You know you can't kick people."};
                p.battleLog.unshift(msg);
            }
        }

        res.send('');
    });
    app.post('/invite', function(req,res){
        var token = req.body.token;
        var id = req.body.id;
        var target = req.body.target;

        //Validate token
        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            var setting = teamData[p.info.teamID].settings.membership;
            if((p.info.teamRole!=="MEMBER" || (p.info.teamRole==="MEMBER" && setting!=="AD INV")) && p.info.teamID>-1){
                if(players[target].status!=="OFFLINE"){
                    if(players[target].info.teamID != p.info.teamID && players[target].info.joinTokens>0){
                        players[target].invites.push({
                            "id": p.info.teamID,
                            "invID": p.id
                        });

                        var msg = {"type":"action", "msg": "You invited "+players[target].info.name+" to join the team."};
                        p.battleLog.unshift(msg);
                    }
                    else if(players[target].info.joinTokens <= 0){
                        var msg = {"type":"action", "msg": "That person has join too many teams recently and can't be invited."};
                        p.battleLog.unshift(msg);
                    }
                    else{
                        var msg = {"type":"action", "msg": "That person is already on your team"};
                        p.battleLog.unshift(msg);
                    }
                }
            }
            else{
                var msg = {"type":"action", "msg": "You can't invite people to join the team."};
                p.battleLog.unshift(msg);
            }
        }

        res.send('');
    });
    app.post('/declineInvite', function(req, res){
        var token = req.body.token;
        var id = req.body.id;
        var tid = req.body.tid;

        //Validate token
        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            for(var inv = 0; inv < p.invites.length; inv++){
                if(p.invites[inv].id===tid){
                    if(players[p.invites[inv].invID].status!=="OFFLINE"){
                        players[p.invites[inv].invID].battleLog.unshift({"type":"action", "msg": p.info.name+" declined your invite."});
                    }

                    p.invites.splice(inv,1);
                    inv--;
                }
            }
        }

        res.send('');
    });
    app.post('/setObjective', function(req, res){
        var token = req.body.token;
        var id = req.body.id;
        var baseID = req.body.baseID;

        //Validate token
        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            if(teamData[p.info.teamID].objective!=baseID){
                if(p.info.teamRole==="LEADER" ||
                   p.info.teamRole==="ADMIN" && teamData[p.info.teamID].settings.ping!=="LEADER" ||
                   p.info.teamRole==="MEMBER" && teamData[p.info.teamID].settings.ping==="TEAM"){
                    teamData[p.info.teamID].objective = baseID;
                    var msg;
                    if(baseID>-1){
                        var type = (baseList[teamData[p.info.teamID].objective].owner==p.info.teamID?"DEFEND":"CAPTURE");
                        msg = "The objective hase been set to "+type+" BASE "+baseID+". Check your map for more details.";
                    }
                    else{
                        msg = "The team's objective has been removed."
                    }

                    messageGroup(teamData[p.info.teamID].members,
                                 msg, "You changed the team's objective.", "team", p);
                }
                else{
                    p.battleLog.unshift({"type":"action", "msg": "You can't set an objective."});
                }
            }
        }

        res.send('');
    });
    app.post('/upgradeBase', function(req,res){
        var token = req.body.token;
        var id = req.body.id;
        var baseID = req.body.baseID;

        //Validate token
        var p;
        if(players[id].status!=="OFFLINE")
            if(players[id].token===token)
                p = players[id];

        if(p!=null){
            if(p.info.teamRole==="LEADER" || p.info.teamRole==="ADMIN" && teamData[p.info.teamID].upgrading!=="LEADER"){
                if(baseList[baseID].owner===p.info.teamID){
                    if(canPurchaseBaseUpgrade(baseID,p.info.teamID)){
                        makePurchaseBaseUpgrade(baseID,p.info.teamID);
                        messageGroup(teamData[p.info.teamID].members,
                                     "Base "+baseID+" is now being upgraded. Be prepared to defend it!",
                                     "You started the upgrade for Base "+baseID+". Be prepared to defend it!", "team", p);
                    }
                    else{
                        p.battleLog.unshift({"type":"action", "msg": "Your team needs more resources to upgrade Base "+baseID+"."});
                    }
                }
                else{
                    p.battleLog.unshift({"type":"action", "msg": "I'm not sure why you need to know this, but you can't upgrade enemy bases."});
                }
            }
            else{
                p.battleLog.unshift({"type":"action", "msg": "You can't cheat me bitch. You can't upgrade bases."});
            }
        }

        res.send('');
    });


    app.get('/map',function(req, res){
        var sendMap = [];
        for(var x = 0; x < mapSize; x++){
            sendMap[x] = [];
            for(var y = 0; y < mapSize; y++){
                var colors = null;
                if(map[x][y].baseID > -1){
                    if(baseList[map[x][y].baseID].owner>-1){
                        colors = teamData[baseList[map[x][y].baseID].owner].colors;
                    }
                    else{
                        colors = {
                            "baseColor": "#666",
                            "areaColor": "#666",
                            "baseShape": "DIAMOND"
                        };
                    }
                }

                sendMap[x][y] = {
                    "type": map[x][y].type,
                    "baseID": map[x][y].baseID,
                    "colors": colors
                };

                if(sendMap[x][y].type==="WALL"){
                    sendMap[x][y]["lvl"] = wallList[sendMap[x][y].id].lvl;
                }
                else if(sendMap[x][y].type==="BASE"){
                    sendMap[x][y]["lvl"] = baseList[sendMap[x][y].baseID].lvl;
                }

            }
        }

        res.send(sendMap);
    });
    app.get('/leaderboard',function(req, res){
        res.send(rankPlayers());
    });
    app.get('/teamLeaderboard',function(req, res){
        var nameToPower = [];

        for(var t in teamData){
            if(teamData[t].status!=="DELETED")
                nameToPower.push({"name":teamData[t].name, "power":teamData[t].power});
        }

        nameToPower.sort(function(a,b){
            if(a.power > b.power) return -1;
            if(a.power < b.power) return 1;
            return 0;
        });

        res.send(nameToPower);
    });
    app.get('/changelog', function (req, res) {
        jsonfile.readFile("data/changelog.json", function(err, obj) {
            if(err){
                console.log(err);
                res.send({"error": "Unable to get Changelog"});
            }
            res.send(obj);
        });
    });
    app.get('/wikiInfo',function(req, res){
        jsonfile.readFile("data/wiki.json", function(err, obj) {
            if(err){
                console.log(err);
                res.send({"error": "Unable to get Wiki Info"});
            }
            res.send(obj);
        });
    });
    app.get('/feedback',function(req, res){
        res.send(feedback);
    });
    app.post('/userFeedback',function (req, res){
        var id = feedback.length;
        var newFeedback = {
            "id": id,
            "type": req.body.type,
            "title":req.body.title,
            "desc":req.body.desc
        }

        feedback.push(newFeedback);
        res.send('');
    });

    //**************************************************************************
    //Webpages
    //**************************************************************************
    app.get('/game', function (req, res) {
        // console.log("Got a GET request for the Game page");
        res.sendFile( __dirname + "/public/game.html" );
    });
    app.get('/wiki', function (req, res) {
        // console.log("Got a GET request for the Wiki page");
        res.sendFile( __dirname + "/public/wiki.html" );
    });
    app.get('/home', function (req, res) {
        // console.log("Got a GET request for the home page");
        res.sendFile( __dirname + "/public/home.html" );
    });
    app.get('/admin', function (req, res) {
        // console.log("Got a GET request for the admin page");
        res.sendFile( __dirname + "/public/admin.html" );
    });
    app.get('/ideas', function (req, res) {
        // console.log("Got a GET request for the Game page");
        res.sendFile( __dirname + "/public/ideas.html" );
    });
    app.get('/log', function (req, res) {
        // console.log("Got a GET request for the Change Log page");
        res.sendFile( __dirname + "/public/log.html" );
    });
    app.get('*', function (req, res) {
        res.sendFile( __dirname + "/public/home.html" );
    });
    app.get('/*', function (req, res) {
        //console.log("Got a GET request to get rick rolled");
        res.sendFile( __dirname + "/public/roll.html" );
    });


    var server = app.listen(port, function () {
        var host = server.address().address;
        var port = server.address().port;

        console.log("App listening at http://%s:%s", host, port);
    });
}

//******************************************************************************
// Round Action Functions
//******************************************************************************
function setupPhase(){
    countdown -= 1;
    if(countdown<=-1){
        phase = 1;
        countdown = countdownMax;
        var actAttacks = [];
        for(var i = 0; i < players.length; i++){
            if(players[i].status!=="OFFLINE"){
                for(var a = players[i].queue.length; a < 3; a++){
                    players[i].queue.push({"type":"HOLD"});
                }
                if(players[i].queue.length>0){ //Next round attacks
                    if(players[i].queue[0].type==="ATTACK" )
                        actAttacks.push(players[i].queue[0].location);
                    else if(players[i].queue[0].type==="CANNON" && (players[i].queue.length == 1 || players[i].queue[1].type!=="CANNON")){
                        var range = (p.stats.cannon>1?5:3);
                        var mid = parseInt(range/2);
                        for(var x = 0; x < range; x++){
                            for(var y = 0; y < range; y++){
                                var cX = location[0] - (mid-x);
                                var cY = location[1] - (mid-y);

                                if(cX < 0) cX += mapSize;
                                if(cY < 0) cY += mapSize;
                                if(cX >= mapSize) cX -= mapSize;
                                if(cY >= mapSize) cY -= mapSize;

                                actAttacks.push([cX,cY]);
                            }
                        }
                    }
                    else if(players[i].queue[0].type==="RAILGUN" && (players[i].queue.length == 1 || players[i].queue[1].type!=="RAILGUN")){
                        if(direction==="N"){
                            for(var i = 1; i <= railgunRange; i++){
                                var newY = players[i].loc[1]-i;
                                if(newY < 0) newY += mapSize;
                                actAttacks.push([players[i].loc[0],newY]);
                            }
                        }else if(direction==="E"){
                            for(var i = 1; i <= railgunRange; i++){
                                actAttacks.push([(players[i].loc[0]+i)%mapSize,players[i].loc[1]]);
                            }
                        }else if(direction==="S"){
                            for(var i = 1; i <= railgunRange; i++){
                                actAttacks.push([players[i].loc[0],(players[i].loc[1]+i)%mapSize]);
                            }
                        }else if(direction==="W"){
                            for(var i = 1; i <= railgunRange; i++){
                                var newX = players[i].loc[0]-i;
                                if(newX < 0) newX += mapSize;
                                actAttacks.push([newY,players[i].loc[1]]);
                            }
                        }
                    }
                }
                for(var a = 0; a < players[i].scanned.length; a++){
                    players[i].scanned[a].rounds--;
                    if(players[i].scanned[a].rounds==0){
                        players[i].scanned.splice(a,1);
                        a--;
                    }
                }
            }
        }

        //Determine base attacks
        for(var b in baseList){
            if(baseList[b].targets.length > 0 && baseList[b].canAttack){
                baseList[b].actTargets = [];
                for(var a = 0; a < baseList[b].attacks[phase-1] && baseList[b].targets.length > 0; a++){
                    var r = parseInt(Math.random()*1000)%baseList[b].targets.length;
                    if(players[baseList[b].targets[r].id].status!=="OFFLINE"){
                        var loc = [players[baseList[b].targets[r].id].loc[0], players[baseList[b].targets[r].id].loc[1]];

                        var canHit = attackDistance(baseList[b].loc, loc); //Check attack range

                        if(canHit){
                            actAttacks.push(loc);
                            baseList[b].actTargets.push(loc);
                        }
                    }
                    else{
                        baseList[b].targets.splice(r,1);
                        a--;
                    }
                }
            }
        }

        //Show attacks that are coming
        for(var i = 0; i < players.length; i++){
            if(players[i].status!=="OFFLINE")
                players[i].activeAttacks = actAttacks;
        }

        setTimeout(function(){actionPhase()},aTick);
    }
    else{
        setTimeout(function(){setupPhase();},cTick);
    }
}

function actionPhase(){
    var moves = [], attacks = [], loots = [], scans = [], heals=[], engMods=[],
        stealths=[], destealths=[], cannons = [], railguns =[], blinks=[], traps=[],
        bAtks = [], walls = [];
    var actAttacks = [];

    //Grab all actions
    for(var i = 0; i < players.length; i++){
        if(players[i].status!=="OFFLINE"){
            players[i].activeAttacks = [];
            if(players[i].stats.hp>0 && players[i].queue[0]!=null){
                if(players[i].queue[0].type==="MOVE" && players[i].info.trapped<1){
                    moves.push({"player":players[i],"direction":players[i].queue[0].direction});
                }else if(players[i].queue[0].type==="BLINK" && players[i].info.trapped<1){
                    blinks.push({"player":players[i],"location":players[i].queue[0].location});
                }else if(players[i].queue[0].type==="WALL"){
                    walls.push({"player":players[i],"location":players[i].queue[0].location});
                }else if(players[i].queue[0].type==="ATTACK" ){
                    attacks.push({"player":players[i], "location":players[i].queue[0].location});
                }else if(players[i].queue[0].type==="CANNON"  && (players[i].queue.length == 1 || players[i].queue[1].type!=="CANNON")){
                    cannons.push({"player":players[i], "location":players[i].queue[0].location});
                }else if(players[i].queue[0].type==="RAILGUN" && (players[i].queue.length == 1 || players[i].queue[1].type!=="RAILGUN")){
                    railguns.push({"player":players[i], "direction":players[i].queue[0].direction});
                }else if(players[i].queue[0].type==="LOOT" && (players[i].queue.length == 1 || players[i].queue[1].type!=="LOOT")){
                    loots.push(players[i]);
                }else if(players[i].queue[0].type==="TRAP" && (players[i].queue.length == 1 || players[i].queue[1].type!=="TRAP")){
                    traps.push(players[i]);
                }else if(players[i].queue[0].type==="SCAN" && players[i].queue.length == 1){
                    scans.push(players[i]);
                }else if(players[i].queue[0].type==="STEALTH" && players[i].queue.length == 1){
                    stealths.push(players[i]);
                }else if(players[i].queue[0].type==="DESTEALTH"){
                    destealths.push(players[i]);
                }else if(players[i].queue[0].type==="QUICKHEAL"){
                    heals.push(players[i]);
                }else if(players[i].queue[0].type==="ENERGY"){
                    engMods.push(players[i]);
                }else if(players[i].queue[0].type==="HOLD" && players[i].stats.energy < players[i].stats.energyMAX){
                    players[i].stats.energy=players[i].stats.energy+statData.energyReg*(players[i].info.inCombat>0?1:2);
                    if (players[i].stats.energy > players[i].stats.energyMAX)
                        players[i].stats.energy = players[i].stats.energyMAX;
                }else if(players[i].info.trapped>1 && (players[i].queue[0].type==="MOVE" || players[i].queue[0].type==="BLINK")){
                    players[i].battleLog.unshift({"type":"action", "msg": "You can't move while trapped."});
                }

                players[i].queue.splice(0,1); //pop from queue

                if(players[i].queue.length>0){ //Next round attacks
                    if(players[i].queue[0].type==="ATTACK" )
                        actAttacks.push(players[i].queue[0].location);
                    else if(players[i].queue[0].type==="CANNON" && (players[i].queue.length == 1 || players[i].queue[1].type!=="CANNON")){
                        var range = (players[i].stats.cannon>1?5:3);
                        var mid = parseInt(range/2);
                        for(var x = 0; x < range; x++){
                            for(var y = 0; y < range; y++){
                                var cX = players[i].queue[0].location[0] - (mid-x);
                                var cY = players[i].queue[0].location[1] - (mid-y);

                                if(cX < 0) cX += map.length;
                                if(cY < 0) cY += map.length;
                                if(cX >= map.length) cX -= map.length;
                                if(cY >= map.length) cY -= map.length;

                                actAttacks.push([cX,cY]);
                            }
                        }
                    }
                    else if(players[i].queue[0].type==="RAILGUN" && (players[i].queue.length == 1 || players[i].queue[1].type!=="RAILGUN")){
                        if(players[i].queue[0].direction==="N"){
                            for(var r = 1; r <= railgunRange; r++){
                                var newY = players[i].loc[1]-r;
                                if(newY < 0) newY += mapSize;
                                actAttacks.push([players[i].loc[0],newY]);
                            }
                        }else if(players[i].queue[0].direction==="E"){
                            for(var r = 1; r <= railgunRange; r++){
                                actAttacks.push([(players[i].loc[0]+r)%mapSize,players[i].loc[1]]);
                            }
                        }else if(players[i].queue[0].direction==="S"){
                            for(var r = 1; r <= railgunRange; r++){
                                actAttacks.push([players[i].loc[0],(players[i].loc[1]+r)%mapSize]);
                            }
                        }else if(players[i].queue[0].direction==="W"){
                            for(var r = 1; r <= railgunRange; r++){
                                var newX = players[i].loc[0]-r;
                                if(newX < 0) newX += mapSize;
                                actAttacks.push([newY,players[i].loc[1]]);
                            }
                        }
                    }
                }
            }
        }
    }

    //Push base attacks and determine next rounds attacks
    for(var b in baseList){
        if(baseList[b].canAttack){
            for(var a = 0; a < baseList[b].actTargets.length; a++){
                bAtks.push({"loc":baseList[b].actTargets[a], "dmg": baseList[b].lvl, "baseID":baseList[b].id});
            }
            baseList[b].actTargets = [];
            if(baseList[b].targets.length > 0 && phase < 3){
                for(var a = 0; a < baseList[b].attacks[phase] && baseList[b].targets.length > 0; a++){
                    var r = parseInt(Math.random()*1000)%baseList[b].targets.length;
                    if(players[baseList[b].targets[r].id].status!=="OFFLINE"){
                        var loc = [players[baseList[b].targets[r].id].loc[0], players[baseList[b].targets[r].id].loc[1]];

                        var canHit = attackDistance(baseList[b].loc, loc); //Check attack range

                        if(canHit){
                            actAttacks.push(loc);
                            baseList[b].actTargets.push(loc);
                        }
                    }
                    else{

                        baseList[b].targets.splice(r,1);
                        a--;
                    }
                }
            }
        }
    }

    //send active Attacks
    for(var i = 0; i < players.length; i++){
        if(players[i].status!=="OFFLINE")
            players[i].activeAttacks = actAttacks;
    }

    //Perform actions in order
    // var order = [moves,attacks,heals,engMods,destealths,scans,stealths];
    for(var i = 0; i < walls.length; i++)
        placeWall(walls[i].player,walls[i].location);
    for(var i = 0; i < blinks.length; i++)
        blink(blinks[i].player,blinks[i].location);
    for(var i = 0; i < moves.length; i++)
        move(moves[i].player,moves[i].direction);

    for(var i = 0; i < attacks.length; i++)
        attack(attacks[i].player,attacks[i].location);
    for(var i = 0; i < bAtks.length; i++)
        baseAttack(bAtks[i].loc, bAtks[i].dmg, bAtks[i].baseID);
    for(var i = 0; i < cannons.length; i++)
        cannon(cannons[i].player,cannons[i].location);
    for(var i = 0; i < railguns.length; i++)
        railgun(railguns[i].player,railguns[i].direction);

    for(var i = 0; i < heals.length; i++)
        quickHeal(heals[i]);
    for(var i = 0; i < engMods.length; i++)
        energyMod(engMods[i]);
    for(var i = 0; i < destealths.length; i++)
        destealth(destealths[i]);

    for(var i = 0; i < loots.length; i++)
        loot(loots[i]);
    for(var i = 0; i < scans.length; i++)
        scan(scans[i]);
    for(var i = 0; i < stealths.length; i++)
        stealth(stealths[i]);
    for(var i = 0; i < traps.length; i++)
        trap(traps[i]);


    //Increment timer
    phase = (phase+1)%4;
    if(phase == 0){
        roundCleanup();
        setTimeout(function(){setupPhase();},cTick);
    }
    else{
        setTimeout(function(){actionPhase()},aTick);
    }
}

function roundCleanup(){
    saveCountdown++;
    profitCountdown = (profitCountdown+1)%profitCountdownMax;
    canDelete = false;

    //Refresh energy levels and clear queues
    for(var i = 0; i < players.length; i++){
        if(players[i].status!=="OFFLINE"){
            //disconnect lost players
            players[i].info.connected++;
            if(players[i].info.connected >= dcCountdown){
                console.log("User "+players[i].info.name+" disconnected.");
                var msg = {"type":"server", "msg": ""+players[i].info.name+" has disconnected."};
                for(var m = 0; m < players.length; m++){
                    if(players[m].status!=="OFFLINE")
                        players[m].battleLog.unshift(msg);
                }
                savePlayer(players[i], true);
            }
            else{
                players[i].queue = [];
                players[i].activeAttacks = [];
                players[i].info.inCombat--;
                players[i].info.stealthTime--;
                players[i].info.trapped--;
                players[i].info.roundsPlayed++;
                players[i].info.respawnCount--;

                if(players[i].info.roundsPlayed%roundsTillJoinToken==0 && players[i].info.joinTokens < maxJoinTokens)
                    players[i].info.joinTokens++;

                if(players[i].info.stealthTime==0)
                    players[i].info.stealthed = false;

                //Regen Energy
                if(players[i].stats.hp>0 && !players[i].info.stealthed){
                    players[i].stats.energy = players[i].stats.energy + statData.energyReg*(players[i].info.inCombat>0?1:2);
                    if (players[i].stats.energy > players[i].stats.energyMAX)
                        players[i].stats.energy = players[i].stats.energyMAX;
                }

                triggeredTrap(players[i]);
                if(saveCountdown==saveRound){
                    savePlayer(players[i], false);
                }
            }
        }
    }

    canDelete = true;

    //Update bases
    for(var b in baseList){
        if(baseList[b].inCombat<=0 && baseList[b].hp < baseList[b].hpMAX){
            baseList[b].hp += parseInt(baseList[b].hpMAX*.1);
            if(baseList[b].hp >= baseList[b].hpMAX){
                baseList[b].hp = baseList[b].hpMAX;
                baseList[b].canAttack = true;
            }
        }

        if(baseList[b].upgrading){
            baseList[b].upgrade++;

            if(baseList[b].upgrade==baseList[b].upgradeMAX){
                baseList[b].upgrade = 0;
                baseList[b].lvl++;
                baseList[b].upgradeCost = calculateBaseUpgradeCost(baseList[b].lvl);
                baseList[b].upgrading = false;

                //Decide hp
                if(baseList[b].lvl==1) baseList[b].hpMAX = 20;
                else if(baseList[b].lvl==2) baseList[b].hpMAX = 50;
                else if(baseList[b].lvl==3) baseList[b].hpMAX = 100;
                else baseList[b].hpMAX = 10000;
                baseList[b].hp = baseList[b].hpMAX;

                messageGroup(teamData[baseList[b].owner].members,
                             "Base "+baseList[b].id+" has completed its upgrade! All systems are back online.","", "team", p);
            }
        }

        baseList[b].inCombat--;
        baseList[b].canTarget = true;
        for(var t = 0; t < baseList[b].targets.length; t++){
            baseList[b].targets[t].countdown--;
            if(baseList[b].targets[t].countdown < 0){
                baseList[b].targets.splice(t,1);
                t--;
            }
        }

        baseList[b].attacks = [0,0,0];
        for(var i = 0; i < baseList[b].lvl; i++){
            var r = parseInt(Math.random()*1000)%3;
            baseList[b].attacks[r]++;
        }

        if(baseList[b].lvl>3)
            baseList[b].attacks = [4, 4, 4];
    }

    //Update team data
    for(var t in teamData){
        if(teamData[t].status!=="DELETED"){
            teamData[t].power = calculateTeamPower(t);
            teamData[t].income = calulateProfit(t);

            if(profitCountdown==0){
                dispurseProfit(t);
            }
        }
    }
    rankTeams();

    if(saveCountdown==saveRound){
        saveCountdown = 0;
        saveGameData();
    }

    //Spawn Treasures
    spawnLoot();


}


//******************************************************************************
// Player Actions
//******************************************************************************
function move(p, direction){
    var before = withinShop(p.loc,p.info.teamID)!=-1;
    var beforeLoc = [p.loc[0],p.loc[1]];

    if(direction==="N"){
        var newY = p.loc[1] - 1;
        if(newY<0) newY = mapSize-1;
        if(!spotOccupied([p.loc[0],newY])) p.loc[1] = newY;
    }
    else if(direction==="E"){
        var newX = p.loc[0] + 1;
        if(newX>=mapSize) newX = 0;
        if(!spotOccupied([newX,p.loc[1]])) p.loc[0] = newX;
    }
    else if(direction==="S"){
        var newY = p.loc[1] + 1;
        if(newY>=mapSize) newY = 0;
        if(!spotOccupied([p.loc[0],newY])) p.loc[1] = newY;
    }
    else if(direction==="W"){
        var newX = p.loc[0] - 1;
        if(newX<0) newX = mapSize-1;
        if(!spotOccupied([newX,p.loc[1]])) p.loc[0] = newX;
    }

    var after = withinShop(p.loc,p.info.teamID)!=-1;
    if(beforeLoc[0]==p.loc[0] && beforeLoc[1]==p.loc[1]){
        p.battleLog.unshift({"type":"action", "msg": "You can't move there."});
    }
    else{
        map[beforeLoc[0]][beforeLoc[1]].type = "OPEN";
        map[beforeLoc[0]][beforeLoc[1]].id = -1;
        map[p.loc[0]][p.loc[1]].type = "PLAYER";
        map[p.loc[0]][p.loc[1]].id = p.id;

        if(map[p.loc[0]][p.loc[1]].baseID > -1){
            if(baseList[map[p.loc[0]][p.loc[1]].baseID].owner!=p.info.teamID && baseList[map[p.loc[0]][p.loc[1]].baseID].owner>-1){
                var base = baseList[map[p.loc[0]][p.loc[1]].baseID];
                var nTarget = true;
                for(var t in base.targets){
                    if(base.targets[t].id===p.id){
                        nTarget = false;
                        base.targets[t].countdown = 5;
                        break;
                    }
                }
                if(nTarget)
                    base.targets.push({"id":p.id,"countdown":5});
            }
        }


        if(before && !after){
            p.battleLog.unshift({"type":"action", "msg": "You have left a shoping area."});
        }
        else if(!before && after){
            p.battleLog.unshift({"type":"action", "msg": "You have entered a shopping area."});
        }
    }

    triggeredTrap(p);
}

function attack(p, loc){
    p.stats.energy -= attackEnergyUsage;
    p.info.inCombat = combatCooldown;

    if(map[loc[0]][loc[1]].type!=="OPEN"){
        hit(map[loc[0]][loc[1]], p, "hit");
    }

}

function cannon(p, location){
    p.stats.energy -= cannonEnergyUsage;
    p.info.uranium -= cannonUraniumUsage;
    p.info.inCombat = combatCooldown;

    var locs = [];
    var range = (p.stats.cannon>1?5:3);
    var mid = parseInt(range/2);
    for(var x = 0; x < range; x++){
        for(var y = 0; y < range; y++){
            var cX = location[0] - (mid-x);
            var cY = location[1] - (mid-y);

            if(cX < 0) cX += map.length;
            if(cY < 0) cY += map.length;
            if(cX >= map.length) cX -= map.length;
            if(cY >= map.length) cY -= map.length;

            locs.push([cX,cY]);
        }
    }

    for(var i in locs){
        if(map[locs[i][0]][locs[i][1]].type!=="OPEN"){
            hit(map[locs[i][0]][locs[i][1]], p, "blasted");
        }
    }
}

function railgun(p, direction){
    p.stats.energy -= railgunEnergyUsage;
    p.info.uranium -= railgunUraniumUsage;
    p.info.inCombat = combatCooldown;

    var locs = [];
    if(direction==="N"){
        for(var i = 1; i <= railgunRange; i++){
            var newY = p.loc[1]-i;
            if(newY < 0) newY += mapSize;
            locs.push([p.loc[0],newY]);
        }
    }
    else if(direction==="E"){
        for(var i = 1; i <= railgunRange; i++){
            locs.push([(p.loc[0]+i)%mapSize,p.loc[1]]);
        }
    }
    else if(direction==="S"){
        for(var i = 1; i <= railgunRange; i++){
            locs.push([p.loc[0],(p.loc[1]+i)%mapSize]);
        }
    }
    else if(direction==="W"){
        for(var i = 1; i <= railgunRange; i++){
            var newX = p.loc[0]-i;
            if(newX < 0) newX += mapSize;
            locs.push([newX,p.loc[1]]);
        }
    }

    for(var i in locs){
        if(map[locs[i][0]][locs[i][1]].type!=="OPEN"){
            hit(map[locs[i][0]][locs[i][1]], p, "railed");
        }
    }
}

function loot(p){
    p.stats.energy = p.stats.energy - lootEnergyUsage;

    var treasure = map[p.loc[0]][p.loc[1]];
    if(hasLoot(treasure)){
        var startGold = p.info.gold;
        var startTotalGold = p.info.totalGold;
        var looted = false;

        if(treasure.loot.gold > 0){
            p.info.gold += treasure.loot.gold;
            p.info.totalGold += treasure.loot.gold;
            p.battleLog.unshift({"type":"loot", "msg": "You found "+treasure.loot.gold+"g!"});
            looted = true;
        }
        if(treasure.loot.iron > 0){
            p.info.iron += treasure.loot.iron;
            p.info.totalIron += treasure.loot.iron;
            p.battleLog.unshift({"type":"loot", "msg": "You found "+treasure.loot.iron+" iron!"});
            looted = true;
        }
        var uranDrop = 0;
        if(treasure.loot.uranium > 0 && p.info.uranium<p.stats.urCarry){
            if(p.info.uranium + treasure.loot.uranium > p.stats.urCarry){
                uranDrop = p.info.uranium + treasure.loot.uranium - p.stats.urCarry;
                p.info.uranium = p.stats.urCarry;
                p.info.totalUranium += treasure.loot.uranium-uranDrop;
                p.battleLog.unshift({"type":"loot", "msg": "You found "+(treasure.loot.uranium-uranDrop)+" uranium!"});
                p.battleLog.unshift({"type":"loot", "msg": "You had to leave a little uranium behind."});
            }
            else{
                p.info.uranium += treasure.loot.uranium;
                p.info.totalUranium += treasure.loot.uranium;
                p.battleLog.unshift({"type":"loot", "msg": "You found "+treasure.loot.uranium+" uranium!"});
            }
            looted = true;
        }
        else if(treasure.loot.uranium > 0 && p.info.uranium>=p.stats.urCarry){
            p.battleLog.unshift({"type":"action", "msg": "You can't carry any more uranium."});
        }

        if(looted){
            p.info.hauls++;

            map[p.loc[0]][p.loc[1]].loot = {"gold":0,"iron":0,"uranium":uranDrop};
            // lootSpawns.push([p.loc[0],p.loc[1]]);
            lootCount--;

            // //Alert local people of looting
            // var mid = parseInt(statData.vision/2);
            // for(var x = 0; x < statData.vision; x++){
            //     for(var y = 0; y < statData.vision; y++){
            //         var cX = p.loc[0] - (mid-x);
            //         var cY = p.loc[1] - (mid-y);
            //
            //         if(cX < 0) cX += map.length;
            //         if(cY < 0) cY += map.length;
            //         if(cX >= map.length) cX -= map.length;
            //         if(cY >= map.length) cY -= map.length;
            //
            //         // var enemyP = playerInSpot([cX,cY], p);
            //         if(map[cX][cY].type==="player" && !(cX==p.loc[0] && cY==p.loc[1]))
            //             enemyP.battleLog.unshift({"type":"combat", "msg": p.info.name+" has looted near you."});
            //     }
            // }

            //Alert world of great wealth
            var msg;
            if(parseInt(startGold/1000) < parseInt(p.info.gold/1000)){
                msg = ""+p.info.name+" has over "+(parseInt(p.info.gold/1000)*1000)+"g.";
            }
            if(parseInt(startTotalGold/2000) < parseInt(p.info.totalGold/2000)){
                msg = ""+p.info.name+" has amassed over "+(parseInt(p.info.totalGold/2000)*2000)+"g.";
            }

            for(var i = 0; i < players.length; i++){
                if(players[i].status!=="OFFLINE"){
                    for(var k = 0; k < players[i].knownLocs.length; k++){
                        if(players[i].knownLocs[k][0]==p.loc[0] && players[i].knownLocs[k][1]==p.loc[1]){
                            players[i].knownLocs.splice(k,1);
                        }
                    }
                    if(msg!=null) players[i].battleLog.unshift({"type":"server", "msg": msg});
                }
            }
        }
    }
    else{
        p.battleLog.unshift({"type":"action", "msg": "You didn't find anything."});
    }
}

function scan(p){
    p.stats.energy -= scanEnergyUsage;
    p.info.scans++;

    //Scan Area
    var mid = parseInt(p.stats.radar/2);
    for(var x = 0; x < p.stats.radar; x++){
        for(var y = 0; y < p.stats.radar; y++){
            var cX = p.loc[0] - (mid-x);
            var cY = p.loc[1] - (mid-y);

            if(cX < 0) cX += map.length;
            if(cY < 0) cY += map.length;
            if(cX >= map.length) cX -= map.length;
            if(cY >= map.length) cY -= map.length;

            if(hasLoot(map[cX][cY])){
                p.knownLocs.push([cX,cY]);
            }

            var tr = map[cX][cY].trap;
            if(tr>-1){
                if(!isKnownTrap(p,trapList[tr]))
                    p.knownTraps.push({"id":trapList[tr].id,"owner":trapList[tr].owner});
            }


            if(map[cX][cY].type==="PLAYER" && !(cX==p.loc[0] && cY==p.loc[1])){
                players[map[cX][cY].id].battleLog.unshift({"type":"combat", "msg": "Someone has scanned you."});
                p.scanned.push({"id":map[cX][cY].id,"rounds":3+p.stats.scanner});
            }
        }
    }
}

function quickHeal(p){
    p.stats.hp = p.stats.hpMAX;
    p.stats.quickHeal = false;
    removeFromStorage(p,"HEAL");
    if(p.abilitySlots[0].type==="HEAL") p.abilitySlots[0] = {"type":"NONE","canUse":false};
    if(p.abilitySlots[1].type==="HEAL") p.abilitySlots[1] = {"type":"NONE","canUse":false};
}

function energyMod(p){
    p.info.uranium -= energyModUraniumUsage;

    p.stats.energy += p.stats.engMod*5;
    if(p.stats.energy > p.stats.energyMAX) p.stats.energy=p.stats.energyMAX
}

function stealth(p){
    p.info.uranium -= stealthUraniumUsage;
    p.stats.energy -= stealthEnergyUsage;
    p.info.stealthed = true;
    p.info.stealthTime = stealthDurationPerLevel*p.stats.stealth+1;

    //Remove from scanned
    for(var pp in players){
        for(var i in players[pp].scanned){
            if(players[pp].scanned[i].token===p.token){
                players[pp].scanned[i].rounds = 0;
                players[pp].battleLog.unshift({"type":"combat", "msg": p.info.name+" has vanished."});
                break;
            }
        }
    }
}

function destealth(p){
    p.info.stealthed = false;
    p.info.stealthTime = 0;
}

function blink(p, location){
    p.info.uranium -= blinkUraniumUsage;
    p.stats.energy -= (blinkEnergyUsage-2*p.stats.blink);

    if(!spotOccupied([location[0],location[1]])){
        map[p.loc[0]][p.loc[1]].type = "OPEN";
        map[p.loc[0]][p.loc[1]].id = -1;
        map[location[0]][location[1]].type = "PLAYER";
        map[location[0]][location[1]].id = p.id;
        p.loc = location;

        if(map[p.loc[0]][p.loc[1]].baseID > -1){
            if(baseList[map[p.loc[0]][p.loc[1]].baseID].owner!=p.info.teamID && baseList[map[p.loc[0]][p.loc[1]].baseID].owner>-1){
                var base = baseList[map[p.loc[0]][p.loc[1]].baseID];
                var nTarget = true;
                for(var t in base.targets){
                    if(base.targets[t].id===p.id){
                        nTarget = false;
                        base.targets[t].countdown = 5;
                        break;
                    }
                }
                if(nTarget)
                    base.targets.push({"id":p.id,"countdown":5});
            }
        }
    }

    triggeredTrap(p);
}

function trap(p){
    p.info.uranium -= (p.stats.trap>2?0:trapUraniumUsage);
    p.stats.energy -= trapEnergyUsage;

    p.info.traps++;
    var id = trapList.length;

    p.battleLog.unshift({"type":"combat", "msg": "You placed trap "+p.info.traps+"."});

    var spread = [];
    var x = p.loc[0],
        lx = p.loc[0]-1,
        rx = (p.loc[0]+1)%mapSize,
        y = p.loc[1],
        uy = p.loc[1]-1,
        dy = (p.loc[1]+1)%mapSize;
    if(lx < 0) lx += mapSize;
    if(uy < 0) uy += mapSize;

    if(p.stats.trap > 1){ //3x3
        if(map[x][y].trap < 0){
            spread.push([x,y]);
            map[x][y].trap = id;
        }
        if(map[rx][y].trap < 0){
            spread.push([rx,y]);
            map[rx][y].trap = id;
        }
        if(map[x][dy].trap < 0){
            spread.push([x,dy]);
            map[x][dy].trap = id;
        }
        if(map[rx][dy].trap < 0){
            spread.push([rx,dy]);
            map[rx][dy].trap = id;
        }
        if(map[lx][uy].trap < 0){
            spread.push([lx,uy]);
            map[lx][uy].trap = id;
        }
        if(map[x][uy].trap < 0){
            spread.push([x,uy]);
            map[x][uy].trap = id;
        }
        if(map[rx][uy].trap < 0){
            spread.push([rx,uy]);
            map[rx][uy].trap = id;
        }
        if(map[lx][y].trap < 0){
            spread.push([lx,y]);
            map[lx][y].trap = id;
        }
        if(map[lx][dy].trap < 0){
            spread.push([lx,dy]);
            map[lx][dy].trap = id;
        }
    }
    else{ //2x2
        if(map[x][y].trap < 0){
            spread.push([x,y]);
            map[x][y].trap = id;
        }
        if(map[rx][y].trap < 0){
            spread.push([rx,y]);
            map[rx][y].trap = id;
        }
        if(map[x][dy].trap < 0){
            spread.push([x,dy]);
            map[x][dy].trap = id;
        }
        if(map[rx][dy].trap < 0){
            spread.push([rx,dy]);
            map[rx][dy].trap = id;
        }
    }

    trapList[id] = {
        "id":id,
        "locs": spread,
        "lvl":0+p.stats.trap,
        "num":0+p.info.traps,
        "owner":p.id
    };

    p.knownTraps.push({"id":id, "owner":p.id});
}

function placeWall(p, loc){
    p.info.walls--;
    p.info.wallsPlaced++;

    if(map[loc[0]][loc[1]].type === "OPEN"){
        wallList[wallList.length] = {
            "id": wallList.length,
            "lvl": p.stats.wall,
            "hp": p.stats.wall*10,
            "hpMAX": p.stats.wall*10,
            "loc": [loc[0], loc[1]]
        };
        map[loc[0]][loc[1]].type = "WALL";
        map[loc[0]][loc[1]].id = wallList.length-1;
    }
}


//******************************************************************************
// Base Actions
//******************************************************************************
function baseAttack(loc, dmg, baseID){
    if(map[loc[0]][loc[1]].type==="PLAYER"){
        var hit = players[map[loc[0]][loc[1]].id];
        dmg -= (isEquipped(hit,"DR")?1:0);

        if(dmg>0){
            hit.stats.hp -= dmg;
            hit.info.inCombat = combatCooldown;
            hit.battleLog.unshift({"type":"combat", "msg": "You have been hit for "+dmg+" damage."});

            if(hit.stats.hp <= 0){
                for(var t in baseList[baseID].targets){
                    if(baseList[baseID].targets[t].id==hit.id){
                        baseList[baseID].targets.splice(t,1);
                        break;
                    }
                }
                death(hit, null);
            }
        }
    }
}


//******************************************************************************
// Utility Functions
//******************************************************************************

//Store Functions
function withinShop(loc, teamID){
    var baseID = map[loc[0]][loc[1]].baseID;

    if(baseID > -1){
        var range = 5;
        var t = parseInt(range/2);
        var xAdj = t-baseList[baseID].loc[0], yAdj = t-baseList[baseID].loc[1];
        var cX = (loc[0] + xAdj)%mapSize, cY = (loc[1] + yAdj)%mapSize;

        if(cX<0)cX+=mapSize;
        if(cY<0)cY+=mapSize;

        var own = baseList[baseID].owner;
        if(baseList[baseID].inCombat <= 0 || baseList[baseID].lvl > 3){
            if(cX < range && cY < range && (own==teamID || own==-1))
                return baseList[baseID].lvl;
        }
    }
    return -1;
}

function calculatePrices(purchase, lvl){
    var prices = {"gold":0,"iron":0,"uranium":0};

    //GOLD
    if(purchase.gold.model==1)
        prices.gold = Math.min(lvl * purchase.gold.mod, purchase.gold.cap);
    else if(purchase.gold.model==2)
        prices.gold = Math.min(lvl * lvl * purchase.gold.mod, purchase.gold.cap);
    else if(purchase.gold.model==3)
        prices.gold = Math.min(purchase.gold.mod, purchase.gold.cap);
    else if(purchase.gold.model==4)
        prices.gold = Math.min(lvl * purchase.gold.mod + purchase.gold.mod2, purchase.gold.cap);
    else if(purchase.gold.model==5)
        prices.gold = Math.min(lvl * lvl * purchase.gold.mod + purchase.gold.mod2, purchase.gold.cap);

    //IRON
    if(lvl >= purchase.iron.threshold)
        if(purchase.iron.model==1)
            prices.iron = Math.min((lvl * purchase.iron.mod)*parseInt(lvl/purchase.iron.threshold), purchase.iron.cap);
        else if(purchase.iron.model==2)
            prices.iron = Math.min((lvl * lvl * purchase.iron.mod)*parseInt(lvl/purchase.iron.threshold), purchase.iron.cap);
        else if(purchase.iron.model==3)
            prices.iron = Math.min(purchase.iron.mod*parseInt(lvl/purchase.iron.threshold), purchase.iron.cap);
        else if(purchase.iron.model==4)
            prices.iron = Math.min((lvl * purchase.iron.mod + purchase.iron.mod2)*parseInt(lvl/purchase.iron.threshold), purchase.iron.cap);
        else if(purchase.gold.model==5)
            prices.iron = Math.min((lvl * lvl * purchase.iron.mod + purchase.iron.mod2)*parseInt(lvl/purchase.iron.threshold), purchase.iron.cap);

    //URANIUM
    if(lvl >= purchase.uranium.threshold)
        if(purchase.uranium.model==1)
            prices.uranium = Math.min((lvl * purchase.uranium.mod)*parseInt(lvl/purchase.uranium.threshold), purchase.uranium.cap);
        else if(purchase.uranium.model==2)
            prices.uranium = Math.min((lvl * lvl * purchase.uranium.mod)*parseInt(lvl/purchase.uranium.threshold), purchase.uranium.cap);
        else if(purchase.uranium.model==3)
            prices.uranium = Math.min((purchase.uranium.mod)*parseInt(lvl/purchase.uranium.threshold), purchase.uranium.cap);
        else if(purchase.uranium.model==4)
            prices.uranium = Math.min((lvl * purchase.uranium.mod + purchase.uranium.mod2)*parseInt(lvl/purchase.uranium.threshold), purchase.uranium.cap);
        else if(purchase.uranium.model==5)
            prices.uranium = Math.min((lvl * lvl * purchase.uranium.mod + purchase.uranium.mod2)*parseInt(lvl/purchase.uranium.threshold), purchase.uranium.cap);

    return prices;
}

function canPurchase(costs, inventory){
    if(costs.gold    <= inventory.gold &&
       costs.iron    <= inventory.iron &&
       costs.uranium <= inventory.uranium)
        return true;

    return false;
}

function makePurchase(costs, p){
    p.info.gold -= costs.gold;
    p.info.iron -= costs.iron;
    p.info.uranium -= costs.uranium;
}

function buildStore(p){
    return {
        "withinShop": withinShop(p.loc,p.info.teamID),

        //Regular Shop
        "hpF":{
            "price":calculatePrices(shopData.shipRepair,p.stats.hpMAX-p.stats.hp),
            "canBuy":p.stats.hp!=p.stats.hpMAX
        },
        "hp5":{
            "price":calculatePrices(shopData.shipRepair5,0),
            "canBuy":p.stats.hp!=p.stats.hpMAX
        },
        "insurance":{
            "price":calculatePrices(shopData.insurance,p.info.shipMass),
            "canBuy":!p.info.hasInsurance
        },
        "hpU":{
            "price":calculatePrices(shopData.healthUpgrades,p.stats.hpUpgrades+1),
            "canBuy":p.stats.hpUpgrades!=p.stats.hpUpgradesMAX
        },
        "enU":{
            "price":calculatePrices(shopData.energyUpgrades,p.stats.energyUpgrades+1),
            "canBuy":p.stats.energyUpgrades!=p.stats.energyUpgradesMAX
        },
        "radU":{
            "price":calculatePrices(shopData.radarUpgrades,p.stats.radarUpgrades+1),
            "canBuy":p.stats.radarUpgrades!=p.stats.radarUpgradesMAX
        },
        "atkU":{
            "price":calculatePrices(shopData.attackUpgrades,p.stats.attackUpgrades+1),
            "canBuy":p.stats.attackUpgrades!=p.stats.attackUpgradesMAX
        },

        //Super Shop
        "wallU":{
            "price":calculatePrices(shopData.wallUpgrades, p.stats.wall+1),
            "canBuy":p.stats.wallUpgrades!=p.stats.wallUpgradesMAX
        },
        "wall":{
            "price":calculatePrices(shopData.wall, 1),
            "canBuy":p.info.walls < (p.stats.wall<5?p.stats.wall*20:99)
        },
        "wall5":{
            "price":calculatePrices(shopData.wall5, 1),
            "canBuy":p.info.walls+5 < (p.stats.wall<5?p.stats.wall*20:99)
        },
        "wall10":{
            "price":calculatePrices(shopData.wall10, 1),
            "canBuy":p.info.walls+10 < (p.stats.wall<5?p.stats.wall*20:99)
        },
        "loadout":{
            "price":calculatePrices(shopData.loadoutUpgrades,0),
            "canBuy":p.stats.loadoutSize!=statData.loadoutMAX
        },
        "canU":{
            "price":calculatePrices(shopData.cannonUpgrades,p.stats.cannonUpgrades+1),
            "canBuy":p.stats.cannonUpgrades!=p.stats.cannonUpgradesMAX
        },
        "bliU":{
            "price":calculatePrices(shopData.blinkUpgrades,p.stats.blinkUpgrades+1),
            "canBuy":p.stats.blinkUpgrades!=p.stats.blinkUpgradesMAX
        },
        "steU":{
            "price":calculatePrices(shopData.stealthUpgrades,p.stats.stealthUpgrades+1),
            "canBuy":p.stats.stealthUpgrades!=p.stats.stealthUpgradesMAX
        },
        "trapU":{
            "price":calculatePrices(shopData.trapUpgrades,p.stats.trapUpgrades+1),
            "canBuy":p.stats.trapUpgrades!=p.stats.trapUpgradesMAX
        },
        "engModU":{
            "price":calculatePrices(shopData.engModUpgrades,p.stats.engModUpgrades+1),
            "canBuy":p.stats.engModUpgrades!=p.stats.engModUpgradesMAX
        },
        "scanU":{
            "price":calculatePrices(shopData.scannerUpgrades,p.stats.scannerUpgrades+1),
            "canBuy":p.stats.scannerUpgrades!=p.stats.scannerUpgradesMAX
        },
        "railU":{
            "price":calculatePrices(shopData.railgunUpgrades,p.stats.railgunUpgrades+1),
            "canBuy":p.stats.railgunUpgrades!=p.stats.railgunUpgradesMAX
        },
        "insuranceU":{
            "price":calculatePrices(shopData.insuranceUpgrades,p.stats.insuranceUpgrades+1),
            "canBuy":p.stats.insuranceUpgrades!=p.stats.insuranceUpgradesMAX
        },
        "carryU":{
            "price":calculatePrices(shopData.urCarryUpgrades,p.stats.urCarryUpgrades+1),
            "canBuy":p.stats.urCarryUpgrades!=p.stats.urCarryUpgradesMAX
        },
        "statHP":{
            "price":calculatePrices(shopData.staticHp,1),
            "canBuy":!p.stats.staticHp
        },
        "statEng":{
            "price":calculatePrices(shopData.staticEng,1),
            "canBuy":!p.stats.staticEng
        },
        "statAtk":{
            "price":calculatePrices(shopData.staticAtk,1),
            "canBuy":!p.stats.staticAtk
        },
        "statRdr":{
            "price":calculatePrices(shopData.staticRdr,1),
            "canBuy":!p.stats.staticRdr
        },
        "statDR":{
            "price":calculatePrices(shopData.staticDR,1),
            "canBuy":!p.stats.staticDR
        },
        "uranium":{
            "price":calculatePrices(shopData.uranium,1),
            "canBuy":p.info.uranium<p.stats.urCarry
        },
        "quickHeal":{
            "price":calculatePrices(shopData.quickHeal,p.stats.hpMAX),
            "canBuy":!p.stats.quickHeal
        }
    };
}

function canPurchaseBaseUpgrade(baseID, teamID){
    var vault = teamData[teamID].vault;
    var cost = baseList[baseID].upgradeCost;

    return vault.gold >= cost.gold && vault.credits >= cost.credits && vault.iron >= cost.iron && vault.uranium >= cost.uranium;
}

function makePurchaseBaseUpgrade(baseID, teamID){
    var cost = baseList[baseID].upgradeCost;

    teamData[teamID].vault.gold-=cost.gold;
    teamData[teamID].vault.credits-=cost.credits;
    teamData[teamID].vault.iron-=cost.iron;
    teamData[teamID].vault.uranium-=cost.uranium;

    baseList[baseID].upgrading = true;
    baseList[baseID].canAttack = false;
}


//Legal Action Checkers
function spotOccupied(location){
    return map[location[0]][location[1]].type!=="OPEN";
}

function attackDistance(player, attack){
    var t = parseInt(statData.attackRange/2);
    var xAdj = t-player[0], yAdj = t-player[1];
    var cX = (attack[0] + xAdj)%mapSize, cY = (attack[1] + yAdj)%mapSize;

    if(cX<0)cX+=mapSize;
    if(cY<0)cY+=mapSize;

    return cX < statData.attackRange && cY < statData.attackRange;
}

function visionDistance(player, spot){
    var t = parseInt(statData.vision/2);
    var xAdj = t-player[0], yAdj = t-player[1];
    var cX = (spot[0] + xAdj)%mapSize, cY = (spot[1] + yAdj)%mapSize;

    if(cX<0)cX+=mapSize;
    if(cY<0)cY+=mapSize;

    return cX < statData.vision && cY < statData.vision;
}

function blinkDistance(player, spot){
    var t = parseInt(player.stats.radar/2);
    var xAdj = t-player.loc[0], yAdj = t-player.loc[1];
    var cX = (spot[0] + xAdj)%mapSize, cY = (spot[1] + yAdj)%mapSize;

    if(cX<0)cX+=mapSize;
    if(cY<0)cY+=mapSize;

    return cX < player.stats.radar && cY < player.stats.radar;
}

function canPlaceWall(p, wall){
    var ownedBase = false;
    if(map[wall[0]][wall[1]].baseID > -1){
        ownedBase = baseList[map[wall[0]][wall[1]].baseID].owner == p.info.teamID;
    }

    var canBuild = p.info.teamRole==="LEADER" ||
                   teamData[p.info.teamID].settings.building==="TEAM" ||
                   (p.info.teamRole==="ADMIN" && teamData[p.info.teamID].settings.building!=="LEADER");

    var open = map[wall[0]][wall[1]].type==="OPEN";

    return open && ownedBase && canBuild;
}

function wallInRange(player, wall){
    var range = 3;
    var t = parseInt(range/2);
    var xAdj = t-player[0], yAdj = t-player[1];
    var cX = (wall[0] + xAdj)%mapSize, cY = (wall[1] + yAdj)%mapSize;

    if(cX<0)cX+=mapSize;
    if(cY<0)cY+=mapSize;

    return cX < range && cY < range
}


//List Checkers
function isKnown(list, x, y){
    for(var i = 0; i < list.length; i++){
        if(list[i][0]==x && list[i][1]==y)
            return true;
    }
    return false;
}

function inScanned(player, id){
    for(var i = 0; i < player.scanned.length; i++){
        if(player.scanned[i].id===id)
            return true;
    }

    return false;
}

function queuedDestealth(p){
    for(var a in p.queue){
        if(p.queue[a].type==="DESTEALTH") return true;
    }
    return false;
}



//Equipment Functions
function updateStorageItem(p, mod, val){
    for(var i in p.storage){
        if(p.storage[i].name===mod){
            p.storage[i].val=val;
            break;
        }
    }
}

function isEquipped(p,mod){
    if(p.abilitySlots[0].type===mod) return true;
    if(p.abilitySlots[1].type===mod) return true;
    return false
}

function removeFromStorage(p,mod){
    for(var i in p.storage){
        if(p.storage[i].name===mod){
            p.storage.splice(i,1);
            break;
        }
    }
}

function canUseMod(p, mod){
    if(mod==="NONE")
        return false;
    else if(mod=="CAN")
        return 3-p.queue.length >= cannonActionUsage && p.stats.energy>=cannonEnergyUsage && p.info.uranium>=cannonUraniumUsage;
    else if(mod=="RAIL")
        return 3-p.queue.length >= railgunActionUsage && p.stats.energy>=railgunEnergyUsage && p.info.uranium>=railgunUraniumUsage;
    else if(mod=="TRAP")
        return 3-p.queue.length >= trapActionUsage && p.stats.energy>=trapEnergyUsage && (p.info.uranium>=trapUraniumUsage || p.stats.trap>2);
    else if(mod=="HEAL")
        return p.stats.energy>=quickHealEnergyUsage;
    else if(mod=="BLNK")
        return p.stats.energy>=blinkEnergyUsage-2*p.stats.blink && p.info.uranium>=blinkUraniumUsage;
    else if(mod=="ENG")
        return p.info.uranium>=energyModUraniumUsage;
    else if(mod=="HIDE" && !p.info.stealthTime>0)
        return 3-p.queue.length >= stealthActionUsage && p.stats.energy>=stealthEnergyUsage && p.info.uranium>=stealthUraniumUsage;
    else if(mod=="HIDE" && p.info.stealthTime>0)
        return !queuedDestealth(p);
    else if(mod=="ATK+" || mod=="ENG+" || mod=="RDR+" || mod=="HP+" || mod=="DR")
        return true;
    return false;
}



//Team Functions
function teamValidation(base, area, name){
    if(base === area)
        return "Base and area need to be different colors";
    if(name<4)
        return "Need a longer Team Name";

    var hex = area.replace('#','');
    var ar = parseInt(hex.substring(0,2), 16);
    var ag = parseInt(hex.substring(2,4), 16);
    var ab = parseInt(hex.substring(4,6), 16);
    if(ar+ag+ab < 140)
        return "Area color is too dark";

    hex = base.replace('#','');
    var br = parseInt(hex.substring(0,2), 16);
    var bg = parseInt(hex.substring(2,4), 16);
    var bb = parseInt(hex.substring(4,6), 16);

    if(Math.abs(ar-br)<60 && Math.abs(ag-bg)<60 && Math.abs(ab-bb)<60)
        return "Base color is too similar to Area color";

    for(var b in teamData){
        if(teamData[b].status!=="DELETED"){
            hex = teamData[b].colors.baseColor.replace('#','');
            var br2 = parseInt(hex.substring(0,2), 16);
            var bg2 = parseInt(hex.substring(2,4), 16);
            var bb2 = parseInt(hex.substring(4,6), 16);
            hex = teamData[b].colors.areaColor.replace('#','');
            var ar2 = parseInt(hex.substring(0,2), 16);
            var ag2 = parseInt(hex.substring(2,4), 16);
            var ab2 = parseInt(hex.substring(4,6), 16);

            if(Math.abs(br2-br)<30 && Math.abs(bg2-bg)<30 && Math.abs(bb2-bb)<30 &&
               Math.abs(ar2-ar)<60 && Math.abs(ag2-ag)<60 && Math.abs(ab2-ab)<60){
                return "Color combo has been taken";
            }

            if(teamData[b].name.toLowerCase()===name.toLowerCase()){
                return "Name has been taken";
            }
        }
    }

    return true;
}

function removeFromTeam(pid, teamID, type){
    if(type==="MERGE"){
        teamData[teamID] = {"id":teamID,"status":"DELETED"};
    }
    else if(type==="KICK"){
        for(var a in teamData[teamID].admins){
            if(teamData[teamID].admins[a].id===pid){
                teamData[teamID].admins.splice(a,1);
                break;
            }
        }

        for(var m in teamData[teamID].members){
            if(teamData[teamID].members[m].id===pid){
                teamData[teamID].members.splice(m,1);
                break;
            }
        }

        if(players[pid].status==="OFFLINE"){
            players[pid].changes = {
                "id":-1,
                "role":"NONE"
            }
        }
        else{
            players[pid].info.teamID = -1;
            players[pid].info.teamRole = "NONE";
            players[pid].battleLog.unshift({"type":"team", "msg": "You have been kicked from "+teamData[teamID].name+"."});
        }
    }
    else{
        for(var a in teamData[teamID].admins){
            if(teamData[teamID].admins[a].id===pid){
                teamData[teamID].admins.splice(a,1);
                break;
            }
        }

        for(var m in teamData[teamID].members){
            if(teamData[teamID].members[m].id===pid){
                teamData[teamID].members.splice(m,1);
                break;
            }
        }

        if(players[pid].status==="OFFLINE"){
            messageGroup(teamData[teamID].members,
                         players[pid].name+" has left the team.","","team", null);
        }
        else{
            messageGroup(teamData[teamID].members,
                         players[pid].info.name+" has left the team.","","team", null);
            players[pid].battleLog.unshift({"type":"team", "msg": "You left "+teamData[teamID].name+"."});
        }
    }
}

function mergeTeams(oldID, newID, p){
    //Take all bases
    for(var b in baseList){
        if(baseList[b].owner==oldID){
            baseList[b].owner = newID;
        }
    }

    //Take all members
    messageGroup(teamData[oldID].members,
                 "Your team has been merged with "+teamData[newID].name+".",
                 "You have merged your old team into "+teamData[newID].name+".","team", p);
    messageGroup(teamData[newID].members,
                "Your team has been merged with "+teamData[oldID].name+". Welcome your new members!",
                "", "team", null);


    for(var m in teamData[oldID].members){
        var id = teamData[oldID].members[m].id;
        if(players[id].status!=="OFFLINE"){
            players[id].info.teamID = newID;
            players[id].info.teamRole = "MEMBER";
        }
        else{
            players[id].changes = {"id":newID,"role":"MEMBER"};
        }
        teamData[newID].members.push({
            "token": teamData[oldID].members[m].token,
            "id": teamData[oldID].members[m].id,
            "name": teamData[oldID].members[m].name,
            "powerLevel": teamData[oldID].members[m].powerLevel,
            "online": teamData[oldID].members[m].online
        });

    }

    //Take all Loot
    teamData[newID].vault.gold += teamData[oldID].vault.gold;
    teamData[newID].vault.credits += teamData[oldID].vault.credits;
    teamData[newID].vault.iron += teamData[oldID].vault.iron;
    teamData[newID].vault.uranium += teamData[oldID].vault.uranium;

    //Delete old team
    removeFromTeam(p, oldID, "MERGE");
}

function changeRole(pid, teamID, prevRole, newRole){
    var mem;
    for(var m in teamData[teamID].members){
        if(teamData[teamID].members[m].id===pid){
            mem = teamData[teamID].members[m];
            break;
        }
    }

    if(prevRole==="ADMIN"){
        for(var a in teamData[teamID].admins){
            if(teamData[teamID].admins[a].id===pid){
                teamData[teamID].admins.splice(a,1);
                break;
            }
        }
    }

    if(newRole==="LEADER"){
        teamData[teamID].leader = {
            "token": mem.token,
            "id": mem.id,
            "name": mem.name,
            "powerLevel": mem.powerLevel,
            "online": mem.online
        };
    }
    else if(newRole==="ADMIN"){
        teamData[teamID].admins.push({
            "token": mem.token,
            "id": mem.id,
            "name": mem.name,
            "powerLevel": mem.powerLevel,
            "online": mem.online
        });
    }

    if(players[pid].status==="OFFLINE")
        players[pid].changes = {"id":teamID,"role":newRole};
    else
        players[pid].info.teamRole = newRole;
}

function calculateTeamPower(teamID){
    var b1Val = 10, b2Val = 40, b3Val = 100;
    var memVal = 5, areaVal = 1000;
    var maxMap = mapSize*mapSize;
    var memPow;

    var bases = 0;
    var control = 0;
    for(var b in baseList){
        if(baseList[b].owner==teamID){
            if(baseList[b].lvl==1) bases+=b1Val;
            if(baseList[b].lvl==2) bases+=b2Val;
            if(baseList[b].lvl==3) bases+=b3Val;
            control+=baseList[b].tiles.length;
        }
    }

    if(typeof teamData[teamID].members !== "undefined")
        memPow = teamData[teamID].members.length*memVal;
    else memPow = 0;

    return bases+memPow+parseInt(control/maxMap*areaVal);
}

function rankTeams(){
    var idToPower = [];

    for(var t in teamData){
        if(teamData[t].status!=="DELETED")
            idToPower.push({"id":teamData[t].id,"power":teamData[t].power});
    }

    idToPower.sort(function(a,b){
        if(a.power > b.power) return -1;
        if(a.power < b.power) return 1;
        return 0;
    });

    var rank = 1;
    for(var i = 0; i < idToPower.length; i++){
        if(i > 0){
            if(idToPower[i].power!=idToPower[i-1].power) rank = i+1;
        }
        teamData[idToPower[i].id].rank = rank;
    }
}

function initTeamClean(){
    for(var t in teamData){
        if(teamData[t].status!=="DELETED"){
            teamData[t].leader.online = false;
            for(var a in teamData[t].admins){
                teamData[t].admins[a].online = false;
            }
            for(var m in teamData[t].members){
                teamData[t].members[m].online = false;
            }
        }

    }

    saveGameData();
}

function changeOnlineStatus(p, status){
    var teamID = p.info.teamID;
    var token = p.token;

    if(teamID > -1 && teamID < teamData.length){
        if(teamData[teamID].status !== "DELETED"){
            if(p.info.teamRole==="LEADER"){
                teamData[teamID].leader.online = status;
            }
            else if(p.info.teamRole==="ADMIN"){
                for(var a in teamData[teamID].admins){
                    if(teamData[teamID].admins[a].token===token){
                        teamData[teamID].admins[a].online = status;
                        break;
                    }
                }
            }

            for(var m in teamData[teamID].members){
                if(teamData[teamID].members[m].token===token){
                    teamData[teamID].members[m].online = status;
                    break;
                }
            }
        }
    }
}

function calculateMapControl(teamID){
    var control = 0;
    for(var b in baseList){
        if(baseList[b].owner==teamID){
            control+=baseList[b].tiles.length;
        }
    }
    return control/(mapSize*mapSize);
}

function calulateProfit(teamID){
    var profit = {
        "gold":0,
        "credits":0,
        "iron":0,
        "uranium":0
    };

    for(var b in baseList){
        if(baseList[b].owner==teamID){
            profit.gold+=baseList[b].output.gold * baseList[b].lvl;
            profit.credits+=baseList[b].output.credits * baseList[b].lvl;
            if(baseList[b].special==="I") profit.iron += 2 * baseList[b].lvl;
            else if(baseList[b].special==="U") profit.uranium += 1 * baseList[b].lvl;
        }
    }

    return profit;
}

function updatePower(p){
    var teamID = p.info.teamID;
    var token = p.token;

    if(teamID > -1 && teamID < teamData.length){
        if(teamData[teamID].status !== "DELETED"){
            if(p.info.teamRole==="LEADER"){
                teamData[teamID].leader.powerLevel = p.info.powerLevel;
            }
            else if(p.info.teamRole==="ADMIN"){
                for(var a in teamData[teamID].admins){
                    if(teamData[teamID].admins[a].token===token){
                        teamData[teamID].admins[a].powerLevel = p.info.powerLevel;
                        break;
                    }
                }
            }

            for(var m in teamData[teamID].members){
                if(teamData[teamID].members[m].token===token){
                    teamData[teamID].members[m].powerLevel = p.info.powerLevel;
                    break;
                }
            }
        }
    }

}

function dispurseProfit(teamID){
    var gpp = 0, ipp = 0, upp = 0;  //player gain
    var gv = 0, iv = 0, uv = 0;     //team gain
    var gaveMem = false;
    var tax = teamData[teamID].settings.tax;

    //Determine who is online
    var mCount1 = 0, //All non leadership online
        mCount2 = 0, //All mems online
        aCount = 0,  //All admins online
        lCount = 0;  //Leader online
    for(var m in teamData[teamID].members){
        if(teamData[teamID].members[m].online){
            mCount1++;
            mCount2++;
        }
    }
    for(var a in teamData[teamID].admins){
        if(teamData[teamID].admins[a].online){
            mCount1--;
            aCount++;
        }
    }
    if(teamData[teamID].leader.online){
        mCount1--;
        lCount = 1;
    }

    //Determine profit divide
    if(tax < 100 && mCount2 > 0){
        gaveMem = true;

        if(teamData[teamID].settings.profitDivide==="FAIR"){
            //Calculate Profit
            gpp = parseInt((teamData[teamID].income.gold*(1 - tax/100))/mCount2);
            ipp = teamData[teamID].income.iron;
            upp = teamData[teamID].income.uranium;

            gv = teamData[teamID].income.gold - (gpp*mCount2);
            iv = teamData[teamID].income.iron;
            uv = teamData[teamID].income.uranium;

            //give to members
            if(gpp > 0 || ipp > 0 || upp > 0)
            for(var m in teamData[teamID].members){
                if(teamData[teamID].members[m].online){
                    giveLoot(players[teamData[teamID].members[m].id],gpp,ipp,upp);
                    players[teamData[teamID].members[m].id].battleLog.unshift({"type":"loot","msg":"You have been paid."});
                    if(ipp > 0 || upp > 0)
                    players[teamData[teamID].members[m].id].battleLog.unshift({"type":"loot","msg":"You have been given resources."});
                }
            }
        }
        else{
            if(teamData[teamID].settings.profitDivide==="AD 50%"){
                //calculate shares
                var split = parseInt(teamData[teamID].income.gold*(1 - tax/100)/2);

                //dispurse
                if(mCount1 > 0 && split > 0){
                    gpp = parseInt(split/mCount1);
                    if(gpp > 0){
                        for(var m in teamData[teamID].members){
                            if(teamData[teamID].members[m].online){
                                if(players[teamData[teamID].members[m].id].info.teamRole==="MEMBER"){
                                    giveLoot(players[teamData[teamID].members[m].id],gpp,ipp,upp);
                                    players[teamData[teamID].members[m].id].battleLog.unshift({"type":"loot","msg":"You have been paid."});
                                }
                            }
                        }
                    }

                }
                else{
                    gv = split;
                }

                if((aCount+lCount) > 0 && split > 0){
                    gpp = parseInt(split/(aCount+lCount));
                    if(gpp > 0){
                        if(aCount > 0){
                            for(var a in teamData[teamID].admins){
                                if(teamData[teamID].admins[a].online){
                                    giveLoot(players[teamData[teamID].admins[a].id],gpp,ipp,upp);
                                    players[teamData[teamID].admins[a].id].battleLog.unshift({"type":"loot","msg":"You have been paid."});
                                }
                            }
                        }
                        if(lCount>0){
                            giveLoot(players[teamData[teamID].leader.id],gpp,ipp,upp);
                            players[teamData[teamID].leader.id].battleLog.unshift({"type":"loot","msg":"You have been paid."});
                        }
                    }
                }
                else{
                    gv = split;
                }

            }
            else if(teamData[teamID].settings.profitDivide==="AD ONLY"){
                if(aCount > 0 || lCount > 0){
                    //Calculate share
                    gpp = parseInt((teamData[teamID].income.gold*(1 - tax/100))/(aCount+lCount));
                    gv = teamData[teamID].income.gold - (gpp*(aCount+lCount));

                    //Give to admins
                    if(gpp > 0)
                    for(var a in teamData[teamID].admins){
                        if(teamData[teamID].admins[a].online){
                            giveLoot(players[teamData[teamID].admins[a].id],gpp,ipp,upp);
                            players[teamData[teamID].admins[a].id].battleLog.unshift({"type":"loot","msg":"You have been paid."});
                        }
                    }

                    if(gpp > 0 && teamData[teamID].leader.online){
                        giveLoot(players[teamData[teamID].leader.id],gpp,ipp,upp);
                        players[teamData[teamID].leader.id].battleLog.unshift({"type":"loot","msg":"You have been paid."});
                    }
                }
                else{
                    gv = teamData[teamID].income.gold;
                }

            }
            else if(teamData[teamID].settings.profitDivide==="LD 50%"){
                //calculate shares
                var split = parseInt(teamData[teamID].income.gold*(1 - tax/100)/2);

                //Dispurse
                if(lCount > 0 && split > 0){
                    giveLoot(players[teamData[teamID].leader.id],split,ipp,upp);
                    players[teamData[teamID].leader.id].battleLog.unshift({"type":"loot","msg":"You have been paid."});
                }
                else{
                    gv = split;
                }

                if((mCount1+aCount) > 0 && split > 0){
                    gpp = parseInt(split/(mCount1+aCount));
                    for(var m in teamData[teamID].members){
                        if(teamData[teamID].members[m].online && teamData[teamID].members[m].id!=teamData[teamID].leader.id){
                            giveLoot(players[teamData[teamID].members[m].id],gpp,ipp,upp);
                            players[teamData[teamID].members[m].id].battleLog.unshift({"type":"loot","msg":"You have been paid."});
                        }
                    }
                }
                else{
                    gv = split;
                }


            }
            else if(teamData[teamID].settings.profitDivide==="LEADER"){
                if(lCount>0){
                    //calculate share
                    gpp = parseInt(teamData[teamID].income.gold*(1 - tax/100));
                    gv = teamData[teamID].income.gold - gpp;

                    //Give to leader
                    if(gpp > 0){
                        giveLoot(players[teamData[teamID].leader.id],gpp,ipp,upp);
                        players[teamData[teamID].leader.id].battleLog.unshift({"type":"loot","msg":"You have been paid."});
                    }
                }
                else{
                    gv = teamData[teamID].income.gold
                }
            }

            //Calculate iron and uranium
            ipp = teamData[teamID].income.iron;
            upp = teamData[teamID].income.uranium;

            iv = teamData[teamID].income.iron;
            uv = teamData[teamID].income.uranium;

            //give iron and uranium to members
            if(ipp > 0 || upp > 0){
                for(var m in teamData[teamID].members){
                    if(teamData[teamID].members[m].online){
                        giveLoot(players[teamData[teamID].members[m].id],0,ipp,upp);
                        players[teamData[teamID].members[m].id].battleLog.unshift({"type":"loot","msg":"You have been given resources."});
                    }
                }
            }

        }

    }
    else{
        //Calculate Iron and uranium
        ipp = teamData[teamID].income.iron;
        upp = teamData[teamID].income.uranium;

        iv = teamData[teamID].income.iron;
        uv = teamData[teamID].income.uranium;

        //give iron and uranium to members
        if(iv > 0 || uv > 0)
        for(var m in teamData[teamID].members){
            if(teamData[teamID].members[m].online){
                giveLoot(players[teamData[teamID].members[m].id],0,ipp,upp);
                players[teamData[teamID].members[m].id].battleLog.unshift({"type":"loot","msg":"You have been paid your share of the team's special income."});
            }
        }
    }

    if(!gaveMem){
        gv = teamData[teamID].income.gold;
        iv = teamData[teamID].income.iron;
        uv = teamData[teamID].income.uranium;
    }


    teamData[teamID].vault.gold += gv;
    teamData[teamID].vault.credits += teamData[teamID].income.credits;
    teamData[teamID].vault.iron += iv;
    teamData[teamID].vault.uranium += uv;

}


//Traps
function triggeredTrap(p){
    var tr = map[p.loc[0]][p.loc[1]].trap;
    if(tr>-1){
        if(players[trapList[tr].owner].info.teamID != p.info.teamID){
            p.info.trapped = trapDuration+1;
            p.battleLog.unshift({"type":"combat", "msg": "You've been trapped!"});

            players[trapList[tr].owner].battleLog.unshift({"type":"combat", "msg": "Your trap "+trapList[tr].num+" has triggered."});

            for(var l in trapList[tr].locs){
                map[trapList[tr].locs[l][0]][trapList[tr].locs[l][1]].trap = -1;
            }

            trapList[tr] = {"id":trapList[tr].id};
        }
    }
}

function isKnownTrap(p, trap){
    for(var t in p.knownTraps){
        if(p.knownTraps[t].id==trap) return true;
    }
    return false;
}



//Saving
function savePlayer(p, del){
    var writePlayer = p;
    jsonfile.writeFile('data/playerData/'+writePlayer.token+".json", writePlayer, {spaces: 4},function(err){
        if(err){
            console.log(err);
        }
        else if(del){
            while(!canDelete){
                var k = 0;
            }
            changeOnlineStatus(p,false);

            map[p.loc[0]][p.loc[1]].type = "OPEN";
            map[p.loc[0]][p.loc[1]].id = -1;

            players[p.id] = {"id":p.id,"name":p.info.name,"status":"OFFLINE","power":p.info.powerLevel,"changes":null};

        }
    });
}

function saveGameData(){
    jsonfile.writeFile('data/teamdata.json', teamData, {spaces: 4},function(err){
        if(err){
            console.log(err);
        }
    });

    var nameList = [];
    for(var p in players){
        if(players[p].status==="OFFLINE"){
            nameList[p] = {
                "name":players[p].name,
                "power":players[p].power,
                "changes": players[p].changes
            };
        }else{
            nameList[p] = {
                "name": players[p].info.name,
                "power":players[p].info.powerLevel,
                "changes": null
            };
        }
    }

    var data = {
        "playerSize":playerSize,
        "nameList": nameList
    };

    jsonfile.writeFile('data/gamedata.json', data, {spaces: 4},function(err){
        if(err){
            console.log(err);
        }
    });

    jsonfile.writeFile('data/feedback.json', feedback, {spaces: 4},function(err){
        if(err){
            console.log(err);
        }
    });
}



//Map Related
function spawn(baseID){
    while(true){
        if(baseID > 0){
            var r = parseInt(Math.random()*baseList[baseID].tiles.length);

            if(!spotOccupied(baseList[baseID].tiles[r])){
                return baseList[baseID].tiles[r];
            }
        }
        else{
            var r = parseInt(Math.random()*spawnList.length);

            if(!spotOccupied(spawnList[r])){
                return spawnList[r];
            }
        }
    }
}

function buildMap(){
    //Correct mapSize
    if(mapSize < minMapSize) mapSize = minMapSize;

    //Sweep 1
    //Define zones, initialize all spaces, and spawn rocks
    //z0 - spawn    (4%)
    //z1 - low      (12%)
    //z2 - med      (~57%)
    //z3 - high     (~18%)
    //z4 - super    (9%)
    var id = 0;
    for(var x = 0; x < mapSize; x++){
        map[x] = [];
        for(var y = 0; y < mapSize; y++){
            var zone = 2; //if nothing else

            //z4 (small corners)
            if((x < mapSize*.15 && y < mapSize*.15) || (x < mapSize*.15 && y > mapSize-mapSize*.15) ||
               (x > mapSize-mapSize*.15 && y < mapSize*.15) || (x > mapSize-mapSize*.15 && y > mapSize-mapSize*.15)){
                zone = 4;
            }

            //z3 (large corners)
            else if((x < mapSize*.25 && y < mapSize*.25) || (x < mapSize*.25 && y > mapSize-mapSize*.25) ||
                    (x > mapSize-mapSize*.25 && y < mapSize*.25) || (x > mapSize-mapSize*.25 && y > mapSize-mapSize*.25)){
                zone = 3;
            }

            //z3 (tiny mids)
            else if((x <= mapSize*.07 && y > mapSize*.465 && y < mapSize*.535)
                    ||(x >= mapSize*.93 && y > mapSize*.465 && y < mapSize*.535)
                    ||(y <= mapSize*.07 && x > mapSize*.465 && x < mapSize*.535)
                    ||(y >= mapSize*.93 && x > mapSize*.465 && x < mapSize*.535)
                ){
                zone = 3;
            }

            //z0 (tiny center)
            else if(x > mapSize*.4 && x < mapSize*.6 && y > mapSize*.4 && y < mapSize*.6){
                zone = 0;
                spawnList.push([x,y]);
            }

            //z1 (large center)
            else if(x > mapSize*.3 && x < mapSize*.7 && y > mapSize*.3 && y < mapSize*.7){
                zone = 1;
            }

            //Spawn rock
            if(Math.random() < rockSpread){
                rockList[rockList.length] = {
                    "id": rockList.length,
                    "hp": rockHP,
                    "hpMAX": rockHP,
                    "loc": [x,y]
                };
                map[x][y] = {
                    "type": "ROCK",
                    "zone": zone,
                    "id": rockList.length-1,
                    "baseID": -1,
                    "loot": {"gold":0,"iron":0,"uranium":0},
                    "trap": -1
                }
                if(zone==0)
                    spawnList.splice(spawnList.length-1,1);
            }
            else{
                map[x][y] = {
                    "type": "OPEN",
                    "zone": zone,
                    "id": -1,
                    "baseID": -1,
                    "loot": {"gold":0,"iron":0,"uranium":0},
                    "trap": -1
                }
            }

        }
    }

    //Sweep 2 - Create Bases
    var maxBases = parseInt(mapSize*mapSize/80);
    var minBases = parseInt(mapSize*mapSize/110);
    var tries = 0;
    while(baseList.length < minBases){
        baseList = [];
        while(baseList.length < maxBases && tries < mapSize*10){
            var x = parseInt(Math.random()*mapSize);
            var y = parseInt(Math.random()*mapSize);

            if(map[x][y].type==="OPEN" && map[x][y].zone!=0 && map[x][y].zone!=4
               && canBuildBase([x,y])){
                   var id = newBase(map[x][y].zone, [x,y]);
                   map[x][y].type = "BASE";
                   map[x][y].id = id;
                   tries = 0;
            }
            else{
                tries++;
            }
        }
    }


    //Sweep 3 - Fill in holes and choose loot spawns
    var holeList = [];
    for(var x = 0; x < mapSize; x++){
        for(var y = 0; y < mapSize; y++){
            if(map[x][y].zone!=0 && map[x][y].zone!=4 && map[x][y].baseID==-1)
                holeList.push([x,y]);

            if(map[x][y].type==="OPEN" && map[x][y].zone!=0)
                lootSpawns.push({"loc":[x,y],"zone":map[x][y].zone});
        }
    }
    //baseSpreadMethod1(holeList);
    baseSpreadMethod2(holeList);

    //Sweep 4 - Special Placements
    //SUPER BASE STORE
    var idSup = newBase(0, [parseInt(mapSize/2),parseInt(mapSize/2)]);
    map[parseInt(mapSize/2)][parseInt(mapSize/2)].type = "BASE";
    map[parseInt(mapSize/2)][parseInt(mapSize/2)].id = idSup;

    //Sweep 5 - Spawn Loot
    spawnLoot();

    console.log("BASE COUNT: "+baseList.length+" ["+minBases+", "+maxBases+"]");
}

function baseSpreadMethod1(holeList){
    var maxBaseSize = 50;
    var add = false;
    while(holeList.length>0){
        for(var i = 0; i < holeList.length; i++){
            var x = holeList[i][0], y = holeList[i][1];

            var dx = x-1, ux = x+1, dy = y-1, uy = y+1;
            if(dx < 0) dx+=mapSize;
            if(ux >= mapSize) ux-=mapSize;
            if(dy < 0) dy+=mapSize;
            if(uy >= mapSize) uy-=mapSize;

            if(map[dx][y].baseID!=-1){
                if(baseList[map[dx][y].baseID].tiles.length < maxBaseSize){
                    baseList[map[dx][y].baseID].tiles.push([x,y]);
                    map[x][y].baseID = map[dx][y].baseID;
                    holeList.splice(i,1);
                    i--;
                }
            }
            else if(map[ux][y].baseID!=-1){
                if(baseList[map[ux][y].baseID].tiles.length < maxBaseSize){
                    baseList[map[ux][y].baseID].tiles.push([x,y]);
                    map[x][y].baseID = map[ux][y].baseID;
                    holeList.splice(i,1);
                    i--;
                }
            }
            else if(map[x][dy].baseID!=-1){
                if(baseList[map[x][dy].baseID].tiles.length < maxBaseSize){
                    baseList[map[x][dy].baseID].tiles.push([x,y]);
                    map[x][y].baseID = map[x][dy].baseID;
                    holeList.splice(i,1);
                    i--;
                }
            }
            else if(map[x][uy].baseID!=-1){
                if(baseList[map[x][uy].baseID].tiles.length < maxBaseSize){
                    baseList[map[x][uy].baseID].tiles.push([x,y]);
                    map[x][y].baseID = map[x][uy].baseID;
                    holeList.splice(i,1);
                    i--;
                }
            }
        }
        if(add){
            maxBaseSize++;
        }
        add = !add;
    }
}

function baseSpreadMethod2(holeList){
    var claim = false;
    var range = 8;
    while(holeList.length>0){
        claim = false;
        for(var b in baseList){
            for(var h = 0; h < holeList.length; h++){
                if(claimRange(baseList[b].loc,holeList[h],range)){
                    baseList[b].tiles.push([holeList[h][0],holeList[h][1]]);
                    map[holeList[h][0]][holeList[h][1]].baseID = baseList[b].id;
                    holeList.splice(h,1);
                    claim = true;
                    break;
                }
            }
        }

        if(!claim){
            range++;
            if(range > 30) break;
        }
    }
}

function claimRange(base, hole, range){
    var t = parseInt(range/2);
    var xAdj = t-base[0], yAdj = t-base[1];
    var cX = (hole[0] + xAdj)%mapSize, cY = (hole[1] + yAdj)%mapSize;

    if(cX<0)cX+=mapSize;
    if(cY<0)cY+=mapSize;

    return cX < range && cY < range;
}

function newBase(zone, loc){
    var id = baseList.length;
    var tiles = [];

    var special = "N", lvl = 1, hpMAX = 0;
    var gold = 0, credits = 0, gTier = 0, cTier = 0;
    var tPoints;

    if(zone==0){
        lvl = 4;
        hpMAX = 10000;
    }
    else if(zone==1){
        tPoints = 2;
        while(tPoints > 0){
            if(Math.random()<.5) gTier++;
            else cTier++;

            tPoints--;
        }
    }
    else if(zone==2){
        if(Math.random() < .25){
            lvl = 2;
        }

        tPoints = 4;
        while(tPoints > 0){
            var r = Math.random();
            if(r < .3 && special==="N"){
                r = Math.random();
                if(r < .2) special = "S";
                else if(r < .8) special="I";
                else special = "U";
            }
            else if (((r < .65 && special==="N") || (r < .5 && special!=="N")) && gTier<3 || cTier==3) gTier++;
            else cTier++;

            tPoints--;
        }
    }
    else if(zone==3){
        if(Math.random() < .75){
            lvl = 2;
        }

        tPoints = 6;
        while(tPoints > 0){
            var r = Math.random();
            if(r < .8 && special==="N"){
                r = Math.random();
                if(r < .2) special = "S";
                else if(r < .3) special="I";
                else special = "U";
            }
            else if (((r < .9 && special==="N") || (r < .5 && special!=="N")) && gTier<3 || cTier==3) gTier++;
            else cTier++;

            tPoints--;
        }
    }

    //Decide hp
    if(lvl==1) hpMAX = 20;
    else if(lvl==2) hpMAX = 50;

    //Decide output
    if(gTier==1) gold = parseInt(Math.random()*30)+10;
    if(gTier==2) gold = parseInt(Math.random()*100)+50;
    if(gTier==3) gold = parseInt(Math.random()*150)+150;
    if(cTier==1) credits = parseInt(Math.random()*30)+10;
    if(cTier==2) credits = parseInt(Math.random()*100)+50;
    if(cTier==3) credits = parseInt(Math.random()*150)+150;


    //Grab all tiles within 3 blocks from all sides
    for(var x = 0; x < 7; x++){
        for(var y = 0; y < 7; y++){
            var cx = loc[0] + (x - 3);
            var cy = loc[1] + (y - 3);

            if(cx < 0) cx+=mapSize;
            else if(cx >= mapSize) cx-=mapSize;
            if(cy < 0) cy+=mapSize;
            else if(cy >= mapSize) cy-=mapSize;

            tiles.push([cx,cy]);
            map[cx][cy].baseID = id;
        }
    }


    baseList[id] = {
        "id": id,
        "lvl": lvl,
        "hp": hpMAX,
        "hpMAX": hpMAX,
        "inCombat": 0,
        "canAttack": true,
        "targets": [],
        "attacks": [0,0,0],
        "actTargets": [],
        "canTarget": true,
        "upgrade": 0,
        "upgradeMAX": 40,
        "upgradeCost": calculateBaseUpgradeCost(lvl),
        "upgrading": false,
        "output": {
            "gold":gold,
            "gTier": gTier,
            "credits":credits,
            "cTier": cTier
        },
        "special": special,
        "owner": -1,
        "loc": loc,
        "tiles": tiles
    };

    return id;
}

function canBuildBase(spot){
    for(var b in baseList){
        var bRange = 13;
        var t = parseInt(bRange/2);
        var xAdj = t-spot[0], yAdj = t-spot[1];
        var cX = (baseList[b].loc[0] + xAdj)%mapSize, cY = (baseList[b].loc[1] + yAdj)%mapSize;

        if(cX<0)cX+=mapSize;
        if(cY<0)cY+=mapSize;

        if(cX < bRange && cY < bRange) return false;
    }

    //z4 (small corners)
    if((spot[0] < mapSize*.15+3 && spot[1] < mapSize*.15+3) || (spot[0] < mapSize*.15+3 && spot[1] > mapSize-mapSize*.15-3) ||
       (spot[0] > mapSize-mapSize*.15-3 && spot[1] < mapSize*.15+3) || (spot[0] > mapSize-mapSize*.15-3 && spot[1] > mapSize-mapSize*.15-3)){
        return false;
    }
    //z0 (tiny center)
    else if(spot[0] > mapSize*.4-3 && spot[0] < mapSize*.6+3 && spot[1] > mapSize*.4-3 && spot[1] < mapSize*.6+3){
        return false;
    }

    return true;
}

function calculateBaseUpgradeCost(lvl){
    if(lvl==1)
        return {"gold":5000,"credits":10000,"iron":80,"uranium":10};
    else if(lvl==2)
        return {"gold":10000,"credits":20000,"iron":160,"uranium":30};
    else
        return {"gold":9999999,"credits":9999999,"iron":99999,"uranium":9999};
}

function spawnLoot(){
    if(lootCount < mapSize*mapSize*lootSpreadMAX){
        var spawn = parseInt(mapSize*mapSize*lootSpreadMIN);
        for(var i = lootCount; i < spawn; i++){
            var r = parseInt((Math.random()*100000)%lootSpawns.length);
            var loot = chooseTreasureValue(lootSpawns[r].zone);
            map[lootSpawns[r].loc[0]][lootSpawns[r].loc[1]].loot.gold += loot.gold;
            map[lootSpawns[r].loc[0]][lootSpawns[r].loc[1]].loot.iron += loot.iron;
            map[lootSpawns[r].loc[0]][lootSpawns[r].loc[1]].loot.uranium += loot.uranium;
            lootCount++;
            // lootSpawns.splice(r,1);
        }
        for(var i = 0; i < lootSpawnRate; i++){
            var r = parseInt((Math.random()*100000)%lootSpawns.length);
            var loot = chooseTreasureValue(lootSpawns[r].zone);
            map[lootSpawns[r].loc[0]][lootSpawns[r].loc[1]].loot.gold += loot.gold;
            map[lootSpawns[r].loc[0]][lootSpawns[r].loc[1]].loot.iron += loot.iron;
            map[lootSpawns[r].loc[0]][lootSpawns[r].loc[1]].loot.uranium += loot.uranium;
            lootCount++;
            // lootSpawns.splice(r,1);
        }
    }
}

function chooseTreasureValue(zone){
    var val = 0, sum = 0;
    var r = Math.random();
    var zone;
    if(zone==1) zone = lootSpawnValues.zone1;
    if(zone==2) zone = lootSpawnValues.zone2;
    if(zone==3) zone = lootSpawnValues.zone3;
    if(zone==4) zone = lootSpawnValues.zone4;

    for(var i = 0; i < zone.length; i++){
        if(r < zone[i].chance+sum){
            var loot = {"gold":0,"iron":0,"uranium":0}
            if(zone[i].type==="GOLD"){
                loot.gold = zone[i].count;
            }
            else if(zone[i].type==="IRON"){
                loot.iron = zone[i].count;
            }
            else if(zone[i].type==="URANIUM"){
                loot.uranium = zone[i].count;
            }

            return loot;
        }
        else
            sum += zone[i].chance;
    }

    return val;
}

function hasLoot(loc){
    if(loc.loot.gold>0) return true
    else if(loc.loot.iron>0) return true
    else if(loc.loot.uranium>0) return true
    return false;
}



//Combat
function hit(location, p, type){
    var dmg;
    if(type==="hit")
        dmg = p.stats.attack + (isEquipped(p,"ATK+")?statData.attackINC:0);
    if(type==="blasted")
        dmg = (p.stats.attack + (isEquipped(p,"ATK+")?statData.attackINC:0))*(p.stats.cannon>2?1.5:1);
    if(type==="railed")
        dmg = (p.stats.attack + (isEquipped(p,"ATK+")?statData.attackINC:0))*(p.stats.railgun+1);

    if(location.type==="PLAYER"){
        var hit = players[location.id];
        dmg -= (isEquipped(hit,"DR")?1:0);
        if(dmg>0){
            hit.stats.hp -= dmg;
            hit.info.inCombat = combatCooldown;
            hit.battleLog.unshift({"type":"combat", "msg": ""+p.info.name+" has "+type+" you for "+dmg+" damage."});

            if(hit.stats.hp <= 0){
                death(hit, p);
            }
        }
    }
    else if(location.type==="BASE"){
        var hit = baseList[location.id];
        if(type==="railed") dmg /= 2;
        hit.hp -= dmg;

        if(hit.canTarget){
            var nTarget = true;
            for(var t in hit.targets){
                if(hit.targets[t].id===p.id){
                    nTarget = false;
                    hit.targets[t].countdown = 5;
                    break;
                }
            }
            if(nTarget)
                hit.targets.push({"id":p.id,"countdown":5});
        }


        if(p.info.teamID!=hit.owner){
            if(hit.inCombat <= 0 && hit.owner>-1){
                messageGroup(teamData[hit.owner].members,
                             "Base "+hit.id+" is under attack!", "", "team", null);
            }
            hit.inCombat = combatCooldown;
        }

        if(hit.hp <= 0){
            var oldID = hit.owner;
            hit.owner = p.info.teamID;

            if(oldID != hit.owner)
                p.info.captures++;

            hit.hp = parseInt(hit.hpMAX/2);
            hit.attacks = [0,0,0];
            hit.targets = [];
            hit.inCombat = 0;
            hit.canAttack = false;
            hit.upgrading = false;
            hit.canTarget = false;
            hit.upgrade = 0;
            if(oldID>-1)
                messageGroup(teamData[oldID].members,
                             "Base "+hit.id+" has been captured by "+teamData[p.info.teamID].name+"!", "", "team", null);
            messageGroup(teamData[p.info.teamID].members,
                         p.info.name+" has captured Base "+hit.id+"!",
                         "You have captured Base "+hit.id+"!", "team", p);
        }
    }
    else if(location.type==="ROCK"){
        var hit = rockList[location.id];
        hit.hp -= dmg;

        if(hit.hp <= 0){
            map[hit.loc[0]][hit.loc[1]].type = "OPEN";
            map[hit.loc[0]][hit.loc[1]].id = -1;
        }
    }
    else if(location.type==="WALL"){
        var hit = wallList[location.id];
        var base = baseList[location.baseID];

        if(hit.hp == hit.hpMAX){
            messageGroup(teamData[base.owner].members,
                         "Base "+hit.id+"'s walls are under attack!", "", "team", null);
        }

        if(type==="railed") dmg /= 2;
        hit.hp -= dmg;

        if(base.canTarget){
            var nTarget = true;
            for(var t in base.targets){
                if(base.targets[t].id === p.id){
                    nTarget = false;
                    base.targets[t].countdown = 5;
                    break;
                }
            }
            if(nTarget)
                base.targets.push({"id":p.id,"countdown":5});
        }

        if(hit.hp <= 0){
            map[hit.loc[0]][hit.loc[1]].type = "OPEN";
            map[hit.loc[0]][hit.loc[1]].id = -1;
            messageGroup(teamData[base.owner].members,
                         "Enemies have breached Base "+hit.id+"'s walls!", "", "team", null);
        }
    }

}

function death(p, killer){
    p.stats.hp = 0;
    p.info.deaths = p.info.deaths + 1;
    p.info.respawnCount = respawnCountdown+1;
    p.queue = [];
    p.battleLog.unshift({"type":"combat", "msg": "You died."});
    if(killer!=null)
        killer.info.kills = killer.info.kills + 1;

    var dropGold, dropIron, dropUranium;
    if(!p.info.hasInsurance){
        dropGold = p.info.gold;
        dropIron = p.info.iron;
        dropUranium = p.info.uranium;
        p.info.gold = 0;
        p.info.iron = 0;
        p.info.uranium = 0;

        p.info.shipMass-=5;
        if(p.info.shipMass<0)p.info.shipMass=0;

        //Equips
        if(p.stats.scanner>1){
            p.stats.scanner--;
            p.stats.scannerUpgrades--;
        }
        if(isEquipped(p,"CAN")){
            p.stats.cannonUpgrades--;
            p.stats.cannon = p.stats.cannon - statData.cannonINC;
            updateStorageItem(p,"CAN",p.stats.cannon);
            if(p.stats.cannon == 0){
                removeFromStorage(p,"CAN");
                if(p.abilitySlots[0].type==="CAN") p.abilitySlots[0] = {"type":"NONE","canUse":false};
                if(p.abilitySlots[1].type==="CAN") p.abilitySlots[1] = {"type":"NONE","canUse":false};
            }
        }
        if(isEquipped(p,"BLNK")){
            p.stats.blinkUpgrades--;
            p.stats.blink = p.stats.blink - statData.blinkINC;
            updateStorageItem(p,"BLNK",p.stats.blink);
            if(p.stats.blink == 0){
                removeFromStorage(p,"BLNK");
                if(p.abilitySlots[0].type==="BLNK") p.abilitySlots[0] = {"type":"NONE","canUse":false};
                if(p.abilitySlots[1].type==="BLNK") p.abilitySlots[1] = {"type":"NONE","canUse":false};
            }
        }
        if(isEquipped(p,"ENG")){
            p.stats.engModUpgrades--;
            p.stats.engMod = p.stats.engMod - statData.engModINC;
            updateStorageItem(p,"ENG",p.stats.engMod);
            if(p.stats.engMod == 0){
                removeFromStorage(p,"ENG");
                if(p.abilitySlots[0].type==="ENG") p.abilitySlots[0] = {"type":"NONE","canUse":false};
                if(p.abilitySlots[1].type==="ENG") p.abilitySlots[1] = {"type":"NONE","canUse":false};
            }
        }
        if(isEquipped(p,"TRAP")){
            p.stats.trapUpgrades--;
            p.stats.trap = p.stats.trap - statData.trapINC;
            updateStorageItem(p,"TRAP",p.stats.trap);
            if(p.stats.trap == 0){
                removeFromStorage(p,"TRAP");
                if(p.abilitySlots[0].type==="TRAP") p.abilitySlots[0] = {"type":"NONE","canUse":false};
                if(p.abilitySlots[1].type==="TRAP") p.abilitySlots[1] = {"type":"NONE","canUse":false};
            }
        }
        if(isEquipped(p,"HIDE")){
            p.stats.stealthUpgrades--;
            p.stats.stealth = p.stats.stealth - statData.stealthINC;
            updateStorageItem(p,"HIDE",p.stats.stealth);
            if(p.stats.stealth == 0){
                removeFromStorage(p,"HIDE");
                if(p.abilitySlots[0].type==="HIDE") p.abilitySlots[0] = {"type":"NONE","canUse":false};
                if(p.abilitySlots[1].type==="HIDE") p.abilitySlots[1] = {"type":"NONE","canUse":false};
            }
        }
        if(isEquipped(p,"RAIL")){
            p.stats.railgunUpgrades--;
            p.stats.railgun = p.stats.railgun - statData.railgunINC;
            updateStorageItem(p,"RAIL",p.stats.railgun);
            if(p.stats.railgun == 0){
                removeFromStorage(p,"RAIL");
                if(p.abilitySlots[0].type==="RAIL") p.abilitySlots[0] = {"type":"NONE","canUse":false};
                if(p.abilitySlots[1].type==="RAIL") p.abilitySlots[1] = {"type":"NONE","canUse":false};
            }
        }
        if(isEquipped(p,"HEAL")){
            p.stats.quickHeal = false;
            removeFromStorage(p,"HEAL");
            if(p.abilitySlots[0].type==="HEAL") p.abilitySlots[0] = {"type":"NONE","canUse":false};
            if(p.abilitySlots[1].type==="HEAL") p.abilitySlots[1] = {"type":"NONE","canUse":false};

        }
        if(isEquipped(p,"ATK+")){
            p.stats.staticAtk = false;
            removeFromStorage(p,"ATK+");
            if(p.abilitySlots[0].type==="ATK+") p.abilitySlots[0] = {"type":"NONE","canUse":false};
            if(p.abilitySlots[1].type==="ATK+") p.abilitySlots[1] = {"type":"NONE","canUse":false};

        }
        if(isEquipped(p,"ENG+")){
            p.stats.staticEng = false;
            removeFromStorage(p,"ENG+");
            if(p.abilitySlots[0].type==="ENG+") p.abilitySlots[0] = {"type":"NONE","canUse":false};
            if(p.abilitySlots[1].type==="ENG+") p.abilitySlots[1] = {"type":"NONE","canUse":false};
            p.stats.energyMAX = statData.energyStart+(statData.energyINC*(p.stats.energyUpgrades));
            if(p.stats.energy > p.stats.energyMAX) p.stats.energy = p.stats.energyMAX;

        }
        if(isEquipped(p,"HP+")){
            p.stats.staticHp = false;
            removeFromStorage(p,"HP+");
            if(p.abilitySlots[0].type==="HP+") p.abilitySlots[0] = {"type":"NONE","canUse":false};
            if(p.abilitySlots[1].type==="HP+") p.abilitySlots[1] = {"type":"NONE","canUse":false};
            p.stats.hpMAX = statData.hpStart+(statData.hpINC*(p.stats.hpUpgrades));
            if(p.stats.hp > p.stats.hpMAX) p.stats.hp = p.stats.hpMAX;
        }
        if(isEquipped(p,"RDR+")){
            p.stats.staticRdr = false;
            removeFromStorage(p,"RDR+");
            if(p.abilitySlots[0].type==="RDR+") p.abilitySlots[0] = {"type":"NONE","canUse":false};
            if(p.abilitySlots[1].type==="RDR+") p.abilitySlots[1] = {"type":"NONE","canUse":false};
            p.stats.radar = statData.radarStart+(statData.radarINC*(p.stats.radarUpgrades-1));
        }
        if(isEquipped(p,"DR")){
            p.stats.staticDR = false;
            removeFromStorage(p,"DR");
            if(p.abilitySlots[0].type==="DR") p.abilitySlots[0] = {"type":"NONE","canUse":false};
            if(p.abilitySlots[1].type==="DR") p.abilitySlots[1] = {"type":"NONE","canUse":false};
        }


        //Statics
        if(p.stats.hpMAX>statData.hpStart){
            p.stats.hpUpgrades--;
            p.stats.hpMAX = p.stats.hpMAX-statData.hpINC;
        }
        if(p.stats.energyMAX>statData.energyStart){
            p.stats.energyUpgrades--;
            p.stats.energyMAX = p.stats.energyMAX-statData.energyINC;
        }
        if(p.stats.radar>statData.radarStart){
            p.stats.radarUpgrades--;
            p.stats.radar = p.stats.radar-statData.radarINC;
        }
        if(p.stats.attack>statData.attackStart){
            p.stats.attackUpgrades--;
            p.stats.attack = p.stats.attack-statData.attackINC;
        }
    }
    else{
        p.info.hasInsurance = false;
        dropGold = p.info.gold-parseInt(p.info.gold*p.stats.insurance*.2);
        dropIron = p.info.iron-parseInt(p.info.iron*p.stats.insurance*.2);
        dropUranium = p.info.uranium-parseInt(p.info.uranium*p.stats.insurance*.2);
        p.info.gold = parseInt(p.info.gold*p.stats.insurance*.2);
        p.info.iron = parseInt(p.info.iron*p.stats.insurance*.2);
        p.info.uranium = parseInt(p.info.uranium*p.stats.insurance*.2);
    }

    map[p.loc[0]][p.loc[1]].loot = {"gold":dropGold, "iron":dropIron, "uranium":dropUranium};
    map[p.loc[0]][p.loc[1]].type = "OPEN";
    map[p.loc[0]][p.loc[1]].id = -1;


    //Alert the world of a kill
    if(killer!=null){
        var msg = ""+killer.info.name+" has killed "+p.info.name+".";
        for(var m = 0; m < players.length; m++){
            if(players[m].status!=="OFFLINE")
                if(players[m].token === killer.token)
                    killer.battleLog.unshift({"type":"server", "msg": "You have killed "+p.info.name});
                else
                    players[m].battleLog.unshift({"type":"server", "msg": msg});
        }
    }
    else{
        var msg = ""+p.info.name+" has died.";
        for(var m = 0; m < players.length; m++){
            if(players[m].status!=="OFFLINE")
                players[m].battleLog.unshift({"type":"server", "msg": msg});
        }
    }
}



//Other
function generateToken(){
    //Create random 16 character token
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var token = '';
    for (var i = 0; i < tokenSize; i++) {
      token += chars[Math.round(Math.random() * (chars.length - 1))];
    }

    return token;
}

function messageGroup(group, msg, msgS, type, source){
    if(type==="team"){
        for(var i = 0; i < group.length; i++){
            if(group[i].online){
                var sendOut = false;
                if(source!=null){
                    if(players[group[i].id].token===source.token){
                        sendOut = true;
                        players[group[i].id].battleLog.unshift({"type":type, "msg": msgS});
                    }
                }

                if(!sendOut){
                    players[group[i].id].battleLog.unshift({"type":type, "msg": msg});
                }
            }
        }
    }
    else if(type==="tchat"){
        for(var i = 0; i < group.length; i++){
            if(group[i].online){
                players[group[i].id].battleLog.unshift({"type":type, "msg":msg, "user":source.info.name});
            }
        }
    }
    else if(type==="chat"){
        for(var i = 0; i < players.length; i++){
            if(players[i].status!=="OFFLINE")
                players[i].battleLog.unshift({"type":type, "msg":msg, "user":source.info.name});
        }
    }
    else{
        for(var i = 0; i < players.length; i++){
            if(players[i].status!=="OFFLINE"){
                var sendOut = false;
                if(source!=null){
                    if(players[i].token === source.token){
                        sendOut = true;
                        players[i].battleLog.unshift({"type":type, "msg": msgS});
                    }

                }

                if(!sendOut){
                    players[i].battleLog.unshift({"type":type, "msg": msg});
                }
            }
        }

    }
}

function calculateIndividualPower(p){
    var upgradeVal = 10, haulVal = 2, killVal = 3, capVal = 5, wallPVal = 1;

    return p.info.shipMass*upgradeVal + Math.min(p.info.hauls,100)*haulVal + p.info.kills*killVal + Math.min(p.info.captures,100)*capVal + Math.min(p.info.wallsPlaced,200)*wallPVal;
}

function giveLoot(p, gold, iron, uranium){
    p.info.gold += gold;
    p.info.totalGold += gold;
    p.info.iron += iron;
    p.info.totalIron += iron;
    if(uranium > 0 && p.info.uranium < p.stats.urCarry){
        if(p.info.uranium + uranium > p.stats.urCarry){
            var uranDrop = p.info.uranium + uranium - p.stats.urCarry;
            p.info.uranium = p.stats.urCarry;
            p.info.totalUranium += uranium-uranDrop;
        }
        else{
            p.info.uranium += uranium;
            p.info.totalUranium += uranium;
        }
    }
}

function rankPlayers(){
    var leaderBoard = [];

    for(var p in players){
        if(players[p].status!=="OFFLINE")
            leaderBoard.push({"name":players[p].info.name,"power":players[p].info.powerLevel,"online":true});
        else
            leaderBoard.push({"name":players[p].name,"power":players[p].power,"online":false});
    }

    leaderBoard.sort(function(a,b){
        if(a.power > b.power) return -1;
        if(a.power < b.power) return 1;
        return 0;
    });

    return leaderBoard;
}
