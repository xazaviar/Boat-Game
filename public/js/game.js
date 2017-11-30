var mX2, mY2;
var hover = [-1,-1];
var gameStart = true;
var store;
var statInfo = false;
var saveOnStartup = true;

//Auto d/c
var autoDCLimit = 120; //~10 minutes
var autoDCCount = 0;
var intervalTimer;
var tick = 50;
var lastRound = -1;


var displayBlink = false;
var displayCannon = false;
var displayRailgun = false;
var displayWall = false;
var railDir = "N";

//Data for server
var name = "";

setTimeout(function() {
    screenResize();
    $("#monitor").mousemove(function(e){handleMousemove(e);});
    $("#monitor").mouseout(function(e){handleMouseout(e);});
    $("#monitor").mousedown(function(e){handleMousedown(e);});
    $("#sidebar").mousemove(function(e){handleMousemove2(e);});
    $("#sidebar").mouseout(function(e){handleMouseout2(e);});
    $("#sidebar").mousedown(function(e){handleMousedown2(e);});
    window.addEventListener('keydown',function(e){handleKeydown(e)},false);
    window.addEventListener('keypress',function(e){handleKeypress(e)},false);
    window.addEventListener('wheel',function(e){handleMouseWheel(e)},false);

    //See if colors can be loaded
    var temp = JSON.parse(localStorage.getItem('savedColors'));
    if(temp!=null) colors = temp;
    else colors = colorsDefault;
    $("body").css("background-color",colors.hudBackColor);


    $("#color-picker1").hexColorPicker({
        "container":"dialog",
		"colorModel":"hsl",
		"pickerWidth":250,
		"size":7,
		"style":"hex"
    });
    $("#color-picker2").hexColorPicker({
        "container":"dialog",
		"colorModel":"hsl",
		"pickerWidth":250,
		"size":7,
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
                // map = data.map;

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
            // map = data.map;

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
        baseList = data.baseList;
        teamList = data.teamList;
        battleLog = data.user.battleLog;
        activeAttacks = data.user.activeAttacks;

        firstData = true;
        if(curSettings==null && me.info.teamID>-1) curSettings = teamList[me.info.teamID].settings;

        //Update Tabs
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

        //Check for screen resize
        if($( document ).width()!=prevWid) screenResize();

        if(me.info.teamID == -1){
            if(openWindow!=="createTeamMenu")
                openWindow = "joinTeamMenu";
        }

        drawScreen();
        drawTimer();
        drawSideBar();


        if(game.phase == 0 && lastRound == 3){
            autoDCCount++;
        }
        lastRound = game.phase;
    });


    if(autoDCCount > autoDCLimit){
        clearInterval(intervalTimer);
        confirmDialog = 3;
        drawScreen();
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
    }else if(openWindow === "createTeamMenu"){
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

    if (keyCode == 27 && openWindow===""){ //Open Menu (esc)
        openWindow = "settingsView";
        drawScreen();
    }
    else if (keyCode == 27 && openWindow==="settingsView"){ //Open Menu (esc)
        openWindow = "";
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
            sendChatMsg(me.token, me.id, chatMsg, chatMessageType);
        }
        else if(keyCode == 8){ //backspace
            chatMsg = chatMsg.substring(0,chatMsg.length-1);
            drawScreen();
        }
    }


    else if(openWindow === "createTeamMenu"){
        if(keyCode == 8){ //backspace
            tName = tName.substring(0,tName.length-1);
            drawScreen();
        }else if(keyCode == 27)
            openWindow = "";
    }
    else if(me.info.teamID==-1){
        if(openWindow !== "createTeamMenu")
            openWindow = "joinTeamMenu";
    }
    else if(keyCode == 27){
        openWindow = "";
        confirmDialog = -1;
    }
    else if(keyCode == 56 || keyCode == 74){
        if(openWindow !== "joinTeamMenu") openWindow = "joinTeamMenu";
        else openWindow = "";
        confirmDialog = -1;

        if(openWindow === "joinTeamMenu"){
            teamRec = [];
        }
    }
    else if(keyCode == 57 || keyCode == 80){
        if(openWindow !== "playerListMenu") openWindow = "playerListMenu";
        else openWindow = "";
        confirmDialog = -1;
    }
    else if(keyCode == 48 || keyCode == 84){
        if(openWindow !== "teamMenu") openWindow = "teamMenu";
        else openWindow = "";
        confirmDialog = -1;
    }
    else if(keyCode == 73){  //i
        statInfo = !statInfo;
    }
    else if(keyCode == 13){ //Enter
        chatMode = true;
    }
    else if(keyCode == 77 ){  //M
        if(openWindow !== "mapView") openWindow = "mapView";
        else openWindow = "";
    }

    else if(keyCode == 17){  //CTRL
        if(chatMessageType === "ALL") chatMessageType = "TEAM";
        else chatMessageType = "ALL";
    }
    else if(keyCode == 79 && shop.withinShop>-1){  //O
        if(openWindow === "") openWindow = "shopMode";
        else openWindow = "";
    }
    else if(openWindow === "" && game.phase==0){
        if(keyCode == 65 || keyCode == 37){        //A
            updateQueue(me.token,me.id,{"type":"MOVE","direction":"W"});
        }else if(keyCode == 68 || keyCode == 39){  //D
            updateQueue(me.token,me.id,{"type":"MOVE","direction":"E"});
        }else if(keyCode == 87 || keyCode == 38){  //W
            updateQueue(me.token,me.id,{"type":"MOVE","direction":"N"});
        }else if(keyCode == 83 || keyCode == 40){  //S
            updateQueue(me.token,me.id,{"type":"MOVE","direction":"S"});
        }else if(keyCode == 49){  //1
            updateQueue(me.token,me.id,{"type":"SCAN"});
        }else if(keyCode == 50){  //2
            updateQueue(me.token,me.id,{"type":"LOOT"});
        }else if(keyCode == 51){  //3
            updateQueue(me.token,me.id,{"type":"HOLD"});
        }
        // else if(keyCode == 89 && me.stats.hp == 0){  //Y
        //     requestRespawn(me.token,me.id);
        // }
        else if(keyCode == 81){          //Q
            doSpecialAction(0);
        }else if(keyCode == 69){          //E
            doSpecialAction(1);
        }else if(keyCode == 82 && me.info.walls>0){          //r
            displayWall = !displayWall;
        }
    }
    else if(openWindow === "shopMode"){
        if(keyCode == 79){  //O or escape
            openWindow = "";
        }
        else if(shop.withinShop>1 && typeof mouseHover.load !== "undefined"){
            if(mouseHover.load < me.storage.length){
                if(keyCode == 81){        //Q
                    changeLoadout(me.token,me.id,0,me.storage[mouseHover.load].name);
                }else if(keyCode == 69){  //E
                    changeLoadout(me.token,me.id,1,me.storage[mouseHover.load].name);
                }
            }
        }
    }

    autoDCCount = 0;
}

function handleMousedown(e){
    if(confirmDialog>-1){
        if(confirmDialog==0){
            if(mouseHover==0){ //join
                var type = "none";

                if(me.info.teamID>-1){
                    if(me.info.teamRole==="LEADER" && teamList[me.info.teamID].members.length>1){
                        confirmDialog = 2;
                    }
                    else{
                        joinTeam(me.token,me.id,valueLock,type);
                        mouseHover = -1;
                        confirmDialog = -1;
                        valueLock = -1;
                    }
                }
                else{
                    joinTeam(me.token,me.id,valueLock,type);
                    mouseHover = -1;
                    confirmDialog = -1;
                    valueLock = -1;
                }
            }else if(mouseHover==1){
                mouseHover = -1;
                confirmDialog = -1;
                valueLock = -1;
            }
        }
        else if(confirmDialog==1){
            if(mouseHover==0){ //create
                createTeam(me.token, me.id, tName, aColor, bColor, bShape, teamList);
                mouseHover = -1;
                confirmDialog = -1;
                valueLock = -1;
            }else if(mouseHover==1){
                mouseHover = -1;
                confirmDialog = -1;
                valueLock = -1;
            }
        }
        else if(confirmDialog==2){
            if(mouseHover==0){
                joinTeam(me.token,me.id,valueLock,"MERGE");
                mouseHover = -1;
                confirmDialog = -1;
                valueLock = -1;
            }
            else if(mouseHover==1){
                joinTeam(me.token,me.id,valueLock,"SPLIT");
                mouseHover = -1;
                confirmDialog = -1;
                valueLock = -1;
            }
        }
        else if(confirmDialog==3){
            if(mouseHover==0){
                document.cookie = "token="+me.token+"; expires=Mon, 30 Dec 2019 12:00:00 UTC; path=/";
                location.reload();
            }
        }
        else if(confirmDialog==4){
            if(mouseHover==0){
                confirmDialog = 5;
            }
            else if(mouseHover==1){
                confirmDialog = 6;
            }
            else if(mouseHover==2){
                confirmDialog = 7;
            }
            else if(mouseHover==3){
                confirmDialog = -1;
                valueLock = -1;
            }
        }
        else if(confirmDialog==5){
            if(mouseHover==0){
                promote(me.token, me.id, valueLock.id);
            }
            else if(mouseHover==1){
                confirmDialog = -1;
                valueLock = -1;
            }
        }
        else if(confirmDialog==6){
            if(mouseHover==0){
                demote(me.token, me.id, valueLock.id);
            }
            else if(mouseHover==1){
                confirmDialog = -1;
                valueLock = -1;
            }
        }
        else if(confirmDialog==7){
            if(mouseHover==0){
                remove(me.token, me.id, valueLock.id);
            }
            else if(mouseHover==1){
                confirmDialog = -1;
                valueLock = -1;
            }
        }
        else if(confirmDialog==8){
            if(mouseHover==0){
                console.log(valueLock);
                invite(me.token, me.id, valueLock);
            }
            else if(mouseHover==1){
                confirmDialog = -1;
                valueLock = -1;
            }
        }
    }
    else if(openWindow === "settingsView"){
        if(typeof mouseHover.tab!=="undefined"){
            curSettingsTab = mouseHover.tab;
        }

        else if (mouseHover === "DEFAULT"){
            colors = JSON.parse(JSON.stringify(colorsDefault));
            $("body").css("background-color",colors.hudBackColor);
            saveColorScheme(colors);
        }


        //Check for color click
        else if(mouseHover!=-1){
            valueLock = mouseHover;
            displayModal(colors[valueLock], function(color){
                colors[valueLock] = color.toHexString();
                $("body").css("background-color",colors.hudBackColor);
                saveColorScheme(colors);
                $(".modal").toggle(false);
                drawScreen();
                valueLock = -1;
            });
       }
    }
    else if(openWindow === "joinTeamMenu"){
        if(mouseHover==="CREATE"){
            openWindow = "createTeamMenu";
        }
        else if(mouseHover>-1){
            confirmDialog = 0;
            valueLock = mouseHover;
        }
    }
    else if(openWindow === "createTeamMenu"){
        if(mouseHover==="CREATE"){
            confirmDialog = 1;
            valueLock = mouseHover;
        }
        else if(mouseHover==="CANCEL"){
            openWindow = "";
        }
        else{
            if(mouseHover == 0){
                bShape = "DIAMOND";
            }else if(mouseHover == 1){
                bShape = "TRIANGLE";
            }else if(mouseHover == 2){
                bShape = "CIRCLE";
            }
        }
    }
    else if(openWindow === "teamMenu"){
        if(mouseHover < 4 && mouseHover > -1){
            curTeamTab = mouseHover;

            if(curTeamTab==3){ //Snapshot settings
                curSettings = teamList[me.info.teamID].settings;
            }
        }
        else if(curTeamTab==0){
            if(mouseHover!=-1 && typeof mouseHover.baseID !== "undefined"){
                if(teamList[me.info.teamID].objective!=mouseHover.baseID)
                    setObjective(me.token, me.id, mouseHover.baseID);
                else
                    setObjective(me.token, me.id, -1);
            }
            else if(mouseHover==="UPGRADE"){
                upgradeBase(me.token,me.id,teamList[me.info.teamID].objective);
            }
            else if(mouseHover==-1 && teamList[me.info.teamID].objective!=-1){
                setObjective(me.token, me.id, -1);
            }
        }
        else if(curTeamTab==1){
            if(mouseHover!=-1){
                valueLock = mouseHover;
                confirmDialog = 4;
            }
        }
        else if(curTeamTab==3){
            if(mouseHover[0]==="MEMBERSHIP"){
                curSettings.membership = mouseHover[1];
                teamSetSaved = false;
            }
            else if(mouseHover[0]==="PING"){
                curSettings.ping = mouseHover[1];
                teamSetSaved = false;
            }
            else if(mouseHover[0]==="BUILD"){
                curSettings.building = mouseHover[1];
                teamSetSaved = false;
            }
            else if(mouseHover[0]==="UPGRADE"){
                curSettings.upgrading = mouseHover[1];
                teamSetSaved = false;
            }
            else if(mouseHover[0]==="PROFIT"){
                curSettings.profitDivide = mouseHover[1];
                teamSetSaved = false;
            }
            else if(mouseHover[0]==="TAX"){
                curSettings.tax = mouseHover[1];
                teamSetSaved = false;
            }
            else if(mouseHover==="SAVE"){
                updateTeamSettings(me.token, me.id, curSettings);
            }
        }
    }
    else if(openWindow === "playerListMenu"){
        var setting = teamList[me.info.teamID].settings.membership;
        if((me.info.teamRole!=="MEMBER" || (me.info.teamRole==="MEMBER" && setting!=="AD INV")) && me.info.teamID>-1)
            if(mouseHover > -1){
                valueLock = mouseHover;
                confirmDialog = 8;
            }
    }
    else if(openWindow === "shopMode"){
       if(typeof mouseHover.tab !== "undefined"){
           curShopTab = mouseHover.tab;
       }
       else if(typeof mouseHover.item !== "undefined"){
           makePurchase(me.token,me.id,mouseHover.item);
       }
    }
    else if(me.stats.hp == 0){  //Dead
        if(typeof mouseHover.spawnID != "undefined"){
            requestRespawn(me.token,me.id,mouseHover.spawnID);
        }
    }
    else if(openWindow === "" && !gameStart){
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
            updateQueue(me.token,me.id,{"type":"CANNON","location":[cX, cY]})
        }
        else if(displayRailgun){
            displayRailgun = false;
            updateQueue(me.token,me.id,{"type":"RAILGUN","direction":railDir})
        }
        else if(displayBlink){
            displayBlink = false;
            updateQueue(me.token,me.id,{"type":"BLINK","location":[cX, cY]})
        }
        else if(displayWall){
            displayWall = false;
            updateQueue(me.token,me.id,{"type":"WALL","location":[cX, cY]})
        }
        else
            updateQueue(me.token,me.id,{"type":"ATTACK","location":[cX, cY]})
     }

    autoDCCount = 0;
}

