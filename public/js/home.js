var bases = [];

setTimeout(init,2);

function init(){
    $("#color-picker1").hexColorPicker({
        "container":"dialog",
		"colorModel":"hsl",
		"pickerWidth":300,
		"size":7,
		"style":"hex"
    });
    $("#color-picker2").hexColorPicker({
        "container":"dialog",
		"colorModel":"hsl",
		"pickerWidth":300,
		"size":7,
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
    //drawAvailableColors();
}

function colorAvailable(base, area){
    if(base === area)
        return "Base and area need to be different colors.";


    var hex = area.replace('#','');
    var r = parseInt(hex.substring(0,2), 16);
    var g = parseInt(hex.substring(2,4), 16);
    var b = parseInt(hex.substring(4,6), 16);
    if(r+g+b < 140)
        return "Area color is too dark";

    hex = base.replace('#','');
    var r2 = parseInt(hex.substring(0,2), 16);
    var g2 = parseInt(hex.substring(2,4), 16);
    var b2 = parseInt(hex.substring(4,6), 16);

    if(Math.abs(r2-r)<20 && Math.abs(g2-g)<20 && Math.abs(b2-b)<20)
        return "Base color is too similar to Area color";

    for(var b in bases){
        if(bases[b].baseColor==base && bases[b].areaColor==area){
            return "Color Has been taken";
        }
    }

    return true;
}
