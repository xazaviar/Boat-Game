

$.get("/changelog", function( data ) {
    //$(".logArea").append(JSON.stringify(data));
    displayChangeLog($(".logArea"), data);

});

function displayChangeLog(zone, data){

    for(var i in data){
        zone.append("<div class='change "+i+"'>"+
                "<div class='title'>"+data[i].title+"</div>"+
                "<div class='date'>"+data[i].date+"</div>"+
                "<div class='version'>"+data[i].version+"</div>"+
                "<div class='description'>"+data[i].description+"</div></div>");
        // zone.append(JSON.stringify(data[i]));
        zone.append("<br>")
    }



}
