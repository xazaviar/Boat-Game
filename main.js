var jsonfile = require('jsonfile');
var changelog;

//Globals
var port = 8081;
var players = [];
var mapSize = 30;
var rockSpread = 4; //Int as percent
var shopSpread = 1; //Int as percent
var map = [];
var spawns = [];

//Countdown Data
var phase = 0; //0 -> setup , 1,2,3 -> action x
var countdownMax = 100; //always 100
var countdown = countdownMax;
var cTick = 30; //countdownMax * tick = 5 secs
var aTick = 800; //action tick
var combatCooldown = 3; //Number of rounds
var dcCountdown = 2;

//Stat Data
var hpStart     =   10;
var hpMAX       =   30;
var hpINC       =   2;

var energyStart =   10;
var energyMAX   =   20;
var energyINC   =   2;
var energyReg   =   1; //per round

var radarStart  =   9;
var radarMAX    =   17;
var radarINC    =   2;

var attackStart =   1;
var attackMAX   =   4;
var attackINC   =   1;

var vision      =   11;
var attackRange =   11;

//Energy Usage
var attackEnergyUsage = 1;
var lootEnergyUsage = 3;
var scanEnergyUsage = 5;

//Action Usage
var lootActionUsage = 2;
var scanActionUsage = 3;

//Treasure Data
//TODO: make harder to find higher value treasure
// var treasureValMIN = 25;
// var treasureValMAX = 200;
var treasureValues = [
    {"value": 25,
     "chance": .03},
    {"value": 50,
     "chance": .10},
    {"value": 75,
     "chance": .12},
    {"value": 100,
     "chance": .30},
    {"value": 125,
     "chance": .12},
    {"value": 150,
     "chance": .10},
    {"value": 175,
     "chance": .05},
    {"value": 200,
     "chance": .05},
    {"value": 225,
     "chance": .05},
    {"value": 250,
     "chance": .03},
    {"value": 275,
     "chance": .02},
    {"value": 300,
     "chance": .01},
    {"value": 325,
     "chance": .01},
    {"value": 500,
     "chance": .01}
]
var treasureSpreadMIN = .05; //decimal as percent
var treasureSpreadMAX = .10; //decimal as percent
var treasureSpawnRate = 1; //Treasures spawn per round
var treasureCount = 0;
var treasureSpawns = [];

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


    if(mapSize < 20) mapSize = 20;

    //init map
    for(var x = 0; x < mapSize; x++){
        map[x] = [];
        for(var y = 0; y < mapSize; y++){
            var r = parseInt(Math.random()*100);
            if(r < shopSpread){
                map[x][y] = "S";
            }else if(r < rockSpread)
                map[x][y] = "R";
            else{
                map[x][y] = "_";
                spawns.push([x,y]);
            }
        }
    }

    //fill treasureSpawns
    for(var i = 0; i < spawns.length; i++){
        treasureSpawns.push([spawns[i][0],spawns[i][1]]);
    }

    //Spawn Treasures
    roundCleanup();

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
                "hp": hpStart,
                "hpMAX": hpStart,
                "hpUpgrades":0,
                "hpUpgradesMAX": (hpMAX-hpStart)/hpINC,

                "energy": energyStart,
                "energyMAX": energyStart,
                "energyUpgrades":0,
                "energyUpgradesMAX": (energyMAX-energyStart)/energyINC,

                "radar": radarStart,
                "radarUpgrades":1,
                "radarUpgradesMAX": (radarMAX-radarStart)/radarINC+1,

                "attack": attackStart,
                "attackUpgrades":1,
                "attackUpgradesMAX": (attackMAX-attackStart)/attackINC+1,
            }
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
                    sendMap[x][y] = ""+map[x][y];
                }
            }

            var mid = parseInt(p.stats.radar/2);
            for(var x = 0; x < p.stats.radar; x++){
                for(var y = 0; y < p.stats.radar; y++){
                    var cX = p.loc[0] - (mid-x);
                    var cY = p.loc[1] - (mid-y);

                    if(cX < 0) cX += map.length;
                    if(cY < 0) cY += map.length;
                    if(cX >= map.length) cX -= map.length;
                    if(cY >= map.length) cY -= map.length;

                    if(!isNaN(sendMap[cX][cY]) && !isKnown(p.knownLocs,cX,cY)){
                        sendMap[cX][cY] = "_";
                    }

                    //Check enemies within vision
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
                "game":{"countdown":countdown,"phase":phase},
                "shop":{
                    "withinShop": withinShop(p.loc),
                    "hp":{"price":(p.stats.hpMAX-p.stats.hp)*(p.stats.hpMAX-p.stats.hp),"canBuy":!(p.stats.hp==p.stats.hpMAX)},
                    "hpU":{"price":(p.stats.hpUpgrades+1)*100,"canBuy":!(p.stats.hpUpgrades==p.stats.hpUpgradesMAX)},
                    "enU":{"price":(p.stats.energyUpgrades+1)*100,"canBuy":!(p.stats.energyUpgrades==p.stats.energyUpgradesMAX)},
                    "radU":{"price":(p.stats.radarUpgrades+1)*200,"canBuy":!(p.stats.radarUpgrades==p.stats.radarUpgradesMAX)},
                    "atkU":{"price":(p.stats.attackUpgrades+1)*200,"canBuy":!(p.stats.attackUpgrades==p.stats.attackUpgradesMAX)}
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
                        inUse = inUse - energyReg;
                    }
                }
                if(3-p.queue.length >= scanActionUsage && req.body.action.type==="SCAN" && p.stats.energy>=scanEnergyUsage+inUse){
                    for(var a = 0; a < scanActionUsage; a++)
                        p.queue.push(req.body.action);
                }else if(3-p.queue.length >= lootActionUsage && req.body.action.type==="LOOT" && p.stats.energy>=lootEnergyUsage+inUse){
                    for(var a = 0; a < lootActionUsage; a++)
                        p.queue.push(req.body.action);
                }else if(req.body.action.type==="ATTACK" && p.stats.energy>=attackEnergyUsage+inUse && !withinShop(p.loc) && attackDistance(p.loc,req.body.action.location))
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
            if(p.stats.hpMAX>hpStart){
                p.stats.hpUpgrades--;
                p.stats.hpMAX = p.stats.hpMAX-hpINC;
            }
            if(p.stats.energyMAX>energyStart){
                p.stats.energyUpgrades--;
                p.stats.energyMAX = p.stats.energyMAX-energyINC;
            }
            if(p.stats.radar>radarStart){
                p.stats.radarUpgrades--;
                p.stats.radar = p.stats.radar-radarINC;
            }
            if(p.stats.attack>attackStart){
                p.stats.attackUpgrades--;
                p.stats.attack = p.stats.attack-attackINC;
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

        if(p!=null && withinShop(p.loc)){
            if(req.body.item==="hp+" && p.info.gold>=(p.stats.hpMAX-p.stats.hp)*(p.stats.hpMAX-p.stats.hp) && p.stats.hpMAX-p.stats.hp!=0){
                p.info.gold = p.info.gold - (p.stats.hpMAX-p.stats.hp)*(p.stats.hpMAX-p.stats.hp);
                p.stats.hp = p.stats.hpMAX;
                p.battleLog.unshift("You have repaired your ship.");
            }else if(req.body.item==="hp+" && p.info.gold<(p.stats.hpMAX-p.stats.hp)*(p.stats.hpMAX-p.stats.hp)){
                p.battleLog.unshift("You need more gold.");
            }else if(req.body.item==="hp+" && p.stats.hpMAX==p.stats.hp){
                p.battleLog.unshift("Your ship is at full health.");
            }
            else if(req.body.item==="hpU" && p.info.gold>=(p.stats.hpUpgrades+1)*100 && p.stats.hpUpgrades!=p.stats.hpUpgradesMAX){
                p.info.gold = p.info.gold - (p.stats.hpUpgrades+1)*100;
                p.stats.hpUpgrades++;
                p.stats.hpMAX = p.stats.hpMAX + hpINC;
                p.battleLog.unshift("You have purchased a health upgrade.");
            }else if(req.body.item==="hpU" && p.info.gold<(p.stats.hpUpgrades+1)*100){
                p.battleLog.unshift("You need more gold.");
            }
            else if(req.body.item==="enU" && p.info.gold>=(p.stats.energyUpgrades+1)*100 && p.stats.energyUpgrades!=p.stats.energyUpgradesMAX){
                p.info.gold = p.info.gold - (p.stats.energyUpgrades+1)*100;
                p.stats.energyUpgrades++;
                p.stats.energyMAX = p.stats.energyMAX + energyINC;
                p.battleLog.unshift("You have purchased an energy upgrade.");
            }else if(req.body.item==="enU" && p.info.gold<(p.stats.energyUpgrades+1)*100){
                p.battleLog.unshift("You need more gold.");
            }
            else if(req.body.item==="radU" && p.info.gold>=(p.stats.radarUpgrades+1)*200 && p.stats.radarUpgrades!=p.stats.radarUpgradesMAX){
                p.info.gold = p.info.gold - (p.stats.radarUpgrades+1)*200;
                p.stats.radarUpgrades++;
                p.stats.radar = p.stats.radar + radarINC;
                p.battleLog.unshift("You have purchased a radar upgrade.");
            }else if(req.body.item==="radU" && p.info.gold<(p.stats.radarUpgrades+1)*200){
                p.battleLog.unshift("You need more gold.");
            }
            else if(req.body.item==="atkU" && p.info.gold>=(p.stats.attackUpgrades+1)*200 && p.stats.attackUpgrades!=p.stats.attackUpgradesMAX){
                p.info.gold = p.info.gold - (p.stats.attackUpgrades+1)*200;
                p.stats.attackUpgrades++;
                p.stats.attack = p.stats.attack + attackINC;
                p.battleLog.unshift("You have purchased an attack upgrade.");
            }else if(req.body.item==="atkU" && p.info.gold<(p.stats.attackUpgrades+1)*200){
                p.battleLog.unshift("You need more gold.");
            }
            else{
                p.battleLog.unshift("You can't purchase that.");
            }
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
            if(players[i].queue[0].type==="ATTACK" && !withinShop(players[i].loc))
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
            }else if(players[i].queue[0].type==="ATTACK" && !withinShop(players[i].loc)){
                attacks.push({"player":players[i], "location":players[i].queue[0].location});
            }else if(players[i].queue[0].type==="ATTACK" && withinShop(players[i].loc)){
                players[i].battleLog.unshift("You can't fight near a shop.");
            }else if(players[i].queue[0].type==="LOOT" && (players[i].queue.length == 1 || players[i].queue[1].type!=="LOOT")){
                loots.push(players[i]);
            }else if(players[i].queue[0].type==="SCAN" && players[i].queue.length == 1){
                scans.push(players[i]);
            }else if(players[i].queue[0].type==="HOLD" && players[i].stats.energy < players[i].stats.energyMAX){
                players[i].stats.energy=players[i].stats.energy+energyReg*(players[i].info.inCombat>0?1:2);
                if (players[i].stats.energy > players[i].stats.energyMAX)
                    players[i].stats.energy = players[i].stats.energyMAX;
            }

            players[i].queue.splice(0,1); //pop from queue

            if(players[i].queue.length>0)
                if(players[i].queue[0].type==="ATTACK" && !withinShop(players[i].loc))
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
                players[i].stats.energy = players[i].stats.energy + energyReg*(players[i].info.inCombat>0?1:2);
                if (players[i].stats.energy > players[i].stats.energyMAX)
                    players[i].stats.energy = players[i].stats.energyMAX;
            }
        }


    }

    //Spawn Treasures
    if(treasureCount < mapSize*mapSize*treasureSpreadMAX){
        var spawn = parseInt(mapSize*mapSize*treasureSpreadMIN);
        for(var i = treasureCount; i < spawn; i++){
            var r = parseInt((Math.random()*1000)%treasureSpawns.length);
            var val = chooseTreasureValue();
            map[treasureSpawns[r][0]][treasureSpawns[r][1]] = val;
            treasureCount++;
            treasureSpawns.splice(r,1);
        }
        for(var i = 0; i < treasureSpawnRate; i++){
            var r = parseInt((Math.random()*1000)%treasureSpawns.length);
            var val = chooseTreasureValue();
            map[treasureSpawns[r][0]][treasureSpawns[r][1]] = val;
            treasureCount++;
            treasureSpawns.splice(r,1);
        }
    }


}


