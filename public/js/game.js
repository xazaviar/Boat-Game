var offsetX;
var offsetY;
var offsetX2;
var offsetY2;
var tick = 50;
var mX, mY;
var hover = [-1,-1];
var shopMode = false;
var cTab = 0;
var gameStart = true;
var settingsView = false;
var radarAngle = 0;
var radarTick = 40;
var radarINC = .1;
var radarAngleChange = true;
var radarFollow = 5;
var mapView = false;
var blink = false;
var tabs;
var baseStore;
var statInfo = false;

var displayBlink = false;
var displayCannon = false;
var displayRailgun = false;
var railDir = "N";

var prevWid = 0;

//Colors
//Monitor Colors
var colors;
var colorsDefault = {
    "hudColor":         "#00FF00", //Default -> #00FF00
    "hudBackColor":     "#000000", //Default -> #000000

    "goldColor":        "#BBBB00", //Default -> #BBBB00
    "ironColor":        "#333333", //Default -> #333333
    "uraniumColor":     "#AA00AA", //Default -> #AA00AA
    "enemyColor":       "#FF0000", //Default -> #FF0000
    "shopColor":        "#999999", //Default -> #272727
    "rockColor":        "#00BB00", //Default -> #00BB00
    "trapColor":        "#990000", //Default -> #00BB00

    "actionTextColor":  "#FFFFFF", //Default -> #FFFFFF
    "attackColor":      "#FF0000", //Default -> #FF0000
    "moveColor":        "#0000FF", //Default -> #0000FF
    "lootColor":        "#990099", //Default -> #990099
    "scanColor":        "#00AA00", //Default -> #00AA00
    "holdColor":        "#000080", //Default -> #000080
    "abilityColor":     "#FFA500", //Default -> #FFA500

    "hpColor":          "#FF0000", //Default -> #FF0000
    "energyColor":      "#0000FF", //Default -> #0000FF
    "upgradeColor":     "#00FF00", //Default -> #00FF00
    "voidUpgradeColor": "#272727", //Default -> #272727

    "canBuyColor":      "#00FF00", //Default -> #00FF00
    "cantBuyColor":     "#999999", //Default -> #999999
    "needMoreColor":    "#FF0000", //Default -> #00FF00

    "timerGradient": false
};

//Data from server
var firstData = false;
var map;
var players;
var game;
var shop;
var battleLog;
var activeAttacks;
var me = {
    "token": "",
    "loc": []
};

//Data for server
var name = "";

setTimeout(function() {
    screenResize();
    $("#monitor").mousemove(function(e){handleMousemove(e);});
    $("#monitor").mouseout(function(e){handleMouseout(e);});
    $("#monitor").mousedown(function(e){handleMousedown(e);});
    $("#sidebar").mousedown(function(e){handleMousedown2(e);});
    window.addEventListener('keydown',function(e){handleKeydown(e)},false);

    //See if colors can be loaded
    var temp = JSON.parse(localStorage.getItem('savedColors'));
    if(temp!=null) colors = temp;
    else colors = colorsDefault;
    $("body").css("background-color",colors.hudBackColor);

    setInterval(function(){radarAngle=radarAngle+radarINC}, radarTick);

    drawMonitor();
},2);

function init(){
    //get data
    if(name==='') name = "random";

    $.get("/new_user/"+name, function( data ) {
        gameStart = false;
        me.token = data.token;
        map = data.map;
        console.log("token: "+me.token);
        document.cookie = "token="+data.token+"; expires=Mon, 30 Dec 2019 12:00:00 UTC; path=/";

        setInterval(function(){newData();},tick);
    });
}

//******************************************************************************
// Server Calls Functions
//******************************************************************************
function newData(){
    $.get("/data/"+me.token, function( data ) {
        //console.log(data);
        me = data.user;
        players = data.players;
        map = data.map;
        game = data.game;
        shop = data.shop;
        battleLog = data.user.battleLog;
        activeAttacks = data.user.activeAttacks;

        firstData = true;

        //Update Tabs
        baseStore = [
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
        ];
        tabs = [
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
                }
            ],
            [
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
                }
            ]
        ];

        //Check for screen resize
        if($( document ).width()!=prevWid) screenResize();

        drawMonitor();
        drawTimer();
        drawSideBar();
    });

    blink = !blink;
}

function updateQueue(action){
    var dat = {
        "token": me.token,
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
            // console.log('Add Project Error: ' + error.message);
        }
    });
}

function requestRespawn(){
    var dat = {
        "token": me.token
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
            // console.log('Add Project Error: ' + error.message);
        }
    });
}

function makePurchase(item){
    var dat = {
        "token": me.token,
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
            // console.log('Add Project Error: ' + error.message);
        }
    });
}

function changeLoadout(slot,item){
    var dat = {
        "token": me.token,
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
            // console.log('Add Project Error: ' + error.message);
        }
    });
}


