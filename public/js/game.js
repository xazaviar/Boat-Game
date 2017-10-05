var offsetX;
var offsetY;
var tick = 50;
var mX, mY;
var hover = [-1,-1];
var shopMode = false;
var subMode = true;
var gameStart = true;
var settingsView = false;
var radarAngle = 0;
var radarTick = 1;
var radarINC = .1;
var radarAngleChange = true;
var radarFollow = 5;
var mapView = false;
var blink = false;

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

    "actionTextColor":  "#FFFFFF", //Default -> #FFFFFF
    "attackColor":      "#FF0000", //Default -> #FF0000
    "moveColor":        "#0000FF", //Default -> #0000FF
    "lootColor":        "#990099", //Default -> #990099
    "scanColor":        "#00AA00", //Default -> #00AA00
    "holdColor":        "#000080", //Default -> #000080

    "hpColor":          "#FF0000", //Default -> #FF0000
    "energyColor":      "#0000FF", //Default -> #0000FF
    "upgradeColor":     "#00FF00", //Default -> #00FF00
    "voidUpgradeColor": "#272727", //Default -> #272727

    "canBuyColor":      "#00FF00", //Default -> #00FF00
    "cantBuyColor":     "#999999", //Default -> #999999
    "needGoldColor":    "#FF0000", //Default -> #00FF00

    "timerGradient": false
}


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

    var $canvas = $("#monitor")
    var canvasOffset = $canvas.offset()
    offsetX = canvasOffset.left;
    offsetY = canvasOffset.top;
    $("#monitor").mousemove(function(e){handleMousemove(e);});
    $("#monitor").mouseout(function(e){handleMouseout(e);});
    $("#monitor").mousedown(function(e){handleMousedown(e);});
    window.addEventListener('keydown',function(e){handleKeydown(e)},false);

    //See if colors can be loaded
    var temp = JSON.parse(localStorage.getItem('savedColors'));
    if(temp!=null) colors = temp;
    else colors = colorsDefault;
    $("body").css("background-color",colors.hudBackColor);

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


