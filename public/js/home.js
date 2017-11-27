var users, teams;

setTimeout(init,2);

setInterval(updates,5000);

function init(){
    //Set initial colors
    buildUI();


    //Map
    updateMap();

    //Chat log


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
        var win = window.open(""+location.origin+"/"+id);
        if (win)
            win.focus();
        else
            alert('Please allow popups for this website');
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
    users = getLeaderboard();
    teams = getTeamLeaderboard();

    displayLeaderboard();
}

function displayLeaderboard(){
    var leaderboard = [];

    if($("#user").hasClass("selected")) leaderboard = users;
    else leaderboard = teams;

    console.log(leaderboard, users.length, teams.length);
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
