var users, teams;

setTimeout(init,2);
setInterval(updates,5000);

function init(){
    //Set initial colors
    buildUI();

    //Map
    updateMap();

    //Leaderboard
    updateLeaderboard();

    //Changelog
    getChangelog(function(data){
        displayChangeLog($("#logArea"), data);
    });
}

function updates(){
    updateMap();
    updateLeaderboard();
}

function buildUI(){
    //See if colors can be loaded
    var temp = JSON.parse(localStorage.getItem('savedColors'));
    if(temp!=null) colors = temp;
    else colors = colorsDefault;


    $("body").css({
        "color": colors.hudColor,
        "background-color": colors.hudBackColor
    });
    $(".header").css({
        "border": "2px solid "+colors.hudColor
    });

    $(".websiteTitle").css({
        "color": colors.hudColor+"DD"
    });
    $(".websiteTitle").hover(function(){
        $(this).css({
            "color": colors.hudColor
        })}, function(){
        $(this).css({
            "color": colors.hudColor+"DD"
        })}
    );
    $('.websiteTitle').on("click",function(){
        window.location = ""+location.origin+"/home";
    });


    $(".tab").css({
        "border": "2px solid "+colors.hudColor
    });
    $(".tab").hover(function(){
        $(this).css({
            "color": colors.hudBackColor,
            "background-color": colors.hudColor
        })}, function(){
        $(this).css({
            "color": colors.hudColor,
            "background-color": colors.hudBackColor
        })}
    );
    $('.tab').on("click",function(){
        var id = $(this).attr("id");
        if(id==="game"){
            var win = window.open(""+location.origin+"/"+id);
            if (win)
                win.focus();
            else
                alert('Please allow popups for this website');
        }
        else{
            window.location = ""+location.origin+"/"+id;
        }
    });

    //Leaderboards
    $(".button").css({
        "color": colors.hudColor,
        "border": "2px solid "+colors.hudColor
    });
    $(".button").hover(function(){
        $(this).css({
            "color": colors.hudBackColor,
            "background-color": colors.hudColor+"BB"
        })}, function(){
            if(!$(this).hasClass("selected")){
                $(this).css({
                    "color": colors.hudColor,
                    "background-color": colors.hudBackColor
                });
            }
            else{
                $(this).css({
                    "color": colors.hudBackColor,
                    "background-color": colors.hudColor
                });
            }
        }
    );
    $('.button').on("click",function(){
        var id = $(this).attr("id");
        if(id==="user"){
            $("#team").removeClass("selected");
            $("#team").css({
                "color": colors.hudColor,
                "background-color": colors.hudBackColor
            });
        }
        else{
            $("#user").removeClass("selected");
            $("#user").css({
                "color": colors.hudColor,
                "background-color": colors.hudBackColor
            });
        }
        $(this).addClass("selected");

        $(this).css({
            "color": colors.hudBackColor,
            "background-color": colors.hudColor
        });

        displayLeaderboard();
    });

    $("#user").addClass("selected");
    $(".selected").css({
        "color": colors.hudBackColor,
        "background-color": colors.hudColor
    });
}

function updateMap(){
    getMap(function(map){
        var c = document.getElementById("drawMap");
        var ctx = c.getContext("2d");
        ctx.clearRect(0,0,c.width,c.height);
        ctx.globalAlpha = 1.0;
        drawMapSimple(ctx, 0, 0, c.width, c.height, map);
    });
}

function updateLeaderboard(){
    getLeaderboard(function(data1){
        users = data1;
        getTeamLeaderboard(function(data2){
            teams = data2;
            displayLeaderboard();
        });
    });


}

function displayLeaderboard(){
    var leaderboard = [];

    $("#table").empty();
    $("#table").append("<thead></thead><tbody></tbody>");

    if($("#user").hasClass("selected")){
        leaderboard = users;
        $("#table tbody").append("<tr><th>Rank</th><th>Name</th><th>Power</th><th>Online</th></tr>");
    }
    else{
        leaderboard = teams;
        $("#table tbody").append("<tr><th>Rank</th><th>Name</th><th>Power</th></tr>");
    }

    $("th").css({
        "border-bottom": "2px solid "+colors.hudColor
    });

    var rank = 1;
    for(var i = 0; i < Math.min(leaderboard.length,10); i++){
        if(i > 0){
            if(leaderboard[i].power!=leaderboard[i-1].power) rank = i+1;
        }
        if($("#user").hasClass("selected")){

            $("#table tbody").append("<tr><td>"+rank+"</td><td>"+leaderboard[i].name+"</td><td>"+leaderboard[i].power+"</td><td>"+leaderboard[i].online+"</td></tr>");
        }
        else{
            $("#table tbody").append("<tr><td>"+rank+"</td><td>"+leaderboard[i].name+"</td><td>"+leaderboard[i].power+"</td></tr>");
        }
    }
}

function displayChangeLog(zone, data){
    //Sort by date
    data.sort(function(a,b){
        var key1 = new Date(a.date);
        var key2 = new Date(b.date);

        if(key1 < key2) return 1;
        if(key1 > key2) return -1;
        return 0;
    });

    //Draw all changes
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
