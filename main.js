var jsonfile = require('jsonfile');
var changelog;
var version = "Alpha v1.1";

//Globals
var port = 8081;
var players = [];
var tokenSize = 450;

//Map Building
var mapSize = 52;
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
var combatCooldown = 3; //Number of rounds
var dcCountdown = 2; //d/c cooldown

//Stat Data
var statData;

//Energy Usage
var attackEnergyUsage       = 1;
var lootEnergyUsage         = 3;
var scanEnergyUsage         = 5;

var cannonEnergyUsage       = 10;
var cannonUraniumUsage      = 1;

var blinkEnergyUsage        = 10; //Changes by lvl
var blinkUraniumUsage       = 1;

var stealthEnergyUsage      = 5;
var stealhUraniumUsage      = 1;

var trapEnergyUsage         = 5;
var trapUraniumUsage        = 1;

var railgunEnergyUsage      = 10;
var railgunUraniumUsage     = 1;

//Action Usage
var lootActionUsage         = 2;
var scanActionUsage         = 3;
var cannonActionUsage       = 2;
var blinkActionUsage        = 1;
var stealthActionUsage      = 3;
var destealthActionUsage    = 1;
var trapActionUsage         = 2;
var railgunActionUsage      = 2;

//TODO: SHOP MODEL IMPORT
var shopData;

init();

