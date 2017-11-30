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

//*****************************************************************************
//  Main Drawing functions
//*****************************************************************************
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

            ctx.globalAlpha = 1.0;
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
