var bases = [];

setTimeout(init,2);

function init(){
    $("#color-picker1").hexColorPicker({
        "container":"dialog",
		"colorModel":"hsl",
		// "pickerWidth":100,
		"size":5,
		"style":"hex"
    });
    $("#color-picker2").hexColorPicker({
        "container":"dialog",
		"colorModel":"hsl",
		// "pickerWidth":100,
		"size":5,
		"style":"hex"
    });

    $('#baseForm').submit( function (e) {
        e.preventDefault();
        var base = $("#color-picker1").val();
        var area = $("#color-picker2").val();

        if(base!="" && area!=""){
            var available = colorAvailable(base, area);
            if(available==true){
                bases.push({
                    "baseColor":base,
                    "areaColor":area
                });
                $("#color-picker1").css('background-color',"white");
                $("#color-picker2").css('background-color',"white");
                $("#color-picker1").val(null);
                $("#color-picker2").val(null);
                drawAllBases();
            }else{
                alert(available);
            }
        }else{
            alert("Need two colors.");
        }
        return false;
    });
}

function drawAllBases(){
    $('.mainArea').empty();
    for(var b in bases){
        $('.mainArea').append('<div id="c'+b+'" class="colorArea"><div class="baseArea"></div></div>');
        $("#c"+b).css('background-color',bases[b].areaColor);
        $("#c"+b+" .baseArea").css('background-color',bases[b].baseColor);
    }
}

function colorAvailable(base, area){
    if(base === area)
        return "Base and area need to be different colors.";

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

    for(var b in bases){
        hex = bases[b].baseColor.replace('#','');
        var br2 = parseInt(hex.substring(0,2), 16);
        var bg2 = parseInt(hex.substring(2,4), 16);
        var bb2 = parseInt(hex.substring(4,6), 16);
        hex = bases[b].areaColor.replace('#','');
        var ar2 = parseInt(hex.substring(0,2), 16);
        var ag2 = parseInt(hex.substring(2,4), 16);
        var ab2 = parseInt(hex.substring(4,6), 16);

        if(Math.abs(br2-br)<20 && Math.abs(bg2-bg)<20 && Math.abs(bb2-bb)<20 &&
           Math.abs(ar2-ar)<30 && Math.abs(ag2-ag)<30 && Math.abs(ab2-ab)<30){
            return "Color combo has been taken";
        }
    }

    return true;
}