function init(){
    //load change log
    jsonfile.readFile("data/changelog.json", function(err, obj) {
        if(err){
            console.log(err);
            process.exit(1);
        }
        changelog = obj;
    });

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
    app.get('/new_user/:name', function (req, res) {
        var name = req.params.name;
        var token =  generateToken();
        var sp = spawn();

        var newP = {
            "token": token,
            "info":{
                "name": name,
                "gold": 0,
                "totalGold":0,
                "iron": 0,
                "totalIron":0,
                "uranium": 0,
                "totalUranium":0,
                "kills": 0,
                "deaths": 0,
                "hauls": 0,
                "inCombat": 0,
                "connected": 0
            },
            "loc": sp,
            "queue": [],
            "knownLocs": [], //TODO: merge scanned and knownLocs: use scanned functionality?
            "battleLog": [],
            "scanned": [],
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
                "cannonUpgradeMAX": (statData.cannonMAX-statData.cannonStart)/statData.cannonINC,

                "blink": statData.blinkStart,
                "blinkUpgrades":0,
                "blinkUpgradeMAX": (statData.blinkMAX-statData.blinkStart)/statData.blinkINC,

                "stealth": statData.stealthStart,
                "stealthUpgrades":0,
                "stealthUpgradeMAX": (statData.stealthMAX-statData.stealthStart)/statData.stealthINC,

                "trap": statData.trapStart,
                "trapUpgrades":0,
                "trapUpgradeMAX": (statData.trapMAX-statData.trapStart)/statData.trapINC,

                "engMod": statData.engModStart,
                "engModUpgrades":0,
                "engModUpgradeMAX": (statData.engModMAX-statData.engModStart)/statData.engModINC,

                "scanner": statData.scannerStart,
                "scannerUpgrades":1,
                "scannerUpgradeMAX": (statData.scannerMAX-statData.scannerStart)/statData.scannerINC+1,

                "railgun": statData.railgunStart,
                "railgunUpgrades":0,
                "railgunUpgradeMAX": (statData.railgunMAX-statData.railgunStart)/statData.railgunINC,

                "urCarry": statData.urCarryStart,
                "urCarryUpgrades":1,
                "urCarryUpgradeMAX": (statData.urCarryMAX-statData.urCarryStart)/statData.urCarryINC+1
            },
            "abilitySlots": []
        };


        console.log("New user "+name+" joined.");

        var data = {
            "token": token,
            "loc": sp,
            "map": map
        }

        res.send(data);

        players.push(newP);

        var msg = ""+name+" has connected.";
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
                sendPlayers.push({"token":players[i].token, "name":players[i].info.name,"loc":players[i].loc});
        }

        if(p!=null){
            var sendMap = [];
            for(var x = 0; x < mapSize; x++){
                sendMap[x] = [];
                for(var y = 0; y < mapSize; y++){
                    if(isLoot(map[x][y]) && !isKnown(p.knownLocs,x,y)) sendMap[x][y] = "OPEN";
                    else if(isLoot(map[x][y])) sendMap[x][y] = map[x][y].type;
                    else
                        sendMap[x][y] = ""+map[x][y].type;
                }
            }

            for(var i = 0; i < sendPlayers.length; i++){
                if(!inScanned(p, sendPlayers[i].token) && !visionDistance(p.loc,sendPlayers[i].loc)){
                    sendPlayers.splice(i,1);
                    i--;
                }else{
                    //drop token
                    delete sendPlayers[i].token;
                }
            }

            var data = {
                "user": p,
                "players": sendPlayers,
                "map": sendMap,
                "game":{"countdown":countdown,"phase":phase,"version":version},
                "shop":{
                    "withinShop": withinShop(p.loc),
                    "hp":{
                        "priceG":(p.stats.hpMAX-p.stats.hp)*(p.stats.hpMAX-p.stats.hp),
                        "priceI":0,
                        "priceU":0,
                        "canBuy":!(p.stats.hp==p.stats.hpMAX)
                    },
                    "hpU":{
                        "priceG":(p.stats.hpUpgrades+1)*100,
                        "priceI":0,
                        "priceU":0,
                        "canBuy":!(p.stats.hpUpgrades==p.stats.hpUpgradesMAX)
                    },
                    "enU":{
                        "priceG":(p.stats.energyUpgrades+1)*100,
                        "priceI":0,
                        "priceU":0,
                        "canBuy":!(p.stats.energyUpgrades==p.stats.energyUpgradesMAX)
                    },
                    "radU":{
                        "priceG":(p.stats.radarUpgrades+1)*200,
                        "priceI":0,
                        "priceU":0,
                        "canBuy":!(p.stats.radarUpgrades==p.stats.radarUpgradesMAX)
                    },
                    "atkU":{
                        "priceG":(p.stats.attackUpgrades+1)*200,
                        "priceI":0,
                        "priceU":0,
                        "canBuy":!(p.stats.attackUpgrades==p.stats.attackUpgradesMAX)
                    }
                }
            }

        }else{
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
                var inUse = 0;
                for(var a = 0; a < p.queue.length; a++){
                    if(p.queue[a].type=="ATTACK")
                        inUse= inUse + attackEnergyUsage;
                    else if(p.queue[a].type=="LOOT"){
                        inUse = inUse + lootEnergyUsage;
                        a++;
                    }else if(p.queue[a].type=="HOLD"){
                        inUse = inUse - statData.energyReg;
                    }
                }
                if(3-p.queue.length >= scanActionUsage && req.body.action.type==="SCAN" && p.stats.energy>=scanEnergyUsage+inUse){
                    for(var a = 0; a < scanActionUsage; a++)
                        p.queue.push(req.body.action);
                }else if(3-p.queue.length >= lootActionUsage && req.body.action.type==="LOOT" && p.stats.energy>=lootEnergyUsage+inUse){
                    for(var a = 0; a < lootActionUsage; a++)
                        p.queue.push(req.body.action);
                }else if(req.body.action.type==="ATTACK" && p.stats.energy>=attackEnergyUsage+inUse && withinShop(p.loc)==null && attackDistance(p.loc,req.body.action.location))
                    p.queue.push(req.body.action);
                else if(req.body.action.type==="ATTACK" && !attackDistance(p.loc,req.body.action.location))
                    p.battleLog.unshift("Out of range.");
                else if(req.body.action.type==="MOVE" || req.body.action.type==="HOLD")
                    p.queue.push(req.body.action);
                else
                    p.battleLog.unshift("You can't perform that action.");
            }else if(p.stats.hp>0){
                p.battleLog.unshift("No action points available.");
            }
        }


        //TODO: Return correctly
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

        if(p!=null && p.stats.hp == 0){
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
            p.loc = spawn();
            p.info.gold = 0;
            p.stats.hp = p.stats.hpMAX;
            p.stats.energy = p.stats.energyMAX;
            p.knownLocs = [];
            p.battleLog.unshift("You have respawned.");
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

        //Regular shop
        var shop = withinShop(p.loc);
        if(p!=null && shop==="SHOP"){
            if(req.body.item==="hp+" && p.info.gold>=(p.stats.hpMAX-p.stats.hp)*(p.stats.hpMAX-p.stats.hp) && p.stats.hpMAX-p.stats.hp!=0){
                p.info.gold = p.info.gold - (p.stats.hpMAX-p.stats.hp)*(p.stats.hpMAX-p.stats.hp);
                p.stats.hp = p.stats.hpMAX;
                p.battleLog.unshift("You repaired your ship.");
            }else if(req.body.item==="hp+" && p.info.gold<(p.stats.hpMAX-p.stats.hp)*(p.stats.hpMAX-p.stats.hp)){
                p.battleLog.unshift("You need more gold.");
            }else if(req.body.item==="hp+" && p.stats.hpMAX==p.stats.hp){
                p.battleLog.unshift("Your ship is at full health.");
            }
            else if(req.body.item==="hpU" && p.info.gold>=(p.stats.hpUpgrades+1)*100 && p.stats.hpUpgrades!=p.stats.hpUpgradesMAX){
                p.info.gold = p.info.gold - (p.stats.hpUpgrades+1)*100;
                p.stats.hpUpgrades++;
                p.stats.hpMAX = p.stats.hpMAX + statData.hpINC;
                p.battleLog.unshift("You purchased a health upgrade.");
            }else if(req.body.item==="hpU" && p.info.gold<(p.stats.hpUpgrades+1)*100){
                p.battleLog.unshift("You need more gold.");
            }
            else if(req.body.item==="enU" && p.info.gold>=(p.stats.energyUpgrades+1)*100 && p.stats.energyUpgrades!=p.stats.energyUpgradesMAX){
                p.info.gold = p.info.gold - (p.stats.energyUpgrades+1)*100;
                p.stats.energyUpgrades++;
                p.stats.energyMAX = p.stats.energyMAX + statData.energyINC;
                p.battleLog.unshift("You purchased an energy upgrade.");
            }else if(req.body.item==="enU" && p.info.gold<(p.stats.energyUpgrades+1)*100){
                p.battleLog.unshift("You need more gold.");
            }
            else if(req.body.item==="radU" && p.info.gold>=(p.stats.radarUpgrades+1)*200 && p.stats.radarUpgrades!=p.stats.radarUpgradesMAX){
                p.info.gold = p.info.gold - (p.stats.radarUpgrades+1)*200;
                p.stats.radarUpgrades++;
                p.stats.radar = p.stats.radar + statData.radarINC;
                p.battleLog.unshift("You purchased a radar upgrade.");
            }else if(req.body.item==="radU" && p.info.gold<(p.stats.radarUpgrades+1)*200){
                p.battleLog.unshift("You need more gold.");
            }
            else if(req.body.item==="atkU" && p.info.gold>=(p.stats.attackUpgrades+1)*200 && p.stats.attackUpgrades!=p.stats.attackUpgradesMAX){
                p.info.gold = p.info.gold - (p.stats.attackUpgrades+1)*200;
                p.stats.attackUpgrades++;
                p.stats.attack = p.stats.attack + statData.attackINC;
                p.battleLog.unshift("You purchased an attack upgrade.");
            }else if(req.body.item==="atkU" && p.info.gold<(p.stats.attackUpgrades+1)*200){
                p.battleLog.unshift("You need more gold.");
            }
            else{
                p.battleLog.unshift("You can't purchase that.");
            }
        }

        //Super Shop
        else if(p!=null && shop==="SSHOP"){

        }

        res.send('');

    });


    app.get('/changelog', function (req, res) {
        res.send(changelog);
    });
    //**************************************************************************
    //Webpages
    //**************************************************************************
    app.get('/game', function (req, res) {
        console.log("Got a GET request for the Game page");
        res.sendFile( __dirname + "/public/game.html" );
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
            if(players[i].queue[0].type==="ATTACK" && withinShop(players[i].loc)==null)
                actAttacks.push(players[i].queue[0].location);
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
    var moves = [], attacks = [], loots = [], scans = [];
    var actAttacks = [];

    //Grab all actions
    for(var i = 0; i < players.length; i++){
        players[i].activeAttacks = [];
        if(players[i].stats.hp>0 && players[i].queue[0]!=null){
            if(players[i].queue[0].type==="MOVE"){
                moves.push({"player":players[i],"direction":players[i].queue[0].direction});
            }else if(players[i].queue[0].type==="ATTACK" && withinShop(players[i].loc)==null){
                attacks.push({"player":players[i], "location":players[i].queue[0].location});
            }else if(players[i].queue[0].type==="ATTACK" && withinShop(players[i].loc)!=null){
                players[i].battleLog.unshift("You can't fight near a shop.");
            }else if(players[i].queue[0].type==="LOOT" && (players[i].queue.length == 1 || players[i].queue[1].type!=="LOOT")){
                loots.push(players[i]);
            }else if(players[i].queue[0].type==="SCAN" && players[i].queue.length == 1){
                scans.push(players[i]);
            }else if(players[i].queue[0].type==="HOLD" && players[i].stats.energy < players[i].stats.energyMAX){
                players[i].stats.energy=players[i].stats.energy+statData.energyReg*(players[i].info.inCombat>0?1:2);
                if (players[i].stats.energy > players[i].stats.energyMAX)
                    players[i].stats.energy = players[i].stats.energyMAX;
            }

            players[i].queue.splice(0,1); //pop from queue

            if(players[i].queue.length>0)
                if(players[i].queue[0].type==="ATTACK" && withinShop(players[i].loc)==null)
                    actAttacks.push(players[i].queue[0].location);
        }
    }

    for(var i = 0; i < players.length; i++){
        players[i].activeAttacks = actAttacks;
    }

    //Perform actions in order
    for(var i = 0; i < moves.length; i++)
        move(moves[i].player,moves[i].direction);
    for(var i = 0; i < attacks.length; i++)
        attack(attacks[i].player,attacks[i].location);
    for(var i = 0; i < loots.length; i++)
        loot(loots[i]);
    for(var i = 0; i < scans.length; i++)
        scan(scans[i]);


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
    //Refresh energy levels and clear queues
    for(var i = 0; i < players.length; i++){
        //disconnect lost players
        players[i].info.connected++;
        if(players[i].info.connected >= dcCountdown){
            console.log("User "+players[i].info.name+" disconnected.");
            var msg = ""+players[i].info.name+" has disconnected.";
            for(var m = 0; m < players.length; m++){
                players[m].battleLog.unshift(msg);
            }
            players.splice(i,1);
            i--;
        }else{
            players[i].queue = [];
            players[i].activeAttacks = [];
            players[i].info.inCombat--;

            //Regen Energy
            if(players[i].stats.hp>0){
                players[i].stats.energy = players[i].stats.energy + statData.energyReg*(players[i].info.inCombat>0?1:2);
                if (players[i].stats.energy > players[i].stats.energyMAX)
                    players[i].stats.energy = players[i].stats.energyMAX;
            }
        }


    }

    //Spawn Treasures
    spawnLoot();

}


//******************************************************************************
// Player Actions
//******************************************************************************
function move(player, direction){
    var before = withinShop(player.loc)!=null;
    var beforeLoc = [player.loc[0],player.loc[1]];

    if(direction==="N"){
        var newY = player.loc[1] - 1;
        if(newY<0) newY = mapSize-1;
        if(!spotOccupied([player.loc[0],newY])) player.loc[1] = newY;
    }else if(direction==="E"){
        var newX = player.loc[0] + 1;
        if(newX>=mapSize) newX = 0;
        if(!spotOccupied([newX,player.loc[1]])) player.loc[0] = newX;
    }else if(direction==="S"){
        var newY = player.loc[1] + 1;
        if(newY>=mapSize) newY = 0;
        if(!spotOccupied([player.loc[0],newY])) player.loc[1] = newY;
    }else if(direction==="W"){
        var newX = player.loc[0] - 1;
        if(newX<0) newX = mapSize-1;
        if(!spotOccupied([newX,player.loc[1]])) player.loc[0] = newX;
    }

    var after = withinShop(player.loc)!=null;
    if(before && !after){
        player.battleLog.unshift("You have left a safe zone.");
    }else if(!before && after){
        player.battleLog.unshift("You have entered a safe zone.");
    }else if(beforeLoc[0]==player.loc[0] && beforeLoc[1]==player.loc[1]){
        player.battleLog.unshift("You can't move there.");
    }
}

function attack(player, location){
    player.stats.energy = player.stats.energy - attackEnergyUsage;
    player.info.inCombat = combatCooldown;

    for(var i = 0; i < players.length; i++){
        if(players[i].loc[0]==location[0] && players[i].loc[1]==location[1] && players[i].stats.hp>0){
            if(withinShop(players[i].loc)==null){
                //HIT
                players[i].stats.hp = players[i].stats.hp - player.stats.attack;
                players[i].info.inCombat = combatCooldown;
                players[i].battleLog.unshift(""+player.info.name+" has hit you for "+player.stats.attack+" damage.");

                if(players[i].stats.hp <= 0){
                    //Player killed
                    players[i].stats.hp = 0;
                    players[i].info.deaths = players[i].info.deaths + 1;
                    players[i].queue = [];
                    players[i].battleLog.unshift("You died.");
                    player.info.kills = player.info.kills + 1;
                    if(isNaN(map[location[0]][location[1]])){
                        map[location[0]][location[1]] = players[i].info.gold;
                        players[i].info.gold = 0;
                    }else{
                        map[location[0]][location[1]] = map[location[0]][location[1]]+players[i].info.gold;
                        players[i].info.gold = 0;
                    }

                    var msg = ""+player.info.name+" has killed "+players[i].info.name+".";
                    for(var m = 0; m < players.length; m++){
                        if(players[m].token === player.token)
                            player.battleLog.unshift("You have killed "+players[i].info.name);
                        else
                            players[m].battleLog.unshift(msg);
                    }

                }
            }
            break;
        }
    }

}

function loot(player){
    player.stats.energy = player.stats.energy - lootEnergyUsage;

    var treasure = map[player.loc[0]][player.loc[1]];
    if(isLoot(treasure)){
        var startGold = player.info.gold;
        var startTotalGold = player.info.totalGold;

        if(treasure.type==="GOLD"){
            player.info.gold = player.info.gold + treasure.count;
            player.info.totalGold = player.info.totalGold + treasure.count;
            player.battleLog.unshift("You found "+treasure.count+"g!");
        }else if(treasure.type==="IRON"){
            player.info.iron = player.info.iron + treasure.count;
            player.info.totalIron = player.info.totalIron + treasure.count;
            player.battleLog.unshift("You found "+treasure.count+" iron!");
        }else if(treasure.type==="URANIUM"){
            player.info.uranium = player.info.uranium + treasure.count;
            player.info.totalUranium = player.info.totalUranium + treasure.count;
            player.battleLog.unshift("You found "+treasure.count+" uranium!");
        }
        player.info.hauls++;

        map[player.loc[0]][player.loc[1]] = {"type":"OPEN"};
        lootSpawns.push([player.loc[0],player.loc[1]]);
        lootCount--;

        //Alert local people of looting
        var mid = parseInt(statData.vision/2);
        for(var x = 0; x < statData.vision; x++){
            for(var y = 0; y < statData.vision; y++){
                var cX = player.loc[0] - (mid-x);
                var cY = player.loc[1] - (mid-y);

                if(cX < 0) cX += map.length;
                if(cY < 0) cY += map.length;
                if(cX >= map.length) cX -= map.length;
                if(cY >= map.length) cY -= map.length;

                var enemyP = playerInSpot([cX,cY], player);
                if(enemyP!=null)
                    enemyP.battleLog.unshift(player.info.name+" has looted near you.");
            }
        }

        //Alert world of great wealth
        var msg;
        if(parseInt(startGold/1000) < parseInt(player.info.gold/1000)){
            msg = ""+player.info.name+" has over "+(parseInt(player.info.gold/1000)*1000)+"g.";
        }
        if(parseInt(startTotalGold/2000) < parseInt(player.info.totalGold/2000)){
            msg = ""+player.info.name+" has amassed over "+(parseInt(player.info.totalGold/2000)*2000)+"g.";
        }

        for(var i = 0; i < players.length; i++){
            for(var k = 0; k < players[i].knownLocs.length; k++){
                if(players[i].knownLocs[k][0]==player.loc[0] && players[i].knownLocs[k][1]==player.loc[1]){
                    players[i].knownLocs.splice(k,1);
                }
            }
            if(msg!=null) players[i].battleLog.unshift(msg);
        }
    }else{
        player.battleLog.unshift("You didn't find anything.");
    }
}

function scan(player){
    player.stats.energy = player.stats.energy - scanEnergyUsage;

    //Scan Area
    var mid = parseInt(player.stats.radar/2);
    for(var x = 0; x < player.stats.radar; x++){
        for(var y = 0; y < player.stats.radar; y++){
            var cX = player.loc[0] - (mid-x);
            var cY = player.loc[1] - (mid-y);

            if(cX < 0) cX += map.length;
            if(cY < 0) cY += map.length;
            if(cX >= map.length) cX -= map.length;
            if(cY >= map.length) cY -= map.length;

            if(isLoot(map[cX][cY])){
                player.knownLocs.push([cX,cY]);
            }

            var enemyP = playerInSpot([cX,cY], player);
            if(enemyP!=null){
                enemyP.battleLog.unshift("Someone has scanned you.");
                player.scanned.push({"token":enemyP.token,"rounds":3});
            }
        }
    }
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
    var mid = parseInt(statData.attackRange/2);
    for(var x = 0; x < statData.attackRange; x++){
        for(var y = 0; y < statData.attackRange; y++){
            var cX = player[0] - (mid-x);
            var cY = player[1] - (mid-y);

            if(cX < 0) cX += map.length;
            if(cY < 0) cY += map.length;
            if(cX >= map.length) cX -= map.length;
            if(cY >= map.length) cY -= map.length;

            if(attack[0]==cX && attack[1]==cY){
                return true;
            }
        }
    }

    return false;
}

function visionDistance(player, spot){
    var mid = parseInt(statData.vision/2);
    for(var x = 0; x < statData.vision; x++){
        for(var y = 0; y < statData.vision; y++){
            var cX = player[0] - (mid-x);
            var cY = player[1] - (mid-y);

            if(cX < 0) cX += map.length;
            if(cY < 0) cY += map.length;
            if(cX >= map.length) cX -= map.length;
            if(cY >= map.length) cY -= map.length;

            if(spot[0]==cX && spot[1]==cY){
                return true;
            }
        }
    }

    return false;
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
                superShop = true;
            }else if(r < .01 && !superShop && (x > (mapSize+3-parseInt(zone3Wid*mapSize))/2+parseInt(zone3Wid*mapSize) && x < (mapSize-parseInt(zone3Wid*mapSize))/2+parseInt(zone3Wid*mapSize)+parseInt(zone2Wid*mapSize))){
                map[x][y] = {"type":"SSHOP"};
                superShop = true;
            }else if(r < shopSpread && (x < (mapSize-parseInt(zone3Wid*mapSize))/2-3 || x > mapSize+3-((mapSize-parseInt(zone3Wid*mapSize))/2))){
                map[x][y] = {"type":"SHOP"};
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

function calculatePrice(model, lvl, mod, mod2, threshold){
    if(lvl >= threshold)
        if(model==1)
            return lvl * mod;
        else if(model==2)
            return lvl * lvl * mod;
        else if(model==3)
            return mod;
        else if(model==4)
            return lvl * mod + mod2;
        else if(model==5)
            return lvl * lvl * mod + mod2;

    return 0;
}