//******************************************************************************
// Drawing Functions
//******************************************************************************
function drawMonitor(){
    var c = document.getElementById("monitor");
    var ctx = c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);

    var tileSize = c.width/(!gameStart?me.stats.radar:9);

    //GridLines
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudColor;
    if(subMode){
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
    }
    else{
        for(var x = 0; x < me.stats.radar-1; x++){
            ctx.beginPath();
            ctx.moveTo(tileSize+x*tileSize,0);
            ctx.lineTo(tileSize+x*tileSize,c.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0,tileSize+x*tileSize);
            ctx.lineTo(c.width,tileSize+x*tileSize);
            ctx.stroke();
        }

        //Draw Coordinates
        ctx.font = "10px Courier";
        var mid = parseInt(me.stats.radar/2);
        for(var x = 0; x < me.stats.radar; x++){
            for(var y = 0; y < me.stats.radar; y++){
                var cX = me.loc[0] - (mid-x);
                var cY = me.loc[1] - (mid-y);

                if(cX < 0) cX += map.length;
                if(cY < 0) cY += map.length;
                if(cX >= map.length) cX -= map.length;
                if(cY >= map.length) cY -= map.length;

                ctx.beginPath();
                ctx.fillText(""+cX+", "+cY,x*tileSize+tileSize/2-15,y*tileSize+tileSize-5);
            }
        }

    }

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
                else if(map[cX][cY]==="SHOP"){ //Shop

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
                else if(map[cX][cY]==="SSHOP"){ //Super Shop

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

        //Draw enemy Ships
        //TODO: SUPER SLOW, fix it
        if(players!=null){
            ctx.strokeStyle=colors.enemyColor
            ctx.fillStyle=colors.enemyColor;
            for(var i = 0; i < players.length; i++){
                //Check if same player
                var eloc = players[i].loc;
                if(!(eloc[0]==me.loc[0] && eloc[1]==me.loc[1] && me.stats.hp>0)){
                    var mid = parseInt(me.stats.radar/2);
                    for(var x = 0; x < me.stats.radar; x++){
                        for(var y = 0; y < me.stats.radar; y++){
                            var cX = me.loc[0] - (mid-x);
                            var cY = me.loc[1] - (mid-y);

                            if(cX < 0) cX += map.length;
                            if(cY < 0) cY += map.length;
                            if(cX >= map.length) cX -= map.length;
                            if(cY >= map.length) cY -= map.length;

                            if(eloc[0]==cX && eloc[1]==cY){
                                ctx.beginPath();
                                ctx.arc(x*tileSize+tileSize/2,y*tileSize+tileSize/2,tileSize/5,0,2*Math.PI);
                                ctx.fill();
                                ctx.font = "14px Courier";
                                ctx.fillText(players[i].name,x*tileSize+tileSize/2-(players[i].name.length*4),y*tileSize+tileSize/2-tileSize/4);

                            }
                        }
                    }
                }
            }
        }

        //Draw enemy Attacks
        var mid = parseInt(me.stats.radar/2);
        for(var x = 0; x < me.stats.radar; x++){
            for(var y = 0; y < me.stats.radar; y++){
                var cX = me.loc[0] - (mid-x);
                var cY = me.loc[1] - (mid-y);

                if(cX < 0) cX += map.length;
                if(cY < 0) cY += map.length;
                if(cX >= map.length) cX -= map.length;
                if(cY >= map.length) cY -= map.length;

                for(var a = 0; a < activeAttacks.length; a++){
                    if(activeAttacks[a][0]==cX && activeAttacks[a][1]==cY){
                        ctx.beginPath();
                        ctx.fillStyle = colors.attackColor;
                        ctx.globalAlpha = 0.3;
                        ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
                        ctx.globalAlpha = 1.0;
                        ctx.stroke();
                    }
                }
            }
        }


        //Draw attacks
        //TODO: Draw all actions
        var atk = 1;
        var actions = [];
        var prevLoc = [me.loc[0],me.loc[1]];
        for(var i = 0; i < me.queue.length; i++){
            if(me.queue[i].type==="ATTACK"){
                actions.push({"type":"ATTACK","loc":me.queue[i].location,"num":atk});
                atk++
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
        // if(actions.length>0)
        // console.log(JSON.stringify(actions));

        //TODO: SUPER SLOW, fix it
        var mid = parseInt(me.stats.radar/2);
        for(var x = 0; x < me.stats.radar && actions.length>0; x++){
            for(var y = 0; y < me.stats.radar && actions.length>0; y++){
                var cX = me.loc[0] - (mid-x);
                var cY = me.loc[1] - (mid-y);

                if(cX < 0) cX += map.length;
                if(cY < 0) cY += map.length;
                if(cX >= map.length) cX -= map.length;
                if(cY >= map.length) cY -= map.length;

                for(var i = 0; i < actions.length; i++){
                    if(actions[i].loc[0]==cX && actions[i].loc[1]==cY){
                        if(actions[i].type==="ATTACK"){
                            var xSize = 15;
                            ctx.beginPath();
                            ctx.strokeStyle = colors.attackColor;
                            ctx.fillStyle = colors.attackColor;
                            // ctx.globalAlpha = 0.4;
                            // ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
                            // ctx.globalAlpha = 1.0;
                            // ctx.stroke();
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
                        }else if(actions[i].type==="LOOT"){
                            ctx.beginPath();
                            ctx.fillStyle = colors.lootColor;
                            ctx.globalAlpha = 0.4;
                            ctx.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
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
                        actions.splice(i,1);
                        i--;
                    }
                }
            }
        }

        //Draw my ship
        ctx.beginPath();
        if(me.stats.hp>0){
            ctx.fillStyle=colors.hudColor;
            ctx.arc(c.width/2,c.height/2,tileSize/5,0,2*Math.PI);
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
        }else if(shopMode /*&& shop.withinShop=="SSHOP"*/){
            drawSShopMenu(c, ctx);
        }

        //Draw grid hover
        else if(mX > -1 && mY > -1 && mX < c.width && mY < c.height && !settingsView){
            ctx.strokeStyle=colors.hudColor;
            ctx.fillStyle=colors.hudColor;
            ctx.beginPath();
            ctx.globalAlpha = 0.3;
            ctx.fillRect(parseInt(mX/tileSize)*tileSize,parseInt(mY/tileSize)*tileSize,tileSize,tileSize);
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

    //Named Stats
    ctx.beginPath();
    ctx.fillStyle = colors.hudColor;
    ctx.font = "20px Courier";
    ctx.fillText("ID   : "+me.info.name,5,sCardHei+30);
    ctx.fillText("LOC  : ("+me.loc[0]+", "+me.loc[1]+")",5,sCardHei+60);
    ctx.fillText("GOLD : "+me.info.gold+"g ("+me.info.totalGold+"g)",5,sCardHei+90);
    ctx.fillText("KILLS: "+me.info.kills+" | DEATHS: "+me.info.deaths,5,sCardHei+120);
    ctx.fillText("HAULS: "+me.info.hauls,5,sCardHei+150);

    //Upgradable Stats
    sCardHei = 250;
    //HP and PWR
    ctx.beginPath();
    ctx.fillText("HP  ",5,sCardHei+162);
    ctx.fillText("PWR ",5,sCardHei+202);
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
    ctx.fillStyle = "#000000";
    ctx.fillText(me.stats.hp,65,sCardHei+162);
    ctx.fillText(me.stats.energy,65,sCardHei+202);

    //ATK
    ctx.fillStyle = colors.hudColor;
    ctx.fillText("ATK",5,sCardHei+253);
    for(var i = 0; i < me.stats.attackUpgradesMAX; i++){
        if(i < me.stats.attackUpgrades) ctx.fillStyle = colors.upgradeColor;
        else ctx.fillStyle = colors.voidUpgradeColor;
        ctx.fillRect(60+i*10,sCardHei+237,5,20);
    }

    //RADAR
    ctx.fillStyle = colors.hudColor;
    ctx.fillText("RDR",125,sCardHei+253);
    for(var i = 0; i < me.stats.radarUpgradesMAX; i++){
        if(i < me.stats.radarUpgrades) ctx.fillStyle = colors.upgradeColor;
        else ctx.fillStyle = colors.voidUpgradeColor;
        ctx.fillRect(170+i*10,sCardHei+237,5,20);
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

            //Draw enemies
            for(var p in players){
                if(players[p].loc[0]==x && players[p].loc[1]==y){
                    ctx.beginPath();
                    ctx.fillStyle = colors.enemyColor;
                    ctx.arc(x*tileSize+tileSize/2,y*tileSize+tileSize/2,tileSize/4,0,2*Math.PI);
                    ctx.fill();
                    break;
                }
            }
        }
    }
}

function drawShopMenu(c, ctx){
    ctx.beginPath();
    ctx.strokeStyle=colors.hudColor;
    ctx.fillStyle=colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(c.width/4,c.height/4,c.width/2,c.height/2);
    ctx.fillRect(c.width/4,c.height/4,c.width/2,c.height/2);
    ctx.stroke();

    //Store Labels
    ctx.fillStyle=colors.hudColor;
    ctx.font = "40px Courier";
    ctx.fillText("Store",c.width/4+5,c.height/4+45);

    ctx.font = "18px Courier";
    ctx.fillText("Press the key to do the following",c.width/4+5,c.height/4+85);


    if(shop.hpF.canBuy && me.info.gold < shop.hpF.price.gold) ctx.fillStyle=colors.needGoldColor;
    else if(shop.hpF.canBuy) ctx.fillStyle=colors.canBuyColor;
    else ctx.fillStyle=colors.cantBuyColor;
    ctx.fillText(" 1 : Buy Ship Repair",c.width/4+5,c.height/4+110);
    ctx.fillText(shop.hpF.price.gold+"g",3*c.width/4-75,c.height/4+110);


    if(shop.hpU.canBuy && me.info.gold < shop.hpU.price.gold) ctx.fillStyle=colors.needGoldColor;
    else if(shop.hpU.canBuy) ctx.fillStyle=colors.canBuyColor;
    else ctx.fillStyle=colors.cantBuyColor;
    ctx.fillText(" 2 : Buy Health Upgrade",c.width/4+5,c.height/4+135);
    ctx.fillText(shop.hpU.price.gold+"g",3*c.width/4-75,c.height/4+135);


    if(shop.enU.canBuy && me.info.gold < shop.enU.price.gold) ctx.fillStyle=colors.needGoldColor;
    else if(shop.enU.canBuy) ctx.fillStyle=colors.canBuyColor;
    else ctx.fillStyle=colors.cantBuyColor;
    ctx.fillText(" 3 : Buy Energy upgrade",c.width/4+5,c.height/4+160);
    ctx.fillText(shop.enU.price.gold+"g",3*c.width/4-75,c.height/4+160);


    if(shop.radU.canBuy && me.info.gold < shop.radU.price.gold) ctx.fillStyle=colors.needGoldColor;
    else if(shop.radU.canBuy) ctx.fillStyle=colors.canBuyColor;
    else ctx.fillStyle=colors.cantBuyColor;
    ctx.fillText(" 4 : Buy Radar Upgrade",c.width/4+5,c.height/4+185);
    ctx.fillText(shop.radU.price.gold+"g",3*c.width/4-75,c.height/4+185);

    if(shop.atkU.canBuy && me.info.gold < shop.atkU.price.gold) ctx.fillStyle=colors.needGoldColor;
    else if(shop.atkU.canBuy) ctx.fillStyle=colors.canBuyColor;
    else ctx.fillStyle=colors.cantBuyColor;
    ctx.fillText(" 5 : Buy Attack Upgrade",c.width/4+5,c.height/4+210);
    ctx.fillText(shop.atkU.price.gold+"g",3*c.width/4-75,c.height/4+210);


    ctx.fillStyle=colors.hudColor;
    ctx.fillText("esc: Exit Store",c.width/4+5,c.height/4+235);
}

function drawSShopMenu(c, ctx){
    ctx.beginPath();
    ctx.strokeStyle=colors.hudColor;
    ctx.fillStyle=colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(c.width/8,c.height/4,3*c.width/4,c.height/2);
    ctx.fillRect(c.width/8,c.height/4,3*c.width/4,c.height/2);
    ctx.stroke();

    //Store Labels
    ctx.fillStyle=colors.hudColor;
    ctx.font = "40px Courier";
    ctx.fillText("Special Store",c.width/8+5,c.height/4+45);

    ctx.font = "18px Courier";
    ctx.fillText("Press the key to do the following",c.width/8+5,c.height/4+85);
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
    else if(gameStart){
        if(e.keyCode == 13){
            init();
        }else if(e.keyCode == 8){
            name = name.substring(0,name.length-1);
        }else if(((e.keyCode > 47 && e.keyCode < 91) || e.keyCode == 32) && name.length < 16){ //number and letter
            name = name+""+String.fromCharCode(e.keyCode).toLowerCase();
        }
        drawMonitor();
    }else if((e.keyCode == 77)){  //M
        mapView = !mapView;
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
        }else if(e.keyCode == 79 /*&& shop.withinShop!=null*/){  //O
            shopMode = true;
        }
    }
    else if(shopMode){
        if(e.keyCode == 49){        //1
            makePurchase("hpF");
        }else if(e.keyCode == 50){  //2
            makePurchase("hpU");
        }else if(e.keyCode == 51){  //3
            makePurchase("enU");
        }else if(e.keyCode == 52){  //4
            makePurchase("radU");
        }else if(e.keyCode == 53){  //5
            makePurchase("atkU");
        }else if(e.keyCode == 79 || e.keyCode == 27){  //O or escape
            shopMode = false;
        }
    }
    else if(e.keyCode == 79 /*&& shop.withinShop!=null*/){  //O
        shopMode = true;
    }


}

function handleMousedown(e){
   if(settingsView){
       var c = document.getElementById("monitor");

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
   else if(!gameStart && !mapView && !shopMode){
        var mid = parseInt(me.stats.radar/2);
        var cX = me.loc[0] - (mid-hover[0]);
        var cY = me.loc[1] - (mid-hover[1]);

        if(cX < 0) cX += map.length;
        if(cY < 0) cY += map.length;
        if(cX >= map.length) cX -= map.length;
        if(cY >= map.length) cY -= map.length;
        //console.log(""+cX+", "+cY);

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

function drawRadarScan(){
    var c = document.getElementById("monitor");
    var ctx = c.getContext("2d");

    //Draw Radar
    var radius = 350;
    ctx.strokeStyle = colors.hudColor;
    ctx.beginPath();
    ctx.moveTo(c.width/2+(radius*Math.cos(radarAngle)),c.height/2+radius*Math.sin(radarAngle)); //Outer circle
    ctx.lineTo(c.width/2,c.height/2); //Center
    ctx.stroke();
    radarAngle= radarAngle+1%360;
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

    if(radarAngle==360){
        radarAngle = 0;
    }else if(radarAngleChange){
        radarAngleChange = false;
        radarAngle=radarAngle+radarINC;
        setTimeout(function(){radarAngleChange = true;}, radarTick);
    }
}
