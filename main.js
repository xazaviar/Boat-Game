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
    jsonfile.readFile("data/shopdata.json", function(err, obj) {
        if(err){
            console.log(err);
            process.exit(1);
        }
        shopData = obj;
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
                "connected": 0,
                "hasInsurance": false
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
                        "price":calculatePrices(shopData.insurance,p.stats.hpMAX),
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
                        "price":calculatePrices(shopData.staticHp,0),
                        "canBuy":!p.stats.staticHp
                    },
                    "statEng":{
                        "price":calculatePrices(shopData.staticEng,0),
                        "canBuy":!p.stats.staticEng
                    },
                    "statAtk":{
                        "price":calculatePrices(shopData.staticAtk,0),
                        "canBuy":!p.stats.staticAtk
                    },
                    "statRdr":{
                        "price":calculatePrices(shopData.staticRdr,0),
                        "canBuy":!p.stats.staticRdr
                    },
                    "statDR":{
                        "price":calculatePrices(shopData.staticDR,0),
                        "canBuy":!p.stats.staticDR
                    },
                    "uranium":{
                        "price":calculatePrices(shopData.uranium,0),
                        "canBuy":p.info.uranium!=p.stats.urCarry
                    },
                    "quickHeal":{
                        "price":calculatePrices(shopData.quickHeal,p.stats.hpMAX),
                        "canBuy":!p.stats.quickHeal
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

        if(p!=null){
            var shop = {
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
                    "price":calculatePrices(shopData.insurance,p.stats.hpMAX),
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
                    "price":calculatePrices(shopData.staticHp,0),
                    "canBuy":!p.stats.staticHp
                },
                "statEng":{
                    "price":calculatePrices(shopData.staticEng,0),
                    "canBuy":!p.stats.staticEng
                },
                "statAtk":{
                    "price":calculatePrices(shopData.staticAtk,0),
                    "canBuy":!p.stats.staticAtk
                },
                "statRdr":{
                    "price":calculatePrices(shopData.staticRdr,0),
                    "canBuy":!p.stats.staticRdr
                },
                "statDR":{
                    "price":calculatePrices(shopData.staticDR,0),
                    "canBuy":!p.stats.staticDR
                },
                "uranium":{
                    "price":calculatePrices(shopData.uranium,0),
                    "canBuy":p.info.uranium!=p.stats.urCarry
                },
                "quickHeal":{
                    "price":calculatePrices(shopData.quickHeal,p.stats.hpMAX),
                    "canBuy":!p.stats.quickHeal
                }
            };
            var inventory = {"gold":p.info.gold,"iron":p.info.iron,"uranium":p.info.uranium};


            //Regular shop
            if(shop.withinShop==="SHOP"){
                if(req.body.item==="hpF" && canPurchase(shop.hpF.price,inventory) && shop.hpF.canBuy){
                    makePurchase(shop.hpF.price,p);
                    p.stats.hp = p.stats.hpMAX;
                    p.battleLog.unshift("You repaired your ship.");
                }else if(req.body.item==="hpF" && !canPurchase(shop.hpF.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }else if(req.body.item==="hpF" && !shop.hpF.canBuy){
                    p.battleLog.unshift("Your ship is at full health.");
                }

                else if(req.body.item==="hp5" && canPurchase(shop.hp5.price,inventory) && shop.hp5.canBuy){
                    makePurchase(shop.hp5.price,p);
                    p.stats.hp = p.stats.hp + 5;
                    if(p.stats.hp > p.stats.hpMAX) p.stats.hp = p.stats.hpMAX;
                    p.battleLog.unshift("You repaired your ship.");
                }else if(req.body.item==="hp5" && !canPurchase(shop.hp5.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }else if(req.body.item==="hp5" && !shop.hp5.canBuy){
                    p.battleLog.unshift("Your ship is at full health.");
                }

                else if(req.body.item==="insurance" && canPurchase(shop.insurance.price,inventory) && shop.insurance.canBuy){
                    makePurchase(shop.insurance.price,p);
                    p.info.hasInsurance = true;
                    p.battleLog.unshift("You purchased insurance.");
                }else if(req.body.item==="insurance" && !canPurchase(shop.insurance.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }else if(req.body.item==="insurance" && !shop.insurance.canBuy){
                    p.battleLog.unshift("You are already insured.");
                }

                else if(req.body.item==="hpU" && canPurchase(shop.hpU.price,inventory) && shop.hpU.canBuy){
                    makePurchase(shop.hpU.price,p);
                    p.stats.hpUpgrades++;
                    p.stats.hpMAX = p.stats.hpMAX + statData.hpINC;
                    p.battleLog.unshift("You upgraded your health.");
                }else if(req.body.item==="hpU" && !canPurchase(shop.hpU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="enU" && canPurchase(shop.enU.price,inventory) && shop.enU.canBuy){
                    makePurchase(shop.enU.price,p);
                    p.stats.energyUpgrades++;
                    p.stats.energyMAX = p.stats.energyMAX + statData.energyINC;
                    p.battleLog.unshift("You upgraded your energy.");
                }else if(req.body.item==="enU" && !canPurchase(shop.enU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="radU" && canPurchase(shop.radU.price,inventory) && shop.radU.canBuy){
                    makePurchase(shop.radU.price,p);
                    p.stats.radarUpgrades++;
                    p.stats.radar = p.stats.radar + statData.radarINC;
                    p.battleLog.unshift("You upgraded your radar.");
                }else if(req.body.item==="radU" && !canPurchase(shop.radU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="atkU" && canPurchase(shop.atkU.price,inventory) && shop.atkU.canBuy){
                    makePurchase(shop.atkU.price,p);
                    p.stats.attackUpgrades++;
                    p.stats.attack = p.stats.attack + statData.attackINC;
                    p.battleLog.unshift("You upgraded your radar.");
                }else if(req.body.item==="atkU" && !canPurchase(shop.atkU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else{
                    p.battleLog.unshift("You can't purchase that.");
                }
            }

            //Super Shop
            else if(shop.withinShop==="SSHOP"){
                if(req.body.item==="loadout" && canPurchase(shop.loadout.price,inventory) && shop.loadout.canBuy){
                    makePurchase(shop.loadout.price,p);
                    p.stats.loadoutSize = p.stats.loadoutSize+statData.loadoutINC;
                    p.battleLog.unshift("You increased your loadout.");
                }else if(req.body.item==="loadout" && !canPurchase(shop.loadout.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }else if(req.body.item==="loadout" && !shop.loadout.canBuy){
                    p.battleLog.unshift("You have already maxed your loadout.");
                }

                else if(req.body.item==="canU" && canPurchase(shop.canU.price,inventory) && shop.canU.canBuy){
                    makePurchase(shop.canU.price,p);
                    p.stats.cannonUpgrades++;
                    p.stats.cannon = p.stats.cannon + statData.cannonINC;
                    if(p.stats.cannonUpgrades==1)
                        p.battleLog.unshift("You purchased the Cannon.");
                    else
                        p.battleLog.unshift("You upgraded your Cannon.");
                }else if(req.body.item==="canU" && !canPurchase(shop.canU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="bliU" && canPurchase(shop.bliU.price,inventory) && shop.bliU.canBuy){
                    makePurchase(shop.bliU.price,p);
                    p.stats.blinkUpgrades++;
                    p.stats.blink = p.stats.blink + statData.blinkINC;
                    if(p.stats.blinkUpgrades==1)
                        p.battleLog.unshift("You purchased the Blink Module.");
                    else
                        p.battleLog.unshift("You upgraded your Blink Module.");
                }else if(req.body.item==="bliU" && !canPurchase(shop.bliU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="steU" && canPurchase(shop.steU.price,inventory) && shop.steU.canBuy){
                    makePurchase(shop.steU.price,p);
                    p.stats.stealthUpgrades++;
                    p.stats.stealth = p.stats.stealth + statData.stealthINC;
                    if(p.stats.stealthUpgrades==1)
                        p.battleLog.unshift("You purchased the Stealth Module.");
                    else
                        p.battleLog.unshift("You upgraded your Stealth Module.");
                }else if(req.body.item==="steU" && !canPurchase(shop.steU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="trapU" && canPurchase(shop.trapU.price,inventory) && shop.trapU.canBuy){
                    makePurchase(shop.trapU.price,p);
                    p.stats.trapUpgrades++;
                    p.stats.trap = p.stats.trap + statData.trapINC;
                    if(p.stats.trapUpgrades==1)
                        p.battleLog.unshift("You purchased the Trap Module.");
                    else
                        p.battleLog.unshift("You upgraded your Trap Module.");
                }else if(req.body.item==="trapU" && !canPurchase(shop.trapU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="engModU" && canPurchase(shop.engModU.price,inventory) && shop.engModU.canBuy){
                    makePurchase(shop.engModU.price,p);
                    p.stats.engModUpgrades++;
                    p.stats.engMod = p.stats.engMod + statData.engModINC;
                    if(p.stats.engModUpgrades==1)
                        p.battleLog.unshift("You purchased the Energy Module.");
                    else
                        p.battleLog.unshift("You upgraded your Energy Module.");
                }else if(req.body.item==="engModU" && !canPurchase(shop.engModU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="railU" && canPurchase(shop.railU.price,inventory) && shop.railU.canBuy){
                    makePurchase(shop.railU.price,p);
                    p.stats.railgunUpgrades++;
                    p.stats.railgun = p.stats.railgun + statData.railgunINC;
                    if(p.stats.railgunUpgrades==1)
                        p.battleLog.unshift("You purchased the Railgun.");
                    else
                        p.battleLog.unshift("You upgraded your Railgun.");
                }else if(req.body.item==="railU" && !canPurchase(shop.railU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="carryU" && canPurchase(shop.carryU.price,inventory) && shop.carryU.canBuy){
                    makePurchase(shop.carryU.price,p);
                    p.stats.urCarryUpgrades++;
                    p.stats.urCarry = p.stats.urCarry + statData.urCarryINC;
                    p.battleLog.unshift("You upgraded your Uranium Carry Capacity.");
                }else if(req.body.item==="carryU" && !canPurchase(shop.carryU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="insuranceU" && canPurchase(shop.insuranceU.price,inventory) && shop.insuranceU.canBuy){
                    makePurchase(shop.insuranceU.price,p);
                    p.stats.insuranceUpgrades++;
                    p.stats.insurance = p.stats.insurance + statData.insuranceINC;
                    p.battleLog.unshift("You upgraded your Insurance.");
                }else if(req.body.item==="insuranceU" && !canPurchase(shop.insuranceU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="scanU" && canPurchase(shop.scanU.price,inventory) && shop.scanU.canBuy){
                    makePurchase(shop.scanU.price,p);
                    p.stats.scannerUpgrades++;
                    p.stats.scanner = p.stats.scanner + statData.scannerINC;
                    p.battleLog.unshift("You upgraded your Scanner.");
                }else if(req.body.item==="scanU" && !canPurchase(shop.scanU.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="statHP" && canPurchase(shop.statHP.price,inventory) && shop.statHP.canBuy){
                    makePurchase(shop.statHP.price,p);
                    p.stats.staticHp = true;
                    p.battleLog.unshift("You purchased the Health+ Module.");
                }else if(req.body.item==="statHP" && !canPurchase(shop.statHP.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="statEng" && canPurchase(shop.statEng.price,inventory) && shop.statEng.canBuy){
                    makePurchase(shop.statEng.price,p);
                    p.stats.staticEng = true;
                    p.battleLog.unshift("You purchased the Energy+ Module.");
                }else if(req.body.item==="statEng" && !canPurchase(shop.statEng.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="statAtk" && canPurchase(shop.statAtk.price,inventory) && shop.statAtk.canBuy){
                    makePurchase(shop.statAtk.price,p);
                    p.stats.staticAtk = true;
                    p.battleLog.unshift("You purchased the Attack+ Module.");
                }else if(req.body.item==="statAtk" && !canPurchase(shop.statAtk.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="statRdr" && canPurchase(shop.statRdr.price,inventory) && shop.statRdr.canBuy){
                    makePurchase(shop.statRdr.price,p);
                    p.stats.staticRdr = true;
                    p.battleLog.unshift("You purchased the Radar+ Module.");
                }else if(req.body.item==="statRdr" && !canPurchase(shop.statRdr.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="statDR" && canPurchase(shop.statDR.price,inventory) && shop.statDR.canBuy){
                    makePurchase(shop.statDR.price,p);
                    p.stats.staticDR = true;
                    p.battleLog.unshift("You purchased the DR Module.");
                }else if(req.body.item==="statDR" && !canPurchase(shop.statDR.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="statDR" && canPurchase(shop.statDR.price,inventory) && shop.statDR.canBuy){
                    makePurchase(shop.statDR.price,p);
                    p.stats.staticDR = true;
                    p.battleLog.unshift("You purchased the DR Module.");
                }else if(req.body.item==="statDR" && !canPurchase(shop.statDR.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="quickHeal" && canPurchase(shop.quickHeal.price,inventory) && shop.quickHeal.canBuy){
                    makePurchase(shop.quickHeal.price,p);
                    p.stats.quickHeal = true;
                    p.battleLog.unshift("You purchased a Quick Heal.");
                }else if(req.body.item==="quickHeal" && !canPurchase(shop.quickHeal.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else if(req.body.item==="uranium" && canPurchase(shop.uranium.price,inventory) && shop.uranium.canBuy){
                    makePurchase(shop.uranium.price,p);
                    p.info.uranium = p.info.uranium + 1;
                    p.battleLog.unshift("You purchased uranium.");
                }else if(req.body.item==="uranium" && !canPurchase(shop.uranium.price,inventory)){
                    p.battleLog.unshift("You need more resources.");
                }

                else{
                    p.battleLog.unshift("You can't purchase that.");
                }
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

function calculatePrices(purchase, lvl){
    var prices = {"gold":0,"iron":0,"uranium":0};

    //GOLD
    if(purchase.gold.model==1)
        prices.gold = lvl * purchase.gold.mod;
    else if(purchase.gold.model==2)
        prices.gold = lvl * lvl * purchase.gold.mod;
    else if(purchase.gold.model==3)
        prices.gold = purchase.gold.mod;
    else if(purchase.gold.model==4)
        prices.gold = lvl * purchase.gold.mod + purchase.gold.mod2;
    else if(purchase.gold.model==5)
        prices.gold = lvl * lvl * purchase.gold.mod + purchase.gold.mod2;

    //IRON
    if(lvl >= purchase.iron.threshold)
        if(purchase.iron.model==1)
            prices.iron = lvl * purchase.iron.mod;
        else if(purchase.iron.model==2)
            prices.iron = lvl * lvl * purchase.iron.mod;
        else if(purchase.iron.model==3)
            prices.iron = purchase.iron.mod;
        else if(purchase.iron.model==4)
            prices.iron = lvl * purchase.iron.mod + purchase.iron.mod2;
        else if(purchase.gold.model==5)
            prices.iron = lvl * lvl * purchase.iron.mod + purchase.iron.mod2;

    //URANIUM
    if(lvl >= purchase.uranium.threshold)
        if(purchase.uranium.model==1)
            prices.uranium = lvl * purchase.uranium.mod;
        else if(purchase.uranium.model==2)
            prices.uranium = lvl * lvl * purchase.uranium.mod;
        else if(purchase.uranium.model==3)
            prices.uranium = purchase.uranium.mod;
        else if(purchase.uranium.model==4)
            prices.uranium = lvl * purchase.uranium.mod + purchase.uranium.mod2;
        else if(purchase.uranium.model==5)
            prices.uranium = lvl * lvl * purchase.uranium.mod + purchase.uranium.mod2;

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
