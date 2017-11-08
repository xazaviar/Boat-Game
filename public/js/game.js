var offsetX;
var offsetY;
var offsetX2;
var offsetY2;
var mX, mY;
var hover = [-1,-1];
var shopMode = false;
var curShopTab = 0;
var gameStart = true;
var settingsView = false;
var radarAngle = 0;
var radarTick = 40;
var radarINC = .1;
var radarAngleChange = true;
var radarFollow = 5;
var mapView = false;
var blink = false;
var chatBlink = true;
var tabs;
var baseStore;
var statInfo = false;
var saveOnStartup = false;

//Auto d/c
var autoDCLimit = 120; //~10 minutes
var autoDCCount = 0;
var intervalTimer;
var tick = 50;
var lastRound = -1;

//Team Data
var joinTeamMenu = false;
var teamRec = [];
var joinTeamHover = -1;
var joinTeamScroll = 0;

var createTeamMenu = false;
var tName = '';
var bColor = "#00FF00", aColor = "#FFFFFF", bShape = "DIAMOND";
var createTeamHover = -1;
var createTeamError = "";

var confirmDialog = -1;
var confirmHover = -1;
var valueLock = -1;

var teamMenu = false;
var teamMenuHover = -1;
var teamSetSaved = false;
var teamScroll = 0;
var curTeamTab = 0;
var curSettings;

//PlayerList
var playerListMenu = false;
var playerListHover = -1;
var playerListScroll = 0

//Chat data
var chatMode = false;
var chatMsg = '';

var errorMsg = '';

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

    "goldColor":        "#DDDD00", //Default -> #DDDD00
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
var shopList;
var teamList;
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
    window.addEventListener('keypress',function(e){handleKeypress(e)},false);
    window.addEventListener('wheel',function(e){handleMouseWheel(e)},false);

    //See if colors can be loaded
    var temp = JSON.parse(localStorage.getItem('savedColors'));
    if(temp!=null) colors = temp;
    else colors = colorsDefault;
    $("body").css("background-color",colors.hudBackColor);

    setInterval(function(){radarAngle=radarAngle+radarINC}, radarTick);
    setInterval(function(){if(chatMode){chatBlink=!chatBlink;} },200);

    $("#color-picker1").hexColorPicker({
        "container":"dialog",
		"colorModel":"hsl",
		"pickerWidth":200,
		"size":6,
		"style":"hex"
    });
    $("#color-picker2").hexColorPicker({
        "container":"dialog",
		"colorModel":"hsl",
		"pickerWidth":200,
		"size":6,
		"style":"hex"
    });

    drawScreen();

    var cookie = getCookie("token")
    if(cookie!=""){
        tokenInit(cookie);
    }

},2);

function tokenInit(token){
    $.get("/returning_user/"+token, function( data ) {
        if(data.error===""){
            console.log("token: "+data.token);
            if(data.token!==undefined){
                me.token = data.token;
                me.id = data.id;
                map = data.map;

                if(saveOnStartup)
                    document.cookie = "token="+data.token+"; expires=Mon, 30 Dec 2019 12:00:00 UTC; path=/";
                gameStart = false;
                intervalTimer = setInterval(function(){newData();},tick);
            }
        }else{
            errorMsg = data.error;
            drawScreen();
        }
    });
}

function init(){
    //get data
    if(name==='') name = "random";

    $.get("/new_user/"+encodeURI(name), function( data ) {
        console.log("token: "+data.token);
        if(data.token!==undefined){
            me.token = data.token;
            me.id = data.id;
            map = data.map;

            if(saveOnStartup)
                document.cookie = "token="+data.token+"; expires=Mon, 30 Dec 2019 12:00:00 UTC; path=/";
            gameStart = false;
            intervalTimer = setInterval(function(){newData();},tick);
        }
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
        shopList = data.shopList;
        teamList = data.teamList;
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

        if(me.info.teamID == -1){
            if(!createTeamMenu)
                joinTeamMenu = true;
        }

        drawScreen();
        drawTimer();
        drawSideBar();


        if(game.phase == 0 && lastRound == 3){
            autoDCCount++;
        }
        lastRound = game.phase;
    });

    blink = !blink;

    if(autoDCCount > autoDCLimit){
        clearInterval(intervalTimer);
        confirmDialog = 3;
        drawScreen();
    }
}

function updateQueue(action){
    var dat = {
        "token": me.token,
        "id": me.id,
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
        "token": me.token,
        "id": me.id
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
        "id": me.id,
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

function sendChatMsg(){
    var dat = {
        "token": me.token,
        "id": me.id,
        "msg": chatMsg
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
            // console.log('Add Project Error: ' + error.message);
        }
    });
}

function removeFromQueue(i){
    var dat = {
        "token": me.token,
        "id": me.id,
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
            // console.log('Add Project Error: ' + error.message);
        }
    });
}

function createTeam(){
    var valid = teamValidation($("#color-picker1").val(),$("#color-picker2").val());
    if(valid==true){
        var dat = {
            "token": me.token,
            "id": me.id,
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
                createTeamHover = -1;
                createTeamMenu = false;
            }
        });
    }else{
        createTeamError = valid;
    }
}

function joinTeam(id, type){
    var dat = {
        "token": me.token,
        "id": me.id,
        "tid": id,
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
            joinTeamMenu = false;
        }
    });
}

function updateTeamSettings(){
    var dat = {
        "token": me.token,
        "id": me.id,
        "settings": curSettings
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
            // console.log('Add Project Error: ' + error.message);
            teamSetSaved = true;
        }
    });
}


//******************************************************************************
// Drawing Canvas Functions
//******************************************************************************
function drawScreen(){
    var c = document.getElementById("monitor");
    var ctx = c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);
    ctx.globalAlpha = 1.0;

    drawMonitor(ctx, 800, 800);
}

