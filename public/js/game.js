var mX2, mY2;
var hover = [-1,-1];
var gameStart = true;
var statInfo = false;
var saveOnStartup = true;

//Auto d/c
var autoDCLimit = 120; //~10 minutes
var autoDCCount = 0;
var intervalTimer;
var tick = 50;
var lastRound = -1;

var medcall = 0;

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
            console.log("token: "+data.user.token);
            me = data.user;

            if(saveOnStartup)
                document.cookie = "token="+me.token+"; expires=Mon, 30 Dec 2019 12:00:00 UTC; path=/";
            gameStart = false;
            intervalTimer = setInterval(function(){newData();},tick);

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
        console.log("token: "+data.user.token);
        me = data.user;

        if(saveOnStartup)
            document.cookie = "token="+me.token+"; expires=Mon, 30 Dec 2019 12:00:00 UTC; path=/";
        gameStart = false;
        intervalTimer = setInterval(function(){newData();},tick);
    });
}

//******************************************************************************
// Server Calls Functions
//******************************************************************************
function newData(){
    newShopData(function(){});
    newBattleLogData(function(){});

    highchangedata(function(){

        if(medcall==0){
            medchangedata(function(){
                if(curSettings==null && me.info.teamID>-1) curSettings = teamList[me.info.teamID].settings;

                if(me.info.teamID == -1){
                    if(openWindow!=="createTeamMenu")
                        openWindow = "joinTeamMenu";
                }
            });
        }
        medcall= (medcall+1)%3;

        if(game.phase!=0){
            lowchangedata(function(){
                drawScreen();
            });
        }
        else{
            drawScreen();
        }

        if(game.phase == 0 && lastRound == 3){
            autoDCCount++;
            lowchangedata(function(){
                drawScreen();
            });
        }
        lastRound = game.phase;

        drawSideBar();
        drawTimer();
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
