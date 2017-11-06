var jsonfile = require('jsonfile');
var changelog;
var version = "Alpha v1.1";

//Globals
var port = 8081;
var players = [];
var tokenSize = 200;
var playerNameMaxLength = 16;
var teamNameMaxLength = 25;

//Map Building
var mapSize = 104;
var rockSpread = .04;   //decimal as percent
var shopSpread = .007;  //decimal as percent
var specialShops = 2;   //even number is preferred
var map = [];
var spawns = [];
var spawnWid = .25;
var spawnHei = .33;
var zone3Wid = .2;
var zone3Hei = .4;
var zone2Wid = .2;
var zone2Hei = .5;

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
var cTick = 30; //countdownMax * tick = 3 secs
var aTick = 800; //action tick
var combatCooldown = 4; //Number of rounds
var dcCountdown = 2; //d/c cooldown

//Saving
var saveCountdown = 0;
var saveRound = 3;
var canDelete = true;

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

var shopData;
var shopList = [];
var trapList = [];
var teamData;
var trapCounter = 0;

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
    jsonfile.readFile("data/teamdata.json", function(err, obj) {
        if(err){
            console.log(err);
            process.exit(1);
        }
        teamData = [];
        for(var t in obj){
            teamData[obj[t].id] = obj[t];
        }
        // console.log(teamData);
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

        // console.log("GOT TOKEN: "+token);

        var found = false;
        for(var i = 0; i < players.length; i++){
            if(players[i].token === token){
                found = true;
                break;
            }
        }

        if(!found)
        jsonfile.readFile("data/playerData/"+token+".json", function(err, obj) {
            var data;
            if(err){
                console.log(err);
                data = {
                    "error": "Invalid Token"
                }
            }else{
                players.push(obj);
                var name = ""
                for(var i = players.length-1; i > -1; i--){
                    if(players[i].token === token){
                        players[i].battleLog = [];
                        players[i].loc = spawn();
                        name = players[i].info.name;
                        break;
                    }
                }
                data = {
                    "token": obj.token,
                    "map": map,
                    "error":""
                }
                var msg = {"type":"server", "msg": ""+name+" has connected."};
                console.log(msg.msg);
                for(var m = 0; m < players.length; m++){
                    players[m].battleLog.unshift(msg);
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
        var sp = spawn();

        var newP = {
            "token": token,
            "info":{
                "name": name,
                "teamID": -1,
                "teamRole": "NONE",
                "gold": 5000,
                "totalGold":0,
                "iron": 0,
                "totalIron":0,
                "uranium": 0,
                "totalUranium":0,
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
                "shipMass": 0
            },
            "loc": sp,
            "queue": [],
            "knownLocs": [], //TODO: merge scanned and knownLocs: use scanned functionality?
            "scanned": [],
            "knownTraps": [],
            "battleLog": [],
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
            "loc": sp,
            "map": map
        }

        res.send(data);

        players.push(newP);

        var msg = {"type":"server", "msg": ""+name+" has connected."};
        for(var m = 0; m < players.length; m++){
            players[m].battleLog.unshift(msg);
        }
    });
    app.get('/data/:token', function (req, res) {
        //Get token
        var token = req.params.token
        var sendPlayers = [];

        var p;
        for(var i = 0; i < players.length; i++){
            if(players[i].token===token){
                p = players[i];
                p.info.connected = 0;
            }else if(players[i].stats.hp>0)
                sendPlayers.push({"token":players[i].token,
                                  "name":players[i].info.name,
                                  "loc":players[i].loc,
                                  "stealthed":players[i].info.stealthed,
                                  "team":players[i].info.teamID});
        }

        if(p!=null){
            var sendMap = [];
            for(var x = 0; x < mapSize; x++){
                sendMap[x] = [];
                for(var y = 0; y < mapSize; y++){
                    if(isLoot(map[x][y]) && !isKnown(p.knownLocs,x,y)) sendMap[x][y] = "OPEN";
                    else if(isLoot(map[x][y])){
                        if((map[x][y].type==="URANIUM" && p.stats.scanner<3) ||
                           (map[x][y].type==="IRON" && p.stats.scanner<2))
                            sendMap[x][y] = "GOLD";
                        else
                            sendMap[x][y] = map[x][y].type;
                    }
                    else
                        sendMap[x][y] = map[x][y].type;
                }
            }

            for(var i = 0; i < sendPlayers.length; i++){
                var isScanned = inScanned(p, sendPlayers[i].token);
                var inVision = visionDistance(p.loc,sendPlayers[i].loc);
                var sameTeam = sendPlayers[i].team == p.info.teamID;
                if(!isScanned && (!inVision || (inVision && sendPlayers[i].stealthed)) && !sameTeam){
                    sendPlayers.splice(i,1);
                    i--;
                }else{
                    //drop token
                    delete sendPlayers[i].token;
                }
            }

            var sendTeam = [];
            for(var t in teamData){
                if(t == p.info.teamID){
                    var admins = [];
                    var members = [];
                    for(var a in teamData[t].admins){
                        admins.push(teamData[t].admins[a][1]);
                    }
                    for(var m in teamData[t].members){
                        members.push(teamData[t].members[m][1]);
                    }
                    sendTeam[teamData[t].id] = {
                        "id": teamData[t].id,
                        "name": teamData[t].name,
                        "colors": teamData[t].colors,
                        "leader": teamData[t].leader[1],
                        "admins": admins,
                        "members": members,
                        "gold": teamData[t].gold,
                        "iron": teamData[t].iron,
                        "uranium": teamData[t].uranium,
                        "credits": teamData[t].credits,
                        "income": teamData[t].income,
                        "settings": teamData[t].settings,
                        "power": calculateTeamPower(t),
                        "mapControl": calculateMapControl(t),
                        "rank": teamData[t].teamRank
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
                        "power": calculateTeamPower(t),
                        "mapControl": calculateMapControl(t)
                    };
                }
            }

            //Update canUse
            p.abilitySlots[0].canUse = canUseMod(p,p.abilitySlots[0].type);
            p.abilitySlots[1].canUse = canUseMod(p,p.abilitySlots[1].type);

            var data = {
                "user": p,
                "players": sendPlayers,
                "map": sendMap,
                "game":{"countdown":countdown,"phase":phase,"version":version},
                "shopList": shopList,
                "teamList": sendTeam,
                "shop": buildStore(p)
            }

        }
        else{
            var data = {
                "error": "Invalid token"
            }
        }
        res.send(data);
    });
    app.post('/updateQueue', function(req, res){
        //Get token
        var token = req.body.token

        var p;
        for(var i = 0; i < players.length; i++){
            if(players[i].token===token){
                p = players[i];
                break;
            }
        }

        if(p!=null && phase==0 ){
            if(p.queue.length < 3 && p.stats.hp>0){
                var inUse = 0, inUseUR = 0;
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
                        inUse = inUse + blinkEnergyUsage;
                        inUseUR = inUseUR + blinkUraniumUsage;
                    }
                    else if(p.queue[a].type=="ENERGY"){
                        inUseUR = inUseUR + energyModUraniumUsage;
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
                    else if(3-p.queue.length >= cannonActionUsage && req.body.action.type==="CANNON" && isEquipped(p,"CAN") && (withinShop(p.loc)==null || attackFromShop) && attackDistance(p.loc,req.body.action.location) && p.stats.energy>=cannonEnergyUsage+inUse && p.info.uranium>=cannonUraniumUsage+inUseUR){
                        for(var a = 0; a < cannonActionUsage; a++)
                            p.queue.push(req.body.action);
                    }
                    else if(req.body.action.type==="CANNON" && !attackDistance(p.loc,req.body.action.location)){
                        p.battleLog.unshift({"type":"action", "msg": "Out of range."});
                    }
                    else if(req.body.action.type==="CANNON" && !(withinShop(p.loc)==null || attackFromShop))
                        p.battleLog.unshift({"type":"action", "msg": "You can't attack from the shop."});
                    else if(3-p.queue.length >= railgunActionUsage && req.body.action.type==="RAILGUN" && isEquipped(p,"RAIL") && (withinShop(p.loc)==null || attackFromShop) && p.stats.energy>=railgunEnergyUsage+inUse && p.info.uranium>=railgunUraniumUsage+inUseUR){
                        for(var a = 0; a < railgunActionUsage; a++)
                            p.queue.push(req.body.action);
                    }
                    else if(req.body.action.type==="RAILGUN" && !(withinShop(p.loc)==null || attackFromShop))
                        p.battleLog.unshift({"type":"action", "msg": "You can't attack from the shop."});
                    else if(3-p.queue.length >= trapActionUsage && req.body.action.type==="TRAP" && isEquipped(p,"TRAP") && p.stats.energy>=trapEnergyUsage+inUse && (p.info.uranium>=trapUraniumUsage+inUseUR || p.stats.trap>2)){
                        for(var a = 0; a < trapActionUsage; a++)
                            p.queue.push(req.body.action);
                    }
                    else if(req.body.action.type==="ATTACK" && p.stats.energy>=attackEnergyUsage+inUse && (withinShop(p.loc)==null || attackFromShop) && attackDistance(p.loc,req.body.action.location))
                        p.queue.push(req.body.action);
                    else if(req.body.action.type==="ATTACK" && !attackDistance(p.loc,req.body.action.location))
                        p.battleLog.unshift({"type":"action", "msg": "Out of range."});
                    else if(req.body.action.type==="ATTACK" && !(withinShop(p.loc)==null || attackFromShop))
                        p.battleLog.unshift({"type":"action", "msg": "You can't attack from the shop."});
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
            }else if(p.stats.hp>0){
                p.battleLog.unshift({"type":"action", "msg": "No action points available."});
            }
        }


        //TODO: Return correctly
        res.send('');
    });
    app.post('/removeFromQueue', function(req,res){
        //Get token
        var token = req.body.token;
        var remove = req.body.remove;

        var p;
        for(var i = 0; i < players.length; i++){
            if(players[i].token===token){
                p = players[i];
                break;
            }
        }

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
        var token = req.body.token

        var p;
        for(var i = 0; i < players.length; i++){
            if(players[i].token===token){
                p = players[i];
                break;
            }
        }

        if(p!=null && p.stats.hp <= 0){
            p.loc = spawn();
            p.stats.hp = p.stats.hpMAX;
            p.stats.energy = p.stats.energyMAX;
            p.knownLocs = [];
            p.battleLog.unshift({"type":"action", "msg": "You have respawned."});
        }

        res.send('');
    });
    app.post('/makePurchase', function(req, res){
        //Get token
        var token = req.body.token

        var p;
        for(var i = 0; i < players.length; i++){
            if(players[i].token===token){
                p = players[i];
                break;
            }
        }

        if(p!=null){
            var shop = buildStore(p);
            var inventory = {"gold":p.info.gold,"iron":p.info.iron,"uranium":p.info.uranium};


            //Regular shop
            if(shop.withinShop==="SHOP"){
                if(req.body.item==="hpF" && canPurchase(shop.hpF.price,inventory) && shop.hpF.canBuy){
                    makePurchase(shop.hpF.price,p);
                    p.stats.hp = p.stats.hpMAX;
                    p.battleLog.unshift({"type":"purchase", "msg": "You repaired your ship."});
                }
                else if(req.body.item==="hpF" && !canPurchase(shop.hpF.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="hpF" && !shop.hpF.canBuy){
                    p.battleLog.unshift({"type":"action", "msg": "Your ship is at full health."});
                }

                else if(req.body.item==="hp5" && canPurchase(shop.hp5.price,inventory) && shop.hp5.canBuy){
                    makePurchase(shop.hp5.price,p);
                    p.stats.hp = p.stats.hp + 5;
                    if(p.stats.hp > p.stats.hpMAX) p.stats.hp = p.stats.hpMAX;
                    p.battleLog.unshift({"type":"purchase", "msg": "You repaired your ship."});
                }
                else if(req.body.item==="hp5" && !canPurchase(shop.hp5.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="hp5" && !shop.hp5.canBuy){
                    p.battleLog.unshift({"type":"action", "msg": "Your ship is at full health."});
                }

                else if(req.body.item==="insurance" && canPurchase(shop.insurance.price,inventory) && shop.insurance.canBuy){
                    makePurchase(shop.insurance.price,p);
                    p.info.hasInsurance = true;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased insurance."});
                }
                else if(req.body.item==="insurance" && !canPurchase(shop.insurance.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="insurance" && !shop.insurance.canBuy){
                    p.battleLog.unshift({"type":"action", "msg": "You are already insured."});
                }

                else if(req.body.item==="hpU" && canPurchase(shop.hpU.price,inventory) && shop.hpU.canBuy){
                    makePurchase(shop.hpU.price,p);
                    p.stats.hpUpgrades++;
                    p.info.shipMass++;
                    p.stats.hpMAX = p.stats.hpMAX + statData.hpINC;
                    p.stats.hp = p.stats.hp + statData.hpINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your health."});
                }
                else if(req.body.item==="hpU" && !canPurchase(shop.hpU.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="enU" && canPurchase(shop.enU.price,inventory) && shop.enU.canBuy){
                    makePurchase(shop.enU.price,p);
                    p.stats.energyUpgrades++;
                    p.info.shipMass++;
                    p.stats.energyMAX = p.stats.energyMAX + statData.energyINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your energy."});
                }
                else if(req.body.item==="enU" && !canPurchase(shop.enU.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="radU" && canPurchase(shop.radU.price,inventory) && shop.radU.canBuy){
                    makePurchase(shop.radU.price,p);
                    p.stats.radarUpgrades++;
                    p.info.shipMass++;
                    p.stats.radar = p.stats.radar + statData.radarINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your radar."});
                }
                else if(req.body.item==="radU" && !canPurchase(shop.radU.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="atkU" && canPurchase(shop.atkU.price,inventory) && shop.atkU.canBuy){
                    makePurchase(shop.atkU.price,p);
                    p.stats.attackUpgrades++;
                    p.info.shipMass++;
                    p.stats.attack = p.stats.attack + statData.attackINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your radar."});
                }
                else if(req.body.item==="atkU" && !canPurchase(shop.atkU.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else{
                    p.battleLog.unshift({"type":"action", "msg": "You can't purchase that."});
                }
            }

            //Super Shop
            else if(shop.withinShop==="SSHOP"){
                if(req.body.item==="loadout" && canPurchase(shop.loadout.price,inventory) && shop.loadout.canBuy){
                    makePurchase(shop.loadout.price,p);
                    p.stats.loadoutSize = p.stats.loadoutSize+statData.loadoutINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You increased your loadout."});
                }
                else if(req.body.item==="loadout" && !canPurchase(shop.loadout.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }
                else if(req.body.item==="loadout" && !shop.loadout.canBuy){
                    p.battleLog.unshift({"type":"action", "msg": "You have already maxed your loadout."});
                }

                else if(req.body.item==="canU" && canPurchase(shop.canU.price,inventory) && shop.canU.canBuy){
                    makePurchase(shop.canU.price,p);
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
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="bliU" && canPurchase(shop.bliU.price,inventory) && shop.bliU.canBuy){
                    makePurchase(shop.bliU.price,p);
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
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="steU" && canPurchase(shop.steU.price,inventory) && shop.steU.canBuy){
                    makePurchase(shop.steU.price,p);
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
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="trapU" && canPurchase(shop.trapU.price,inventory) && shop.trapU.canBuy){
                    makePurchase(shop.trapU.price,p);
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
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="engModU" && canPurchase(shop.engModU.price,inventory) && shop.engModU.canBuy){
                    makePurchase(shop.engModU.price,p);
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
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="railU" && canPurchase(shop.railU.price,inventory) && shop.railU.canBuy){
                    makePurchase(shop.railU.price,p);
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
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="carryU" && canPurchase(shop.carryU.price,inventory) && shop.carryU.canBuy){
                    makePurchase(shop.carryU.price,p);
                    p.stats.urCarryUpgrades++;
                    p.stats.urCarry = p.stats.urCarry + statData.urCarryINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Uranium Carry Capacity."});
                }
                else if(req.body.item==="carryU" && !canPurchase(shop.carryU.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="insuranceU" && canPurchase(shop.insuranceU.price,inventory) && shop.insuranceU.canBuy){
                    makePurchase(shop.insuranceU.price,p);
                    p.stats.insuranceUpgrades++;
                    p.stats.insurance = p.stats.insurance + statData.insuranceINC;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Insurance."});
                }
                else if(req.body.item==="insuranceU" && !canPurchase(shop.insuranceU.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="scanU" && canPurchase(shop.scanU.price,inventory) && shop.scanU.canBuy){
                    makePurchase(shop.scanU.price,p);
                    p.stats.scannerUpgrades++;
                    p.stats.scanner = p.stats.scanner + statData.scannerINC;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You upgraded your Scanner."});
                }
                else if(req.body.item==="scanU" && !canPurchase(shop.scanU.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="statHP" && canPurchase(shop.statHP.price,inventory) && shop.statHP.canBuy){
                    makePurchase(shop.statHP.price,p);
                    p.stats.staticHp = true;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Health+ Module."});
                    p.storage.push({"name":"HP+","val":1});
                    p.info.shipMass++;
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"HP+","canUse":false};
                    else if(p.abilitySlots[1].type!=="HP+") p.abilitySlots[0]={"type":"HP+","canUse":false};
                }
                else if(req.body.item==="statHP" && !canPurchase(shop.statHP.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="statEng" && canPurchase(shop.statEng.price,inventory) && shop.statEng.canBuy){
                    makePurchase(shop.statEng.price,p);
                    p.stats.staticEng = true;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Energy+ Module."});
                    p.storage.push({"name":"PWR+","val":1});
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"PWR+","canUse":false};
                    else if(p.abilitySlots[1].type!=="PWR+") p.abilitySlots[0]={"type":"PWR+","canUse":false};
                }
                else if(req.body.item==="statEng" && !canPurchase(shop.statEng.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="statAtk" && canPurchase(shop.statAtk.price,inventory) && shop.statAtk.canBuy){
                    makePurchase(shop.statAtk.price,p);
                    p.stats.staticAtk = true;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Attack+ Module."});
                    p.storage.push({"name":"ATK+","val":1});
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"ATK+","canUse":false};
                    else if(p.abilitySlots[1].type!=="ATK+") p.abilitySlots[0]={"type":"ATK+","canUse":false};
                }
                else if(req.body.item==="statAtk" && !canPurchase(shop.statAtk.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="statRdr" && canPurchase(shop.statRdr.price,inventory) && shop.statRdr.canBuy){
                    makePurchase(shop.statRdr.price,p);
                    p.stats.staticRdr = true;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased the Radar+ Module."});
                    p.storage.push({"name":"RDR+","val":1});
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"RDR+","canUse":false};
                    else if(p.abilitySlots[1].type!=="RDR+") p.abilitySlots[0]={"type":"RDR+","canUse":false};
                }
                else if(req.body.item==="statRdr" && !canPurchase(shop.statRdr.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="statDR" && canPurchase(shop.statDR.price,inventory) && shop.statDR.canBuy){
                    makePurchase(shop.statDR.price,p);
                    p.stats.staticDR = true;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased the DR Module."});
                    p.storage.push({"name":"DR","val":1});
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"DR","canUse":false};
                    else if(p.abilitySlots[1].type!=="DR") p.abilitySlots[0]={"type":"DR","canUse":false};
                }
                else if(req.body.item==="statDR" && !canPurchase(shop.statDR.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="quickHeal" && canPurchase(shop.quickHeal.price,inventory) && shop.quickHeal.canBuy){
                    makePurchase(shop.quickHeal.price,p);
                    p.stats.quickHeal = true;
                    p.info.shipMass++;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased a Quick Heal."});
                    p.storage.push({"name":"HEAL","val":1});
                    if(p.abilitySlots[1].type==="NONE" && p.stats.loadoutSize>1) p.abilitySlots[1]={"type":"HEAL","canUse":false};
                    else if(p.abilitySlots[1].type!=="HEAL") p.abilitySlots[0]={"type":"HEAL","canUse":false};
                }
                else if(req.body.item==="quickHeal" && !canPurchase(shop.quickHeal.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else if(req.body.item==="uranium" && canPurchase(shop.uranium.price,inventory) && shop.uranium.canBuy){
                    makePurchase(shop.uranium.price,p);
                    p.info.uranium = p.info.uranium + 1;
                    p.info.totalUranium = p.info.totalUranium + 1;
                    p.battleLog.unshift({"type":"purchase", "msg": "You purchased uranium."});
                }
                else if(req.body.item==="uranium" && !canPurchase(shop.uranium.price,inventory)){
                    p.battleLog.unshift({"type":"action", "msg": "You need more resources."});
                }

                else{
                    p.battleLog.unshift({"type":"action", "msg": "You can't purchase that."});
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

                if(isEquipped(p,"PWR+")){
                    p.stats.energyMAX = statData.energyStart+(statData.energyINC*p.stats.energyUpgrades)+5;
                }else{
                    p.stats.energyMAX = statData.energyStart+(statData.energyINC*(p.stats.energyUpgrades));
                    if(p.stats.energy > p.stats.energyMAX) p.stats.energy = p.stats.energyMAX;
                }

                if(!isEquipped(p,"HIDE"))
                    p.info.stealthed = false;
            }
        }
        res.send('');

    });
    app.post('/changeLoadout', function(req, res){
        //Get info
        var token = req.body.token;
        var slot = req.body.slot;
        var item = req.body.item;

        var p;
        for(var i = 0; i < players.length; i++){
            if(players[i].token===token){
                p = players[i];
                break;
            }
        }

        if(p!=null && item!=null && slot!=null){
            if(slot == 1 && p.stats.loadoutSize<2){ //Don't have slot
                p.battleLog.unshift({"type":"action", "msg": "You don't have that slot unlocked yet."});
            }else{
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

                        if(isEquipped(p,"PWR+")){
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

        res.send('');
    });
    app.post('/postChatMsg', function(req, res){
        var msg = req.body.msg;
        var token = req.body.token

        if(msg!==""){
            var p;
            for(var i = 0; i < players.length; i++){
                if(players[i].token===token){
                    p = players[i];
                    break;
                }
            }

            if(p!=null){
                for(var i in players){
                    players[i].battleLog.unshift({"type":"chat","msg":msg,"user":p.info.name});
                }
            }
        }
        res.send('');
    });

    app.post('/createTeam', function(req, res){
        var token = req.body.token;
        var teamName = req.body.teamName;
        var areaColor = req.body.areaColor;
        var baseColor = req.body.baseColor;
        var baseShape = req.body.baseShape;

        if(token!=='' && teamName.length>3 && areaColor!=='' && baseColor!=='' && baseShape !== ''){
            //Validate token
            var p;
            for(var i = 0; i < players.length; i++){
                if(players[i].token===token){
                    p = players[i];
                    break;
                }
            }

            var valid = teamValidation(baseColor, areaColor);
            if(p!=null && valid == true){
                var id = teamData.length;
                teamData.push({
                    "id": id,
                    "name": teamName,
                    "colors":{
                        "baseColor": baseColor,
                        "areaColor": areaColor,
                        "baseShape": baseShape
                    },
                    "leader": [token, p.info.name],
                    "admins": [],
                    "members": [],
                    "gold":0,
                    "iron":0,
                    "uranium":0,
                    "credits":0,
                    "income": [0,0], //[Gold, Credits]
                    "teamRank": 1000,
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
                    mergeTeams(p.info.teamID, id, p);
                else
                    teamData[id].members.push([p.token,p.info.name]);

                p.info.teamID = id;
                p.info.teamRole = "LEADER";

                p.battleLog.unshift({"type":"team", "msg": "You created the team "+teamData[id].name+"! Good Luck!"});

                saveTeam();
            }
            else if(p!=null){
                //TODO: Error messaging
            }
        }

        res.send('');
    });
    app.post('/joinTeam', function(req, res){
        //TODO: CAN ONLY Join every ~200 Rounds

        var token = req.body.token;
        var teamID = req.body.id;
        var type = req.body.type; //merge, split, none

        //Validate token
        var p;
        for(var i = 0; i < players.length; i++){
            if(players[i].token===token){
                p = players[i];
                break;
            }
        }
        if(p!=null){
            if(type==="MERGE"){ //Merge Teams together
                mergeTeams(p.info.teamID,teamID,p);
            }
            else {
                if(type==="SPLIT"){
                    //Select new leader
                    if(teamData[p.info.teamID].admins.length>0){
                        var r = parseInt(Math.random()*100)%teamData[p.info.teamID].admins.length;
                        changeRole(teamData[p.info.teamID].admins[r][0],p.info.teamID,"LEADER");
                        messageGroup(teamData[p.info.teamID].members,
                                     teamData[p.info.teamID].admins[r][1]+" is now the leader.",
                                     "", "team", null);
                    }
                    else{
                        while(true || teamData[p.info.teamID].members.length>1){
                            var r = parseInt(Math.random()*100)%teamData[p.info.teamID].members.length;
                            if(teamData[p.info.teamID].members[r][0]!==teamData[p.info.teamID].leader[0]){
                                changeRole(teamData[p.info.teamID].members[r][0], p.info.teamID, "LEADER");
                                messageGroup(teamData[p.info.teamID].members,
                                             teamData[p.info.teamID].members[r][1]+" is now the leader.",
                                             "", "team", null);
                                break;
                            }
                        }
                    }

                }

                //Remove from previous team
                if(p.info.teamID>-1)
                    removeFromTeam(p, p.info.teamID, false);

                //Move to new team
                p.info.teamID = teamID;
                p.info.teamRole = "MEMBER";
                teamData[teamID].members.push([p.token,p.info.name]);

                messageGroup(teamData[teamID].members,
                             p.info.name+" has joined the team!",
                             "You are now a member of "+teamData[teamID].name+".",
                             "team", p);
            }
        }

        res.send('');
    });
    app.post('/updateTeamSettings',function(req, res){
        var token = req.body.token;

        var p;
        for(var i = 0; i < players.length; i++){
            if(players[i].token===token){
                p = players[i];
                break;
            }
        }
        if(p!=null){
            if(p.info.teamRole==='LEADER'){
                teamData[p.info.teamID].settings = req.body.settings;
            }
        }

        res.send('');
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

    //**************************************************************************
    //Webpages
    //**************************************************************************
    app.get('/game', function (req, res) {
        console.log("Got a GET request for the Game page");
        res.sendFile( __dirname + "/public/game.html" );
    });
    app.get('/wiki', function (req, res) {
        console.log("Got a GET request for the Wiki page");
        res.sendFile( __dirname + "/public/wiki.html" );
    });
    app.get('/home', function (req, res) {
        console.log("Got a GET request for the home page");
        res.sendFile( __dirname + "/public/home.html" );
    });
    app.get('/admin', function (req, res) {
        console.log("Got a GET request for the admin page");
        res.sendFile( __dirname + "/public/admin.html" );
    });
    app.get('/log', function (req, res) {
        console.log("Got a GET request for the Change Log page");
        res.sendFile( __dirname + "/public/log.html" );
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
    if(countdown==-1){
        phase = 1;
        countdown = countdownMax;
        var actAttacks = [];
        for(var i = 0; i < players.length; i++){
            for(var a = players[i].queue.length; a < 3; a++){
                players[i].queue.push({"type":"HOLD"});
            }
            if(players[i].queue.length>0 && (withinShop(players[i].loc)==null || attackFromShop)){ //Next round attacks
                if(players[i].queue[0].type==="ATTACK" )
                    actAttacks.push(players[i].queue[0].location);
                else if(players[i].queue[0].type==="CANNON" && (players[i].queue.length == 1 || players[i].queue[1].type!=="CANNON")){
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

        //Show attacks that are coming
        for(var i = 0; i < players.length; i++){
            players[i].activeAttacks = actAttacks;
        }

        setTimeout(function(){actionPhase()},aTick);
    }else{
        setTimeout(function(){setupPhase();},cTick);
    }
}

function actionPhase(){
    var moves = [], attacks = [], loots = [], scans = [], heals=[], engMods=[], stealths=[], destealths=[], cannons = [], railguns =[], blinks=[], traps=[];
    var actAttacks = [];

    //Grab all actions
    for(var i = 0; i < players.length; i++){
        players[i].activeAttacks = [];
        if(players[i].stats.hp>0 && players[i].queue[0]!=null){
            if(players[i].queue[0].type==="MOVE" && players[i].info.trapped<1){
                moves.push({"player":players[i],"direction":players[i].queue[0].direction});
            }else if(players[i].queue[0].type==="BLINK" && players[i].info.trapped<1){
                blinks.push({"player":players[i],"location":players[i].queue[0].location});
            }else if(players[i].queue[0].type==="ATTACK" && (withinShop(players[i].loc)==null || attackFromShop)){
                attacks.push({"player":players[i], "location":players[i].queue[0].location});
            }else if(players[i].queue[0].type==="CANNON" && (withinShop(players[i].loc)==null || attackFromShop) && (players[i].queue.length == 1 || players[i].queue[1].type!=="CANNON")){
                cannons.push({"player":players[i], "location":players[i].queue[0].location});
            }else if(players[i].queue[0].type==="RAILGUN" && (withinShop(players[i].loc)==null || attackFromShop) && (players[i].queue.length == 1 || players[i].queue[1].type!=="RAILGUN")){
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
            }else if((players[i].queue[0].type==="ATTACK" || players[i].queue[0].type==="CANNON" || players[i].queue[0].type==="RAILGUN") && withinShop(players[i].loc)!=null){ //Must be fighting near a shop or cheating
                players[i].battleLog.unshift({"type":"action", "msg": "You can't fight near a shop."});
            }

            players[i].queue.splice(0,1); //pop from queue

            if(players[i].queue.length>0 && (withinShop(players[i].loc)==null || attackFromShop)){ //Next round attacks
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

    for(var i = 0; i < players.length; i++){
        players[i].activeAttacks = actAttacks;
    }

    //Perform actions in order
    // var order = [moves,attacks,heals,engMods,destealths,scans,stealths];
    for(var i = 0; i < blinks.length; i++)
        blink(blinks[i].player,blinks[i].location);
    for(var i = 0; i < moves.length; i++)
        move(moves[i].player,moves[i].direction);

    for(var i = 0; i < attacks.length; i++)
        attack(attacks[i].player,attacks[i].location);
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
    }else{
        setTimeout(function(){actionPhase()},aTick);
    }
}

function roundCleanup(){
    saveCountdown++;
    canDelete = false;

    //Refresh energy levels and clear queues
    for(var i = 0; i < players.length; i++){
        //disconnect lost players
        players[i].info.connected++;
        if(players[i].info.connected >= dcCountdown){
            console.log("User "+players[i].info.name+" disconnected.");
            var msg = {"type":"server", "msg": ""+players[i].info.name+" has disconnected."};
            for(var m = 0; m < players.length; m++){
                players[m].battleLog.unshift(msg);
            }
            savePlayer(players[i], true);
        }else{
            players[i].queue = [];
            players[i].activeAttacks = [];
            players[i].info.inCombat--;
            players[i].info.stealthTime--;
            players[i].info.trapped--;
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
                saveTeam();
            }
        }
    }

    if(saveCountdown==saveRound){
        saveCountdown = 0;
    }

    //Spawn Treasures
    spawnLoot();

    canDelete = true;
}


//******************************************************************************
// Player Actions
//******************************************************************************
function move(p, direction){
    var before = withinShop(p.loc)!=null;
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

    var after = withinShop(p.loc)!=null;
    if(before && !after){
        p.battleLog.unshift({"type":"action", "msg": "You have left a safe zone."});
    }
    else if(!before && after){
        p.battleLog.unshift({"type":"action", "msg": "You have entered a safe zone."});
    }
    else if(beforeLoc[0]==p.loc[0] && beforeLoc[1]==p.loc[1]){
        p.battleLog.unshift({"type":"action", "msg": "You can't move there."});
    }

    triggeredTrap(p);
}

function attack(p, location){
    p.stats.energy -= attackEnergyUsage;
    p.info.inCombat = combatCooldown;

    var hit = playerInSpot(location,null);
    if(hit!=null){
        if(attackFromShop || withinShop(hit.loc)==null){
            //HIT
            var dmg = p.stats.attack + (isEquipped(p,"ATK+")?statData.attackINC:0 - (isEquipped(hit,"DR")?1:0));
            hit.stats.hp = hit.stats.hp - dmg;
            hit.info.inCombat = combatCooldown;
            hit.battleLog.unshift({"type":"combat", "msg": ""+p.info.name+" has hit you for "+dmg+" damage."});

            if(hit.stats.hp <= 0){
                death(hit, p);
            }
        }
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
        var hit = playerInSpot(locs[i],null);
        if(hit!=null){
            if(attackFromShop || withinShop(hit.loc)==null){
                var dmg = parseInt((p.stats.attack + (isEquipped(p,"ATK+")?statData.attackINC:0))*(p.stats.cannon>2?1.5:1)) - (isEquipped(hit,"DR")?1:0);
                hit.stats.hp = hit.stats.hp - dmg;
                hit.info.inCombat = combatCooldown;
                hit.battleLog.unshift({"type":"combat", "msg": ""+p.info.name+" has blasted you for "+dmg+" damage."});

                if(hit.stats.hp <= 0){
                    death(hit, p);
                }
            }
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
    }else if(direction==="E"){
        for(var i = 1; i <= railgunRange; i++){
            locs.push([(p.loc[0]+i)%mapSize,p.loc[1]]);
        }
    }else if(direction==="S"){
        for(var i = 1; i <= railgunRange; i++){
            locs.push([p.loc[0],(p.loc[1]+i)%mapSize]);
        }
    }else if(direction==="W"){
        for(var i = 1; i <= railgunRange; i++){
            var newX = p.loc[0]-i;
            if(newX < 0) newX += mapSize;
            locs.push([newY,p.loc[1]]);
        }
    }

    for(var i in locs){
        var hit = playerInSpot(locs[i],p);
        if(hit!=null){
            if(attackFromShop || withinShop(hit.loc)==null){
                var dmg = ((p.stats.attack + (isEquipped(p,"ATK+")?statData.attackINC:0))*(p.stats.railgun+1) - (isEquipped(hit,"DR")?1:0));
                hit.stats.hp = hit.stats.hp - dmg;
                hit.info.inCombat = combatCooldown;
                hit.battleLog.unshift({"type":"combat", "msg": ""+p.info.name+" has railed you for "+dmg+" damage."});

                if(hit.stats.hp <= 0){
                    death(hit, p);
                }
            }
        }
    }
}

function loot(p){
    p.stats.energy = p.stats.energy - lootEnergyUsage;

    var treasure = map[p.loc[0]][p.loc[1]];
    if(isLoot(treasure)){
        var startGold = p.info.gold;
        var startTotalGold = p.info.totalGold;
        var looted = false;

        if(treasure.type==="GOLD"){
            p.info.gold = p.info.gold + treasure.count;
            p.info.totalGold = p.info.totalGold + treasure.count;
            p.battleLog.unshift({"type":"loot", "msg": "You found "+treasure.count+"g!"});
            looted = true;
        }else if(treasure.type==="IRON"){
            p.info.iron = p.info.iron + treasure.count;
            p.info.totalIron = p.info.totalIron + treasure.count;
            p.battleLog.unshift({"type":"loot", "msg": "You found "+treasure.count+" iron!"});
            looted = true;
        }else if(treasure.type==="URANIUM" && p.info.uranium<p.stats.urCarry){
            p.info.uranium = p.info.uranium + treasure.count;
            p.info.totalUranium = p.info.totalUranium + treasure.count;
            p.battleLog.unshift({"type":"loot", "msg": "You found "+treasure.count+" uranium!"});
            looted = true;
        }else if(treasure.type==="URANIUM" && p.info.uranium>=p.stats.urCarry){
            p.battleLog.unshift({"type":"action", "msg": "You can't carry any more uranium."});
        }

        if(looted){
            p.info.hauls++;

            map[p.loc[0]][p.loc[1]] = {"type":"OPEN"};
            lootSpawns.push([p.loc[0],p.loc[1]]);
            lootCount--;

            //Alert local people of looting
            var mid = parseInt(statData.vision/2);
            for(var x = 0; x < statData.vision; x++){
                for(var y = 0; y < statData.vision; y++){
                    var cX = p.loc[0] - (mid-x);
                    var cY = p.loc[1] - (mid-y);

                    if(cX < 0) cX += map.length;
                    if(cY < 0) cY += map.length;
                    if(cX >= map.length) cX -= map.length;
                    if(cY >= map.length) cY -= map.length;

                    var enemyP = playerInSpot([cX,cY], p);
                    if(enemyP!=null)
                        enemyP.battleLog.unshift({"type":"combat", "msg": p.info.name+" has looted near you."});
                }
            }

            //Alert world of great wealth
            var msg;
            if(parseInt(startGold/1000) < parseInt(p.info.gold/1000)){
                msg = ""+p.info.name+" has over "+(parseInt(p.info.gold/1000)*1000)+"g.";
            }
            if(parseInt(startTotalGold/2000) < parseInt(p.info.totalGold/2000)){
                msg = ""+p.info.name+" has amassed over "+(parseInt(p.info.totalGold/2000)*2000)+"g.";
            }

            for(var i = 0; i < players.length; i++){
                for(var k = 0; k < players[i].knownLocs.length; k++){
                    if(players[i].knownLocs[k][0]==p.loc[0] && players[i].knownLocs[k][1]==p.loc[1]){
                        players[i].knownLocs.splice(k,1);
                    }
                }
                if(msg!=null) players[i].battleLog.unshift({"type":"server", "msg": msg});
            }
        }
    }else{
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

            if(isLoot(map[cX][cY])){
                p.knownLocs.push([cX,cY]);
            }

            var tr = withinTrap([cX,cY]);
            if(tr>-1){
                if(!isKnownTrap(p,trapList[tr]))
                    p.knownTraps.push({"loc":trapList[tr].loc,"lvl":0+trapList[tr].lvl,"id":0+trapList[tr].id,"owned":false});
            }

            var enemyP = playerInSpot([cX,cY], p);
            if(enemyP!=null){
                enemyP.battleLog.unshift({"type":"combat", "msg": "Someone has scanned you."});
                p.scanned.push({"token":enemyP.token,"rounds":3+p.stats.scanner});
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

    if(!spotOccupied([location[0],location[1]]))
        p.loc = location;


    triggeredTrap(p);
}

function trap(p){
    p.info.uranium -= (p.stats.trap>2?0:trapUraniumUsage);
    p.stats.energy -= trapEnergyUsage;

    p.info.traps++;
    trapCounter++;

    p.battleLog.unshift({"type":"combat", "msg": "You placed trap "+p.info.traps+"."});

    trapList.push({"loc":[p.loc[0],p.loc[1]],"lvl":0+p.stats.trap,"id":0+trapCounter, "num":0+p.info.traps, "owner":p.token});
    p.knownTraps.push({"loc":[p.loc[0],p.loc[1]],"lvl":0+p.stats.trap,"id":0+trapCounter,"owned":true});
}


//******************************************************************************
// Utility Functions
//******************************************************************************
function withinShop(location){
    for(var x = 0; x < 3; x++){
        for(var y = 0; y < 3; y++){
            var cX = location[0] - (1-x);
            var cY = location[1] - (1-y);

            if(cX < 0) cX += map.length;
            if(cY < 0) cY += map.length;
            if(cX >= map.length) cX -= map.length;
            if(cY >= map.length) cY -= map.length;

            if(map[cX][cY].type==="SHOP") return "SHOP";
        }
    }

    for(var x = 0; x < 5; x++){
        for(var y = 0; y < 5; y++){
            var cX = location[0] - (2-x);
            var cY = location[1] - (2-y);

            if(cX < 0) cX += map.length;
            if(cY < 0) cY += map.length;
            if(cX >= map.length) cX -= map.length;
            if(cY >= map.length) cY -= map.length;

            if(map[cX][cY].type==="SSHOP") return "SSHOP";
        }
    }

    return null;
}

function withinTrap(location){
    for(var tr in trapList){
        var range = (trapList[tr].lvl>1?3:2);
        if(range>2){
            var t = parseInt(range/2);
            var xAdj = t-trapList[tr].loc[0], yAdj = t-trapList[tr].loc[1];
            var cX = (location[0] + xAdj)%mapSize, cY = (location[1] + yAdj)%mapSize;

            if(cX<0)cX+=mapSize;
            if(cY<0)cY+=mapSize;

            if(cX<range && cY<range) return tr;
        }else{
            if(location[0]==trapList[tr].loc[0]   && location[1]==trapList[tr].loc[1]) return tr;
            if(location[0]==(trapList[tr].loc[0]+1)%mapSize && location[1]==trapList[tr].loc[1]) return tr;
            if(location[0]==trapList[tr].loc[0]   && location[1]==(trapList[tr].loc[1]+1)%mapSize) return tr;
            if(location[0]==(trapList[tr].loc[0]+1)%mapSize && location[1]==(trapList[tr].loc[1]+1)%mapSize) return tr;
        }
    }

    return -1;
}

function spotOccupied(location){
    if(map[location[0]][location[1]].type==="ROCK" ||
       map[location[0]][location[1]].type==="SHOP" ||
       map[location[0]][location[1]].type==="SSHOP")
        return true;
    else for(var i = 0; i < players.length; i++)
        if(players[i].loc[0]==location[0] && players[i].loc[1]==location[1] && players[i].stats.hp>0) return true;


    return false;
}

function playerInSpot(location, ignore){
    for(var i = 0; i < players.length; i++)
        if(players[i].loc[0]==location[0] && players[i].loc[1]==location[1] && players[i].stats.hp>0 && players[i]!=ignore) return players[i];
    return null;
}

function isKnown(list, x, y){
    for(var i = 0; i < list.length; i++){
        if(list[i][0]==x && list[i][1]==y)
            return true;
    }
    return false;
}

function spawn(){
    while(true){
        var r = parseInt((Math.random()*100)%spawns.length);

        if(!spotOccupied(spawns[r])){
            return spawns[r];
        }
    }
}

function generateToken(){
    //Create random 16 character token
    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var token = '';
    for (var i = 0; i < tokenSize; i++) {
      token += chars[Math.round(Math.random() * (chars.length - 1))];
    }

    return token;
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

function inScanned(player, token){
    for(var i = 0; i < player.scanned.length; i++){
        if(player.scanned[i].token===token)
            return true;
    }

    return false;
}

function buildMap(){
    //Correct mapSize
    if(mapSize < 20) mapSize = 20;

    //init map
    var superShop = false;
    for(var x = 0; x < mapSize; x++){
        map[x] = [];
        for(var y = 0; y < mapSize; y++){
            var r = Math.random();

            if(x == mapSize/2 && superShop) superShop = false;

            if(r < .03 && !superShop && (x < (mapSize-parseInt(zone3Wid*mapSize))/2-3 && x > (mapSize-parseInt(zone3Wid*mapSize))/2-parseInt(zone2Wid*mapSize))){
                map[x][y] = {"type":"SSHOP"};
                shopList.push({"type":"SSHOP","loc":[x,y]});
                superShop = true;
            }else if(r < .01 && !superShop && (x > (mapSize+3-parseInt(zone3Wid*mapSize))/2+parseInt(zone3Wid*mapSize) && x < (mapSize-parseInt(zone3Wid*mapSize))/2+parseInt(zone3Wid*mapSize)+parseInt(zone2Wid*mapSize))){
                map[x][y] = {"type":"SSHOP"};
                shopList.push({"type":"SSHOP","loc":[x,y]});
                superShop = true;
            }else if(r < shopSpread && (x < (mapSize-parseInt(zone3Wid*mapSize))/2-3 || x > mapSize+3-((mapSize-parseInt(zone3Wid*mapSize))/2))){
                map[x][y] = {"type":"SHOP"};
                shopList.push({"type":"SHOP","loc":[x,y]});
            }else if(r < rockSpread){
                map[x][y] = {"type":"ROCK"};
            }else{
                map[x][y] = {"type":"OPEN"};
                if((x < parseInt(spawnWid/2*mapSize) || (x > mapSize-parseInt(spawnWid/2*mapSize))) &&
                    y < mapSize-((mapSize-parseInt(spawnHei*mapSize))/2) && y > (mapSize-parseInt(spawnHei*mapSize))/2){
                    spawns.push([x,y]);
                    if(r > .5)
                        lootSpawns.push([x,y]);
                }else{
                    lootSpawns.push([x,y]);
                }
            }
        }
    }

    //Spawn Treasures
    spawnLoot();
}

function spawnLoot(){
    if(lootCount < mapSize*mapSize*lootSpreadMAX){
        var spawn = parseInt(mapSize*mapSize*lootSpreadMIN);
        for(var i = lootCount; i < spawn; i++){
            var r = parseInt((Math.random()*100000)%lootSpawns.length);
            var loot = chooseTreasureValue(lootSpawns[r][0],lootSpawns[r][1]);
            map[lootSpawns[r][0]][lootSpawns[r][1]] = loot;
            lootCount++;
            lootSpawns.splice(r,1);
        }
        for(var i = 0; i < lootSpawnRate; i++){
            var r = parseInt((Math.random()*100000)%lootSpawns.length);
            var loot = chooseTreasureValue(lootSpawns[r][0],lootSpawns[r][1]);
            map[lootSpawns[r][0]][lootSpawns[r][1]] = loot;
            lootCount++;
            lootSpawns.splice(r,1);
        }
    }
}

function chooseTreasureValue(x,y){
    var val = 0, sum = 0;
    var r = Math.random();
    var zone = lootSpawnValues.zone1; //Zone 1

    //Select zone
    if(x > (mapSize-parseInt(mapSize*zone3Wid))/2 && x < mapSize - (mapSize-parseInt(mapSize*zone3Wid))/2)
        zone = lootSpawnValues.zone3; //Zone 3
    else if(x > (mapSize-parseInt(mapSize*zone3Wid))/2-parseInt(mapSize*zone2Wid) && x < mapSize - (mapSize-parseInt(mapSize*zone3Wid))/2+parseInt(mapSize*zone2Wid))
        zone = lootSpawnValues.zone2; //Zone 2

    for(var i = 0; i < zone.length; i++){
        if(r < zone[i].chance+sum){
            return {"type":zone[i].type,"count":zone[i].count};
        }
        else
            sum += zone[i].chance;
    }

    return val;
}

function isLoot(loc){
    if(loc.type==="GOLD") return true
    else if(loc.type==="IRON") return true
    else if(loc.type==="URANIUM") return true
    return false;
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

function death(p, killer){
    p.stats.hp = 0;
    p.info.deaths = p.info.deaths + 1;
    p.queue = [];
    p.battleLog.unshift({"type":"combat", "msg": "You died."});
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
        if(isEquipped(p,"PWR+")){
            p.stats.staticEng = false;
            removeFromStorage(p,"PWR+");
            if(p.abilitySlots[0].type==="PWR+") p.abilitySlots[0] = {"type":"NONE","canUse":false};
            if(p.abilitySlots[1].type==="PWR+") p.abilitySlots[1] = {"type":"NONE","canUse":false};
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

    map[p.loc[0]][p.loc[1]] = {"type":"GOLD","count":dropGold};
    map[(p.loc[0]+1)%mapSize][p.loc[1]] = {"type":"IRON","count":dropIron};
    map[p.loc[0]+1][(p.loc[1]+1)%mapSize] = {"type":"URANIUM","count":dropUranium};



    //Alert the world of a kill
    var msg = ""+killer.info.name+" has killed "+p.info.name+".";
    for(var m = 0; m < players.length; m++){
        if(players[m].token === killer.token)
            killer.battleLog.unshift({"type":"server", "msg": "You have killed "+p.info.name});
        else
            players[m].battleLog.unshift({"type":"server", "msg": msg});
    }
}

function removeFromStorage(p,mod){
    for(var i in p.storage){
        if(p.storage[i].name===mod){
            p.storage.splice(i,1);
            break;
        }
    }
}

function queuedDestealth(p){
    for(var a in p.queue){
        if(p.queue[a].type==="DESTEALTH") return true;
    }
    return false;
}

function triggeredTrap(p){
    var tr = withinTrap(p.loc);
    if(tr>-1){
        if(trapList[tr].owner!==p.token){
            p.info.trapped = trapDuration+1;
            p.battleLog.unshift({"type":"combat", "msg": "You've been trapped!"});
            for(var pp in players){
                for(var t in players[pp].knownTraps){
                    if(players[pp].knownTraps[t].id==trapList[tr].id){
                        players[pp].knownTraps.splice(t,1);
                        if(trapList[tr].owner===players[pp].token)
                            players[pp].battleLog.unshift({"type":"combat", "msg": "Your trap "+trapList[tr].num+" has triggered."});
                        break;
                    }
                }
            }
            trapList.splice(tr,1);
        }
    }
}

function isKnownTrap(p,trap){
    for(var t in p.knownTraps){
        if(p.knownTraps[t].id==trap.id) return true;
    }
    return false;
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
    else if(mod=="ATK+" || mod=="PWR+" || mod=="RDR+" || mod=="HP+" || mod=="DR")
        return true;
    return false;
}

function savePlayer(p, del){
    var writePlayer = p;
    jsonfile.writeFile('data/playerData/'+writePlayer.token+".json", writePlayer, {spaces: 4},function(err){
        if(err){
            console.log(err);
        }else if(del){
            while(!canDelete){
                var k = 0;
            }
            for(var i in players){
                if(players[i].token===writePlayer.token){
                    players.splice(i,1);
                    break;
                }
            }
        }
    });
}

function saveTeam(){
    jsonfile.writeFile('data/teamData.json', teamData, {spaces: 4},function(err){
        if(err){
            console.log(err);
        }
    });
}

function teamValidation(base, area){
    if(base === area)
        return "Base and area need to be different colors";

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

    if(Math.abs(ar-br)<50 && Math.abs(ag-bg)<50 && Math.abs(ab-bb)<50)
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

            if(Math.abs(br2-br)<20 && Math.abs(bg2-bg)<20 && Math.abs(bb2-bb)<20 &&
               Math.abs(ar2-ar)<30 && Math.abs(ag2-ag)<30 && Math.abs(ab2-ab)<30){
                return "Color combo has been taken";
            }
        }
    }

    return true;
}

function buildStore(p){
    return {
        "withinShop": withinShop(p.loc),

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

function removeFromTeam(p, teamID, merge){
    if(merge){
        teamData[teamID] = {"id":teamID,"status":"DELETED"};
    }else{
        if(p.info.teamRole === "ADMIN"){
            for(var a in teamData[teamID].admins){
                if(teamData[teamID].admins[a][0]===p.token){
                    teamData[teamID].admins.splice(a,1);
                    break;
                }
            }
        }

        for(var m in teamData[teamID].members){
            if(teamData[teamID].members[m][0]===p.token){
                teamData[teamID].members.splice(m,1);
                break;
            }
        }

        messageGroup(teamData[teamID].members,
                     p.info.name+" has left the team.","","team", null);
        p.battleLog.unshift({"type":"team", "msg": "You left "+teamData[teamID].name+"."});
    }
}

function messageGroup(group, msg, msgS, type, source){
    if(type==="team"){
        for(var i = 0; i < group.length; i++){
            for(var p in players){
                if(players[p].token === group[i][0]){
                    if(source!=null){
                        if(players[p].token===source.token){
                            players[p].battleLog.unshift({"type":type, "msg": msgS});
                            break;
                        }
                    }
                    players[p].battleLog.unshift({"type":type, "msg": msg});
                    break;
                }
            }
        }
    }
    else{
        for(var i = 0; i < group.length; i++){
            if(players[i].token === source.token)
                killer.battleLog.unshift({"type":type, "msg": msgS});
            else
                players[i].battleLog.unshift({"type":type, "msg": msg});
        }
    }
}

function mergeTeams(oldID, newID, p){
    //Take all bases
    //TODO: THIS SECTION

    //Take all members
    messageGroup(teamData[oldID].members,
                 "Your team has been merged with "+teamData[newID].name+".",
                 "You have merged your old team into "+teamData[newID].name+".","team", p);
    messageGroup(teamData[newID].members,
                "Your team has been merged with "+teamData[oldID].name+". Welcome your new members!",
                "", "team", null);

    for(var m in teamData[oldID].members){
        for(var pp in players){
            if(players[pp].token === teamData[oldID].members[m][0]){
                players[pp].info.teamID = newID;
                players[pp].info.teamRole = "MEMBER";
                teamData[newID].members.push([players[pp].token,players[pp].info.name]);
                break;
            }
        }
    }

    //Delete old team
    removeFromTeam(p, oldID, true);
}

function changeRole(token, teamID, role){
    var mem;
    for(var p in players){
        if(players[p].token === token){
            if(role==="LEADER"){
                if(players[p].info.teamRole==="ADMIN"){
                    for(var a in teamData[teamID].admins){
                        if(teamData[teamID].admins[a][0]===token){
                            teamData[teamID].admins.splice(a,1);
                            break;
                        }
                    }
                }
                teamData[teamID].leader = [players[p].token,players[p].name];
            }else if(role==="ADMIN"){
                teamData[teamID].admins.push([players[p].token,players[p].name]);
            }else if(players[p].info.teamRole==="ADMIN"){
                for(var a in teamData[teamID].admins){
                    if(teamData[teamID].admins[a][0]===token){
                        teamData[teamID].admins.splice(a,1);
                        break;
                    }
                }
            }

            players[p].info.teamRole = role;
            break;
        }
    }
}

function calculateTeamPower(teamID){
    var b1Val = 5, b2Val = 10, b3Val = 20;
    var memVal = 5, areaVal = 1000;

    return teamData[teamID].members.length*memVal;
}

function calculateMapControl(teamID){
    return 0;
}

function rankTeams(){

}