//******************************************************************************
// Player Actions
//******************************************************************************
function move(player, direction){
    var before = withinShop(player.loc);
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

    var after = withinShop(player.loc);
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
            if(!withinShop(players[i].loc)){
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

    var treasure = parseInt(map[player.loc[0]][player.loc[1]]);
    if(!isNaN(treasure)){
        var startGold = player.info.gold;
        player.info.gold = player.info.gold + treasure;
        player.info.totalGold = player.info.totalGold + treasure;
        player.info.hauls++;
        map[player.loc[0]][player.loc[1]] = "_";
        treasureSpawns.push([player.loc[0],player.loc[1]]);
        treasureCount--;

        player.battleLog.unshift("You found "+treasure+"g!");

        //Alert local people of looting
        var mid = parseInt(vision/2);
        for(var x = 0; x < vision; x++){
            for(var y = 0; y < vision; y++){
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

        for(var i = 0; i < players.length; i++){
            for(var k = 0; k < players[i].knownLocs.length; k++){
                if(players[i].knownLocs[k][0]==player.loc[0] && players[i].knownLocs[k][1]==player.loc[1]){
                    players[i].knownLocs.splice(k,1);
                    break;
                }
            }
            if(msg!=null) players[i].battleLog.unshift(msg);
        }
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

            if(!isNaN(map[cX][cY]) && !isKnown(player.knownLocs,cX,cY)){
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

            if(map[cX][cY]==="S") return true;
        }
    }

    return false;
}

function spotOccupied(location){
    if(map[location[0]][location[1]]==="R" || map[location[0]][location[1]]==="S") return true;
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
    for (var i = 0; i < 16; i++) {
      token += chars[Math.round(Math.random() * (chars.length - 1))];
    }

    return token;
}

function chooseTreasureValue(){
    var val = 0, sum = 0;
    var r = Math.random();

    for(var i = 0; i < treasureValues.length; i++){
        if(r < treasureValues[i].chance+sum)
            return treasureValues[i].value;
        else
            sum += treasureValues[i].chance;
    }

    return val;
}

function attackDistance(player, attack){
    var mid = parseInt(attackRange/2);
    for(var x = 0; x < attackRange; x++){
        for(var y = 0; y < attackRange; y++){
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
    var mid = parseInt(vision/2);
    for(var x = 0; x < vision; x++){
        for(var y = 0; y < vision; y++){
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