function drawMonitor(ctx, width, height){
    var tileSize = width/(!gameStart?me.stats.radar:9);

    if(gameStart){
        drawGridLines(ctx, width, height);
        ctx.beginPath();
        ctx.strokeStyle=colors.hudColor;
        ctx.fillStyle=colors.hudBackColor;
        ctx.globalAlpha = 1.0;
        ctx.strokeRect(width/8,height/4,3*width/4,height/8);
        ctx.fillRect(width/8,height/4,3*width/4,height/8);
        ctx.stroke();


        if(errorMsg!=''){
            ctx.fillStyle=colors.enemyColor;
            ctx.font = "30px Courier";
            ctx.fillText(errorMsg,width/2-120,height/4-40);
        }

        //Text entry area Labels
        ctx.fillStyle=colors.hudColor;
        ctx.font = "30px Courier";
        ctx.fillText("Enter Name: "+name,width/8+35,height/4+60);
    }
    else if(mapView){
        drawMap(ctx, 0, 0, width, height);
    }
    else{
        drawGridLines(ctx, width, height);
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
        for(var i = 0; i < shopList.length; i++){
            var sloc = shopList[i].loc;

            var t = parseInt(me.stats.radar/2);
            var xAdj = t-me.loc[0], yAdj = t-me.loc[1];
            var cX = (sloc[0] + xAdj)%map.length, cY = (sloc[1] + yAdj)%map.length;


            // if(cX<0)cX+=map.length;
            // if(cY<0)cY+=map.length;

            if(shopList[i].type==="SHOP"){ //Shop

                //Draw Safe Zone
                ctx.beginPath();
                ctx.globalAlpha = 0.3;
                ctx.fillRect((cX-1)*tileSize, (cY-1)*tileSize, 3*tileSize, 3*tileSize);
                ctx.fill();

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
            else if(shopList[i].type==="SSHOP"){ //Super Shop

                //Draw Safe Zone
                ctx.beginPath();
                ctx.globalAlpha = 0.3;
                ctx.fillRect((cX-2)*tileSize, (cY-2)*tileSize, 5*tileSize, 5*tileSize);
                ctx.fill();

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

        //Draw player Ships
        ctx.strokeStyle=colors.enemyColor;
        ctx.fillStyle=colors.enemyColor;
        for(var i = 0; i < players.length; i++){
            if(typeof players[i].loc !== "undefined"){
                var eloc = players[i].loc; //Check if same player
                if(!(eloc[0]==me.loc[0] && eloc[1]==me.loc[1] && me.stats.hp>0)){

                    if(players[i].team==me.info.teamID){
                        ctx.fillStyle=colors.hudColor;
                        ctx.strokeStyle=colors.hudColor;
                    }
                    else {
                        ctx.fillStyle=colors.enemyColor;
                        ctx.strokeStyle=colors.enemyColor;
                    }

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
                drawRadarScan(ctx, width, height);
            }
        }


        for(var i = 0; i < actions.length; i++){
            var t = parseInt(me.stats.radar/2);
            var xAdj = t-me.loc[0], yAdj = t-me.loc[1];
            var x = (actions[i].loc[0] + xAdj)%map.length, y = (actions[i].loc[1] + yAdj)%map.length;

            if(x<0)x+=map.length;
            if(y<0)y+=map.length;

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
                    ctx.fillRect(x*tileSize,0,tileSize,height/2-tileSize/2);
                }else if(actions[i].dir==="E"){ //E
                    ctx.fillRect(x*tileSize+tileSize,y*tileSize,width/2-tileSize/2,tileSize);
                }else if(actions[i].dir==="S"){ //S
                    ctx.fillRect(x*tileSize,y*tileSize+tileSize,tileSize,height/2-tileSize/2);
                }else if(actions[i].dir==="W"){ //W
                    ctx.fillRect(0,y*tileSize,width/2-tileSize/2,tileSize);
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
            ctx.arc(width/2,height/2,tileSize/5,0,2*Math.PI);
            if(me.info.stealthed)
                ctx.stroke();
            else
                ctx.fill();
        }
        else{
            ctx.fillStyle=colors.enemyColor;
            ctx.font = "40px Courier";
            ctx.fillText("YOU ARE DEAD",width/2-130,height/2);
            ctx.fillText("Press 'y' to Respawn",width/2-220,height/2+50);
        }

        //Let them know they can access the Store
        if(shop.withinShop!=null){
            ctx.fillStyle = colors.shopColor;
            ctx.font = "20px Courier";
            ctx.fillText("Press 'o' to open shop menu",width/2-150,height/2-50);
        }


        //Draw shop Screen
        if(shopMode && shop.withinShop=="SHOP"){
            drawShopMenu(ctx, width, height);
        }
        else if(shopMode && shop.withinShop=="SSHOP"){
            drawSShopMenu(ctx, width, height);
        }
        else if(joinTeamMenu){
            drawJoinTeam(ctx, 0, 0, width, height);
        }
        else if(createTeamMenu){
            drawCreateTeam(ctx, 0, 0, width, height);
        }
        else if(teamMenu){
            drawTeamMenu(ctx, 0, 0, width, height);
        }
        else if(playerListMenu){
            drawPlayerList(ctx, 0, 0, width, height)
        }

        //Draw grid hover
        else if(mX > -1 && mY > -1 && mX < width && mY < height && !settingsView){
            ctx.beginPath();
            if(displayBlink || displayCannon || displayRailgun){
                ctx.strokeStyle = colors.abilityColor;
                ctx.fillStyle = colors.abilityColor;
            }
            else{
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
                if(mX>width/3 && mX<width*2/3 && mY<width/2-tileSize/2){ //N
                    ctx.fillRect(width/2-tileSize/2,0,tileSize,height/2-tileSize/2);
                    railDir = "N";
                }else if(mX>width/2+tileSize/2 && mY>width/3 && mY<width*2/3){ //E
                    ctx.fillRect(width/2+tileSize/2,height/2-tileSize/2,width/2-tileSize/2,tileSize);
                    railDir = "E";
                }else if(mX>width/3 && mX<width*2/3 && mY>width/2+tileSize/2){ //S
                    ctx.fillRect(width/2-tileSize/2,height/2+tileSize/2,tileSize,height/2-tileSize/2);
                    railDir = "S";
                }else if(mX<width/2-tileSize/2 && mY>width/3 && mY<width*2/3){ //W
                    ctx.fillRect(0,height/2-tileSize/2,width/2-tileSize/2,tileSize);
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


        if(!createTeamMenu){
            $(".input1").toggle(false);
            $(".input2").toggle(false);
        }

        if(confirmDialog > -1){
            drawConfirmDialog(ctx,0,0,width,height);
        }

    }

    if(settingsView){
        drawSettings(ctx, width, height);
    }

    //Draw Version and Author info
    ctx.beginPath();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = colors.hudColor;
    ctx.font = "12px Courier";
    ctx.fillText("Made by Xazaviar",0,height-15);
    if(game!=null)
        ctx.fillText(game.version,0,height-30);
    if(gameStart)
        ctx.fillText("press 'esc' for settings",width-175,height-15);

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
        ctx.font = "18px Courier";
        ctx.fillText("ID   : "+me.info.name,5,sCardHei+20);
        if(me.info.teamID>-1){
            ctx.fillText("TEAM : "+teamList[me.info.teamID].name,5,sCardHei+40);
            ctx.fillText("ROLE : "+me.info.teamRole,5,sCardHei+60);
        }
        else{
            ctx.fillText("TEAM : N/A",5,sCardHei+40);
            ctx.fillText("ROLE : N/A",5,sCardHei+60);
        }
        ctx.fillText("LOC  : ("+me.loc[0]+", "+me.loc[1]+")",5,sCardHei+80);
        ctx.fillText("GOLD : "+me.info.gold+"g ("+me.info.totalGold+"g)",5,sCardHei+100);
        ctx.fillText("IRON : "+me.info.iron+"i ("+me.info.totalIron+"i)",5,sCardHei+120);
        ctx.fillText("URAN : "+me.info.uranium+"u ("+me.info.totalUranium+"u)",5,sCardHei+140);
        ctx.fillText("KILLS: "+me.info.kills+" | DEATHS: "+me.info.deaths,5,sCardHei+160);
        ctx.fillText("SCANS: "+me.info.scans+" | HAULS: "+me.info.hauls,5,sCardHei+180);
        ctx.fillText("TRAPS: "+me.info.traps,5,sCardHei+200);
        ctx.fillText("SAVED: "+(cookie!=""?"TRUE":"FALSE"),5,sCardHei+220);

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
    // ctx.font = "25px Courier";
    // ctx.fillText("Battle Log",0,bCardHei+30);
    bCardHei = 540;
    ctx.font = "14px Courier";
    var multi = 0;
    for(var i = 0; i+multi < Math.min(battleLog.length+multi,27); i++){
        var name = '';
        if(battleLog[i].type==="combat"){
            ctx.fillStyle = colors.enemyColor;
        }else if(battleLog[i].type==="server"){
            ctx.fillStyle = "#FFa500";
        }else if(battleLog[i].type==="chat"){
            ctx.fillStyle = colors.hudColor;
            name = "["+battleLog[i].user+"]: ";
        }else if(battleLog[i].type==="loot"){
            ctx.fillStyle = "#FFFF00";
        }else if(battleLog[i].type==="action"){
            ctx.fillStyle = colors.cantBuyColor;
        }else if(battleLog[i].type==="purchase"){
            ctx.fillStyle = "#FFFF00";
        }else if(battleLog[i].type==="team"){
            ctx.fillStyle = "#FF00FF";
        }

        var msg = name+battleLog[i].msg;

        var temp = [];
        for(var l = 0; l < parseInt(msg.length/36)+1; l++){
            temp.push(msg.substring(l*35,l*35+Math.min(35,msg.length-l*35)));
            if(l > 0) multi++;
        }
        // console.log(temp);
        for(var l = 0; l < temp.length; l++){
            ctx.fillText(temp[l],3,c.height-30-(i+(multi-l))*15);
        }
    }
    ctx.fillStyle = colors.hudColor;
    ctx.strokeRect(0,c.height-25,c.width,c.height);
    var start = (chatMsg.length>26?chatMsg.length-26:0);
    ctx.fillText("[CHAT]: "+chatMsg.substring(start,start+Math.min(chatMsg.length,26)),3,c.height-10);
    if(chatBlink)
        ctx.fillRect(Math.min((chatMsg.length+8)*8.6,290),c.height-20,2,15);
}



//******************************************************************************
// Drawing Helper Functions
//******************************************************************************
function drawGridLines(ctx, width, height){
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudColor;
    for(var i = 0; i < 5; i++){
        ctx.beginPath();
        ctx.arc(width/2,height/2,90+i*70,0,2*Math.PI);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(width/2,0);
    ctx.lineTo(width/2,height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0,height/2);
    ctx.lineTo(width,height/2);
    ctx.stroke();

}

function drawMap(ctx, startX, startY, width, height){
    ctx.globalAlpha = 1.0;
    var tileSize = width/map.length;

    //TODO: keep shops in draw area
    for(var x = 0; x < map.length; x++){
        for(var y = 0; y < map.length; y++){
            if(map[x][y]==="ROCK"){ //Rock
                ctx.beginPath();
                ctx.fillStyle= colors.rockColor;
                ctx.fillRect(x*tileSize+tileSize/2-tileSize*.4+startX,y*tileSize+tileSize/2-tileSize*.4+startY,tileSize*.8,tileSize*.8);
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

                ctx.fillRect(sX*tileSize+startX, sY*tileSize+startY, (eX-sX+1)*tileSize, (eY-sY+1)*tileSize);
                ctx.fill();

                //Draw Shop
                ctx.beginPath();
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = colors.shopColor;
                ctx.save();
                ctx.translate(x*tileSize+tileSize/2+startX, y*tileSize+tileSize/2+startY);
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

                ctx.fillRect(sX*tileSize+startX, sY*tileSize+startY, (eX-sX+1)*tileSize, (eY-sY+1)*tileSize);
                ctx.fill();

                //Draw Super Shop
                ctx.beginPath();
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = colors.shopColor;
                ctx.save();
                ctx.translate(x*tileSize+tileSize/2+startX, y*tileSize+tileSize/2+startY);
                ctx.rotate(Math.PI / 4);
                ctx.translate(-(tileSize/2 / 2), -(tileSize/2 / 2));
                ctx.fillRect(0,0, tileSize/2, tileSize/2);
                ctx.rotate(3*Math.PI / 4);
                ctx.restore();
                ctx.fillRect(x*tileSize+tileSize/4+startX,y*tileSize+tileSize/4+startY, tileSize/2, tileSize/2);
                ctx.fill();

            }
            else if(map[x][y]=="GOLD"){ //Treasure
                ctx.beginPath();
                ctx.fillStyle=colors.goldColor;
                ctx.arc(x*tileSize+tileSize/2-tileSize/8+startX,y*tileSize+tileSize/2+tileSize/10+startY,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2+tileSize/8+startX,y*tileSize+tileSize/2+tileSize/10+startY,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2+startX,y*tileSize+tileSize/2-tileSize/4+tileSize/10+startY,tileSize/6,0,2*Math.PI);
                ctx.fill();
            }
            else if(map[x][y]=="IRON"){ //Iron
                ctx.beginPath();
                ctx.fillStyle=colors.ironColor;
                ctx.arc(x*tileSize+tileSize/2-tileSize/8+startX,y*tileSize+tileSize/2+tileSize/10+startY,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2+tileSize/8+startX,y*tileSize+tileSize/2+tileSize/10+startY,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2+startX,y*tileSize+tileSize/2-tileSize/4+tileSize/10+startY,tileSize/6,0,2*Math.PI);
                ctx.fill();
            }
            else if(map[x][y]=="URANIUM"){ //Uranium
                ctx.beginPath();
                ctx.fillStyle=colors.uraniumColor;
                ctx.arc(x*tileSize+tileSize/2-tileSize/8+startX,y*tileSize+tileSize/2+tileSize/10+startY,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2+tileSize/8+startX,y*tileSize+tileSize/2+tileSize/10+startY,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x*tileSize+tileSize/2+startX,y*tileSize+tileSize/2-tileSize/4+tileSize/10+startY,tileSize/6,0,2*Math.PI);
                ctx.fill();
            }

            //Draw me
            if(me.loc[0]==x && me.loc[1]==y && me.stats.hp>0){
                if(blink){
                    ctx.beginPath();
                    ctx.fillStyle = colors.hudColor;
                    ctx.strokeStyle = colors.hudColor;
                    ctx.arc(x*tileSize+tileSize/2+startX,y*tileSize+tileSize/2+startY,tileSize/4,0,2*Math.PI);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.globalAlpha = 0.3;
                    ctx.fillRect(x*tileSize+startX,y*tileSize+startY,tileSize,tileSize);
                    ctx.globalAlpha = 1.0;
                    ctx.stroke();
                }
            }
        }
    }

    for(var i = 0; i < players.length; i++){
        if(typeof players[i].loc !== "undefined"){
            var eloc = players[i].loc; //Check if same player
            if(!(eloc[0]==me.loc[0] && eloc[1]==me.loc[1] && me.stats.hp>0)){
                if(players[i].team==me.info.teamID) ctx.fillStyle=colors.hudColor;
                else ctx.fillStyle=colors.enemyColor;

                ctx.beginPath();
                ctx.arc(eloc[0]*tileSize+tileSize/2+startX,eloc[1]*tileSize+tileSize/2+startY,tileSize/5,0,2*Math.PI);
                ctx.fill();
            }
        }
    }

    ctx.globalAlpha = 1.0;
}

function drawShopMenu(ctx, width, height){
    ctx.beginPath();
    ctx.strokeStyle=colors.hudColor;
    ctx.fillStyle=colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    var startX = width/6;
    var startY = height/4;
    ctx.strokeRect(startX,startY,width-startX*2,height-startY*2);
    ctx.fillRect(startX,startY,width-startX*2,height-startY*2);
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
        ctx.fillText(baseStore[i].price.gold+"g",width-startX-140,startY+110+25*i);
        if(baseStore[i].canBuy && me.info.iron < baseStore[i].price.iron) ctx.fillStyle=colors.needMoreColor;
        else if(baseStore[i].canBuy) ctx.fillStyle=colors.canBuyColor;
        ctx.fillText(baseStore[i].price.iron+"i",width-startX-68,startY+110+25*i);
        if(baseStore[i].canBuy && me.info.uranium < baseStore[i].price.uranium) ctx.fillStyle=colors.needMoreColor;
        else if(baseStore[i].canBuy) ctx.fillStyle=colors.canBuyColor;
        ctx.fillText(baseStore[i].price.uranium+"u",width-startX-30,startY+110+25*i);

        //upgrade bars
        for(var u = 0; u < baseStore[i].maxLvl; u++){
            if(u < baseStore[i].level) ctx.fillStyle = colors.upgradeColor;
            else ctx.fillStyle = colors.voidUpgradeColor;
            ctx.fillRect(width-startX-250+u*10,startY+95+i*25,5,20);
        }
    }
    // ctx.fillStyle=colors.hudColor;
    // ctx.fillText("esc: Exit Store",startX+5,startY+110+25*i);

}

function drawSShopMenu(ctx, width, height){
    ctx.beginPath();
    ctx.strokeStyle=colors.hudColor;
    ctx.fillStyle=colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    var startX = width/8;
    var startY = height/4;
    ctx.strokeRect(startX,startY,3*width/4,height/2);
    ctx.fillRect(startX,startY,3*width/4,height/2);
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
        var tHei = 60;//(height/2)/(tabs.length+1);
        if(i==curShopTab) ctx.fillStyle=colors.hudColor;
        else ctx.fillStyle=colors.hudBackColor;
        ctx.strokeRect(width-startX+1,startY+tHei*i,25,tHei);
        ctx.fillRect(width-startX+1,startY+tHei*i,25,tHei);

        if(i==curShopTab) ctx.fillStyle=colors.hudBackColor;
        else ctx.fillStyle=colors.hudColor;
        ctx.fillText((i==tabs.length?"LO":"T"+(i+1)),width-startX+3,startY+35+tHei*i);
        ctx.stroke();
    }

    //Draw Shop Tab Contents
    if(curShopTab < 5 && curShopTab > -1){
        //Store Labels
        ctx.fillStyle=colors.hudColor;
        ctx.font = "40px Courier";
        ctx.fillText("Special Store",startX+5,startY+45);

        ctx.font = "18px Courier";
        ctx.fillText("Press the key to do the following",startX+5,startY+85);

        for(var i = 0; i < tabs[curShopTab].length; i++){
            ctx.beginPath();
            if(tabs[curShopTab][i].canBuy && !canPurchase(tabs[curShopTab][i].price, {"gold":me.info.gold,"iron":me.info.iron,"uranium":me.info.uranium})) ctx.fillStyle=colors.needMoreColor;
            else if(tabs[curShopTab][i].canBuy) ctx.fillStyle=colors.canBuyColor;
            else ctx.fillStyle=colors.cantBuyColor;
            ctx.fillText(" "+(i+1)+": "+tabs[curShopTab][i].label,startX+5,startY+110+i*25);
            if(tabs[curShopTab][i].canBuy && me.info.gold < tabs[curShopTab][i].price.gold) ctx.fillStyle=colors.needMoreColor;
            else if(tabs[curShopTab][i].canBuy) ctx.fillStyle=colors.canBuyColor;
            ctx.fillText(tabs[curShopTab][i].price.gold+"g",width-startX-140,startY+110+i*25);
            if(tabs[curShopTab][i].canBuy && me.info.iron < tabs[curShopTab][i].price.iron) ctx.fillStyle=colors.needMoreColor;
            else if(tabs[curShopTab][i].canBuy) ctx.fillStyle=colors.canBuyColor;
            ctx.fillText(tabs[curShopTab][i].price.iron+"i",width-startX-68,startY+110+i*25);
            if(tabs[curShopTab][i].canBuy && me.info.uranium < tabs[curShopTab][i].price.uranium) ctx.fillStyle=colors.needMoreColor;
            else if(tabs[curShopTab][i].canBuy) ctx.fillStyle=colors.canBuyColor;
            ctx.fillText(tabs[curShopTab][i].price.uranium+"u",width-startX-30,startY+110+i*25);

            //upgrade bars
            for(var u = 0; u < tabs[curShopTab][i].maxLvl; u++){
                if(u < tabs[curShopTab][i].level) ctx.fillStyle = colors.upgradeColor;
                else ctx.fillStyle = colors.voidUpgradeColor;
                ctx.fillRect(width-startX-200+u*10,startY+95+i*25,5,20);
            }
        }
    }
    else if(curShopTab > -1){
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
        ctx.lineTo(startX+150,startY+height/2);
        ctx.stroke();

        //Options
        ctx.font = "22px Courier";
        for(var i = 0; i < me.storage.length; i++){
            ctx.strokeRect(startX+170+70*(i%6),startY+130+70*parseInt(i/6),60,60);
            ctx.fillText(me.storage[i].name,startX+170+70*(i%6)+3,startY+130+70*parseInt(i/6)+35);
        }
    }
}

function drawSettings(ctx, width, height){
    var hudStart = width/6;
    ctx.beginPath();
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(hudStart,height/8,width/2,3*height/4);
    ctx.fillRect(hudStart,height/8,width/2,3*height/4);
    ctx.stroke();

    //Settings Labels
    ctx.beginPath();
    ctx.fillStyle = colors.hudColor;
    ctx.font = "30px Courier";
    ctx.fillText("Settings",hudStart+5,height/8+35);
    ctx.font = "20px Courier";
    ctx.fillText("Click the color to change it.",hudStart+5,height/8+55);

    var i = 1;
    ctx.font = "18px Courier";
    for(var property in colors){
        if(colors.hasOwnProperty(property)){
            if(property!=="timerGradient"){
                ctx.beginPath();
                ctx.fillStyle = colors.hudColor;
                ctx.fillText(property,hudStart+20,height/8+75+20*i);
                ctx.strokeStyle = colors.hudColor;
                ctx.fillStyle = colors[property];
                ctx.strokeRect(hudStart+350,height/8+60+20*i,15,15);
                ctx.fillRect(hudStart+350,height/8+60+20*i,15,15);
                i++;
            }
        }
    }

    //Draw return to default button
    ctx.fillStyle = colors.hudColor;
    ctx.strokeStyle = colors.hudColor;
    ctx.font = "25px Courier";
    ctx.fillText("Default",hudStart+260,height/8+107+20*i);
    ctx.strokeRect(hudStart+255,height/8+60+20*i+20,115,40);

    //Controls
    hudStart = 4*width/6;
    ctx.beginPath();
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(hudStart+1,height/8,5*width/16,height/2+20);
    ctx.fillRect(hudStart+1,height/8,5*width/16,height/2+20);
    ctx.fillStyle = colors.hudColor;
    ctx.font = "22px Courier";
    ctx.fillText("Controls",(hudStart)+6,height/8+23);
    ctx.font = "16px Courier";
    ctx.fillText("Key     Action   Cost",(hudStart)+6,height/8+40);
    ctx.fillText("1     - Scan      [3]",(hudStart)+6,height/8+55);
    ctx.fillText("2     - Loot      [2]",(hudStart)+6,height/8+70);
    ctx.fillText("3     - Hold      [1]",(hudStart)+6,height/8+85);
    ctx.fillText("WASD  - Move      [1]",(hudStart)+6,height/8+100);
    ctx.fillText("Click - Attack    [1]",(hudStart)+6,height/8+115);
    ctx.fillText("ESC   - Settings  [0]",(hudStart)+6,height/8+130);
    ctx.font = "22px Courier";
    ctx.fillText("How to Play",(hudStart)+6,height/8+165);
    ctx.font = "16px Courier";
    ctx.fillText("Scan to reveal treasure. ",(hudStart)+6,height/8+182);
    ctx.fillText("Move over the treasure to",(hudStart)+6,height/8+197);
    ctx.fillText("loot it. Take the gold to",(hudStart)+6,height/8+212);
    ctx.fillText("shops to get upgrades.   ",(hudStart)+6,height/8+227);
    ctx.fillText("Attack  enemy ships to   ",(hudStart)+6,height/8+242);
    ctx.fillText("steal their loot.        ",(hudStart)+6,height/8+257);
    ctx.fillText("                         ",(hudStart)+6,height/8+272);
    ctx.fillText("You have 3 action slots  ",(hudStart)+6,height/8+287);
    ctx.fillText("per round and 3 secs to  ",(hudStart)+6,height/8+302);
    ctx.fillText("choose them. All actions ",(hudStart)+6,height/8+317);
    ctx.fillText("are done in order at the ",(hudStart)+6,height/8+332);
    ctx.fillText("same time as other       ",(hudStart)+6,height/8+347);
    ctx.fillText("players. Priority order  ",(hudStart)+6,height/8+362);
    ctx.fillText("goes:                    ",(hudStart)+6,height/8+377);
    ctx.fillText(" MOVE->ATTACK->LOOT->SCAN",(hudStart)+6,height/8+392);
    ctx.fillText("                         ",(hudStart)+6,height/8+407);
    ctx.stroke();
}

function drawRadarScan(ctx, width, height){
    ctx.globalAlpha = 1.0;
    var radius = 450;
    ctx.beginPath();
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudColor;
    ctx.moveTo(width/2+(radius*Math.cos(radarAngle)),height/2+(radius*Math.sin(radarAngle))); //Outer point
    ctx.lineTo(width/2,height/2); //center
    ctx.stroke();

    //follow Rings
    for(var i = 1; i < radarFollow; i++){
        ctx.beginPath();
        ctx.globalAlpha = 1.0-(1.0/radarFollow)*i;
        ctx.moveTo(width/2+(radius*Math.cos(radarAngle-i*(radarINC/2))),height/2+(radius*Math.sin(radarAngle-i*(radarINC/2)))); //Outer point
        ctx.lineTo(width/2,height/2); //center
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
}

function drawJoinTeam(ctx, startX, startY, width, height){
    //Calculate Drawing Area
    var sX = startX+width/8;
    var sY = startY+height/10;
    var wid = width-(sX-startX)*2;
    var hei = height-(sY-startY)*2;

    //Draw Box
    ctx.beginPath();
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(sX,sY,wid,hei);
    ctx.fillRect(sX,sY,wid,hei);
    ctx.stroke();

    //Seperator
    ctx.strokeRect(sX,sY,wid,150);

    joinTeamHover = -1;

    //Suggested Teams
    ctx.fillStyle = colors.hudColor;
    ctx.font = "22px Courier";
    ctx.fillText("Recommended Teams",sX+5,sY+25);

    if(teamRec.length == 0){
        var opts = [];
        while(opts.length < 3){
            var rand = parseInt(Math.random()*1000)%teamList.length;
            if(opts.indexOf(rand) > -1 || teamList[rand].joinStatus!=="OPEN") continue;
            opts.push(rand);
        }
        teamRec = opts;
    }

    ctx.font = "bold 11pt Courier";
    for(var i = 0; i < teamRec.length; i++){
        if(mX < sX+wid/60+wid/3*i+180 && mX > sX+wid/60+wid/3*i &&
           mY < sY+130 && mY > sY+55){
            ctx.globalAlpha = 1.0;
            joinTeamHover = teamRec[i];
        }else{
            ctx.globalAlpha = 0.8;
        }
        ctx.fillStyle = teamList[teamRec[i]].colors.areaColor;
        ctx.fillRect(sX+wid/60+wid/3*i,sY+55,180,75);
        ctx.fillStyle = "#000000";
        ctx.fillText(teamList[teamRec[i]].name,sX+(wid/60-1+(100-teamList[teamRec[i]].name.length*5))+wid/3*i,sY+69);
        ctx.fillText("MEMBERS: "+teamList[teamRec[i]].size,sX+wid/60+5+wid/3*i-1,sY+85-1);
        ctx.fillText("POWER  : "+teamList[teamRec[i]].power,sX+wid/60+5+wid/3*i-1,sY+100-1);
        ctx.fillText("BASES  : ",sX+wid/60+5+wid/3*i-1,sY+115-1);
        drawBase(ctx,sX+wid/60+5+75+wid/3*i-1,sY+100-1, 20, teamList[teamRec[i]].colors.baseShape, 1, "#000000");
        drawBase(ctx,sX+wid/60+5+95+wid/3*i-1,sY+100-1, 20, teamList[teamRec[i]].colors.baseShape, 2, "#000000");
        drawBase(ctx,sX+wid/60+5+115+wid/3*i-1,sY+100-1, 20, teamList[teamRec[i]].colors.baseShape, 3, "#000000");
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = teamList[teamRec[i]].colors.baseColor;
        ctx.fillText(teamList[teamRec[i]].name,sX+(wid/60+(100-teamList[teamRec[i]].name.length*5))+wid/3*i,sY+70);
        ctx.fillText("MEMBERS: "+teamList[teamRec[i]].size,sX+wid/60+5+wid/3*i,sY+85);
        ctx.fillText("POWER  : "+teamList[teamRec[i]].power,sX+wid/60+5+wid/3*i,sY+100);
        ctx.fillText("BASES  : ",sX+wid/60+5+wid/3*i,sY+115);
        drawBase(ctx,sX+wid/60+5+75+wid/3*i,sY+100, 20, teamList[teamRec[i]].colors.baseShape, 1, teamList[teamRec[i]].colors.baseColor);
        drawBase(ctx,sX+wid/60+5+95+wid/3*i,sY+100, 20, teamList[teamRec[i]].colors.baseShape, 2, teamList[teamRec[i]].colors.baseColor);
        drawBase(ctx,sX+wid/60+5+115+wid/3*i,sY+100, 20, teamList[teamRec[i]].colors.baseShape, 3, teamList[teamRec[i]].colors.baseColor);
    }

    //Create Team Button
    ctx.globalAlpha = 1.0;
    ctx.font = "16px Courier";
    if(mX < sX+wid-10 && mX > sX+wid-150 &&
       mY < sY+30 && mY > sY+10){
        ctx.fillStyle = colors.hudColor;
        ctx.fillRect(sX+wid-150,sY+10,140,20);
        ctx.fillStyle = colors.hudBackColor;
        ctx.fillText("+ CREATE TEAM",sX+wid-145,sY+25);
        joinTeamHover = "CREATE";
    }
    else{
        ctx.strokeStyle = colors.hudColor;
        ctx.strokeRect(sX+wid-150,sY+10,140,20);
        ctx.fillStyle = colors.hudColor;
        ctx.fillText("+ CREATE TEAM",sX+wid-145,sY+25);
    }

    //Draw Scrollbar
    if(teamList.length > 22){
        ctx.beginPath();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = colors.hudColor;
        ctx.fillRect(sX+wid-20,sY+185,10, hei-195);
        ctx.globalAlpha = 1.0;
        var barsize = (22/teamList.length)*(hei-195);
        ctx.fillRect(sX+wid-25,sY+185+joinTeamScroll*((hei-195)-barsize)/(teamList.length-22),20,barsize);
    }


    //Full Team List
    ctx.beginPath();
    ctx.globalAlpha = 1.0;
    sY = sY + 150;
    ctx.fillStyle = colors.hudColor;
    ctx.font = "14pt Courier";
    ctx.strokeRect(sX+5,sY+30,wid-40,1);
    ctx.fillText("TEAM NAME",sX+8,sY+20);
    ctx.fillText("BASES",sX+220,sY+20);
    ctx.fillText("PROFIT",sX+300,sY+20);
    ctx.fillText("TAX",sX+390,sY+20);
    ctx.fillText("MEMBERS",sX+450,sY+20);

    ctx.font = "11pt Courier";
    var yAdj = 0, drawAmount = Math.min(teamList.length, 22);

    for(var i = joinTeamScroll; yAdj < drawAmount && i < teamList.length; i++){
        if(teamList[i].joinStatus==="OPEN"){
            if(mX < sX+wid-50 && mX > sX+6 &&
               mY < sY+37+20*yAdj+17 && mY > sY+37+20*yAdj){
                ctx.fillStyle = colors.hudColor;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(sX+6,sY+37+20*yAdj,wid-50,17);
                joinTeamHover = i;
            }
            ctx.fillStyle = teamList[i].colors.areaColor;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(sX+220,sY+37+20*yAdj,60,17);
            drawBase(ctx,sX+222,sY+37+20*yAdj, 17, teamList[i].colors.baseShape, 1, teamList[i].colors.baseColor);
            drawBase(ctx,sX+242,sY+37+20*yAdj, 17, teamList[i].colors.baseShape, 2, teamList[i].colors.baseColor);
            drawBase(ctx,sX+263,sY+37+20*yAdj, 17, teamList[i].colors.baseShape, 3, teamList[i].colors.baseColor);


            ctx.fillStyle = colors.hudColor;
            ctx.globalAlpha = 1.0;

            ctx.fillText(teamList[i].name,sX+8,sY+50+20*yAdj);
            ctx.fillText(teamList[i].profitDivide,sX+315,sY+50+20*yAdj);
            ctx.fillText(teamList[i].tax+"%",sX+400,sY+50+20*yAdj);
            ctx.fillText(teamList[i].size,sX+480,sY+50+20*yAdj);
            yAdj++;
        }
    }
    ctx.globalAlpha = 1.0;

}

function drawCreateTeam(ctx, startX, startY, width, height){
    //Calcuate Draw Area
    var sX = startX+width/3.5;
    var sY = startY+height/4;
    var wid = width-(sX-startX)*2;
    var hei = height-(sY-startY)*2;

    ctx.beginPath();
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(sX,sY,wid,hei);
    ctx.fillRect(sX,sY,wid,hei);
    ctx.stroke();

    createTeamHover = -1;
    $(".input1").toggle(!(confirmDialog>-1));
    $(".input2").toggle(!(confirmDialog>-1));

    var baseIN = $("#color-picker1").val();
    if(baseIN!="") bColor = baseIN;
    var areaIN = $("#color-picker2").val();
    if(areaIN!="") aColor = areaIN;


    //Options
    ctx.beginPath();
    ctx.fillStyle = colors.hudColor;
    ctx.strokeStyle = colors.hudColor;
    ctx.font = "bold 18pt Courier";
    ctx.fillText("Team Name: ",sX+5,sY+40);
    ctx.strokeRect(sX+10,sY+50,wid-20,30);
    ctx.fillRect(sX+Math.min((tName.length)*13,290)+22,sY+55,2,18);
    ctx.font = "bold 16pt Courier";
    ctx.fillText(tName,sX+20,sY+70);
    ctx.font = "bold 18pt Courier";
    ctx.fillText("Base Shape: ",sX+5,sY+110);
    var styles = ["DIAMOND","TRIANGLE","CIRCLE"];
    for(var i = 0; i < styles.length; i++){
        if(mX < sX+200+i*30 && mX > sX+170+i*30 &&
           mY < sY+120 && mY > sY+90){
            ctx.strokeRect(sX+170+30*i,sY+90,30,30);
            createTeamHover = i;
        }
        if(bShape===styles[i]){
            ctx.globalAlpha = 0.5;
            ctx.fillRect(sX+170+30*i,sY+90,30,30);
        }
        drawBase(ctx,sX+170+30*i,sY+90, 30, styles[i], 1, colors.hudColor);
    }

    //Colors
    ctx.beginPath();
    ctx.fillStyle = colors.hudColor;
    ctx.font = "bold 18pt Courier";
    ctx.fillText("Base Color: ",sX+5,sY+140);
    ctx.fillStyle = bColor;
    ctx.fillRect(sX+170,sY+125,150,20);
    var hex = bColor.replace('#','');
    var r = parseInt(hex.substring(0,2), 16);
    var g = parseInt(hex.substring(2,4), 16);
    var b = parseInt(hex.substring(4,6), 16);
    if(r+g+b < 240)
        ctx.fillStyle = "#FFF";
    else
        ctx.fillStyle = "#000";
    ctx.font = "12pt Courier";
    ctx.fillText(bColor,sX+175,sY+140);
    if(mX < sX+320 && mX > sX+170 &&
       mY < sY+145 && mY > sY+125){
        ctx.strokeStyle = colors.hudColor;
        ctx.strokeRect(sX+170,sY+125,150,20);
        createTeamHover = "BASE";
    }


    ctx.beginPath();
    ctx.fillStyle = colors.hudColor;
    ctx.font = "bold 18pt Courier";
    ctx.fillText("Area Color: ",sX+5,sY+170);
    ctx.fillStyle = aColor;
    ctx.fillRect(sX+170,sY+155,150,20);
    var hex = bColor.replace('#','');
    var r = parseInt(hex.substring(0,2), 16);
    var g = parseInt(hex.substring(2,4), 16);
    var b = parseInt(hex.substring(4,6), 16);
    if(r+g+b < 160)
        ctx.fillStyle = "#FFF";
    else
        ctx.fillStyle = "#000";
    ctx.font = "12pt Courier";
    ctx.fillText(aColor,sX+175,sY+170);
    if(mX < sX+320 && mX > sX+170 &&
       mY < sY+175 && mY > sY+155){
        ctx.strokeStyle = colors.hudColor;
        ctx.strokeRect(sX+170,sY+155,150,20);
        createTeamHover = "AREA";
    }


    //Base Examples
    ctx.beginPath();
    ctx.fillStyle = aColor;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(sX+10,sY+hei-200,wid-20,70);
    ctx.fillStyle = bColor;
    ctx.globalAlpha = 1.0;
    ctx.font = "12pt Courier";
    for(var i = 0; i < 3; i++){
        ctx.fillText("Level "+(i+1),sX+15+i*(wid/3),sY+hei-185);
        drawBase(ctx,sX+25+i*(wid/3),sY+hei-185, 50, bShape, i+1, bColor);
    }

    //ERROR MESSAGE
    ctx.beginPath();
    ctx.globalAlpha = 1.0;
    ctx.font = "bold 22px Courier";
    ctx.fillStyle = colors.enemyColor;
    ctx.fillText(createTeamError.substring(0,Math.min(22,createTeamError.length)),sX+25,sY+hei-100);
    if(createTeamError.length>22)
        ctx.fillText(createTeamError.substring(23,createTeamError.length),sX+25,sY+hei-80);

    //Create button
    ctx.beginPath();
    ctx.globalAlpha = 1.0;
    ctx.font = "20px Courier";
    if(mX < sX+wid/2+75 && mX > sX+wid/2-75 &&
       mY < sY+hei-15 && mY > sY+hei-45){
        ctx.fillStyle = colors.hudColor;
        ctx.fillRect(sX+wid/2-75,sY+hei-45,150,30);
        ctx.fillStyle = colors.hudBackColor;
        ctx.fillText("CREATE TEAM",sX+wid/2-65,sY+hei-25);
        createTeamHover = "CREATE";
    }
    else{
        ctx.strokeStyle = colors.hudColor;
        ctx.strokeRect(sX+wid/2-75,sY+hei-45,150,30);
        ctx.fillStyle = colors.hudColor;
        ctx.fillText("CREATE TEAM",sX+wid/2-65,sY+hei-25);
    }

}

function drawTeamMenu(ctx, startX, startY, width, height){
    var sX = startX+width/8;
    var sY = startY+height/6;
    var wid = width-(sX-startX)*2;
    var hei = height-(sY-startY)*2;

    var id = me.info.teamID;

    //Draw box
    ctx.beginPath();
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(sX,sY,wid,hei);
    ctx.fillRect(sX,sY,wid,hei);
    ctx.stroke();

    teamMenuHover = -1;

    //Draw Tabs
    ctx.strokeStyle=colors.hudColor;
    ctx.fillStyle=colors.hudBackColor;
    ctx.font = "18px Courier";
    var teamTabs = ["SUM","MEM","LOOT","SET"];
    for(var i = 0; i < teamTabs.length; i++){
        ctx.beginPath();
        var tHei = 60;
        ctx.globalAlpha = 1.0;
        if(i==curTeamTab) ctx.fillStyle=colors.hudColor;
        else ctx.fillStyle=colors.hudBackColor;
        ctx.strokeRect(sX+wid+1,sY+tHei*i,50,tHei);
        ctx.fillRect(sX+wid+1,sY+tHei*i,50,tHei);

        ctx.globalAlpha = 1.0;
        if(i==curTeamTab) ctx.fillStyle=colors.hudBackColor;
        else ctx.fillStyle=colors.hudColor;
        ctx.fillText(teamTabs[i],sX+wid+3,sY+35+tHei*i);
        ctx.stroke();

        if(mX > sX+wid+1 && mX < sX+wid+51 &&
           mY > sY+tHei*i && mY < sY+tHei*i+tHei){
            teamMenuHover = i;
            ctx.globalAlpha = 0.5;
            ctx.fillStyle=colors.hudColor;
            ctx.fillRect(sX+wid+1,sY+tHei*i,50,tHei);
        }

    }


    //In Tabs
    ctx.beginPath();
    ctx.globalAlpha = 1.0;
    if(curTeamTab==0){ //MAIN view tab
        ctx.fillStyle=colors.hudColor;
        ctx.globalAlpha = 1.0;

        //Draw Summary
        ctx.font = "bold 22pt Courier";
        ctx.fillText(teamList[id].name+"'s SUMMARY",sX+5, sY+25);
        ctx.font = "18pt Courier";
        ctx.fillText("INCOME : "+teamList[id].income[0]+"g",sX+5, sY+50);
        ctx.fillText("         "+teamList[id].income[1]+"c",sX+5, sY+70);
        ctx.fillText("MEMBERS: "+teamList[id].members.length,sX+5, sY+90);

        ctx.fillText("TEAM RANK  : "+teamList[id].rank,sX+250, sY+50);
        ctx.fillText("TEAM POWER : "+teamList[id].power,sX+250, sY+70);
        ctx.fillText("MAP CONTROL: "+teamList[id].mapControl+"%",sX+250, sY+90);

        //Draw Objective
        ctx.font = "bold 25pt Courier";
        ctx.fillText("OBJECTIVE:",sX+5, sY+135);
        ctx.font = "16pt Courier";
        ctx.fillText("CAPTURE [BASE_NAME]",sX+210, sY+132);

        //Draw Base Info
        //TODO: make bases
        ctx.font = "16pt Courier";
        ctx.fillText("BASE INFO",sX+5*wid/8+10, sY+180);

        //Draw Map
        ctx.strokeRect(sX, sY+hei-5*wid/8, 5*wid/8, 5*wid/8);
        drawMap(ctx, sX, sY+hei-5*wid/8, 5*wid/8, 5*wid/8);
    }
    else if(curTeamTab==1){ //Membership
        ctx.fillStyle=colors.hudColor;
        ctx.strokeStyle=colors.hudColor;
        ctx.font = "bold 22pt Courier";
        ctx.fillText("MEMBERS",sX+5, sY+25);

        //leader
        ctx.font = "bold 16pt Courier";
        ctx.fillText("LEADER",sX+5, sY+45);
        ctx.strokeRect(sX+5,sY+55,250,30);
        if(teamList[id].leader.id>-1) ctx.fillStyle=colors.hudColor;
        else ctx.fillStyle = colors.cantBuyColor;
        ctx.fillText(teamList[id].leader.name,sX+7, sY+75);
        ctx.fillText(teamList[id].leader.powerLevel,sX+217, sY+75);

        //Admins
        ctx.fillStyle=colors.hudColor;
        ctx.font = "bold 16pt Courier";
        ctx.fillText("ADMINS",sX+5, sY+115);
        ctx.strokeRect(sX+5,sY+125,250,hei/2);

        ctx.font = "14pt Courier";
        for(var i = 0; i < Math.min(teamList[id].admins.length,13); i++){
            if(mX < sX+255 && mX > sX+5 &&
               mY < sY+145+20*i && mY > sY+125+20*i && me.info.teamRole==="LEADER"){
                ctx.fillStyle = colors.hudColor;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(sX+8,sY+129+20*i,243,20);
                teamMenuHover = {"id":teamList[id].admins[i].id,"type":"ADMIN"};
            }

            ctx.globalAlpha = 1.0;
            if(teamList[id].admins[i].id>-1) ctx.fillStyle=colors.hudColor;
            else ctx.fillStyle = colors.cantBuyColor;
            ctx.fillText(teamList[id].admins[i].name,sX+10,sY+145+20*i);
            ctx.fillText(teamList[id].admins[i].powerLevel,sX+218,sY+145+20*i);
        }

        //Members
        ctx.fillStyle=colors.hudColor;
        ctx.font = "bold 16pt Courier";
        ctx.fillText("GENERAL MEMBERS",sX+wid/2-20, sY+45);
        ctx.strokeRect(sX+wid/2-20,sY+55,wid/2-10,hei-100);

        var memList = filterMemberList(teamList[id].members, teamList[id].admins, teamList[id].leader);

        //Draw Scrollbar
        var listSize = 21;
        if(teamScroll > memList.length || memList.length <= listSize) teamScroll = 0;
        else if(teamScroll > memList.length-listSize && memList.length > listSize) teamScroll = memList.length-listSize;

        if(memList.length > listSize){
            ctx.beginPath();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+wid-50,sY+60, 10, hei-110);
            ctx.globalAlpha = 1.0;
            var barsize = (listSize/memList.length)*(hei-110);
            ctx.fillRect(sX+wid-55,sY+60+teamScroll*((hei-110)-barsize)/(memList.length-listSize),20,barsize);
        }

        ctx.font = "14pt Courier";
        var drawAmount = Math.min(memList.length, listSize);
        for(var i = teamScroll, yAdj = 0; yAdj < drawAmount && i < memList.length; i++, yAdj++){
            if(mX < sX+wid-30 && mX > sX+wid/2-20 &&
               mY < sY+75+20*yAdj && mY > sY+55+20*yAdj &&
               (me.info.teamRole==="LEADER" || me.info.teamRole==="ADMIN")){
                ctx.fillStyle = colors.hudColor;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(sX+wid/2-15,sY+58+20*yAdj,wid/2-50,20);
                teamMenuHover = {"id":memList[i].id,"type":"MEM"};
            }

            ctx.globalAlpha = 1.0;


            if(memList[i].id>-1) ctx.fillStyle=colors.hudColor;
            else ctx.fillStyle = colors.cantBuyColor;
            ctx.fillText(memList[i].name,sX+wid/2-10,sY+75+20*yAdj);
            ctx.fillText(memList[i].powerLevel,sX+wid/2+200,sY+75+20*yAdj);
        }
    }
    else if(curTeamTab==2){ //Vault
        ctx.fillStyle=colors.hudColor;
        ctx.globalAlpha = 1.0;
        ctx.font = "bold 30pt Courier";
        ctx.fillText("THE VAULT",sX+5, sY+35);

        ctx.font = "bold 40pt Courier";
        ctx.fillStyle=colors.goldColor;
        ctx.fillText("GOLD   : "+teamList[id].credits+"g",sX+wid/2-200, sY+hei/5);
        ctx.fillStyle=colors.ironColor;
        ctx.fillText("IRON   : "+teamList[id].credits+"i",sX+wid/2-200, sY+2*hei/5);
        ctx.fillStyle=colors.uraniumColor;
        ctx.fillText("URANIUM: "+teamList[id].credits+"u",sX+wid/2-200, sY+3*hei/5);
        ctx.fillStyle=colors.hudColor;
        ctx.fillText("CREDITS: "+teamList[id].credits+"c",sX+wid/2-200, sY+4*hei/5);

    }
    else if(curTeamTab==3){ //Settings
        ctx.fillStyle=colors.hudColor;
        ctx.strokeStyle=colors.hudColor;
        ctx.globalAlpha = 1.0;
        ctx.font = "bold 30pt Courier";
        ctx.fillText("TEAM SETTINGS",sX+5, sY+35);

        //Draw locked status
        if(me.info.teamRole!=="LEADER"){
            ctx.fillStyle="#F00";
            ctx.fillText("LOCKED",sX+wid-170, sY+35);
        }
        else if(teamSetSaved){
            ctx.fillStyle="#F00";
            ctx.fillText("SAVED",sX+wid-170, sY+35);
        }

        //Draw settings
        var settingOptions = [
            {
                "text": "MEMBERSHIP :",
                "input": "MEMBERSHIP",
                "opts": ["OPEN","INVITE","AD INV"],
                "curOpt": curSettings.membership
            },
            {
                "text": "CAN PING :",
                "input": "PING",
                "opts": ["TEAM","ADMIN","LEADER"],
                "curOpt": curSettings.ping
            },
            {
                "text": "CAN BUILD :",
                "input": "BUILD",
                "opts": ["TEAM","ADMIN","LEADER"],
                "curOpt": curSettings.building
            },
            {
                "text": "CAN UPGRADE :",
                "input": "UPGRADE",
                "opts": ["ADMIN","LEADER"],
                "curOpt": curSettings.upgrading
            },
            {
                "text": "PROFIT SPLIT :",
                "input": "PROFIT",
                "opts": ["FAIR","AD ONLY","LEADER"],
                "curOpt": curSettings.profitDivide
            },
            {
                "text": "TAX :",
                "input": "TAX",
                "opts": [0,25,50,75,100],
                "curOpt": curSettings.tax
            }
        ];

        var setHei = 0;
        for(var set = 0; set < settingOptions.length; set++){
            ctx.beginPath();
            ctx.globalAlpha = 1.0;
            ctx.fillStyle=colors.hudColor;
            ctx.font = "bold 20pt Courier";
            setHei = sY+70*(set+1);
            ctx.fillText(settingOptions[set].text, sX+5, setHei);
            ctx.font = "bold 16pt Courier";
            var oLength = settingOptions[set].opts.length;
            for(var i = 0; i < oLength; i++){
                ctx.globalAlpha = 1.0;
                if(settingOptions[set].curOpt == settingOptions[set].opts[i]){
                    ctx.fillStyle=colors.hudColor;
                    ctx.fillRect(sX+5+i*120,setHei+15,110,20);
                    ctx.fillStyle=colors.hudBackColor;
                    var oName = ""+settingOptions[set].opts[i]+(settingOptions[set].input==="TAX"?"%":"");
                    ctx.fillText(oName,sX+15+i*120+(7-oName.length)*8,setHei+32);
                }
                else{
                    ctx.fillStyle=colors.hudColor;
                    ctx.strokeStyle=colors.hudColor;
                    ctx.strokeRect(sX+5+i*120,setHei+15,110,20);
                    var oName = ""+settingOptions[set].opts[i]+(settingOptions[set].input==="TAX"?"%":"");
                    ctx.fillText(oName,sX+15+i*120+(7-oName.length)*8,setHei+32);
                }

                if(mX < sX+5+i*120+110 && mX > sX+5+i*120 &&
                   mY < setHei+35 && mY > setHei+15 && me.info.teamRole==="LEADER"){
                    teamMenuHover = [settingOptions[set].input,settingOptions[set].opts[i]];
                    ctx.fillStyle=colors.hudColor;
                    ctx.globalAlpha = .5;
                    ctx.fillRect(sX+5+i*120,setHei+15,110,20);
                }
            }
            ctx.fill();
        }

        //Draw save button
        ctx.beginPath();
        ctx.font = "bold 20pt Courier";
        ctx.fillStyle=colors.hudColor;
        setHei = sY+hei - 50;
        if(mX < sX+wid-20 && mX > sX+wid-120 &&
           mY < setHei+35 && mY > setHei && me.info.teamRole==="LEADER"){
            teamMenuHover = "SAVE";
            ctx.fillRect(sX+wid-120,setHei,100,35);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("SAVE",sX+wid-105,setHei+25);
        }
        else if(me.info.teamRole==="LEADER"){
            ctx.strokeStyle=colors.hudColor;
            ctx.strokeRect(sX+wid-120,setHei,100,35);
            ctx.fillText("SAVE",sX+wid-105,setHei+25);
        }
    }

}

function drawPlayerList(ctx, startX, startY, width, height){
    //Calculate Drawing Area
    var sX = startX+width/8;
    var sY = startY+height/10;
    var wid = width-(sX-startX)*2;
    var hei = height-(sY-startY)*2;

    //Draw Box
    ctx.beginPath();
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(sX,sY,wid,hei);
    ctx.fillRect(sX,sY,wid,hei);
    ctx.stroke();

    playerListHover = -1;

    ctx.fillStyle = colors.hudColor;
    ctx.font = "bold 24pt Courier";
    ctx.fillText("PLAYERS",sX+8,sY+30);
    ctx.font = "12pt Courier";
    ctx.fillText("(click to invite)",sX+wid-180,sY+14);

    //Draw Scrollbar
    var filteredList = filterPlayerList(players);
    var listSize = 28;
    if(playerListScroll > filteredList.length || filteredList.length <= listSize) playerListScroll = 0;
    else if(playerListScroll > filteredList.length-listSize && filteredList.length > listSize) playerListScroll = filteredList.length-listSize;

    if(filteredList.length > listSize){
        ctx.beginPath();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = colors.hudColor;
        ctx.fillRect(sX+wid-20,sY+75,10,hei-85);
        ctx.globalAlpha = 1.0;
        var barsize = (listSize/filteredList.length)*(hei-85);
        ctx.fillRect(sX+wid-25,sY+75+playerListScroll*((hei-85)-barsize)/(filteredList.length-listSize),20,barsize);
    }

    //Draw list
    ctx.beginPath();
    ctx.globalAlpha = 1.0;
    sY += 40;
    ctx.fillStyle = colors.hudColor;
    ctx.font = "14pt Courier";
    ctx.strokeRect(sX+5,sY+30,wid-40,1);
    ctx.fillText("NAME",sX+8,sY+20);
    ctx.fillText("TEAM",sX+170,sY+20);
    ctx.fillText("POWER",sX+370,sY+20);
    ctx.fillText("PING",sX+460,sY+20);

    ctx.font = "11pt Courier";
    var yAdj = 0, drawAmount = Math.min(filteredList.length, listSize);

    for(var i = playerListScroll; yAdj < drawAmount && i < filteredList.length; i++){
        if(typeof filteredList[i].name !=="undefined"){
            if(mX < sX+wid-50 && mX > sX+6 &&
               mY < sY+37+20*yAdj+17 && mY > sY+37+20*yAdj){
                ctx.fillStyle = colors.hudColor;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(sX+6,sY+37+20*yAdj,wid-50,17);
                playerListHover = filteredList[i].id;
            }

            ctx.fillStyle = colors.hudColor;
            ctx.globalAlpha = 1.0;

            ctx.fillText(filteredList[i].name,sX+8,sY+50+20*yAdj);
            if(filteredList[i].team>-1)
                ctx.fillText(teamList[filteredList[i].team].name,sX+170,sY+50+20*yAdj);
            else
                ctx.fillText("N/A",sX+170,sY+50+20*yAdj);
            ctx.fillText(filteredList[i].powerLevel,sX+390,sY+50+20*yAdj);
            ctx.fillText(filteredList[i].ping+"ms",sX+460,sY+50+20*yAdj);
            yAdj++;
        }
    }
    ctx.globalAlpha = 1.0;
}

function drawBase(ctx, startX, startY, tileSize, type, lvl, color){
    ctx.fillStyle = color;
    ctx.globalAlpha = 1.0;

    if(type==="DIAMOND"){
        ctx.beginPath();
        ctx.save();
        ctx.translate(tileSize/2+startX, tileSize/2+startY);
        ctx.rotate(Math.PI / 4);
        ctx.translate(-(tileSize/2 / 2), -(tileSize/2 / 2));
        ctx.fillRect(0,0, tileSize/2, tileSize/2);
        ctx.restore();
        if(lvl>=2)
            ctx.fillRect(tileSize/4+startX, tileSize/4+startY, tileSize/2, tileSize/2);
        if(lvl==3){
            ctx.globalAlpha = 0.7;
            ctx.save();
            ctx.translate(tileSize/2+startX, tileSize/2+startY);
            ctx.rotate(Math.PI / 8);
            ctx.translate(-(tileSize/2 / 2), -(tileSize/2 / 2));
            ctx.fillRect(0,0, tileSize/2, tileSize/2);
            ctx.rotate(Math.PI / 4);
            ctx.translate(tileSize/10, -tileSize/4);
            ctx.fillRect(0,0, tileSize/2, tileSize/2);
            ctx.restore();
        }
        ctx.fill();
    }
    else if(type==="CIRCLE"){
        if(lvl == 1){
            ctx.beginPath();
            ctx.arc(tileSize/2+startX,tileSize/2+startY,tileSize/4,0,2*Math.PI);
            ctx.fill();
        }else if(lvl == 2){
            ctx.beginPath();
            ctx.arc(tileSize/2+startX-tileSize/8,tileSize/2+startY,tileSize/4,0,2*Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tileSize/2+startX+tileSize/8,tileSize/2+startY,tileSize/4,0,2*Math.PI);
            ctx.fill();
        }else if(lvl == 3){
            ctx.beginPath();
            ctx.arc(tileSize/2+startX-tileSize/8,tileSize/2+startY-tileSize/8,tileSize/5,0,2*Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tileSize/2+startX+tileSize/8,tileSize/2+startY-tileSize/8,tileSize/5,0,2*Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tileSize/2+startX-tileSize/8,tileSize/2+startY+tileSize/8,tileSize/5,0,2*Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(tileSize/2+startX+tileSize/8,tileSize/2+startY+tileSize/8,tileSize/5,0,2*Math.PI);
            ctx.fill();
        }
    }
    else if(type==="TRIANGLE"){
        if(lvl == 1){
            var path = new Path2D();
            path.moveTo(startX+tileSize/2,startY+(tileSize-tileSize/4));
            path.lineTo(startX+(tileSize-tileSize/6),startY+tileSize/4);
            path.lineTo(startX+tileSize/6,startY+tileSize/4);
            ctx.fill(path);
        }
        else if(lvl == 2){
            var path = new Path2D();
            path.moveTo(startX+tileSize/2,startY+tileSize/4);
            path.lineTo(startX+(tileSize-tileSize/6),startY+(tileSize-tileSize/4));
            path.lineTo(startX+tileSize/6,startY+(tileSize-tileSize/4));
            ctx.fill(path);
            path = new Path2D();
            path.moveTo(startX+tileSize/2,startY+(tileSize-tileSize/4));
            path.lineTo(startX+(tileSize-tileSize/6),startY+tileSize/4);
            path.lineTo(startX+tileSize/6,startY+tileSize/4);
            ctx.fill(path);
        }
        else if(lvl == 3){
            var path = new Path2D();
            path.moveTo(startX+tileSize/2,startY+(tileSize-tileSize/4));
            path.lineTo(startX+(tileSize-tileSize/3),startY+tileSize/2);
            path.lineTo(startX+tileSize/3,startY+tileSize/2);
            ctx.fill(path);

            path = new Path2D();
            path.moveTo(startX+(tileSize-tileSize/3),startY+tileSize/2);
            path.lineTo(startX+(tileSize-tileSize/6),startY+tileSize/4);
            path.lineTo(startX+tileSize/2,startY+tileSize/4);
            ctx.fill(path);

            path = new Path2D();
            path.moveTo(startX+tileSize/3,startY+tileSize/2);
            path.lineTo(startX+tileSize/2,startY+tileSize/4);
            path.lineTo(startX+tileSize/6,startY+tileSize/4);
            ctx.fill(path);
        }
    }
}

function drawConfirmDialog(ctx, startX, startY, width, height){
    //Calculate Drawing Area
    var sX = startX+width/3;
    var sY = startY+height/2.4;
    var wid = width-(sX-startX)*2;
    var hei = height-(sY-startY)*2;

    confirmHover = -1;

    ctx.beginPath();
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(sX,sY,wid,hei);
    ctx.fillRect(sX,sY,wid,hei);
    ctx.stroke();

    if(confirmDialog==0){ //Join Team
        ctx.fillStyle = colors.hudColor;
        ctx.font = "18px Courier";
        ctx.fillText("Are you sure you ",sX+25,sY+25);
        ctx.fillText("want to join ",sX+25,sY+45);
        ctx.fillText(teamList[valueLock].name+"?",sX+25,sY+65);
        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.font = "20px Courier";

        //Join
        if(mX < sX+105 && mX > sX+25 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("JOIN",sX+40,sY+hei-25);
            confirmHover = 0;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("JOIN",sX+40,sY+hei-25);
        }

        //Cancel
        if(mX < sX+wid-25 && mX > sX+wid-105 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
            confirmHover = 1;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
        }
    }
    else if(confirmDialog==1){ //Create Team
        ctx.fillStyle = colors.hudColor;
        ctx.font = "18px Courier";
        ctx.fillText("Are you sure you ",sX+25,sY+25);
        ctx.fillText("want to create ",sX+25,sY+45);
        ctx.fillText(tName+"?",sX+25,sY+65);
        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.font = "20px Courier";

        //Create
        if(mX < sX+105 && mX > sX+25 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("CREATE",sX+30,sY+hei-25);
            confirmHover = 0;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("CREATE",sX+30,sY+hei-25);
        }

        //Cancel
        if(mX < sX+wid-25 && mX > sX+wid-105 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
            confirmHover = 1;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
        }
    }
    else if(confirmDialog==2){ //Merge/Split
        ctx.fillStyle = colors.hudColor;
        ctx.font = "18px Courier";
        ctx.fillText("Would you like to ",sX+25,sY+25);
        ctx.fillText("merge or split from",sX+25,sY+45);
        ctx.fillText("your team?",sX+25,sY+65);
        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.font = "20px Courier";

        //Join
        if(mX < sX+105 && mX > sX+25 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("MERGE",sX+35,sY+hei-25);
            confirmHover = 0;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("MERGE",sX+35,sY+hei-25);
        }

        //Cancel
        if(mX < sX+wid-25 && mX > sX+wid-105 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("SPLIT",sX+wid-95,sY+hei-25);
            confirmHover = 1;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("SPLIT",sX+wid-95,sY+hei-25);
        }
    }
    else if(confirmDialog==3){ //D/C reconnect?
        ctx.fillStyle = colors.hudColor;
        ctx.font = "18px Courier";
        ctx.fillText("You were afk for too ",sX+25,sY+25);
        ctx.fillText(" long. You have been ",sX+25,sY+45);
        ctx.fillText("     disconnected.   ",sX+25,sY+65);
        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.font = "20px Courier";

        //Join
        if(mX < sX+105 && mX > sX+25 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+wid/2-40,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("RECON",sX+wid/2-30,sY+hei-25);
            confirmHover = 0;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("RECON",sX+35,sY+hei-25);
        }

        // //Cancel
        // if(mX < sX+wid-25 && mX > sX+wid-105 &&
        //    mY < sY+hei-15 && mY > sY+hei-45){
        //     ctx.fillStyle = colors.hudColor;
        //     ctx.fillRect(sX+wid-105,sY+hei-45,80,30);
        //     ctx.fillStyle = colors.hudBackColor;
        //     ctx.fillText("QUIT",sX+wid-90,sY+hei-25);
        //     confirmHover = 1;
        // }
        // else{
        //     ctx.strokeStyle = colors.hudColor;
        //     ctx.strokeRect(sX+wid-105,sY+hei-45,80,30);
        //     ctx.fillStyle = colors.hudColor;
        //     ctx.fillText("QUIT",sX+wid-90,sY+hei-25);
        // }
    }
}


//******************************************************************************
// Event Handler Functions
//******************************************************************************
function handleKeypress(e){
    var keyCode = e.which || e.keyCode;

    if(gameStart){
        if(((keyCode > 31 && keyCode < 128) || (keyCode > 185)) && name.length < 16){
            name = name+""+String.fromCharCode(keyCode);
            name = name.replace("/","_").replace("\'","_").replace("\"","_").replace("#","_");
        }
        drawScreen();
    }else if(chatMode){
        if(((keyCode > 31 && keyCode < 128) || (keyCode > 185)) && chatMsg.length < 140){
            chatMsg = chatMsg+""+String.fromCharCode(keyCode);
            chatMsg = chatMsg.replace("/","_").replace("#","_");
        }
        drawScreen();
    }else if(createTeamMenu){
        if(((keyCode > 31 && keyCode < 128) || (keyCode > 185)) && tName.length < 20){
            tName = tName+""+String.fromCharCode(keyCode);
            tName = tName.replace("/","_").replace("#","_");
        }
        drawScreen();
    }

    autoDCCount = 0;
}

function handleKeydown(e){
    var keyCode = e.which || e.keyCode;

    if (keyCode == 27 && !shopMode && !createTeamMenu && !joinTeamMenu && !teamMenu && !playerListMenu){ //Open Menu (esc)
        settingsView = !settingsView;
        if(!settingsView)
            $(".modal").toggle(false);
        drawScreen();
    }
    else if(gameStart){
        if(keyCode == 13){ //Enter
            init();
        }else if(keyCode == 8){ //backspace
            name = name.substring(0,name.length-1);
            drawScreen();
        }
    }
    else if(chatMode){
        if(keyCode == 13){
            chatMode = false;
            sendChatMsg();
        }else if(keyCode == 8){ //backspace
            chatMsg = chatMsg.substring(0,chatMsg.length-1);
            drawScreen();
        }
    }
    else if(createTeamMenu){
        if(keyCode == 8){ //backspace
            tName = tName.substring(0,tName.length-1);
            drawScreen();
        }
        else if(keyCode == 27){
            createTeamMenu = false;
        }
    }
    else if(me.info.teamID==-1){
        if(!createTeamMenu)
            joinTeamMenu = true;
    }
    else if(keyCode == 27){
        joinTeamMenu = false;
        playerListMenu = false;
        teamMenu = false;
        createTeamMenu = false;
        shopMode = false;
    }
    else if(keyCode == 56){
        joinTeamMenu = !joinTeamMenu;
        teamMenu = false;
        createTeamMenu = false;
        playerListMenu = false;
        shopMode = false;

        if(joinTeamMenu){
            teamRec = [];
        }
    }
    else if(keyCode == 57){
        playerListMenu = !playerListMenu;
        joinTeamMenu = false;
        createTeamMenu = false;
        teamMenu = false;
        shopMode = false;
    }
    else if(keyCode == 48){
        teamMenu = !teamMenu;
        joinTeamMenu = false;
        createTeamMenu = false;
        playerListMenu = false;
        shopMode = false;
    }
    else if(keyCode == 73){  //i
        statInfo = !statInfo;
    }
    else if(keyCode == 13){
        chatMode = true;
    }
    else if(keyCode == 77 && !settingsView){  //M
        mapView = !mapView;
        shopMode = false;
    }
    else if(keyCode == 77 && mapView){  //M
        mapView = false;
        shopMode = false;
        settingsView = false;
    }
    else if(!shopMode && !mapView && game.phase==0){
        if(keyCode == 65 || keyCode == 37){        //A
            updateQueue({"type":"MOVE","direction":"W"});
        }else if(keyCode == 68 || keyCode == 39){  //D
            updateQueue({"type":"MOVE","direction":"E"});
        }else if(keyCode == 87 || keyCode == 38){  //W
            updateQueue({"type":"MOVE","direction":"N"});
        }else if(keyCode == 83 || keyCode == 40){  //S
            updateQueue({"type":"MOVE","direction":"S"});
        }else if(keyCode == 49){  //1
            updateQueue({"type":"SCAN"});
        }else if(keyCode == 50){  //2
            updateQueue({"type":"LOOT"});
        }else if(keyCode == 51){  //3
            updateQueue({"type":"HOLD"});
        }else if(keyCode == 89 && me.stats.hp == 0){  //Y
            requestRespawn();
        }else if(keyCode == 79 && shop.withinShop!=null && !settingsView){  //O
            shopMode = true;
            mapView = false;
        }else if(keyCode == 81){          //Q
            doSpecialAction(0);
        }else if(keyCode == 69){          //E
            doSpecialAction(1);
        }
    }
    else if(shopMode){
        if(keyCode == 79 || keyCode == 27){  //O or escape
            shopMode = false;
        }
        if(shop.withinShop==="SHOP"){
            for(var i = 0; i < baseStore.length; i++){
                if(keyCode == 49+i){
                    makePurchase(baseStore[i].pLabel);
                    break;
                }
            }
        }
        else if(shop.withinShop==="SSHOP"){
            if(curShopTab > -1 && curShopTab < 5) //In shop
                for(var i = 0; i < tabs[curShopTab].length; i++){
                    if(keyCode == 49+i){
                        makePurchase(tabs[curShopTab][i].pLabel);
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
                    if(keyCode == 81){        //Q
                        changeLoadout(0,me.storage[i].name);
                    }else if(keyCode == 69){  //E
                        changeLoadout(1,me.storage[i].name);
                    }
            }
        }
    }
    else if(keyCode == 79 && shop.withinShop!=null && !settingsView){  //O
        shopMode = true;
        mapView = false;
    }

    autoDCCount = 0;
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
                           drawScreen();
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
    else if(confirmDialog>-1){
        if(confirmDialog==0){
            if(confirmHover==0){ //join
                var type = "none";

                if(me.info.teamID>-1){
                    if(me.info.teamRole==="LEADER" && teamList[me.info.teamID].members.length>1){
                        confirmDialog = 2;
                    }
                    else{
                        joinTeam(valueLock,type);
                        confirmHover = -1;
                        confirmDialog = -1;
                        valueLock = -1;
                    }
                }
                else{
                    joinTeam(valueLock,type);
                    confirmHover = -1;
                    confirmDialog = -1;
                    valueLock = -1;
                }
            }else if(confirmHover==1){
                confirmHover = -1;
                confirmDialog = -1;
                valueLock = -1;
            }
        }
        else if(confirmDialog==1){
            if(confirmHover==0){ //join
                createTeam();
                confirmHover = -1;
                confirmDialog = -1;
                valueLock = -1;
            }else if(confirmHover==1){
                confirmHover = -1;
                confirmDialog = -1;
                valueLock = -1;
            }
        }
        else if(confirmDialog==2){
            if(confirmHover==0){
                joinTeam(valueLock,"MERGE");
                confirmHover = -1;
                confirmDialog = -1;
                valueLock = -1;
            }
            else if(confirmHover==1){
                joinTeam(valueLock,"SPLIT");
                confirmHover = -1;
                confirmDialog = -1;
                valueLock = -1;
            }
        }
        else if(confirmDialog==3){
            if(confirmHover==0){
                document.cookie = "token="+me.token+"; expires=Mon, 30 Dec 2019 12:00:00 UTC; path=/";
                location.reload();
            }
        }
    }
    else if(joinTeamMenu){
        if(joinTeamHover==="CREATE"){
            createTeamMenu = true;
            joinTeamMenu = false;
        }
        else if(joinTeamHover>-1){
            confirmDialog = 0;
            valueLock = joinTeamHover;
        }
    }
    else if(createTeamMenu){
        if(createTeamHover==="CREATE"){
            confirmDialog = 1;
            valueLock = joinTeamHover;
        }
        else if(createTeamHover==="CANCEL"){
            createTeamMenu = false;
        }
        else{
            if(createTeamHover == 0){
                bShape = "DIAMOND";
            }else if(createTeamHover == 1){
                bShape = "TRIANGLE";
            }else if(createTeamHover == 2){
                bShape = "CIRCLE";
            }
        }
    }
    else if(teamMenu){
        if(teamMenuHover < 4 && teamMenuHover > -1){
            curTeamTab = teamMenuHover;

            if(curTeamTab==3){ //Snapshot settings
                curSettings = teamList[me.info.teamID].settings;
            }
        }
        else if(curTeamTab==1){
            console.log(teamMenuHover);
        }
        else if(curTeamTab==3){
            if(teamMenuHover[0]==="MEMBERSHIP"){
                curSettings.membership = teamMenuHover[1];
                teamSetSaved = false;
            }
            else if(teamMenuHover[0]==="PING"){
                curSettings.ping = teamMenuHover[1];
                teamSetSaved = false;
            }
            else if(teamMenuHover[0]==="BUILD"){
                curSettings.building = teamMenuHover[1];
                teamSetSaved = false;
            }
            else if(teamMenuHover[0]==="UPGRADE"){
                curSettings.upgrading = teamMenuHover[1];
                teamSetSaved = false;
            }
            else if(teamMenuHover[0]==="PROFIT"){
                curSettings.profitDivide = teamMenuHover[1];
                teamSetSaved = false;
            }
            else if(teamMenuHover[0]==="TAX"){
                curSettings.tax = teamMenuHover[1];
                teamSetSaved = false;
            }
            else if(teamMenuHover==="SAVE"){
                updateTeamSettings();
            }
        }
    }
    else if(playerListMenu){
        if(playerListHover > -1){
            console.log(playerListHover);
        }
    }
    else if(shopMode && shop.withinShop=="SSHOP"){
       //Change tabs
       var startX = c.width/8;
       var startY = c.height/4;

       if(mX > c.width-startX && mX < c.width-startX+25){
           var tHei = 60;
           for(var i = 0; i < tabs.length+1; i++){
               if(mY > startY+tHei*i && mY < startY+tHei*i+tHei){
                   curShopTab = i;
                   break;
               }
           }
       }

    }
    else if(!gameStart && !mapView && !shopMode &&
            !joinTeamMenu && !teamMenu && !createTeamMenu){
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

    autoDCCount = 0;
}

function handleMousemove(e){
    e.preventDefault();
    e.stopPropagation();
    mX = parseInt(e.clientX - offsetX);
    mY = parseInt(e.clientY - offsetY);
    if(!shopMode && !mapView){
        drawScreen();
    }
}

function handleMouseout(e){
    mX = -1;
    mY = -1;
}

function handleMousedown2(e){
    var cX = parseInt(e.clientX - offsetX2);
    var cY = parseInt(e.clientY - offsetY2);

    for(var i = 0; i < 3; i++){
        if(cX>=40 && cX<=260 &&
           cY>=i*45+70 && cY<=i*45+105){
               removeFromQueue(i);
               console.log(i);

           }
    }

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

    autoDCCount = 0;
}

function handleMouseWheel(e){
    if(joinTeamMenu){
        if(e.deltaY<0 && joinTeamScroll > 0){
            joinTeamScroll--;
        }else if(e.deltaY > 0 && joinTeamScroll < teamList.length-22 && teamList.length > 22){
            joinTeamScroll++;
        }
    }
    else if(teamMenu){
        if(e.deltaY < 0 && teamScroll > 0){
            teamScroll--;
        }else if(e.deltaY > 0){
            teamScroll++;
        }

        if(teamScroll < 0) teamScroll = 0;
    }
    if(playerListMenu){
        if(e.deltaY<0 && playerListScroll > 0){
            playerListScroll--;
        }else if(e.deltaY > 0 ){
            playerListScroll++;
        }

        if(playerListScroll < 0) playerListScroll = 0;
    }

    autoDCCount = 0;
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
            return c.substring(name.length+1, c.length);
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
    var c1 = document.getElementById("monitor");
    var c2 = document.getElementById("sidebar");
    prevWid = $( document ).width();
    $(".gameScreen").css("margin-left",(prevWid-c1.width-c2.width)/2+"px");

    //Position the input boxes
    $(".input1").css({
        "left": (prevWid-c1.width-c2.width)/2 + c1.width/3.5+177,
        "top": c1.height/4+60+132
    });
    $(".input2").css({
        "left": (prevWid-c1.width-c2.width)/2 + c1.width/3.5+177,
        "top": c1.height/4+90+132
    });

    var $canvas = $("#monitor")
    var canvasOffset = $canvas.offset()
    offsetX = canvasOffset.left;
    offsetY = canvasOffset.top;
    var $canvas2 = $("#sidebar")
    var canvasOffset2 = $canvas2.offset()
    offsetX2 = canvasOffset2.left;
    offsetY2 = canvasOffset2.top;

}

function teamValidation(base, area){
    if(base=="" || area=="")
        return "Base and/or area color missing";
    if(base === area)
        return "Base and area need to be different colors";
    if(tName.length<4)
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

    if(Math.abs(ar-br)<50 && Math.abs(ag-bg)<50 && Math.abs(ab-bb)<50)
        return "Base color is too similar to Area color";

    for(var b in teamList){
        if(teamList[b].id!=null){
            hex = teamList[b].colors.baseColor.replace('#','');
            var br2 = parseInt(hex.substring(0,2), 16);
            var bg2 = parseInt(hex.substring(2,4), 16);
            var bb2 = parseInt(hex.substring(4,6), 16);
            hex = teamList[b].colors.areaColor.replace('#','');
            var ar2 = parseInt(hex.substring(0,2), 16);
            var ag2 = parseInt(hex.substring(2,4), 16);
            var ab2 = parseInt(hex.substring(4,6), 16);

            if(Math.abs(br2-br)<20 && Math.abs(bg2-bg)<20 && Math.abs(bb2-bb)<20 &&
               Math.abs(ar2-ar)<30 && Math.abs(ag2-ag)<30 && Math.abs(ab2-ab)<30){
                return "Color combo has been  taken";
            }
        }
    }

    return true;
}

function filterMemberList(members, admins, leader){
    var mems = [];
    for(var m in members){
        // if(members[m].id != leader.id){
        //     var adm = false;
        //     for(var a in admins){
        //         if(members[m].id != admins[a].id){
        //             adm = true;
        //             break;
        //         }
        //     }
        //     if(!adm)
        //         mems.push({
        //             "id":members[m].id,
        //             "name":members[m].name,
        //             "powerLevel":members[m].powerLevel
        //         });
        // }
        mems.push({
            "id":members[m].id,
            "name":members[m].name,
            "powerLevel":members[m].powerLevel
        });
    }

    //Sort the list
    mems.sort(function(a, b){
        var idA = a.id, idB = b.id;

        if(idA > idB) return -1;
        if(idA < idB) return 1;
        return 0;
    });

    return mems;
}

function filterPlayerList(list){
    var newList = [];
    for(var i = 0; i < list.length; i++){
        if(typeof list[i].id !=="undefined")
            newList.push(list[i]);
    }

    return newList;
}
