var patA = [50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250];
var patB = [50,70,90,110,130,150,170,190,210,230,250];
var patC = [50,80,110,140,170,200,230];

var changeInterval = 1000;

setTimeout(changeColors,2);

function changeColors(){
    var array = patA;
    for(var i = 1; i <= 10; i++){
        var r1 = parseInt(Math.random()*100)%array.length,
            g1 = parseInt(Math.random()*100)%array.length,
            b1 = parseInt(Math.random()*100)%array.length;

        var r2 = parseInt(Math.random()*100)%array.length,
            g2 = parseInt(Math.random()*100)%array.length,
            b2 = parseInt(Math.random()*100)%array.length;

        $("#c"+i).css('background-color','rgb('+array[r1]+','+array[g1]+','+array[b1]+')');
        $("#c"+i+" .baseArea").css('background-color','rgb('+array[r2]+','+array[g2]+','+array[b2]+')');
    }
    setTimeout(changeColors,changeInterval);
}