//******************************************************************************
// Drawing Canvas Functions
//******************************************************************************
function drawMonitor(){
    var c = document.getElementById("monitor");
    var ctx = c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);

    var tileSize = c.width/(!gameStart?me.stats.radar:9);

    //GridLines
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudColor;
    for(var i = 0; i < 5; i++){
        ctx.beginPath();
        ctx.arc(c.width/2,c.height/2,90+i*70,0,2*Math.PI);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(c.width/2,0);
    ctx.lineTo(c.width/2,c.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0,c.height/2);
    ctx.lineTo(c.width,c.height/2);
    ctx.stroke();

    if(gameStart){
        ctx.beginPath();
        ctx.strokeStyle=colors.hudColor;
        ctx.fillStyle=colors.hudBackColor;
        ctx.globalAlpha = 1.0;
        ctx.strokeRect(c.width/8,c.height/4,3*c.width/4,c.height/8);
        ctx.fillRect(c.width/8,c.height/4,3*c.width/4,c.height/8);
        ctx.stroke();

        //Store Labels
        ctx.fillStyle=colors.hudColor;
        ctx.font = "30px Courier";
        ctx.fillText("Enter Name: "+name,c.width/8+35,c.height/4+60);
    }
    else if(mapView){
        drawMap();
    }
    else{
        //Draw map
        var mid = parseInt(me.stats.radar/2);
        for(var x = 0; x < me.stats.radar; x++){
            for(var y = 0; y < me.stats.radar; y++){
                var cX = me.loc[0] - (mid-x);
                var cY = me.loc[1] - (mid-y);

                if(cX < 0) cX += map.length;
                if(cY < 0) cY += map.length;
                if(cX >= map.length) cX -= map.length;
                if(cY >= map.length) cY -= map.length;

                if(map[cX][cY]==="ROCK"){ //Rock
                    ctx.beginPath();
                    ctx.fillStyle= colors.rockColor;
                    ctx.fillRect(x*tileSize+tileSize/2-tileSize*.4,y*tileSize+tileSize/2-tileSize*.4,tileSize*.8,tileSize*.8);
                    ctx.stroke();
                }
                else if(map[cX][cY]=="GOLD"){ //Treasure
                    ctx.beginPath();
                    ctx.fillStyle=colors.goldColor;
                    ctx.arc(x*tileSize+tileSize/2-tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x*tileSize+tileSize/2+tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x*tileSize+tileSize/2,y*tileSize+tileSize/2-tileSize/4+tileSize/10,tileSize/6,0,2*Math.PI);
                    ctx.fill();
                }
                else if(map[cX][cY]=="IRON"){ //Iron
                    ctx.beginPath();
                    ctx.fillStyle=colors.ironColor;
                    ctx.arc(x*tileSize+tileSize/2-tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x*tileSize+tileSize/2+tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x*tileSize+tileSize/2,y*tileSize+tileSize/2-tileSize/4+tileSize/10,tileSize/6,0,2*Math.PI);
                    ctx.fill();
                }
                else if(map[cX][cY]=="URANIUM"){ //Uranium
                    ctx.beginPath();
                    ctx.fillStyle=colors.uraniumColor;
                    ctx.arc(x*tileSize+tileSize/2-tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x*tileSize+tileSize/2+tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x*tileSize+tileSize/2,y*tileSize+tileSize/2-tileSize/4+tileSize/10,tileSize/6,0,2*Math.PI);
                    ctx.fill();
                }

                //Attack range
                if(me.stats.radar>11 && (mid-x)==5 && (mid-y)==5){
                    ctx.beginPath();
                    ctx.strokeStyle= colors.attackColor;
                    ctx.strokeRect(x*tileSize, x*tileSize, 11*tileSize, (11)*tileSize);
                    ctx.fill();
                }

            }
        }

        //Draw Known Traps
        for(var tr in me.knownTraps){
            var range = me.stats.radar;
            var t = parseInt(range/2);
            var xAdj = t-me.loc[0], yAdj = t-me.loc[1];
            var cX = (me.knownTraps[tr].loc[0] + xAdj)%map.length, cY = (me.knownTraps[tr].loc[1] + yAdj)%map.length;

            // if(cX<0)cX+=map.length;
            // if(cY<0)cY+=map.length;

            //Draw Zone
            ctx.beginPath();
            ctx.globalAlpha = 0.3;
            if(me.knownTraps[tr].owned) ctx.fillStyle = colors.hudColor;
            else ctx.fillStyle = colors.trapColor;

            if(me.knownTraps[tr].lvl==1)
                ctx.fillRect(cX*tileSize, cY*tileSize, 2*tileSize, 2*tileSize);
            else
                ctx.fillRect(cX*tileSize-tileSize, cY*tileSize-tileSize, 3*tileSize, 3*tileSize);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        //Draw shops
        ctx.fillStyle=colors.shopColor;
        for(var i = 0; i < shop.shops.length; i++){
            var sloc = shop.shops[i].loc;

            var t = parseInt(me.stats.radar/2);
            var xAdj = t-me.loc[0], yAdj = t-me.loc[1];
            var cX = (sloc[0] + xAdj)%map.length, cY = (sloc[1] + yAdj)%map.length;

            if(shop.shops[i].type==="SHOP"){ //Shop
                //Draw Safe Zone
                ctx.beginPath();
                ctx.globalAlpha = 0.3;
                ctx.fillRect(cX*tileSize-tileSize, cY*tileSize-tileSize, 3*tileSize, 3*tileSize);
                ctx.fill();

                if(cX<0)cX+=map.length;
                if(cY<0)cY+=map.length;

                //Draw Shop
                ctx.beginPath();
                ctx.globalAlpha = 1.0;
                ctx.save();
                ctx.translate(cX*tileSize+tileSize/2, cY*tileSize+tileSize/2);
                ctx.rotate(Math.PI / 4);
                ctx.translate(-(tileSize/2 / 2), -(tileSize/2 / 2));
                ctx.fillRect(0,0, tileSize/2, tileSize/2);
                ctx.restore();
                ctx.fill();

            }
            else if(shop.shops[i].type==="SSHOP"){ //Super Shop
                //Draw Safe Zone
                ctx.beginPath();
                ctx.globalAlpha = 0.3;
                ctx.fillRect(cX*tileSize-2*tileSize, cY*tileSize-2*tileSize, 5*tileSize, 5*tileSize);
                ctx.fill();

                if(cX<0)cX+=map.length;
                if(cY<0)cY+=map.length;

                //Draw Super Shop
                ctx.beginPath();
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = colors.shopColor;
                ctx.save();
                ctx.translate(cX*tileSize+tileSize/2, cY*tileSize+tileSize/2);
                ctx.rotate(Math.PI / 4);
                ctx.translate(-(tileSize/2 / 2), -(tileSize/2 / 2));
                ctx.fillRect(0,0, tileSize/2, tileSize/2);
                ctx.restore();
                ctx.fillRect(cX*tileSize+tileSize/4,cY*tileSize+tileSize/4, tileSize/2, tileSize/2);
                ctx.fill();

            }

        }

        //Draw enemy Ships
        ctx.strokeStyle=colors.enemyColor;
        ctx.fillStyle=colors.enemyColor;
        for(var i = 0; i < players.length; i++){
            var eloc = players[i].loc; //Check if same player
            if(!(eloc[0]==me.loc[0] && eloc[1]==me.loc[1] && me.stats.hp>0)){

                var t = parseInt(me.stats.radar/2);
                var xAdj = t-me.loc[0], yAdj = t-me.loc[1];
                var cX = (eloc[0] + xAdj)%map.length, cY = (eloc[1] + yAdj)%map.length;

                if(cX<0)cX+=map.length;
                if(cY<0)cY+=map.length;

                ctx.beginPath();
                ctx.arc(cX*tileSize+tileSize/2,cY*tileSize+tileSize/2,tileSize/5,0,2*Math.PI);
                if(!players[i].stealthed)
                    ctx.fill();
                else
                    ctx.stroke();
                ctx.font = "14px Courier";
                ctx.fillText(players[i].name,cX*tileSize+tileSize/2-(players[i].name.length*4),cY*tileSize+tileSize/2-tileSize/4);
            }
        }

        //Draw enemy Attacks
        ctx.fillStyle = colors.attackColor;
        for(var a = 0; a < activeAttacks.length; a++){
            var t = parseInt(me.stats.radar/2);
            var xAdj = t-me.loc[0], yAdj = t-me.loc[1];
            var cX = (activeAttacks[a][0] + xAdj)%map.length, cY = (activeAttacks[a][1] + yAdj)%map.length;

            if(cX<0)cX+=map.length;
            if(cY<0)cY+=map.length;

            ctx.beginPath();
            ctx.globalAlpha = 0.3;
            ctx.fillRect(cX*tileSize,cY*tileSize,tileSize,tileSize);
            ctx.globalAlpha = 1.0;
            ctx.stroke();
        }

        //Draw Actions
        var atk = 1;
        var actions = [];
        var prevLoc = [me.loc[0],me.loc[1]];
        for(var i = 0; i < me.queue.length; i++){
            if(me.queue[i].type==="ATTACK"){
                actions.push({"type":"ATTACK","loc":me.queue[i].location,"num":atk});
                atk++
            }else if(me.queue[i].type==="CANNON"){
                actions.push({"type":"CANNON","loc":me.queue[i].location});
            }else if(me.queue[i].type==="RAILGUN"){
                actions.push({"type":"RAILGUN","loc":prevLoc,"dir":me.queue[i].direction});
            }else if(me.queue[i].type==="BLINK"){
                actions.push({"type":"BLINK","loc":me.queue[i].location});
                prevLoc = me.queue[i].location;
            }else if(me.queue[i].type==="MOVE"){
                var loc;
                if(me.queue[i].direction==="N"){
                    var newY = prevLoc[1] - 1;
                    if(newY<0) newY = map.length-1;
                    loc = [prevLoc[0],newY];
                }else if(me.queue[i].direction==="E"){
                    var newX = prevLoc[0] + 1;
                    if(newX>=map.length) newX = 0;
                    loc = [newX,prevLoc[1]];
                }else if(me.queue[i].direction==="S"){
                    var newY = prevLoc[1] + 1;
                    if(newY>=map.length) newY = 0;
                    loc = [prevLoc[0],newY];
                }else if(me.queue[i].direction==="W"){
                    var newX = prevLoc[0] - 1;
                    if(newX<0) newX = map.length-1;
                    loc = [newX,prevLoc[1]];
                }
                actions.push({"type":"MOVE","loc":loc});
                prevLoc = loc;
            }else if(me.queue[i].type==="LOOT"){
                actions.push({"type":"LOOT","loc":prevLoc});
            }else if(me.queue[i].type==="HOLD"){
                actions.push({"type":"HOLD","loc":prevLoc});
            }else if(me.queue[i].type==="SCAN"){
                drawRadarScan(c, ctx);
            }
        }


        for(var i = 0; i < actions.length; i++){
            var t = parseInt(me.stats.radar/2);
            var xAdj = t-me.loc[0], yAdj = t-me.loc[1];
            var x = (actions[i].loc[0] + xAdj)%map.length, y = (actions[i].loc[1] + yAdj)%map.length;

            if(y<0)x+=map.length;
            if(y<0)x+=map.length;

            if(actions[i].type==="ATTACK"){
                var xSize = 15;
                ctx.beginPath();
                ctx.strokeStyle = colors.attackColor;
                ctx.fillStyle = colors.attackColor;
                ctx.moveTo(x*tileSize+xSize,y*tileSize+xSize);
                ctx.lineTo((x+1)*tileSize-xSize,(y+1)*tileSize-xSize);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo((x+1)*tileSize-xSize,y*tileSize+xSize);
                ctx.lineTo(x*tileSize+xSize,(y+1)*tileSize-xSize);
                ctx.stroke();
                ctx.font = "14px Courier";
                ctx.fillText(""+actions[i].num,x*tileSize+6,y*tileSize+actions[i].num*15);
            }else if(actions[i].type==="MOVE"){
                ctx.beginPath();
                ctx.fillStyle = colors.moveColor;
                ctx.globalAlpha = 0.4;
                ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
                ctx.globalAlpha = 1.0;
                ctx.stroke();
            }else if(actions[i].type==="BLINK"){
                ctx.beginPath();
                ctx.fillStyle = colors.moveColor;
                ctx.globalAlpha = 0.4;
                ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
                ctx.globalAlpha = 1.0;
                ctx.stroke();
            }else if(actions[i].type==="LOOT"){
                ctx.beginPath();
                ctx.fillStyle = colors.lootColor;
                ctx.globalAlpha = 0.4;
                ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
                ctx.globalAlpha = 1.0;
                ctx.stroke();
            }else if(actions[i].type==="CANNON"){
                var size = (me.stats.cannon>1?5:3);
                ctx.beginPath();
                ctx.fillStyle = colors.abilityColor;
                ctx.globalAlpha = 0.4;
                ctx.fillRect(x*tileSize-parseInt(size/2)*tileSize,y*tileSize-parseInt(size/2)*tileSize,tileSize*size,tileSize*size);
                ctx.globalAlpha = 1.0;
                ctx.stroke();
            }else if(actions[i].type==="RAILGUN"){
                ctx.beginPath();
                ctx.fillStyle = colors.abilityColor;
                ctx.globalAlpha = 0.4;
                if(actions[i].dir==="N"){ //N
                    ctx.fillRect(x*tileSize,0,tileSize,c.height/2-tileSize/2);
                }else if(actions[i].dir==="E"){ //E
                    ctx.fillRect(x*tileSize+tileSize,y*tileSize,c.width/2-tileSize/2,tileSize);
                }else if(actions[i].dir==="S"){ //S
                    ctx.fillRect(x*tileSize,y*tileSize+tileSize,tileSize,c.height/2-tileSize/2);
                }else if(actions[i].dir==="W"){ //W
                    ctx.fillRect(0,y*tileSize,c.width/2-tileSize/2,tileSize);
                }
                ctx.globalAlpha = 1.0;
                ctx.stroke();
            }
            // else if(actions[i].type==="HOLD"){
            //     ctx.beginPath();
            //     ctx.fillStyle = colors.holdColor;
            //     ctx.globalAlpha = 0.4;
            //     ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
            //     ctx.globalAlpha = 1.0;
            //     ctx.stroke();
            // }
        }

        //Draw my ship
        ctx.beginPath();
        if(me.stats.hp>0){
            ctx.fillStyle=colors.hudColor;
            ctx.strokeStyle=colors.hudColor;
            ctx.arc(c.width/2,c.height/2,tileSize/5,0,2*Math.PI);
            if(me.info.stealthed)
                ctx.stroke();
            else
                ctx.fill();
        }
        else{
            ctx.fillStyle=colors.enemyColor;
            ctx.font = "40px Courier";
            ctx.fillText("YOU ARE DEAD",c.width/2-130,c.height/2);
            ctx.fillText("Press 'y' to Respawn",c.width/2-220,c.height/2+50);
        }

        //Let them know they can access the Store
        if(shop.withinShop!=null){
            ctx.fillStyle = colors.shopColor;
            ctx.font = "20px Courier";
            ctx.fillText("Press 'o' to open shop menu",c.width/2-150,c.height/2-50);
        }


        //Draw shop Screen
        if(shopMode && shop.withinShop=="SHOP"){
            drawShopMenu(c, ctx);
        }
        else if(shopMode && shop.withinShop=="SSHOP"){
            drawSShopMenu(c, ctx);
        }

        //Draw grid hover
        else if(mX > -1 && mY > -1 && mX < c.width && mY < c.height && !settingsView){
            ctx.beginPath();
            if(displayBlink || displayCannon || displayRailgun){
                ctx.strokeStyle = colors.abilityColor;
                ctx.fillStyle = colors.abilityColor;
            }else{
                ctx.strokeStyle = colors.hudColor;
                ctx.fillStyle = colors.hudColor;
            }
            ctx.beginPath();
            ctx.globalAlpha = 0.3;
            if(displayCannon){
                var size = (me.stats.cannon>1?5:3);
                ctx.fillRect(parseInt(mX/tileSize)*tileSize-parseInt(size/2)*tileSize,parseInt(mY/tileSize)*tileSize-parseInt(size/2)*tileSize,tileSize*size,tileSize*size);
                ctx.globalAlpha = 1.0;
                ctx.strokeRect(parseInt(mX/tileSize)*tileSize,parseInt(mY/tileSize)*tileSize,tileSize,tileSize);
            }
            else if(displayRailgun){
                if(mX>c.width/3 && mX<c.width*2/3 && mY<c.width/2-tileSize/2){ //N
                    ctx.fillRect(c.width/2-tileSize/2,0,tileSize,c.height/2-tileSize/2);
                    railDir = "N";
                }else if(mX>c.width/2+tileSize/2 && mY>c.width/3 && mY<c.width*2/3){ //E
                    ctx.fillRect(c.width/2+tileSize/2,c.height/2-tileSize/2,c.width/2-tileSize/2,tileSize);
                    railDir = "E";
                }else if(mX>c.width/3 && mX<c.width*2/3 && mY>c.width/2+tileSize/2){ //S
                    ctx.fillRect(c.width/2-tileSize/2,c.height/2+tileSize/2,tileSize,c.height/2-tileSize/2);
                    railDir = "S";
                }else if(mX<c.width/2-tileSize/2 && mY>c.width/3 && mY<c.width*2/3){ //W
                    ctx.fillRect(0,c.height/2-tileSize/2,c.width/2-tileSize/2,tileSize);
                    railDir = "W";
                }
            }
            else{
                ctx.fillRect(parseInt(mX/tileSize)*tileSize,parseInt(mY/tileSize)*tileSize,tileSize,tileSize);
            }
            ctx.globalAlpha = 1.0;
            ctx.stroke();

            hover = [parseInt(mX/tileSize),parseInt(mY/tileSize)];
        }

    }

    if(settingsView){
        var hudStart = c.width/6;
        ctx.beginPath();
        ctx.strokeStyle = colors.hudColor;
        ctx.fillStyle = colors.hudBackColor;
        ctx.globalAlpha = 1.0;
        ctx.strokeRect(hudStart,c.height/8,c.width/2,3*c.height/4);
        ctx.fillRect(hudStart,c.height/8,c.width/2,3*c.height/4);
        ctx.stroke();

        //Settings Labels
        ctx.beginPath();
        ctx.fillStyle = colors.hudColor;
        ctx.font = "30px Courier";
        ctx.fillText("Settings",hudStart+5,c.height/8+35);
        ctx.font = "20px Courier";
        ctx.fillText("Click the color to change it.",hudStart+5,c.height/8+55);

        var i = 1;
        ctx.font = "18px Courier";
        for(var property in colors){
            if(colors.hasOwnProperty(property)){
                if(property!=="timerGradient"){
                    ctx.beginPath();
                    ctx.fillStyle = colors.hudColor;
                    ctx.fillText(property,hudStart+20,c.height/8+75+20*i);
                    ctx.strokeStyle = colors.hudColor;
                    ctx.fillStyle = colors[property];
                    ctx.strokeRect(hudStart+350,c.height/8+60+20*i,15,15);
                    ctx.fillRect(hudStart+350,c.height/8+60+20*i,15,15);
                    i++;
                }
            }
        }

        //Draw return to default button
        ctx.fillStyle = colors.hudColor;
        ctx.strokeStyle = colors.hudColor;
        ctx.font = "25px Courier";
        ctx.fillText("Default",hudStart+260,c.height/8+107+20*i);
        ctx.strokeRect(hudStart+255,c.height/8+60+20*i+20,115,40);

        //Controls
        hudStart = 4*c.width/6;
        ctx.beginPath();
        ctx.strokeStyle = colors.hudColor;
        ctx.fillStyle = colors.hudBackColor;
        ctx.globalAlpha = 1.0;
        ctx.strokeRect(hudStart+1,c.height/8,5*c.width/16,c.height/2+20);
        ctx.fillRect(hudStart+1,c.height/8,5*c.width/16,c.height/2+20);
        ctx.fillStyle = colors.hudColor;
        ctx.font = "22px Courier";
        ctx.fillText("Controls",(hudStart)+6,c.height/8+23);
        ctx.font = "16px Courier";
        ctx.fillText("Key     Action   Cost",(hudStart)+6,c.height/8+40);
        ctx.fillText("1     - Scan      [3]",(hudStart)+6,c.height/8+55);
        ctx.fillText("2     - Loot      [2]",(hudStart)+6,c.height/8+70);
        ctx.fillText("3     - Hold      [1]",(hudStart)+6,c.height/8+85);
        ctx.fillText("WASD  - Move      [1]",(hudStart)+6,c.height/8+100);
        ctx.fillText("Click - Attack    [1]",(hudStart)+6,c.height/8+115);
        ctx.fillText("ESC   - Settings  [0]",(hudStart)+6,c.height/8+130);
        ctx.font = "22px Courier";
        ctx.fillText("How to Play",(hudStart)+6,c.height/8+165);
        ctx.font = "16px Courier";
        ctx.fillText("Scan to reveal treasure. ",(hudStart)+6,c.height/8+182);
        ctx.fillText("Move over the treasure to",(hudStart)+6,c.height/8+197);
        ctx.fillText("loot it. Take the gold to",(hudStart)+6,c.height/8+212);
        ctx.fillText("shops to get upgrades.   ",(hudStart)+6,c.height/8+227);
        ctx.fillText("Attack  enemy ships to   ",(hudStart)+6,c.height/8+242);
        ctx.fillText("steal their loot.        ",(hudStart)+6,c.height/8+257);
        ctx.fillText("                         ",(hudStart)+6,c.height/8+272);
        ctx.fillText("You have 3 action slots  ",(hudStart)+6,c.height/8+287);
        ctx.fillText("per round and 3 secs to  ",(hudStart)+6,c.height/8+302);
        ctx.fillText("choose them. All actions ",(hudStart)+6,c.height/8+317);
        ctx.fillText("are done in order at the ",(hudStart)+6,c.height/8+332);
        ctx.fillText("same time as other       ",(hudStart)+6,c.height/8+347);
        ctx.fillText("players. Priority order  ",(hudStart)+6,c.height/8+362);
        ctx.fillText("goes:                    ",(hudStart)+6,c.height/8+377);
        ctx.fillText(" MOVE->ATTACK->LOOT->SCAN",(hudStart)+6,c.height/8+392);
        ctx.fillText("                         ",(hudStart)+6,c.height/8+407);
        ctx.stroke();
    }

    //Draw Version and Author info
    ctx.beginPath();
    ctx.fillStyle = colors.hudColor;
    ctx.font = "12px Courier";
    ctx.fillText("Made by Xazaviar",0,c.height-15);
    if(game!=null)
        ctx.fillText(game.version,0,c.height-30);
    if(gameStart)
        ctx.fillText("press 'esc' for settings",c.width-175,c.height-15);

}

function drawTimer(){
    var c = document.getElementById("timer");
    var ctx = c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);

    if(game.phase==0){
        ctx.beginPath();
        ctx.fillStyle = colors.hudColor;
        ctx.fillRect(50,27,c.width-100,5);
        if(colors.timerGradient)
            if(game.countdown>50){ //green -> yellow
                ctx.fillStyle="rgb("+parseInt(255-((game.countdown-50)/50)*255)+","+255+",0)";
            }else{ //Yellow -> red
                ctx.fillStyle="rgb("+255+","+parseInt(255-((50-game.countdown)/50)*255)+",0)";
            }
        else {
            ctx.fillStyle = colors.hudColor;
        }

        var x = ((100-game.countdown)*(.01*(c.width-100)));
        ctx.fillRect(50+x,10,c.width-100-x,40);
        ctx.fillStyle = colors.hudColor;
        ctx.fillRect(50,10,4,40);
        ctx.fillRect(c.width-50,10,4,40);
    }else{
        ctx.beginPath();
        ctx.fillStyle = colors.hudColor;
        ctx.font = "45px Courier";
        ctx.fillText("Performing Action "+game.phase,c.width/2-240,40);
    }



}

