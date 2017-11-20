//Canvas positioning
var offsetX;
var offsetY;
var offsetX2;
var offsetY2;
var prevWid = 0;

var openWindow = "";

var curShopTab = 0;

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
var blink = false;
var chatBlink = true;

//Radar Globals
var changeRadarAngle = false;
var radarAngle = 0;

var mX, mY;
var mouseHover = -1;

//Team Globals
var teamRec = [];
var joinTeamScroll = 0;

var tName = '';
var bColor = "#00FF00", aColor = "#FFFFFF", bShape = "DIAMOND";
var createTeamError = "";

var confirmDialog = -1;
var valueLock = -1;

var teamSetSaved = false;
var teamScroll = 0;
var curTeamTab = 0;
var curSettings;

var blScroll = 0

var errorMsg = '';
var chatMessageType = "ALL";

//PlayerList
var playerListScroll = 0

setInterval(function(){
    blink = !blink;
}, 200);
setInterval(function(){
    changeRadarAngle = true;
}, 40);
setInterval(function(){
    if(chatMode)
        chatBlink=!chatBlink;
    else chatBlink = true;
},200);


//*****************************************************************************
//  Main Drawing functions
//*****************************************************************************
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

function drawMap(ctx, startX, startY, width, height, map, baseList, players, me, dead){
    //Calculate Drawing Area
    var sX = startX;
    var sY = startY;
    var wid = width;
    var hei = height;

    ctx.globalAlpha = 1.0;
    var tileSize = width/map.length;

    for(var x = 0; x < map.length; x++){
        for(var y = 0; y < map.length; y++){

            if(map[x][y].baseID > -1){
                var owner = baseList[map[x][y].baseID].owner;
                if(typeof mouseHover.baseID!=="undefined" && !dead){
                    if(map[x][y].baseID==mouseHover.baseID) ctx.globalAlpha = 0.7;
                    else ctx.globalAlpha = 0.3;
                }else ctx.globalAlpha = 0.3;

                if(teamList[me.info.teamID].objective > -1 && blink && !dead)
                    if(map[x][y].baseID == teamList[me.info.teamID].objective) ctx.globalAlpha = 0.7;

                if(dead && baseList[map[x][y].baseID].owner == me.info.teamID && baseList[map[x][y].baseID].special==="S" && blink)
                    ctx.globalAlpha = 0.7;

                ctx.beginPath();
                if(owner > -1){
                    ctx.fillStyle = teamList[owner].colors.areaColor;
                }
                else{
                    ctx.fillStyle = "#666";
                }
                ctx.fillRect(sX+x*tileSize,sY+y*tileSize,tileSize,tileSize);
                ctx.stroke();

                if(mX > sX+x*tileSize && mX < sX+x*tileSize+tileSize &&
                   mY > sY+y*tileSize && mY < sY+y*tileSize+tileSize && dead){
                    if(map[x][y].spawn) mouseHover = {"spawnID": -1};
                    mouseHover = {"spawnID": map[x][y].baseID};
                }
            }

            if(dead && map[x][y].spawn && blink){
                ctx.beginPath();
                ctx.fillStyle = "#666";
                ctx.globalAlpha = 0.7;
                ctx.fillRect(sX+x*tileSize,sY+y*tileSize,tileSize,tileSize);
                ctx.stroke();

                if(mX > sX+x*tileSize && mX < sX+x*tileSize+tileSize &&
                   mY > sY+y*tileSize && mY < sY+y*tileSize+tileSize){
                    mouseHover = {"spawnID": -1};
                }
            }

            //Draw trap area
            if(map[x][y].trap > -1 && !dead){
                ctx.beginPath();
                ctx.globalAlpha = 0.3;
                if(me.info.teamID == map[x][y].trap) ctx.fillStyle = colors.hudColor;
                else ctx.fillStyle = colors.trapColor;

                ctx.fillRect(sX+x*tileSize,sY+y*tileSize,tileSize,tileSize);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;

            if(map[x][y].type==="ROCK"){ //Rocks
                ctx.beginPath();
                ctx.fillStyle= colors.rockColor;
                ctx.fillRect(sX+x*tileSize+tileSize/2-tileSize*.4,sY+y*tileSize+tileSize/2-tileSize*.4,tileSize*.8,tileSize*.8);
                ctx.stroke();
            }
            else if(map[x][y].type==="WALL"){ //Walls
                var owner = baseList[map[x][y].baseID].owner;
                drawWall(ctx, sX+x*tileSize, sY+y*tileSize, tileSize, map[x][y].lvl, teamList[owner].colors.baseColor);
            }
            else if(map[x][y].type==="BASE"){ //Bases
                var owner = baseList[map[x][y].id].owner;
                if(owner > -1){
                    drawBase(ctx, sX+x*tileSize, sY+y*tileSize, tileSize, teamList[owner].colors.baseShape, baseList[map[x][y].id].lvl, teamList[owner].colors.baseColor);
                }
                else{
                    drawBase(ctx, sX+x*tileSize, sY+y*tileSize, tileSize, "DIAMOND", baseList[map[x][y].id].lvl, colors.shopColor);
                }
            }
            else if(map[x][y].type==="PLAYER" && !(me.loc[0]==x && me.loc[1]==y)){ //Players
                if(players[map[x][y].id].team==me.info.teamID){
                    ctx.fillStyle=colors.hudColor;
                    ctx.strokeStyle=colors.hudColor;
                }
                else {
                    ctx.fillStyle=colors.enemyColor;
                    ctx.strokeStyle=colors.enemyColor;
                }

                ctx.arc(sX+x*tileSize+tileSize/2,sY+y*tileSize+tileSize/2,tileSize/5,0,2*Math.PI);
                ctx.fill();
            }
            else if(typeof map[x][y].loot!=="undefined" && !dead){ //Loot
                if(map[x][y].loot.uranium) ctx.fillStyle=colors.uraniumColor;
                else if(map[x][y].loot.iron) ctx.fillStyle=colors.ironColor;
                else if(map[x][y].loot.gold) ctx.fillStyle=colors.goldColor;

                ctx.beginPath();
                ctx.arc(sX+x*tileSize+tileSize/2-tileSize/8,sY+y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(sX+x*tileSize+tileSize/2+tileSize/8,sY+y*tileSize+tileSize/2+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(sX+x*tileSize+tileSize/2,sY+y*tileSize+tileSize/2-tileSize/4+tileSize/10,tileSize/6,0,2*Math.PI);
                ctx.fill();

            }

            //Draw me
            if(me.loc[0]==x && me.loc[1]==y && me.stats.hp>0 && blink && !dead){
                ctx.fillStyle = colors.hudColor;
                // ctx.strokeStyle = colors.hudColor;
                ctx.beginPath();
                ctx.globalAlpha = 0.3;
                ctx.fillRect(sX+x*tileSize,sY+y*tileSize,tileSize,tileSize);
                ctx.globalAlpha = 1.0;

                ctx.beginPath();
                ctx.arc(sX+x*tileSize+tileSize/2,sY+y*tileSize+tileSize/2, tileSize/4 ,0,2*Math.PI);
                ctx.fill();

            }
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
        if(lvl>=3){
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
        }else if(lvl >= 3){
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
        else if(lvl >= 3){
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

function drawWall(ctx, startX, startY, tileSize, lvl, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    if(lvl == 1){
        var size = .4;
        ctx.fillRect(startX+tileSize/2-tileSize*(size/2),startY+tileSize/2-tileSize*(size/2),tileSize*size,tileSize*size);
    }
    else if(lvl == 2){
        var size = .5;
        ctx.fillRect(startX+tileSize/2-tileSize*(size/2),startY+tileSize/2-tileSize*(size/2),tileSize*size,tileSize*size);
    }
    else if(lvl == 3){
        var size = .7;
        ctx.fillRect(startX+tileSize/2-tileSize*(size/2),startY+tileSize/2-tileSize*(size/2),tileSize*size,tileSize*size);
    }
    else if(lvl == 4){
        var size = .8;
        ctx.fillRect(startX+tileSize/2-tileSize*(size/2),startY+tileSize/2-tileSize*(size/2),tileSize*size,tileSize*size);
    }
    else{
        var size = 1;
        ctx.fillRect(startX+tileSize/2-tileSize*(size/2),startY+tileSize/2-tileSize*(size/2),tileSize*size,tileSize*size);
    }
    ctx.stroke();
}

function drawMapSimple(ctx, startX, startY, width, height, map){
    //Calculate Drawing Area
    var sX = startX;
    var sY = startY;
    var wid = width;
    var hei = height;

    var tileSize = width/map.length;

    for(var x = 0; x < map.length; x++){
        for(var y = 0; y < map.length; y++){
            ctx.globalAlpha = 1.0;
            if(map[x][y].baseID > -1){
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.fillStyle = map[x][y].colors.areaColor;
                ctx.fillRect(sX+x*tileSize,sY+y*tileSize,tileSize,tileSize);
                ctx.stroke();
            }

            if(map[x][y].type==="ROCK"){ //Rocks
                ctx.beginPath();
                ctx.fillStyle= colors.rockColor;
                ctx.fillRect(sX+x*tileSize+tileSize/2-tileSize*.4,sY+y*tileSize+tileSize/2-tileSize*.4,tileSize*.8,tileSize*.8);
                ctx.stroke();
            }
            else if(map[x][y].type==="WALL"){ //Walls
                drawWall(ctx, sX+x*tileSize, sY+y*tileSize, tileSize, map[x][y].lvl, map[x][y].colors.baseColor);
            }
            else if(map[x][y].type==="BASE"){ //Bases
                drawBase(ctx, sX+x*tileSize, sY+y*tileSize, tileSize, map[x][y].colors.baseShape, map[x][y].lvl, map[x][y].colors.baseColor);
            }
        }
    }

    ctx.globalAlpha = 1.0;
}



//*****************************************************************************
//  Action Drawing functions
//*****************************************************************************
function drawRadarScan(ctx, startX, startY, width, height){
    //TODO: apply startx, starty

    var radarFollow = 5;
    var radius = 450;
    var radarINC = .1;
    if(changeRadarAngle){
        changeRadarAngle = false;
        radarAngle += radarINC;
    }

    ctx.globalAlpha = 1.0;
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



//*****************************************************************************
//  UI Drawing functions
//*****************************************************************************
function drawSettings(ctx, startX, startY, width, height){
    //TODO: MAKE BETTER CLICKABLE
    var sX = startX+width/4;
    var sY = startY+height/10;
    var wid = width-(sX-startX)*2;
    var hei = height-(sY-startY)*2;

    ctx.beginPath();
    ctx.strokeStyle = colors.hudColor;
    ctx.fillStyle = colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(sX,sY,wid,hei);
    ctx.fillRect(sX,sY,wid,hei);
    ctx.stroke();

    //Settings Labels
    ctx.beginPath();
    ctx.fillStyle = colors.hudColor;
    ctx.font = "30px Courier";
    ctx.fillText("Settings",sX+5,sY+35);
    ctx.font = "20px Courier";
    ctx.fillText("Click the color to change it.",sX+5,sY+55);

    var i = 1;
    ctx.font = "18px Courier";
    for(var property in colors){
        if(colors.hasOwnProperty(property)){
            if(property!=="timerGradient"){
                if(mX < sX+365 && mX > sX+20 &&
                   mY < sY+75+20*i && mY > sY+60+20*i){
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = colors.hudColor;
                    ctx.fillRect(sX+15,sY+58+20*i,360,20);
                    mouseHover = property;
                }
                ctx.globalAlpha = 1.0;

                ctx.beginPath();
                ctx.fillStyle = colors.hudColor;
                ctx.fillText(property,sX+20,sY+75+20*i);
                ctx.strokeStyle = colors.hudColor;
                ctx.fillStyle = colors[property];
                ctx.strokeRect(sX+350,sY+60+20*i,15,15);
                ctx.fillRect(sX+350,sY+60+20*i,15,15);
                i++;
            }
        }
    }

    //Draw return to default button
    ctx.globalAlpha = 1.0;
    ctx.font = "25px Courier";
    if(mX < sX+370 && mX > sX+255 &&
       mY < sY+120+20*i && mY > sY+80+20*i){
        ctx.fillStyle = colors.hudColor;
        ctx.fillRect(sX+255,sY+60+20*i+20,115,40);
        ctx.fillStyle = colors.hudBackColor;
        ctx.fillText("DEFAULT",sX+260,sY+107+20*i);
        mouseHover = "DEFAULT";
    }
    else{
        ctx.strokeStyle = colors.hudColor;
        ctx.strokeRect(sX+255,sY+60+20*i+20,115,40);
        ctx.fillStyle = colors.hudColor;
        ctx.fillText("DEFAULT",sX+260,sY+107+20*i);
    }
}

function drawShopMenu(ctx, startX, startY, width, height, store, lvl, me){
    var sX = startX+width/8;
    var sY = startY+height/4;
    var wid = width-(sX-startX)*2;
    var hei = height-(sY-startY)*2;

    mouseHover = -1;

    //Draw box
    ctx.beginPath();
    ctx.strokeStyle=colors.hudColor;
    ctx.fillStyle=colors.hudBackColor;
    ctx.globalAlpha = 1.0;
    ctx.strokeRect(sX,sY,wid,hei);
    ctx.fillRect(sX,sY,wid,hei);
    ctx.stroke();

    var display;
    var name;
    var len;
    if(lvl == 1){
        name = "Store";
        len = 1;
        display = store[0];
    }
    else if(lvl == 2){
        name = "Special Store";
        len = store.length -1;
        if(curShopTab > -1 && curShopTab < store.length)
            display = store[curShopTab+1];
    }
    else if(lvl >= 3){
        name = "Super Store";
        len = store.length;
        if(curShopTab > -1 && curShopTab < store.length)
            display = store[curShopTab];
    }

    if(curShopTab>len || curShopTab < 0) curShopTab = 0;

    //Check if need to draw tabs
    if(lvl > 1){
        ctx.strokeStyle=colors.hudColor;
        ctx.fillStyle=colors.hudBackColor;
        ctx.font = "18px Courier";
        for(var i = 0; i < len+1; i++){
            ctx.globalAlpha = 1.0;
            ctx.beginPath();
            var tHei = 60;//(height/2)/(tabs.length+1);
            if(i==curShopTab) ctx.fillStyle=colors.hudColor;
            else ctx.fillStyle=colors.hudBackColor;
            ctx.strokeRect(sX+wid,sY+tHei*i,25,tHei);
            ctx.fillRect(sX+wid,sY+tHei*i,25,tHei);

            if(i==curShopTab) ctx.fillStyle=colors.hudBackColor;
            else ctx.fillStyle=colors.hudColor;
            ctx.fillText((i==len?"LO":"T"+(i+1)),sX+wid+2,sY+35+tHei*i);
            ctx.stroke();

            if(mX > sX+wid && mX < sX+wid+25 &&
               mY > sY+tHei*i && mY < sY+tHei*i+tHei){
                mouseHover = {"tab":i};
                ctx.globalAlpha = 0.5;
                ctx.fillStyle=colors.hudColor;
                ctx.fillRect(sX+wid,sY+tHei*i,25,tHei);
            }
        }
    }
    ctx.globalAlpha = 1.0;

    if((curShopTab > -1 && curShopTab < len) || lvl == 1){ //Main Store
        //Store Labels
        ctx.fillStyle=colors.hudColor;
        ctx.font = "40px Courier";
        ctx.fillText(name,sX+5,sY+45);

        ctx.font = "18px Courier";
        ctx.fillText("Click any item to purchase",sX+5,sY+85);

        var i = 0;
        for(; i < display.length; i++){
            if(mX > sX+5 && mX < sX+wid-10 &&
               mY > sY+95+i*25 && mY < sY+120+i*25){
                mouseHover = {"item":display[i].pLabel};
                ctx.globalAlpha = 0.5;
                ctx.fillStyle=colors.hudColor;
                ctx.fillRect(sX+5,sY+93+i*25,wid-10,25);
            }
            ctx.globalAlpha = 1.0;


            if(display[i].canBuy && !canPurchase(display[i].price, {"gold":me.info.gold,"iron":me.info.iron,"uranium":me.info.uranium}) && me.stats.hp > 0) ctx.fillStyle=colors.needMoreColor;
            else if(display[i].canBuy && me.stats.hp > 0) ctx.fillStyle=colors.canBuyColor;
            else ctx.fillStyle=colors.cantBuyColor;
            ctx.fillText(" "+display[i].label,sX+5,sY+110+25*i);
            if(display[i].canBuy && me.info.gold < display[i].price.gold && me.stats.hp > 0) ctx.fillStyle=colors.needMoreColor;
            else if(display[i].canBuy && me.stats.hp > 0) ctx.fillStyle=colors.canBuyColor;
            ctx.fillText(display[i].price.gold+"g",sX+wid-140,sY+110+25*i);
            if(display[i].canBuy && me.info.iron < display[i].price.iron && me.stats.hp > 0) ctx.fillStyle=colors.needMoreColor;
            else if(display[i].canBuy && me.stats.hp > 0) ctx.fillStyle=colors.canBuyColor;
            ctx.fillText(display[i].price.iron+"i",sX+wid-68,sY+110+25*i);
            if(display[i].canBuy && me.info.uranium < display[i].price.uranium && me.stats.hp > 0) ctx.fillStyle=colors.needMoreColor;
            else if(display[i].canBuy && me.stats.hp > 0) ctx.fillStyle=colors.canBuyColor;
            ctx.fillText(display[i].price.uranium+"u",sX+wid-30,sY+110+25*i);

            //upgrade bars
            for(var u = 0; u < display[i].maxLvl; u++){
                if(u < display[i].level) ctx.fillStyle = colors.upgradeColor;
                else ctx.fillStyle = colors.voidUpgradeColor;
                if(lvl == 1 || (lvl >= 3 && curShopTab == 0))
                    ctx.fillRect(sX+wid-250+u*10,sY+95+i*25,5,20);
                else
                    ctx.fillRect(sX+wid-200+u*10,sY+95+i*25,5,20);

            }
        }
    }
    else if(curShopTab == len){
        //Edit Loadout Labels
        ctx.beginPath();
        ctx.fillStyle=colors.hudColor;
        ctx.strokeStyle=colors.hudColor;
        ctx.font = "40px Courier";
        ctx.fillText("Loadout",sX+5,sY+45);

        ctx.font = "18px Courier";
        ctx.fillText("Hover over item and press 'Q' or 'E' to equip.",sX+5,sY+85);

        //Selection Boxes
        ctx.font = "22px Courier";
        ctx.fillText("SLOTS",sX+45,sY+185);
        ctx.strokeRect(sX+15,sY*2+20,50,50);
        ctx.strokeRect(sX+90,sY*2+20,50,50);
        //If not unlocked
        if(me.stats.loadoutSize < 2){
            ctx.beginPath();
            ctx.moveTo(sX+90,sY*2+20);
            ctx.lineTo(sX+140,sY*2+70);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(sX+140,sY*2+20);
            ctx.lineTo(sX+90,sY*2+70);
            ctx.stroke();
        }
        ctx.fillText("Q",sX+35,sY*2+90);
        ctx.fillText("E",sX+107,sY*2+90);
        ctx.font = "18px Courier";
        if(me.abilitySlots[0].type!=="NONE") ctx.fillText(me.abilitySlots[0].type,sX+17,sY*2+50);
        if(me.abilitySlots[1].type!=="NONE") ctx.fillText(me.abilitySlots[1].type,sX+92,sY*2+50);

        ctx.stroke();

        //line
        ctx.beginPath();
        ctx.moveTo(sX+150,sY+120);
        ctx.lineTo(sX+150,sY+height/2);
        ctx.stroke();

        //Options
        ctx.font = "22px Courier";
        for(var i = 0; i < me.storage.length; i++){
            if(mX > sX+170+70*(i%6) && mX < sX+230+70*(i%6) &&
               mY > sY+130+70*parseInt(i/6) && mY < sY+190+70*parseInt(i/6)){
                mouseHover = {"load":i};
                ctx.fillStyle=colors.hudColor;
                ctx.fillRect(sX+170+70*(i%6),sY+130+70*parseInt(i/6),60,60);
                ctx.fillStyle=colors.hudBackColor;
                ctx.fillText(me.storage[i].name,sX+170+70*(i%6)+3,sY+130+70*parseInt(i/6)+35);
            }
            else{
                ctx.strokeStyle=colors.hudColor;
                ctx.strokeRect(sX+170+70*(i%6),sY+130+70*parseInt(i/6),60,60);
                ctx.fillStyle=colors.hudColor;
                ctx.fillText(me.storage[i].name,sX+170+70*(i%6)+3,sY+130+70*parseInt(i/6)+35);
            }
        }
    }

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

    mouseHover = -1;

    //Suggested Teams
    ctx.fillStyle = colors.hudColor;
    ctx.font = "22px Courier";
    ctx.fillText("Recommended Teams",sX+5,sY+25);
    ctx.font = "bold 11pt Courier";
    ctx.fillText("Join Tokens: "+me.info.joinTokens,sX+5,sY+40);

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
            mouseHover = teamRec[i];
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
        mouseHover = "CREATE";
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
                if(me.info.joinTokens<=0) ctx.fillStyle = colors.cantBuyColor
                else ctx.fillStyle = colors.hudColor;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(sX+6,sY+37+20*yAdj,wid-50,17);
                mouseHover = i;
            }
            ctx.fillStyle = teamList[i].colors.areaColor;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(sX+220,sY+37+20*yAdj,60,17);
            drawBase(ctx,sX+222,sY+37+20*yAdj, 17, teamList[i].colors.baseShape, 1, teamList[i].colors.baseColor);
            drawBase(ctx,sX+242,sY+37+20*yAdj, 17, teamList[i].colors.baseShape, 2, teamList[i].colors.baseColor);
            drawBase(ctx,sX+263,sY+37+20*yAdj, 17, teamList[i].colors.baseShape, 3, teamList[i].colors.baseColor);


            if(me.info.joinTokens<=0) ctx.fillStyle = colors.cantBuyColor
            else ctx.fillStyle = colors.hudColor;
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

    mouseHover = -1;
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
            mouseHover = i;
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
        mouseHover = "BASE";
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
        mouseHover = "AREA";
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
        mouseHover = "CREATE";
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

    mouseHover = -1;

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
            mouseHover = i;
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
        ctx.fillText("INCOME : "+teamList[id].income.gold+"g",sX+5, sY+50);
        ctx.fillText("         "+teamList[id].income.credits+"c",sX+5, sY+70);
        ctx.fillText("         "+teamList[id].income.iron+"i",sX+5, sY+90);
        ctx.fillText("         "+teamList[id].income.uranium+"u",sX+5, sY+110);

        ctx.fillText("TEAM RANK  : "+teamList[id].rank,sX+250, sY+50);
        ctx.fillText("TEAM POWER : "+teamList[id].power,sX+250, sY+70);
        ctx.fillText("MAP CONTROL: "+parseInt(teamList[id].mapControl*100)+"%",sX+250, sY+90);
        ctx.fillText("MEMBERS    : "+teamList[id].members.length,sX+250, sY+110);

        //Draw Objective
        ctx.font = "bold 25pt Courier";
        ctx.fillText("OBJECTIVE:",sX+5, sY+150);
        ctx.font = "16pt Courier";
        if(teamList[id].objective>-1){
            var type = (baseList[teamList[id].objective].owner==id?"DEFEND":"CAPTURE");
            ctx.fillText(type+" BASE "+teamList[id].objective,sX+210, sY+147);
        }
        else
            ctx.fillText("NONE",sX+210, sY+147);


        //Draw Map
        //Map Hover
        if(mX > sX && mX < sX+5*wid/8 &&
           mY > sY+hei-5*wid/8 && mY < sY+hei){
            var tileSize = (5*wid/8)/map.length;
            var baseID = map[parseInt((mX-sX)/tileSize)][parseInt((mY-(sY+hei-5*wid/8))/tileSize)].baseID;
            if(baseID > -1)
                mouseHover = {"baseID": baseID};
        }

        ctx.strokeRect(sX, sY+hei-5*wid/8, 5*wid/8, 5*wid/8);
        drawMap(ctx, sX, sY+hei-5*wid/8, 5*wid/8, 5*wid/8, map, baseList, players, me, false);


        //Draw Base Info
        ctx.fillStyle=colors.hudColor;
        ctx.globalAlpha = 1.0;
        if(typeof mouseHover.baseID !== "undefined" || teamList[me.info.teamID].objective > -1){
            var base = baseList[(mouseHover.baseID > -1?mouseHover.baseID:teamList[me.info.teamID].objective)];
            var yAdj = 0;
            ctx.font = "20pt Courier";
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("BASE "+base.id,sX+5*wid/8+10, sY+175);
            ctx.font = "16pt Courier";

            if(base.owner==me.info.teamID){
                ctx.fillText("HP : ",sX+5*wid/8+10, sY+200);
                ctx.fillText("UPG: ",sX+5*wid/8+10, sY+220);
                ctx.fillStyle="#333333";
                ctx.fillRect(sX+5*wid/8+75,sY+185,140,15);
                ctx.fillRect(sX+5*wid/8+75,sY+205,140,15);
                ctx.fillStyle=colors.hpColor;
                ctx.fillRect(sX+5*wid/8+75,sY+185,140*(base.hp/base.hpMAX),15);
                ctx.fillStyle=colors.energyColor;
                ctx.fillRect(sX+5*wid/8+75,sY+205,140*(base.upgrade/base.upgradeMAX),15);
                yAdj = 40;
            }

            ctx.fillStyle=colors.hudColor;
            ctx.fillText("LVL: "+base.lvl,sX+5*wid/8+10, sY+200+yAdj);
            if(base.owner>-1){
                ctx.fillStyle=teamList[base.owner].colors.baseColor;
                ctx.fillText(""+teamList[base.owner].name,sX+5*wid/8+10, sY+220+yAdj);
            }
            else
                ctx.fillText("NEUTRAL",sX+5*wid/8+10, sY+220+yAdj);

            ctx.fillStyle=colors.hudColor;
            ctx.fillText("OUTPUT:",sX+5*wid/8+10, sY+240+yAdj);
            var spec = "NONE";
            if(base.special==="I") spec = "IRON";
            if(base.special==="U") spec = "URANIUM";
            if(base.special==="S") spec = "SPAWN";
            ctx.fillText("SPECIAL: "+spec,sX+5*wid/8+10, sY+300+yAdj);


            if(base.owner!=me.info.teamID){
                ctx.fillText("GOLD :",sX+5*wid/8+30, sY+260);
                ctx.fillText("CREDS:",sX+5*wid/8+30, sY+280);
                //Gold Output bar
                ctx.fillStyle = "#B87333";
                ctx.fillRect(sX+5*wid/8+120,sY+248,30,15);
                ctx.fillStyle = "#C0C0C0";
                ctx.fillRect(sX+5*wid/8+150,sY+248,30,15);
                ctx.fillStyle = "#D4AF37";
                ctx.fillRect(sX+5*wid/8+180,sY+248,30,15);

                if(base.output.gTier==0){
                    ctx.fillStyle = "#FF0000";
                    ctx.fillRect(sX+5*wid/8+120,sY+245,3,20);
                }
                else{
                    ctx.fillStyle = "#FF0000";
                    ctx.fillRect(sX+5*wid/8+105+base.output.gTier*30,sY+245,3,20);
                }

                //Credits Output bar
                ctx.fillStyle = "#B87333";
                ctx.fillRect(sX+5*wid/8+120,sY+268,30,15);
                ctx.fillStyle = "#C0C0C0";
                ctx.fillRect(sX+5*wid/8+150,sY+268,30,15);
                ctx.fillStyle = "#D4AF37";
                ctx.fillRect(sX+5*wid/8+180,sY+268,30,15);

                if(base.output.cTier==0){
                    ctx.fillStyle = "#FF0000";
                    ctx.fillRect(sX+5*wid/8+120,sY+265,3,20);
                }
                else{
                    ctx.fillStyle = "#FF0000";
                    ctx.fillRect(sX+5*wid/8+105+base.output.cTier*30,sY+265,3,20);
                }
            }
            else{
                ctx.fillText("GOLD : "+(base.output.gold * base.lvl)+"g",sX+5*wid/8+30, sY+260+yAdj);
                ctx.fillText("CREDS: "+(base.output.credits * base.lvl)+"c",sX+5*wid/8+30, sY+280+yAdj);

                //Base upgrading
                ctx.fillText("UPGRADE COST: ",sX+5*wid/8+10, sY+340+yAdj);
                if(base.upgradeCost.gold > teamList[me.info.teamID].vault.gold) ctx.fillStyle = colors.needMoreColor;
                else ctx.fillStyle=colors.hudColor;
                ctx.fillText("GOLD : "+base.upgradeCost.gold+"g",sX+5*wid/8+30, sY+360+yAdj);
                if(base.upgradeCost.credits > teamList[me.info.teamID].vault.credits) ctx.fillStyle = colors.needMoreColor;
                else ctx.fillStyle=colors.hudColor;
                ctx.fillText("CREDS: "+base.upgradeCost.credits+"c",sX+5*wid/8+30, sY+380+yAdj);
                if(base.upgradeCost.iron > teamList[me.info.teamID].vault.iron) ctx.fillStyle = colors.needMoreColor;
                else ctx.fillStyle=colors.hudColor;
                ctx.fillText("IRON : "+base.upgradeCost.iron+"i",sX+5*wid/8+30, sY+400+yAdj);
                if(base.upgradeCost.uranium > teamList[me.info.teamID].vault.uranium) ctx.fillStyle = colors.needMoreColor;
                else ctx.fillStyle=colors.hudColor;
                ctx.fillText("URAN : "+base.upgradeCost.uranium+"u",sX+5*wid/8+30, sY+420+yAdj);

                //Upgrade?
                if((me.info.teamRole==="LEADER" || me.info.teamRole==="ADMIN" && teamList[me.info.teamID].settings.upgrading!=="LEADER") && !base.upgrading){
                    ctx.font = "bold 16pt Courier";
                    if(mX < sX+6*wid/8+90 && mX > sX+6*wid/8-20 &&
                       mY < sY+470+yAdj && mY > sY+440+yAdj){
                        ctx.fillStyle = colors.hudColor;
                        ctx.fillRect(sX+6*wid/8-20,sY+440+yAdj,110,30);
                        ctx.fillStyle = colors.hudBackColor;
                        ctx.fillText("UPGRADE",sX+6*wid/8-10,sY+460+yAdj);
                        mouseHover = "UPGRADE";
                    }
                    else{
                        ctx.strokeStyle = colors.hudColor;
                        ctx.strokeRect(sX+6*wid/8-20,sY+440+yAdj,110,30);
                        ctx.fillStyle = colors.hudColor;
                        ctx.fillText("UPGRADE",sX+6*wid/8-10,sY+460+yAdj);
                    }
                }
            }
        }
        else{
            ctx.fillStyle=colors.hudColor;
            ctx.font = "20pt Courier";
            ctx.fillText("BASE INFO",sX+5*wid/8+10, sY+175);
            ctx.font = "16pt Courier";
            ctx.fillText("Hover over the",sX+5*wid/8+10, sY+200);
            ctx.fillText("map to see more. ",sX+5*wid/8+10, sY+220);
        }



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
        if(teamList[id].leader.online) ctx.fillStyle=colors.hudColor;
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
                mouseHover = {"id":teamList[id].admins[i].id,"type":"ADMIN"};
            }

            ctx.globalAlpha = 1.0;
            if(teamList[id].admins[i].online) ctx.fillStyle=colors.hudColor;
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
                mouseHover = {"id":memList[i].id,"type":"MEM"};
            }

            ctx.globalAlpha = 1.0;


            if(memList[i].online) ctx.fillStyle=colors.hudColor;
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
        ctx.fillText("GOLD   : "+teamList[id].vault.gold+"g",sX+wid/2-250, sY+hei/5);
        ctx.fillStyle=colors.ironColor;
        ctx.fillText("IRON   : "+teamList[id].vault.iron+"i",sX+wid/2-250, sY+2*hei/5);
        ctx.fillStyle=colors.uraniumColor;
        ctx.fillText("URANIUM: "+teamList[id].vault.uranium+"u",sX+wid/2-250, sY+3*hei/5);
        ctx.fillStyle=colors.hudColor;
        ctx.fillText("CREDITS: "+teamList[id].vault.credits+"c",sX+wid/2-250, sY+4*hei/5);

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
                "opts": ["FAIR","AD 50%","AD ONLY","LD 50%","LEADER"],
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
                    mouseHover = [settingOptions[set].input,settingOptions[set].opts[i]];
                    ctx.fillStyle=colors.hudColor;
                    ctx.globalAlpha = .5;
                    ctx.fillRect(sX+5+i*120,setHei+15,110,20);
                }
            }
            ctx.fill();
        }

        //Draw save button
        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.font = "bold 20pt Courier";
        ctx.fillStyle=colors.hudColor;
        setHei = sY+hei - 50;
        if(mX < sX+wid-20 && mX > sX+wid-120 &&
           mY < setHei+35 && mY > setHei && me.info.teamRole==="LEADER"){
            mouseHover = "SAVE";
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

    mouseHover = -1;

    var canInvite = false;
    var setting = teamList[me.info.teamID].settings.membership;
    if((me.info.teamRole!=="MEMBER" || (me.info.teamRole==="MEMBER" && setting!=="AD INV")) && me.info.teamID>-1) canInvite = true;

    ctx.fillStyle = colors.hudColor;
    ctx.font = "bold 24pt Courier";
    ctx.fillText("PLAYERS",sX+8,sY+30);
    ctx.font = "12pt Courier";
    if(canInvite)ctx.fillText("(click to invite)",sX+wid-180,sY+14);

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
               mY < sY+37+20*yAdj+17 && mY > sY+37+20*yAdj && canInvite){
                ctx.fillStyle = colors.hudColor;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(sX+6,sY+37+20*yAdj,wid-50,17);
                mouseHover = filteredList[i].id;
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

function drawConfirmDialog(ctx, startX, startY, width, height){
    //Calculate Drawing Area
    var sX = startX+width/3;
    var sY = startY+height/2.4;
    var wid = width-(sX-startX)*2;
    var hei = height-(sY-startY)*2;

    mouseHover = -1;

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
            mouseHover = 0;
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
            mouseHover = 1;
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
            mouseHover = 0;
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
            mouseHover = 1;
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
            mouseHover = 0;
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
            mouseHover = 1;
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
        if(mX < sX+wid/2+40 && mX > sX+wid/2-40 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+wid/2-40,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("RECON",sX+wid/2-30,sY+hei-25);
            mouseHover = 0;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+wid/2-40,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("RECON",sX+wid/2-30,sY+hei-25);
        }
    }
    else if(confirmDialog==4){ //Action
        ctx.fillStyle = colors.hudColor;
        ctx.font = "18px Courier";
        ctx.fillText("ACTIONS",sX+wid/2-45,sY+25);
        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.font = "20px Courier";

        var actOpts = ["PROMOTE","DEMOTE","REMOVE","CANCEL"];
        for(var i = 0; i < actOpts.length; i++){
            var yAdj = parseInt(i/2);
            if((actOpts[i]!=="DEMOTE" && actOpts[i]!=="PROMOTE") || me.info.teamRole==="LEADER"){
                if(mX < sX+120+120*(i%2) && mX > sX+20+120*(i%2) &&
                   mY < sY+75+yAdj*50 && mY > sY+45+yAdj*50){
                    ctx.fillStyle = colors.hudColor;
                    ctx.fillRect(sX+20+120*(i%2),sY+45+yAdj*50,100,30);
                    ctx.fillStyle = colors.hudBackColor;
                    ctx.fillText(actOpts[i],sX+25+120*(i%2),sY+65+yAdj*50);
                    mouseHover = i;
                }
                else{
                    ctx.strokeStyle = colors.hudColor;
                    ctx.strokeRect(sX+20+120*(i%2),sY+45+yAdj*50,100,30);
                    ctx.fillStyle = colors.hudColor;
                    ctx.fillText(actOpts[i],sX+25+120*(i%2),sY+65+yAdj*50);
                }
            }
        }


    }
    else if(confirmDialog==5){ //promote
        ctx.fillStyle = colors.hudColor;
        ctx.font = "18px Courier";
        ctx.fillText("Are you sure you ",sX+25,sY+25);
        ctx.fillText("want to promote ",sX+25,sY+45);
        ctx.fillText(players[valueLock.id].name+"?",sX+25,sY+65);
        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.font = "20px Courier";

        //Promote
        if(mX < sX+115 && mX > sX+25 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+25,sY+hei-45,90,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("PROMOTE",sX+26,sY+hei-25);
            mouseHover = 0;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+25,sY+hei-45,90,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("PROMOTE",sX+26,sY+hei-25);
        }

        //Cancel
        if(mX < sX+wid-25 && mX > sX+wid-105 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
            mouseHover = 1;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
        }
    }
    else if(confirmDialog==6){ //demote
        ctx.fillStyle = colors.hudColor;
        ctx.font = "18px Courier";
        ctx.fillText("Are you sure you ",sX+25,sY+25);
        ctx.fillText("want to demote ",sX+25,sY+45);
        ctx.fillText(players[valueLock.id].name+"?",sX+25,sY+65);
        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.font = "20px Courier";

        //Demote
        if(mX < sX+105 && mX > sX+25 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("DEMOTE",sX+28,sY+hei-25);
            mouseHover = 0;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("DEMOTE",sX+28,sY+hei-25);
        }

        //Cancel
        if(mX < sX+wid-25 && mX > sX+wid-105 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
            mouseHover = 1;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
        }
    }
    else if(confirmDialog==7){ //remove
        ctx.fillStyle = colors.hudColor;
        ctx.font = "18px Courier";
        ctx.fillText("Are you sure you ",sX+25,sY+25);
        ctx.fillText("want to remove ",sX+25,sY+45);
        ctx.fillText(players[valueLock.id].name+"?",sX+25,sY+65);
        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.font = "20px Courier";

        //Remove
        if(mX < sX+105 && mX > sX+25 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("REMOVE",sX+28,sY+hei-25);
            mouseHover = 0;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("REMOVE",sX+28,sY+hei-25);
        }

        //Cancel
        if(mX < sX+wid-25 && mX > sX+wid-105 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
            mouseHover = 1;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
        }
    }
    else if(confirmDialog==8){ //invite
        ctx.fillStyle = colors.hudColor;
        ctx.font = "18px Courier";
        ctx.fillText("Are you sure you ",sX+25,sY+25);
        ctx.fillText("want to invite ",sX+25,sY+45);
        ctx.fillText(players[valueLock].name+"?",sX+25,sY+65);
        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.font = "20px Courier";

        //Join
        if(mX < sX+105 && mX > sX+25 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("INVITE",sX+30,sY+hei-25);
            mouseHover = 0;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+25,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("INVITE",sX+30,sY+hei-25);
        }

        //Cancel
        if(mX < sX+wid-25 && mX > sX+wid-105 &&
           mY < sY+hei-15 && mY > sY+hei-45){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
            mouseHover = 1;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(sX+wid-105,sY+hei-45,80,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("CANCEL",sX+wid-100,sY+hei-25);
        }
    }

}

function drawActionQueue(ctx, startX, startY, width, height, me){
    //Calculate Drawing Area
    var sX = startX;
    var sY = startY;
    var wid = width;
    var hei = height;

    ctx.beginPath();
    ctx.fillStyle=colors.hudColor;
    ctx.font = "30px Courier";
    ctx.fillText("Action Queue",40,45);

    //Queue Card
    //**************************************************************************
    for(var i = 0; i < me.queue.length; i++){
        if(mX2 > 40 && mX2 < 260 &&
           mY2 >i*45+70 && mY2 < i*45+105){
            mouseHover = i;
            ctx.globalAlpha = 1.0;
        }
        else{
            ctx.globalAlpha = 0.7;
        }


        var text;
        if(me.queue[i].type==="MOVE"){
            ctx.fillStyle = colors.moveColor;
            text = "MOVE "+me.queue[i].direction;
        }
        else if(me.queue[i].type==="ATTACK"){
            ctx.fillStyle = colors.attackColor;
            text = "ATTACK ("+me.queue[i].location[0]+", "+me.queue[i].location[1]+")";
        }
        else if(me.queue[i].type==="SCAN"){
            ctx.fillStyle = colors.scanColor;
            text = "SCAN";
        }
        else if(me.queue[i].type==="LOOT"){
            ctx.fillStyle = colors.lootColor;
            text = "LOOT";
        }
        else if(me.queue[i].type==="HOLD"){
            ctx.fillStyle = colors.holdColor;
            text = "HOLD";
        }
        else if(me.queue[i].type==="QUICKHEAL"){
            ctx.fillStyle = colors.abilityColor;
            text = "SHIP REPAIR";
        }
        else if(me.queue[i].type==="BLINK"){
            ctx.fillStyle = colors.abilityColor;
            text = "BLINK ("+me.queue[i].location+")";
        }
        else if(me.queue[i].type==="WALL"){
            ctx.fillStyle = colors.cantBuyColor;
            text = "WALL ("+me.queue[i].location+")";
        }
        else if(me.queue[i].type==="ENERGY"){
            ctx.fillStyle = colors.abilityColor;
            text = "ENERGY REGEN";
        }
        else if(me.queue[i].type==="STEALTH"){
            ctx.fillStyle = colors.abilityColor;
            text = "STEALTH";
        }
        else if(me.queue[i].type==="DESTEALTH"){
            ctx.fillStyle = colors.abilityColor;
            text = "DESTEALTH";
        }
        else if(me.queue[i].type==="CANNON"){
            ctx.fillStyle = colors.abilityColor;
            text = "CANNON "+me.queue[i].location;
        }
        else if(me.queue[i].type==="RAILGUN"){
            ctx.fillStyle = colors.abilityColor;
            text = "RAILGUN "+me.queue[i].direction;
        }
        else if(me.queue[i].type==="TRAP"){
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
    ctx.globalAlpha = 1.0;
    for(var i = me.queue.length; i < 3; i++){
        ctx.strokeStyle = colors.hudColor;
        ctx.beginPath();
        ctx.strokeRect(40,i*45+70,220,35);
        ctx.stroke();
    }

}

function drawStatsCard(ctx, startX, startY, width, height, me){
    //Calculate Drawing Area
    var sX = startX;
    var sY = startY;
    var wid = width;
    var hei = height;


    ctx.strokeStyle = colors.hudColor;
    ctx.beginPath();
    ctx.strokeRect(0,sY,wid,hei);
    ctx.stroke();
    if(me.invites.length > 0){
        ctx.fillStyle = colors.hudColor;
        ctx.font = "18px Courier";
        ctx.fillText(players[me.invites[0].invID].name,25,sY+25);
        ctx.fillText("has invited you to join",25,sY+45);
        ctx.fillText(teamList[me.invites[0].id].name+".",25,sY+65);
        ctx.beginPath();
        ctx.globalAlpha = 1.0;
        ctx.font = "20px Courier";

        //Accept
        if(mX2 < 125 && mX2 > 25 &&
           mY2 < sY+130 && mY2 > sY+100){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(25,sY+100,100,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("ACCEPT",30,sY+120);
            mouseHover = 0;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(25,sY+100,100,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("ACCEPT",30,sY+120);
        }

        //Decline
        if(mX2 < wid-25 && mX2 > wid-125 &&
           mY2 < sY+130 && mY2 > sY+100){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(wid-125,sY+100,100,30);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("DECLINE",wid-120,sY+120);
            mouseHover = 1;
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(wid-125,sY+100,100,30);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("DECLINE",wid-120,sY+120);
        }
    }
    else if(openWindow==="shopMode"){
        //Named Stats
        ctx.beginPath();
        ctx.fillStyle = colors.hudColor;
        ctx.font = "40px Courier";
        ctx.fillText("GOLD: ",5,sY+40);
        ctx.fillStyle = colors.goldColor;
        ctx.fillText(me.info.gold+"g",25,sY+85);
        ctx.fillStyle = colors.hudColor;
        ctx.fillText("IRON: ",5,sY+130);
        ctx.fillStyle = colors.ironColor;
        ctx.fillText(+me.info.iron+"i",25,sY+175);
        ctx.fillStyle = colors.hudColor;
        ctx.fillText("URANIUM: ",5,sY+220);
        ctx.fillStyle = colors.uraniumColor;
        ctx.fillText(me.info.uranium+"u/"+me.stats.urCarry+"u",25,sY+265);
    }
    else if(statInfo){
        var cookie = getCookie("token");
        //Named Stats
        ctx.beginPath();
        ctx.fillStyle = colors.hudColor;
        ctx.font = "18px Courier";
        ctx.fillText("NAME : "+me.info.name,5,sY+20);
        if(me.info.teamID>-1){
            ctx.fillText("TEAM : "+teamList[me.info.teamID].name,5,sY+40);
            ctx.fillText("ROLE : "+me.info.teamRole,5,sY+60);
        }
        else{
            ctx.fillText("TEAM : N/A",5,sY+40);
            ctx.fillText("ROLE : N/A",5,sY+60);
        }
        ctx.fillText("LOC  : ("+me.loc[0]+", "+me.loc[1]+")",5,sY+80);
        ctx.fillText("GOLD : "+me.info.gold+"g ("+me.info.totalGold+"g)",5,sY+100);
        ctx.fillText("IRON : "+me.info.iron+"i ("+me.info.totalIron+"i)",5,sY+120);
        ctx.fillText("URAN : "+me.info.uranium+"u ("+me.info.totalUranium+"u)",5,sY+140);
        ctx.fillText("POWER: "+me.info.powerLevel,5,sY+160);
        ctx.fillText("KILLS: "+me.info.kills,5,sY+180);
        ctx.fillText("| DEATHS  : "+me.info.deaths,120,sY+180);
        ctx.fillText("SCANS: "+me.info.scans,5,sY+200);
        ctx.fillText("| HAULS   : "+me.info.hauls,120,sY+200);
        ctx.fillText("TRAPS: "+me.info.traps,5,sY+220);
        ctx.fillText("| CAPTURES: "+me.info.captures,120,sY+220);
        ctx.fillText("WALLS: "+me.info.walls,5,sY+240);
        ctx.fillText("| PLACED  : "+me.info.wallsPlaced,120,sY+240);
        // ctx.fillText("SAVED: "+(cookie===me.token?"TRUE":"FALSE"),5,sY+240);

        //Toggle Save button
        ctx.font = "24px Courier";
        ctx.beginPath();
        sY += 280;
        if(mX2 < 115 && mX2 > 15 &&
           mY2 < sY+10 && mY2 > sY-25){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(15,sY-25,100,35);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText((cookie===me.token?"UNSAVE":"SAVE"),25,sY);
            mouseHover = "SAVE";
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(15,sY-25,100,35);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText((cookie===me.token?"UNSAVE":"SAVE"),25,sY);
        }

        //HUD button
        ctx.beginPath();
        if(mX2 < 287 && mX2 > 195 &&
           mY2 < sY+10 && mY2 > sY-25){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(195,sY-25,92,35);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("HUD",220,sY);
            mouseHover = "HUD";
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(195,sY-25,92,35);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("HUD",220,sY);
        }

    }
    else{
        //Named Stats
        ctx.beginPath();
        ctx.fillStyle = colors.hudColor;
        ctx.font = "20px Courier";
        ctx.fillText("LOC : ("+me.loc[0]+", "+me.loc[1]+")",5,sY+30);

        //insured tag
        ctx.font = "18px Courier";
        ctx.beginPath();
        sY = 249;
        if(me.info.hasInsurance){
            ctx.fillStyle = colors.hudColor;
            ctx.strokeStyle = colors.hudColor;
            ctx.fillText("INSURED",195,sY);
        }
        else{
            ctx.fillStyle = colors.needMoreColor;
            ctx.strokeStyle = colors.needMoreColor;
            ctx.fillText("UNINSURED",185,sY);
        }
        ctx.strokeRect(180,sY-17,107,25);

        //Upgradable Stats
        ctx.font = "20px Courier";
        ctx.fillStyle = colors.hudColor;
        ctx.strokeStyle = colors.hudColor;
        sY = 120;
        //HP and PWR
        ctx.beginPath();
        ctx.fillText("HP  ",5,sY+162);
        ctx.fillText("ENG ",5,sY+202);
        ctx.fillText("UR  ",5,sY+242);
        ctx.fillStyle = colors.hpColor;
        ctx.fillRect(60,sY+145,220*(me.stats.hp/me.stats.hpMAX),20);
        for(var i = 0; i < me.stats.hpUpgradesMAX; i++){
            if(i < me.stats.hpUpgrades) ctx.fillStyle = colors.upgradeColor;
            else ctx.fillStyle = colors.voidUpgradeColor;
            ctx.fillRect(60+i*(220/me.stats.hpUpgradesMAX),sY+167,(220/me.stats.hpUpgradesMAX)-5,5);
        }
        ctx.fillStyle = colors.energyColor;
        ctx.fillRect(60,sY+185,220*(me.stats.energy/me.stats.energyMAX),20);
        for(var i = 0; i < me.stats.energyUpgradesMAX; i++){
            if(i < me.stats.energyUpgrades) ctx.fillStyle = colors.upgradeColor;
            else ctx.fillStyle = colors.voidUpgradeColor;
            ctx.fillRect(60+i*45,sY+207,40,5);
        }
        for(var i = 0; i < me.stats.urCarry; i++){
            if(i < me.info.uranium) ctx.fillStyle = colors.uraniumColor;
            else ctx.fillStyle = "#070707";
            ctx.fillRect(60+i*(220/me.stats.urCarry),sY+225,(220/me.stats.urCarry)-3,20);
        }
        ctx.fillStyle = colors.uraniumColor;
        for(var i = 0; i < me.stats.urCarryUpgradesMAX; i++){
            if(i < me.stats.urCarryUpgrades) ctx.fillStyle = colors.upgradeColor;
            else ctx.fillStyle = colors.voidUpgradeColor;
            ctx.fillRect(60+i*(220/me.stats.urCarryUpgradesMAX),sY+247,(220/me.stats.urCarryUpgradesMAX)-3,5);
        }

        //Ability Boxes
        //Ability 1
        ctx.beginPath();
        sY = 370;

        if(game.phase != 0 || noUseMod(me.abilitySlots[0].type)){
            ctx.fillStyle = colors.cantBuyColor;
            ctx.strokeStyle = colors.cantBuyColor;
        }
        else if(me.abilitySlots[0].canUse){
            ctx.fillStyle = colors.hudColor;
            ctx.strokeStyle = colors.hudColor;
        }
        else{
            ctx.fillStyle = colors.needMoreColor;
            ctx.strokeStyle = colors.needMoreColor;
        }
        ctx.strokeRect(20,sY+20,50,50);
        ctx.font = "22px Courier";
        ctx.fillText("Q",39,sY+90);
        ctx.font = "18px Courier";
        if(me.abilitySlots[0].type!=="NONE") ctx.fillText(me.abilitySlots[0].type,22,sY+50);

        //Ability 2
        if(game.phase != 0 || noUseMod(me.abilitySlots[1].type)){
            ctx.fillStyle = colors.cantBuyColor;
            ctx.strokeStyle = colors.cantBuyColor;
        }
        else if(me.abilitySlots[1].canUse){
            ctx.fillStyle = colors.hudColor;
            ctx.strokeStyle = colors.hudColor;
        }
        else{
            ctx.fillStyle = colors.needMoreColor;
            ctx.strokeStyle = colors.needMoreColor;
        }
        ctx.strokeRect(120,sY+20,50,50);
        if(me.stats.loadoutSize < 2){//If not unlocked
            ctx.beginPath();
            ctx.moveTo(120,sY+20);
            ctx.lineTo(170,sY+70);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(170,sY+20);
            ctx.lineTo(120,sY+70);
            ctx.stroke();
        }
        ctx.font = "22px Courier";
        ctx.fillText("E",139,sY+90);
        ctx.font = "18px Courier";
        if(me.abilitySlots[1].type!=="NONE") ctx.fillText(me.abilitySlots[1].type,122,sY+50);

        //Walls
        if(game.phase != 0 || me.stats.wall<1){
            ctx.fillStyle = colors.cantBuyColor;
            ctx.strokeStyle = colors.cantBuyColor;
        }
        else if(me.info.walls>0){
            ctx.fillStyle = colors.hudColor;
            ctx.strokeStyle = colors.hudColor;
        }
        else{
            ctx.fillStyle = colors.needMoreColor;
            ctx.strokeStyle = colors.needMoreColor;
        }
        ctx.strokeRect(220,sY+20,50,50);
        ctx.font = "18px Courier";
        ctx.fillText("WALL",222,sY+40);
        ctx.fillText(me.info.walls,235,sY+60);
        if(me.stats.wall < 1){//If not unlocked
            ctx.beginPath();
            ctx.moveTo(220,sY+20);
            ctx.lineTo(270,sY+70);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(270,sY+20);
            ctx.lineTo(220,sY+70);
            ctx.stroke();
        }
        ctx.font = "22px Courier";
        ctx.fillText("R",239,sY+90);

        //Mode
        sY = 500;
        ctx.beginPath();
        ctx.font = "24px Courier";
        if(me.info.trapped>0){ //Trapped
            ctx.fillStyle=colors.trapColor;
            ctx.fillText("TRAPPED",5,sY);

        }
        else if(me.info.stealthTime>0){ //stealthed
            ctx.fillStyle=colors.hudColor;
            ctx.fillText("STEALTHED",5,sY);

        }
        else if(me.info.inCombat>0){ //Combat
            ctx.fillStyle=colors.enemyColor;
            ctx.fillText("IN COMBAT",5,sY);

        }
        else{ //Exploring
            ctx.fillStyle=colors.uraniumColor;
            ctx.fillText("EXPLORING",5,sY);
        }

        //Info button
        ctx.beginPath();
        sY = 500;
        if(mX2 < 287 && mX2 > 195 &&
           mY2 < sY+10 && mY2 > sY-25){
            ctx.fillStyle = colors.hudColor;
            ctx.fillRect(195,sY-25,92,35);
            ctx.fillStyle = colors.hudBackColor;
            ctx.fillText("STATS",205,sY);
            mouseHover = "STATS";
        }
        else{
            ctx.strokeStyle = colors.hudColor;
            ctx.strokeRect(195,sY-25,92,35);
            ctx.fillStyle = colors.hudColor;
            ctx.fillText("STATS",205,sY);
        }

    }


}

function drawChatLog(ctx, startX, startY, width, height, me){
    //Calculate Drawing Area
    var sX = startX;
    var sY = startY;
    var wid = width;
    var hei = height;

    ctx.strokeStyle = colors.hudColor;
    ctx.beginPath();
    ctx.strokeRect(0,sY,wid,hei);
    ctx.stroke();

    if(mX2 < wid && mX2 > 0 &&
       mY2 < sY+hei && mY2 > sY){
        mouseHover = {"overBattlelog": true};
    }

    ctx.beginPath();
    ctx.fillStyle = colors.hudColor;

    var adjLog = adjustedBattleLog(battleLog, 8.9, wid-5); //11pt ~= 15px

    //Draw Scrollbar
    var listSize = 26;
    if(blScroll > adjLog.length || adjLog.length <= listSize) blScroll = 0;
    else if(blScroll > adjLog.length-listSize && adjLog.length > listSize) blScroll = adjLog.length-listSize;

    if(adjLog.length > listSize){
        ctx.beginPath();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = colors.hudColor;
        var maxHei = hei-565;
        ctx.fillRect(sX+wid-6,sY+15, 3, maxHei);
        ctx.globalAlpha = 1.0;
        var barsize = (listSize/adjLog.length)*(maxHei);
        ctx.fillRect(sX+wid-7,sY+15+(maxHei-barsize)-blScroll*(maxHei-barsize)/(adjLog.length-listSize),5,barsize);
    }


    sY = 540;
    ctx.font = "11pt Courier";

    var drawAmount = Math.min(adjLog.length, listSize);
    for(var i = blScroll, yAdj = 0; yAdj < drawAmount && i < adjLog.length; i++, yAdj++){
        if(adjLog[i].type==="combat")        ctx.fillStyle = colors.enemyColor;
        else if(adjLog[i].type==="server")   ctx.fillStyle = "#FFa500";
        else if(adjLog[i].type==="chat")     ctx.fillStyle = colors.hudColor;
        else if(adjLog[i].type==="tchat")    ctx.fillStyle = "#AA00FF";
        else if(adjLog[i].type==="loot")     ctx.fillStyle = "#FFFF00";
        else if(adjLog[i].type==="action")   ctx.fillStyle = colors.cantBuyColor;
        else if(adjLog[i].type==="purchase") ctx.fillStyle = "#FFFF00";
        else if(adjLog[i].type==="team")     ctx.fillStyle = "#900090";

        ctx.fillText(adjLog[i].msg, 3, hei-30-yAdj*15);
    }


    //User chat input
    var chat = "[ALL]: ";
    if(chatMessageType==="TEAM"){
        ctx.fillStyle = "#BB00EE";
        chat = "[TEAM]: ";
    }
    else ctx.fillStyle = colors.hudColor
    ctx.strokeRect(0,hei-25,wid,hei);
    var start = (chatMsg.length>24?chatMsg.length-24:0);
    var fullMsg = chat+chatMsg.substring(start,start+Math.min(chatMsg.length,26));
    ctx.fillText(fullMsg,3,hei-10);
    if(chatBlink)
        ctx.fillRect(Math.min((fullMsg.length)*8.8+4,286),hei-20,2,15);
}



//*****************************************************************************
//  Modal Displays functions
//*****************************************************************************
function displayModal(color, _callback){
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


//*****************************************************************************
//  Other drawing functions
//*****************************************************************************
function screenResize(){
    //place monitor in center
    var c1 = document.getElementById("monitor");
    var c2 = document.getElementById("sidebar");
    prevWid = $( document ).width();
    $(".gameScreen").css("margin-left",(prevWid-c1.width-c2.width)/2+"px");

    //Position the input boxes
    $(".modal").css({
        "left": (prevWid-c1.width-c2.width)/2 + 12*c1.width/16,
        "top": c1.height/4-50
    });
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