function handleMousemove(e){
    e.preventDefault();
    e.stopPropagation();
    mX = parseInt(e.clientX - offsetX);
    mY = parseInt(e.clientY - offsetY);
    if(openWindow !== "mapView"){
        drawScreen();
    }
}

function handleMouseout(e){
    mX = -1;
    mY = -1;
}

function handleMousemove2(e){
    e.preventDefault();
    e.stopPropagation();
    mX2 = parseInt(e.clientX - offsetX2);
    mY2 = parseInt(e.clientY - offsetY2);

    if(!gameStart)
        drawSideBar();
}

function handleMouseout2(e){
    mX2 = -1;
    mY2 = -1;
}

function handleMousedown2(e){
    if(me.invites.length > 0){
        if(mouseHover==0){
            valueLock = me.invites[0].id;
            var type = "none";

            if(me.info.teamID>-1){
                if(me.info.teamRole==="LEADER" && teamList[me.info.teamID].members.length>1){
                    confirmDialog = 2;
                }
                else{
                    joinTeam(me.token,me.id,valueLock,type);
                    mouseHover = -1;
                    confirmDialog = -1;
                    valueLock = -1;
                }
            }
            else{
                joinTeam(me.token,me.id,valueLock,type);
                mouseHover = -1;
                confirmDialog = -1;
                valueLock = -1;
            }
        }
        else if(mouseHover==1){
            declineInvite(me.token, me.id, me.invites[0].id);
        }
    }
    else if(mouseHover > -1){ //Remove from Queu
        removeFromQueue(me.token, me.id, mouseHover);
    }
    else if(mouseHover === "SAVE"){
        toggleSaving(me.token);
    }
    else if(mouseHover === "STATS"){
        statInfo = true;
    }
    else if(mouseHover === "HUD"){
        statInfo = false;
    }

    autoDCCount = 0;
}