function drawSideBar(){
    var c = document.getElementById("sidebar");
    var ctx = c.getContext("2d");
    ctx.globalAlpha = 1.0;
    ctx.clearRect(0,0,c.width,c.height);
    ctx.beginPath();
    ctx.strokeStyle = colors.hudColor;
    ctx.strokeRect(0,0,c.width,c.height);

    //Queue
    ctx.beginPath();
    ctx.fillStyle=colors.hudColor;
    ctx.font = "30px Courier";
    ctx.fillText("Action Queue",40,45);

    //Queue Card
    //**************************************************************************
    for(var i = 0; i < me.queue.length; i++){
        var text;
        if(me.queue[i].type==="MOVE"){
            ctx.fillStyle = colors.moveColor;
            text = "MOVE "+me.queue[i].direction;
        }else if(me.queue[i].type==="ATTACK"){
            ctx.fillStyle = colors.attackColor;
            text = "ATTACK ("+me.queue[i].location[0]+", "+me.queue[i].location[1]+")";
        }else if(me.queue[i].type==="SCAN"){
            ctx.fillStyle = colors.scanColor;
            text = "SCAN";
        }else if(me.queue[i].type==="LOOT"){
            ctx.fillStyle = colors.lootColor;
            text = "LOOT";
        }else if(me.queue[i].type==="HOLD"){
            ctx.fillStyle = colors.holdColor;
            text = "HOLD";
        }else if(me.queue[i].type==="QUICKHEAL"){
            ctx.fillStyle = colors.abilityColor;
            text = "SHIP REPAIR";
        }else if(me.queue[i].type==="BLINK"){
            ctx.fillStyle = colors.abilityColor;
            text = "BLINK "+me.queue[i].location;
        }else if(me.queue[i].type==="ENERGY"){
            ctx.fillStyle = colors.abilityColor;
            text = "ENERGY REGEN";
        }else if(me.queue[i].type==="STEALTH"){
            ctx.fillStyle = colors.abilityColor;
            text = "STEALTH";
        }else if(me.queue[i].type==="DESTEALTH"){
            ctx.fillStyle = colors.abilityColor;
            text = "DESTEALTH";
        }else if(me.queue[i].type==="CANNON"){
            ctx.fillStyle = colors.abilityColor;
            text = "CANNON "+me.queue[i].location;
        }else if(me.queue[i].type==="RAILGUN"){
            ctx.fillStyle = colors.abilityColor;
            text = "RAILGUN "+me.queue[i].direction;
        }else if(me.queue[i].type==="TRAP"){
            ctx.fillStyle = colors.abilityColor;
            text = "TRAP";
        }
        ctx.beginPath();
        ctx.fillRect(40,i*45+70,220,35);
        ctx.stroke();

        //Queue Action
        ctx.beginPath();
        ctx.fillStyle = colors.actionTextColor;
        ctx.font = "20px Courier";
        ctx.fillText(text,43,i*45+95);
    }
    for(var i = me.queue.length; i < 3; i++){
        ctx.strokeStyle = colors.hudColor;
        ctx.beginPath();
        ctx.strokeRect(40,i*45+70,220,35);
        ctx.stroke();
    }


    //Stats Card
    //**************************************************************************
    var sCardHei = 220;
    ctx.strokeStyle = colors.hudColor;
    ctx.beginPath();
    ctx.strokeRect(0,sCardHei,c.width,c.height);
    ctx.stroke();
    if(shopMode){
        //Named Stats
        ctx.beginPath();
        ctx.fillStyle = colors.hudColor;
        ctx.font = "40px Courier";
        ctx.fillText("GOLD: ",5,sCardHei+40);
        ctx.fillStyle = colors.goldColor;
        ctx.fillText(me.info.gold+"g",25,sCardHei+85);
        ctx.fillStyle = colors.hudColor;
        ctx.fillText("IRON: ",5,sCardHei+130);
        ctx.fillStyle = colors.ironColor;
        ctx.fillText(+me.info.iron+"i",25,sCardHei+175);
        ctx.fillStyle = colors.hudColor;
        ctx.fillText("URANIUM: ",5,sCardHei+220);
        ctx.fillStyle = colors.uraniumColor;
        ctx.fillText(me.info.uranium+"u/"+me.stats.urCarry+"u",25,sCardHei+265);
    }
    else if(statInfo){
        var cookie = getCookie("token");
        //Named Stats
        ctx.beginPath();
        ctx.fillStyle = colors.hudColor;
        ctx.font = "20px Courier";
        ctx.fillText("ID   : "+me.info.name,5,sCardHei+30);
        ctx.fillText("LOC  : ("+me.loc[0]+", "+me.loc[1]+")",5,sCardHei+60);
        ctx.fillText("GOLD : "+me.info.gold+"g ("+me.info.totalGold+"g)",5,sCardHei+90);
        ctx.fillText("IRON : "+me.info.iron+"i ("+me.info.totalIron+"i)",5,sCardHei+120);
        ctx.fillText("URAN : "+me.info.uranium+"u ("+me.info.totalUranium+"u)",5,sCardHei+150);
        ctx.fillText("KILLS: "+me.info.kills+" | DEATHS: "+me.info.deaths,5,sCardHei+180);
        ctx.fillText("SCANS: "+me.info.scans+" | HAULS: "+me.info.hauls,5,sCardHei+210);
        ctx.fillText("SAVED: "+(cookie!=""?"TRUE":"FALSE"),5,sCardHei+240);

        //Toggle Save button
        ctx.font = "24px Courier";
        ctx.beginPath();
        sCardHei = 500;
        ctx.fillStyle = colors.hudColor;
        ctx.strokeStyle = colors.hudColor;
        ctx.fillText("SAVE?",25,sCardHei);
        ctx.strokeRect(15,sCardHei-25,92,35);

        //HUD button
        ctx.beginPath();
        sCardHei = 500;
        ctx.fillStyle = colors.hudColor;
        ctx.strokeStyle = colors.hudColor;
        ctx.fillText("HUD",220,sCardHei);
        ctx.strokeRect(195,sCardHei-25,92,35);

    }
    else{
        //Named Stats
        ctx.beginPath();
        ctx.fillStyle = colors.hudColor;
        ctx.font = "20px Courier";
        ctx.fillText("LOC : ("+me.loc[0]+", "+me.loc[1]+")",5,sCardHei+30);

        //insured tag
        ctx.font = "18px Courier";
        ctx.beginPath();
        sCardHei = 249;
        if(me.info.hasInsurance){
            ctx.fillStyle = colors.hudColor;
            ctx.strokeStyle = colors.hudColor;
            ctx.fillText("INSURED",195,sCardHei);
        }else{
            ctx.fillStyle = colors.needMoreColor;
            ctx.strokeStyle = colors.needMoreColor;
            ctx.fillText("UNINSURED",185,sCardHei);
        }
        ctx.strokeRect(180,sCardHei-17,107,25);

        //Upgradable Stats
        ctx.font = "20px Courier";
        ctx.fillStyle = colors.hudColor;
        ctx.strokeStyle = colors.hudColor;
        sCardHei = 120;
        //HP and PWR
        ctx.beginPath();
        ctx.fillText("HP  ",5,sCardHei+162);
        ctx.fillText("PWR ",5,sCardHei+202);
        ctx.fillText("UR  ",5,sCardHei+242);
        ctx.fillStyle = colors.hpColor;
        ctx.fillRect(60,sCardHei+145,220*(me.stats.hp/me.stats.hpMAX),20);
        for(var i = 0; i < me.stats.hpUpgradesMAX; i++){
            if(i < me.stats.hpUpgrades) ctx.fillStyle = colors.upgradeColor;
            else ctx.fillStyle = colors.voidUpgradeColor;
            ctx.fillRect(60+i*(220/me.stats.hpUpgradesMAX),sCardHei+167,(220/me.stats.hpUpgradesMAX)-5,5);
        }
        ctx.fillStyle = colors.energyColor;
        ctx.fillRect(60,sCardHei+185,220*(me.stats.energy/me.stats.energyMAX),20);
        for(var i = 0; i < me.stats.energyUpgradesMAX; i++){
            if(i < me.stats.energyUpgrades) ctx.fillStyle = colors.upgradeColor;
            else ctx.fillStyle = colors.voidUpgradeColor;
            ctx.fillRect(60+i*45,sCardHei+207,40,5);
        }
        for(var i = 0; i < me.stats.urCarry; i++){
            if(i < me.info.uranium) ctx.fillStyle = colors.uraniumColor;
            else ctx.fillStyle = "#070707";
            ctx.fillRect(60+i*(220/me.stats.urCarry),sCardHei+225,(220/me.stats.urCarry)-3,20);
        }
        ctx.fillStyle = colors.uraniumColor;
        for(var i = 0; i < me.stats.urCarryUpgradesMAX; i++){
            if(i < me.stats.urCarryUpgrades) ctx.fillStyle = colors.upgradeColor;
            else ctx.fillStyle = colors.voidUpgradeColor;
            ctx.fillRect(60+i*(220/me.stats.urCarryUpgradesMAX),sCardHei+247,(220/me.stats.urCarryUpgradesMAX)-3,5);
        }

        //Ability Boxes
        ctx.beginPath();
        sCardHei = 370;
        if(me.abilitySlots[0].canUse && game.phase==0){
            ctx.fillStyle = colors.hudColor;
            ctx.strokeStyle = colors.hudColor;
        }else{
            ctx.fillStyle = colors.cantBuyColor;
            ctx.strokeStyle = colors.cantBuyColor;
        }
        ctx.strokeRect(80,sCardHei+20,50,50);
        ctx.font = "22px Courier";
        ctx.fillText("Q",99,sCardHei+90);
        ctx.font = "18px Courier";
        if(me.abilitySlots[0].type!=="NONE") ctx.fillText(me.abilitySlots[0].type,82,sCardHei+50);


        if(me.abilitySlots[1].canUse){
            ctx.fillStyle = colors.hudColor;
            ctx.strokeStyle = colors.hudColor;
        }else{
            ctx.fillStyle = colors.cantBuyColor;
            ctx.strokeStyle = colors.cantBuyColor;
        }
        ctx.strokeRect(180,sCardHei+20,50,50);
        if(me.stats.loadoutSize < 2){//If not unlocked
            ctx.beginPath();
            ctx.moveTo(180,sCardHei+20);
            ctx.lineTo(230,sCardHei+70);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(230,sCardHei+20);
            ctx.lineTo(180,sCardHei+70);
            ctx.stroke();
        }
        ctx.font = "22px Courier";
        ctx.fillText("E",199,sCardHei+90);
        ctx.font = "18px Courier";
        if(me.abilitySlots[1].type!=="NONE") ctx.fillText(me.abilitySlots[1].type,182,sCardHei+50);

        //Mode
        sCardHei = 500;
        ctx.beginPath();
        ctx.font = "24px Courier";
        if(me.info.trapped>0){ //Trapped
            ctx.fillStyle=colors.trapColor;
            ctx.fillText("TRAPPED",5,sCardHei);

        }else if(me.info.stealthTime>0){ //stealthed
            ctx.fillStyle=colors.hudColor;
            ctx.fillText("STEALTHED",5,sCardHei);

        }else if(me.info.inCombat>0){ //Combat
            ctx.fillStyle=colors.enemyColor;
            ctx.fillText("IN COMBAT",5,sCardHei);

        }else{ //Exploring
            ctx.fillStyle=colors.uraniumColor;
            ctx.fillText("EXPLORING",5,sCardHei);
        }

        //Info button
        ctx.beginPath();
        sCardHei = 500;
        ctx.fillStyle = colors.hudColor;
        ctx.strokeStyle = colors.hudColor;
        ctx.fillText("STATS",205,sCardHei);
        ctx.strokeRect(195,sCardHei-25,92,35);

    }


    //Battle Log
    //**************************************************************************
    var bCardHei = 520;
    ctx.strokeStyle = colors.hudColor;
    ctx.beginPath();
    ctx.strokeRect(0,bCardHei,c.width,c.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = colors.hudColor;
    ctx.font = "25px Courier";
    ctx.fillText("Battle Log",0,bCardHei+30);
    ctx.font = "14px Courier";
    for(var i = 0; i < (battleLog.length>26?26:battleLog.length);i++){
        ctx.fillText(battleLog[i],3,bCardHei+45+i*15);
    }

}


//******************************************************************************
// Drawing Helper Functions
//******************************************************************************
function drawMap(){
    var c = document.getElementById("monitor");
    var ctx = c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);

    var tileSize = c.width/map.length;

    for(var x = 0; x < map.length; x++){
        for(var y = 0; y < map.length; y++){
            if(map[x][y]==="ROCK"){ //Rock
                ctx.beginPath();
                ctx.fillStyle= colors.rockColor;
                ctx.fillRect(x*tileSize+tileSize/2-tileSize*.4,y*tileSize+tileSize/2-tileSize*.4,tileSize*.8,tileSize*.8);
                ctx.stroke();
            }
            else if(map[x][y]==="SHOP"){ //Shop

                //Draw Safe Zone
                ctx.beginPath();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = colors.shopColor;
                var sX=(x==0?0:x-1), sY=(y==0?0:y-1);
                var eX=(x==me.stats.radar-1?me.stats.radar:x+1);
                var eY=(y==me.stats.radar-1?me.stats.radar:y+1);

                ctx.fillRect(sX*tileSize, sY*tileSize, (eX-sX+1)*tileSize, (eY-sY+1)*tileSize);
                ctx.fill();

                //Draw Shop
                ctx.beginPath();
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = colors.shopColor;
                ctx.save();
                ctx.translate(x*tileSize+tileSize/2, y*tileSize+tileSize/2);
                ctx.rotate(Math.PI / 4);
                ctx.translate(-(tileSize/2 / 2), -(tileSize/2 / 2));
                ctx.fillRect(0,0, tileSize/2, tileSize/2);
                ctx.restore();
                ctx.fill();

            }
            else if(map[x][y]==="SSHOP"){ //Super Shop

                //Draw Safe Zone
                ctx.beginPath();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = colors.shopColor;
                var sX=(x==0?0:x-2), sY=(y==0?0:y-2);
                var eX=(x==me.stats.radar-2?me.stats.radar:x+2);
                var eY=(y==me.stats.radar-2?me.stats.radar:y+2);

                ctx.fillRect(sX*tileSize, sY*tileSize, (eX-sX+1)*tileSize, (eY-sY+1)*tileSize);
                ctx.fill();

                //Draw Super Shop
                ctx.beginPath();
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = colors.shopColor;
                ctx.save();
                ctx.translate(x*tileSize+tileSize/2, y*tileSize+tileSize/2);
                ctx.rotate(Math.PI / 4);
                ctx.translate(-(tileSize/2 / 2), -(tileSize/2 / 2));
                ctx.fillRect(0,0, tileSize/2, tileSize/2);
                ctx.rotate(3*Math.PI / 4);
                ctx.restore();
                ctx.fillRect(x*tileSize+tileSize/4,y*tileSize+tileSize/4, tileSize/2, tileSize/2);
                ctx.fill();

            }
            else if(map[x][y]=="GOLD"){ //Treasure
                ctx.beginPath();
                ctx.fillStyle=colors.goldColor;
                ctx.arc(x*tileSize+tileSize/2-tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2+tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2,y*tileSize+tileSize/2-tileSize/4+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();
            }
            else if(map[x][y]=="IRON"){ //Iron
                ctx.beginPath();
                ctx.fillStyle=colors.ironColor;
                ctx.arc(x*tileSize+tileSize/2-tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2+tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2,y*tileSize+tileSize/2-tileSize/4+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();
            }
            else if(map[x][y]=="URANIUM"){ //Uranium
                ctx.beginPath();
                ctx.fillStyle=colors.uraniumColor;
                ctx.arc(x*tileSize+tileSize/2-tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2+tileSize/8,y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2,y*tileSize+tileSize/2-tileSize/4+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();
            }

            //Draw me
            if(me.loc[0]==x && me.loc[1]==y && me.stats.hp>0){
                if(blink){
                    ctx.beginPath();
                    ctx.fillStyle = colors.hudColor;
                    ctx.strokeStyle = colors.hudColor;
                    ctx.arc(x*tileSize+tileSize/2,y*tileSize+tileSize/2,tileSize/4,0,2*Math.PI);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.globalAlpha = 0.3;
                    ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
                    ctx.globalAlpha = 1.0;
                    ctx.stroke();
                }
            }
        }
    }

    ctx.fillStyle=colors.enemyColor;
    for(var i = 0; i < players.length; i++){
        var eloc = players[i].loc; //Check if same player
        if(!(eloc[0]==me.loc[0] && eloc[1]==me.loc[1] && me.stats.hp>0)){
            ctx.beginPath();
            ctx.arc(eloc[0]*tileSize+tileSize/2,eloc[1]*tileSize+tileSize/2,tileSize/5,0,2*Math.PI);
            ctx.fill();
        }
    }
}

function drawShopMenu(c, ctx){
    ctx.beginPath();
    ctx.strokeStyle=colors.hudColor;
    ctx.fillStyle=colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    var startX = c.width/6;
    var startY = c.height/4;
    ctx.strokeRect(startX,startY,c.width-startX*2,c.height-startY*2);
    ctx.fillRect(startX,startY,c.width-startX*2,c.height-startY*2);
    ctx.stroke();

    //Store Labels
    ctx.fillStyle=colors.hudColor;
    ctx.font = "40px Courier";
    ctx.fillText("Store",startX+5,startY+45);

    ctx.font = "18px Courier";
    ctx.fillText("Press the key to do the following",startX+5,startY+85);

    var i = 0;
    for(; i < baseStore.length; i++){
        if(baseStore[i].canBuy && !canPurchase(baseStore[i].price, {"gold":me.info.gold,"iron":me.info.iron,"uranium":me.info.uranium})) ctx.fillStyle=colors.needMoreColor;
        else if(baseStore[i].canBuy) ctx.fillStyle=colors.canBuyColor;
        else ctx.fillStyle=colors.cantBuyColor;
        ctx.fillText(" "+(i+1)+" : "+baseStore[i].label,startX+5,startY+110+25*i);
        if(baseStore[i].canBuy && me.info.gold < baseStore[i].price.gold) ctx.fillStyle=colors.needMoreColor;
        else if(baseStore[i].canBuy) ctx.fillStyle=colors.canBuyColor;
        ctx.fillText(baseStore[i].price.gold+"g",c.width-startX-140,startY+110+25*i);
        if(baseStore[i].canBuy && me.info.iron < baseStore[i].price.iron) ctx.fillStyle=colors.needMoreColor;
        else if(baseStore[i].canBuy) ctx.fillStyle=colors.canBuyColor;
        ctx.fillText(baseStore[i].price.iron+"i",c.width-startX-68,startY+110+25*i);
        if(baseStore[i].canBuy && me.info.uranium < baseStore[i].price.uranium) ctx.fillStyle=colors.needMoreColor;
        else if(baseStore[i].canBuy) ctx.fillStyle=colors.canBuyColor;
        ctx.fillText(baseStore[i].price.uranium+"u",c.width-startX-30,startY+110+25*i);

        //upgrade bars
        for(var u = 0; u < baseStore[i].maxLvl; u++){
            if(u < baseStore[i].level) ctx.fillStyle = colors.upgradeColor;
            else ctx.fillStyle = colors.voidUpgradeColor;
            ctx.fillRect(c.width-startX-250+u*10,startY+95+i*25,5,20);
        }
    }
    // ctx.fillStyle=colors.hudColor;
    // ctx.fillText("esc: Exit Store",startX+5,startY+110+25*i);

}

function drawSShopMenu(c, ctx){
    ctx.beginPath();
    ctx.strokeStyle=colors.hudColor;
    ctx.fillStyle=colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    var startX = c.width/8;
    var startY = c.height/4;
    ctx.strokeRect(startX,startY,3*c.width/4,c.height/2);
    ctx.fillRect(startX,startY,3*c.width/4,c.height/2);
    ctx.stroke();


    //Tab contents
    //0 - combat
    //1 - travel
    //2 - util
    //3 - static
    //4 - other
    //5 - loadout

    ctx.strokeStyle=colors.hudColor;
    ctx.fillStyle=colors.hudBackColor;
    ctx.font = "18px Courier";
    for(var i = 0; i < tabs.length+1; i++){
        ctx.beginPath();
        var tHei = 60;//(c.height/2)/(tabs.length+1);
        if(i==cTab) ctx.fillStyle=colors.hudColor;
        else ctx.fillStyle=colors.hudBackColor;
        ctx.strokeRect(c.width-startX+1,startY+tHei*i,25,tHei);
        ctx.fillRect(c.width-startX+1,startY+tHei*i,25,tHei);

        if(i==cTab) ctx.fillStyle=colors.hudBackColor;
        else ctx.fillStyle=colors.hudColor;
        ctx.fillText((i==tabs.length?"LO":"T"+(i+1)),c.width-startX+3,startY+35+tHei*i);
        ctx.stroke();
    }

    //Draw Shop Tab Contents
    if(cTab < 5 && cTab > -1){
        //Store Labels
        ctx.fillStyle=colors.hudColor;
        ctx.font = "40px Courier";
        ctx.fillText("Special Store",startX+5,startY+45);

        ctx.font = "18px Courier";
        ctx.fillText("Press the key to do the following",startX+5,startY+85);

        for(var i = 0; i < tabs[cTab].length; i++){
            ctx.beginPath();
            if(tabs[cTab][i].canBuy && !canPurchase(tabs[cTab][i].price, {"gold":me.info.gold,"iron":me.info.iron,"uranium":me.info.uranium})) ctx.fillStyle=colors.needMoreColor;
            else if(tabs[cTab][i].canBuy) ctx.fillStyle=colors.canBuyColor;
            else ctx.fillStyle=colors.cantBuyColor;
            ctx.fillText(" "+(i+1)+": "+tabs[cTab][i].label,startX+5,startY+110+i*25);
            if(tabs[cTab][i].canBuy && me.info.gold < tabs[cTab][i].price.gold) ctx.fillStyle=colors.needMoreColor;
            else if(tabs[cTab][i].canBuy) ctx.fillStyle=colors.canBuyColor;
            ctx.fillText(tabs[cTab][i].price.gold+"g",c.width-startX-140,startY+110+i*25);
            if(tabs[cTab][i].canBuy && me.info.iron < tabs[cTab][i].price.iron) ctx.fillStyle=colors.needMoreColor;
            else if(tabs[cTab][i].canBuy) ctx.fillStyle=colors.canBuyColor;
            ctx.fillText(tabs[cTab][i].price.iron+"i",c.width-startX-68,startY+110+i*25);
            if(tabs[cTab][i].canBuy && me.info.uranium < tabs[cTab][i].price.uranium) ctx.fillStyle=colors.needMoreColor;
            else if(tabs[cTab][i].canBuy) ctx.fillStyle=colors.canBuyColor;
            ctx.fillText(tabs[cTab][i].price.uranium+"u",c.width-startX-30,startY+110+i*25);

            //upgrade bars
            for(var u = 0; u < tabs[cTab][i].maxLvl; u++){
                if(u < tabs[cTab][i].level) ctx.fillStyle = colors.upgradeColor;
                else ctx.fillStyle = colors.voidUpgradeColor;
                ctx.fillRect(c.width-startX-200+u*10,startY+95+i*25,5,20);
            }
        }
    }
    else if(cTab > -1){
        //Edit Loadout Labels
        ctx.beginPath();
        ctx.fillStyle=colors.hudColor;
        ctx.strokeStyle=colors.hudColor;
        ctx.font = "40px Courier";
        ctx.fillText("Loadout",startX+5,startY+45);

        ctx.font = "18px Courier";
        ctx.fillText("Hover over option and press Q or E to equip item.",startX+5,startY+85);

        //Selection Boxes
        ctx.font = "22px Courier";
        ctx.fillText("SLOTS",startX+45,startY+185);
        ctx.strokeRect(startX+15,startY*2+20,50,50);
        ctx.strokeRect(startX+90,startY*2+20,50,50);
        //If not unlocked
        if(me.stats.loadoutSize < 2){
            ctx.beginPath();
            ctx.moveTo(startX+90,startY*2+20);
            ctx.lineTo(startX+140,startY*2+70);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(startX+140,startY*2+20);
            ctx.lineTo(startX+90,startY*2+70);
            ctx.stroke();
        }
        ctx.fillText("Q",startX+35,startY*2+90);
        ctx.fillText("E",startX+107,startY*2+90);
        ctx.font = "18px Courier";
        if(me.abilitySlots[0].type!=="NONE") ctx.fillText(me.abilitySlots[0].type,startX+17,startY*2+50);
        if(me.abilitySlots[1].type!=="NONE") ctx.fillText(me.abilitySlots[1].type,startX+92,startY*2+50);

        ctx.stroke();

        //line
        ctx.beginPath();
        ctx.moveTo(startX+150,startY+120);
        ctx.lineTo(startX+150,startY+c.height/2);
        ctx.stroke();

        //Options
        ctx.font = "22px Courier";
        for(var i = 0; i < me.storage.length; i++){
            ctx.strokeRect(startX+170+70*(i%6),startY+130+70*parseInt(i/6),60,60);
            ctx.fillText(me.storage[i].name,startX+170+70*(i%6)+3,startY+130+70*parseInt(i/6)+35);
        }
    }
}


//******************************************************************************
// Event Handler Functions
//******************************************************************************
function handleKeydown(e){
    // alert(e.keyCode);

    //Move Actions
    if (e.keyCode == 27 && !shopMode){ //Open Menu (esc)
        settingsView = !settingsView;
        if(!settingsView)
            $(".modal").toggle(false);
        drawMonitor();

    }
    else if(e.keyCode == 73){  //i
        statInfo = !statInfo;
    }
    else if(gameStart){
        if(e.keyCode == 13){
            init();
        }else if(e.keyCode == 8){ //backspace
            name = name.substring(0,name.length-1);
        }else if(((e.keyCode > 47 && e.keyCode < 91) || e.keyCode == 32) && name.length < 16){ //number and letter
            if(e.shiftKey)
                name = name+""+String.fromCharCode(e.keyCode).toUpperCase();
            else
                name = name+""+String.fromCharCode(e.keyCode).toLowerCase();
        }else if((e.keyCode > 185) && name.length < 16){
            // console.log(e.keyCode);
            name = name+""+String.fromCharCode(e.charCode);
        }
        drawMonitor();
    }
    else if(e.keyCode == 77 && !settingsView){  //M
        mapView = !mapView;
        shopMode = false;
    }
    else if(e.keyCode == 77 && mapView){  //M
        mapView = false;
        shopMode = false;
        settingsView = false;
    }
    else if(!shopMode && !mapView && game.phase==0){
        if(e.keyCode == 65 || e.keyCode == 37){        //A
            updateQueue({"type":"MOVE","direction":"W"});
        }else if(e.keyCode == 68 || e.keyCode == 39){  //D
            updateQueue({"type":"MOVE","direction":"E"});
        }else if(e.keyCode == 87 || e.keyCode == 38){  //W
            updateQueue({"type":"MOVE","direction":"N"});
        }else if(e.keyCode == 83 || e.keyCode == 40){  //S
            updateQueue({"type":"MOVE","direction":"S"});
        }else if(e.keyCode == 72 || e.keyCode == 49){  //H or 1
            updateQueue({"type":"SCAN"});
        }else if(e.keyCode == 76 || e.keyCode == 50){  //L or 2
            updateQueue({"type":"LOOT"});
        }else if(e.keyCode == 32 || e.keyCode == 51){  //Space or 3
            updateQueue({"type":"HOLD"});
        }else if(e.keyCode == 89 && me.stats.hp == 0){  //Y
            requestRespawn();
        }else if(e.keyCode == 79 && shop.withinShop!=null && !settingsView){  //O
            shopMode = true;
            mapView = false;
        }else if(e.keyCode == 81){          //Q
            doSpecialAction(0);
        }else if(e.keyCode == 69){          //E
            doSpecialAction(1);
        }
    }
    else if(shopMode){
        if(e.keyCode == 79 || e.keyCode == 27){  //O or escape
            shopMode = false;
        }
        if(shop.withinShop==="SHOP"){
            for(var i = 0; i < baseStore.length; i++){
                if(e.keyCode == 49+i){
                    makePurchase(baseStore[i].pLabel);
                    break;
                }
            }
        }
        else if(shop.withinShop==="SSHOP"){
            if(cTab > -1 && cTab < 5) //In shop
                for(var i = 0; i < tabs[cTab].length; i++){
                    if(e.keyCode == 49+i){
                        makePurchase(tabs[cTab][i].pLabel);
                        break;
                    }
                }
            else{ //In load out
                var c = document.getElementById("monitor");
                var startX = c.width/8;
                var startY = c.height/4;
                var i;
                for(i = 0; i < me.storage.length; i++){
                    if(mX > startX+170+70*(i%6) && mX < startX+170+70*(i%6) + 60 &&
                       mY > startY+130+70*parseInt(i/6) && mY < startY+130+70*parseInt(i/6)+60){
                           break;
                       }
                }
                if(i < me.storage.length)
                    if(e.keyCode == 81){        //Q
                        changeLoadout(0,me.storage[i].name);
                    }else if(e.keyCode == 69){  //E
                        changeLoadout(1,me.storage[i].name);
                    }
            }
        }
    }
    else if(e.keyCode == 79 && shop.withinShop!=null && !settingsView){  //O
        shopMode = true;
        mapView = false;
    }

}

function handleMousedown(e){
    var c = document.getElementById("monitor");
    if(settingsView){

       //Check for color click
       var i = 1;
       var hudStart = c.width/6;
       for(var property in colors){
           if(colors.hasOwnProperty(property)){
               if(property!=="timerGradient"){
                   if(mX >= hudStart+350 && mX <= hudStart+365 && mY >= c.height/8+60+20*i && mY <= (c.height/8+60+20*i+15)){
                       displayModal(colors[property], function(color){
                           colors[property] = color.toHexString();
                           $("body").css("background-color",colors.hudBackColor);
                           saveColorScheme();
                           $(".modal").toggle(false);
                           drawMonitor();
                       });
                       break;
                   }
                   i++;
               }
           }
       }

       //Check for return to default click
       i++;
       if(mX >= hudStart+255 && mX <= hudStart+370 && mY >= c.height/8+60+20*i && mY <= (c.height/8+60+20*i+40)){
           colors = JSON.parse(JSON.stringify(colorsDefault));
           $("body").css("background-color",colors.hudBackColor);
           saveColorScheme();
       }
       //    ctx.strokeRect(c.width/4+255,c.height/8+60+20*i+20,115,40);
    }
    else if(shopMode && shop.withinShop=="SSHOP"){
       //Change tabs
       var startX = c.width/8;
       var startY = c.height/4;

       if(mX > c.width-startX && mX < c.width-startX+25){
           var tHei = 60;
           for(var i = 0; i < tabs.length+1; i++){
               if(mY > startY+tHei*i && mY < startY+tHei*i+tHei){
                   cTab = i;
                   break;
               }
           }
       }

    }
    else if(!gameStart && !mapView && !shopMode){
        var mid = parseInt(me.stats.radar/2);
        var cX = me.loc[0] - (mid-hover[0]);
        var cY = me.loc[1] - (mid-hover[1]);

        if(cX < 0) cX += map.length;
        if(cY < 0) cY += map.length;
        if(cX >= map.length) cX -= map.length;
        if(cY >= map.length) cY -= map.length;
        //console.log(""+cX+", "+cY);

        if(displayCannon){
            displayCannon = false;
            updateQueue({"type":"CANNON","location":[cX, cY]})
        }
        else if(displayRailgun){
            displayRailgun = false;
            updateQueue({"type":"RAILGUN","direction":railDir})
        }
        else if(displayBlink){
            displayBlink = false;
            updateQueue({"type":"BLINK","location":[cX, cY]})
        }
        else
            updateQueue({"type":"ATTACK","location":[cX, cY]})
     }
}

function handleMousemove(e){
    e.preventDefault();
    e.stopPropagation();
    mX = parseInt(e.clientX - offsetX);
    mY = parseInt(e.clientY - offsetY);
    if(!shopMode && !mapView){
        drawMonitor();
    }
}

function handleMouseout(e){
    mX = -1;
    mY = -1;
}

function handleMousedown2(e){
    var cX = parseInt(e.clientX - offsetX2);
    var cY = parseInt(e.clientY - offsetY2);
    if(statInfo){
        //Save button
        if(cX > 15 && cX < 107 && cY > 475 && cY < 510){
            toggleSaving();
        }
        //HUD button
        if(cX > 195 && cX < 287 && cY > 475 && cY < 510){
            statInfo = false;
        }
    }else{
        //STAT button
        if(cX > 195 && cX < 287 && cY > 475 && cY < 510){
            statInfo = true;
        }
    }
}


//******************************************************************************
// Utility Functions
//******************************************************************************
function displayModal(color, _callback){
    var first = false;
    $(".modal").toggle(true);
    $("#custom").off('change.spectrum');
    $(document).off('click');
    $("#custom").spectrum({
        color: color,
        flat: true,
        showInitial: true,
        showPalette: true,
        palette: [ ],
        localStorageKey: "spectrum.homepage"
    });
    $("#custom").on('change.spectrum', function(e, tinycolor) {
        _callback(tinycolor);
        $("#custom").off('change.spectrum');
    });
}

function saveColorScheme(){
    localStorage.setItem('savedColors', JSON.stringify(colors));
}

function drawRadarScan(c, ctx){
    var radius = 450;
    ctx.beginPath();
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudColor;
    ctx.moveTo(c.width/2+(radius*Math.cos(radarAngle)),c.height/2+(radius*Math.sin(radarAngle))); //Outer point
    ctx.lineTo(c.width/2,c.height/2); //center
    ctx.stroke();

    //follow Rings
    for(var i = 1; i < radarFollow; i++){
        ctx.beginPath();
        ctx.globalAlpha = 1.0-(1.0/radarFollow)*i;
        ctx.moveTo(c.width/2+(radius*Math.cos(radarAngle-i*(radarINC/2))),c.height/2+(radius*Math.sin(radarAngle-i*(radarINC/2)))); //Outer point
        ctx.lineTo(c.width/2,c.height/2); //center
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}

function canPurchase(costs, inventory){
    if(costs.gold    <= inventory.gold &&
       costs.iron    <= inventory.iron &&
       costs.uranium <= inventory.uranium)
        return true;

    return false;
}

function getCookie(name){
    var cname = name + "=";
    var decodedCookie = decodeURIComponent(document.cookie);

    var ca = decodedCookie.split(";");
    for(var i = 0; i < ca.length; i++){
        var c = ca[i];
        while(c.charAt(0)==' ')
            c.substring(1);

        if(c.indexOf(cname) == 0){
            return c.substring(name.length, c.length);
        }
    }


    return "";
}

function toggleSaving(){
    var cookie = getCookie("token");
    if(cookie===""){
        document.cookie = "token="+me.token+"; expires=Mon, 30 Dec 2019 12:00:00 UTC; path=/";
    }else{
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    }
}

function doSpecialAction(slot){
    if(me.abilitySlots[slot].type==="HEAL" && me.abilitySlots[slot].canUse)
        updateQueue({"type":"QUICKHEAL"});
    if(me.abilitySlots[slot].type==="TRAP" && me.abilitySlots[slot].canUse)
        updateQueue({"type":"TRAP"});
    if(me.abilitySlots[slot].type==="ENG" && me.abilitySlots[slot].canUse)
        updateQueue({"type":"ENERGY"});
    if(me.abilitySlots[slot].type==="HIDE" && me.abilitySlots[slot].canUse)
        updateQueue({"type":"STEALTH"});
    if(me.abilitySlots[slot].type==="CAN" && me.abilitySlots[slot].canUse){
        displayCannon = !displayCannon;
        displayRailgun = false;
        displayBlink = false;
    }
    if(me.abilitySlots[slot].type==="RAIL" && me.abilitySlots[slot].canUse){
        displayCannon = false;
        displayRailgun = !displayRailgun;
        displayBlink = false;
    }
    if(me.abilitySlots[slot].type==="BLNK" && me.abilitySlots[slot].canUse){
        displayCannon = false;
        displayRailgun = false;
        displayBlink = !displayBlink;
    }

}

function screenResize(){
    //place monitor in center
    prevWid = $( document ).width();
    $(".gameScreen").css("margin-left",(prevWid-300-800)/2+"px");

    var $canvas = $("#monitor")
    var canvasOffset = $canvas.offset()
    offsetX = canvasOffset.left;
    offsetY = canvasOffset.top;
    var $canvas2 = $("#sidebar")
    var canvasOffset2 = $canvas2.offset()
    offsetX2 = canvasOffset2.left;
    offsetY2 = canvasOffset2.top;

}