function handleMouseWheel(e){
    if(typeof mouseHover.overBattlelog !== "undefined"){
        if(e.deltaY < 0 && blScroll > 0){
            blScroll--;
        }else if(e.deltaY > 0){
            blScroll++;
        }
    }
    else if(openWindow === "joinTeamMenu"){
        if(e.deltaY < 0 && joinTeamScroll > 0){
            joinTeamScroll--;
        }else if(e.deltaY > 0 && joinTeamScroll < teamList.length-22 && teamList.length > 22){
            joinTeamScroll++;
        }
    }
    else if(openWindow === "teamMenu"){
        if(e.deltaY < 0 && teamScroll > 0){
            teamScroll--;
        }else if(e.deltaY > 0){
            teamScroll++;
        }

        if(teamScroll < 0) teamScroll = 0;
    }
    else if(openWindow === "playerListMenu"){
        if(e.deltaY < 0 && playerListScroll > 0){
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
function doSpecialAction(slot){
    if(me.abilitySlots[slot].type==="HEAL" && me.abilitySlots[slot].canUse)
        updateQueue(me.token,me.id,{"type":"QUICKHEAL"});
    if(me.abilitySlots[slot].type==="TRAP" && me.abilitySlots[slot].canUse)
        updateQueue(me.token,me.id,{"type":"TRAP"});
    if(me.abilitySlots[slot].type==="ENG" && me.abilitySlots[slot].canUse)
        updateQueue(me.token,me.id,{"type":"ENERGY"});
    if(me.abilitySlots[slot].type==="HIDE" && me.abilitySlots[slot].canUse)
        updateQueue(me.token,me.id,{"type":"STEALTH"});
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
