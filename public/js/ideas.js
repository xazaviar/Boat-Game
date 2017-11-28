setTimeout(init,2);
setInterval(displayFeedback,5000);

function init(){
    //Set initial colors
    buildUI();

    //Show the current feedback
    displayFeedback();
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

    $("#bugs").css({
        "border": "1px solid "+colors.hudColor
    });
    $("#features").css({
        "border": "1px solid "+colors.hudColor
    });

    $(".button").css({
        "color": colors.hudColor,
        "border": "2px solid "+colors.hudColor
    });
    $(".button").hover(function(){
        $(this).css({
            "color": colors.hudBackColor,
            "background-color": colors.hudColor
        })}, function(){
            $(this).css({
                "color": colors.hudColor,
                "background-color": colors.hudBackColor
            });
        }
    );
    $('.button').on("click",function(){
        var id = $(this).attr("id");
        console.log(id);
        if(id==="submitB"){
            $("#bugForm").hide();

        }
        else if(id==="submitF"){
            $("#featureForm").hide();

        }
        else if(id==="report"){ $("#bugForm").toggle(); }
        else{ $("#featureForm").toggle(); }
    });
}

function displayFeedback(){
    getFeedback(function(data){
        var bugs = [], feat = [];

        //Sort
        for(var i in data){
            if(data[i].type==="bug") bugs.push(data[i]);
            else feat.push(data[i]);
        }

        //Display bugs
        $("#bugList").empty();
        if(bugs.length > 0){

        }
        else{
            $("#bugList").append("There appear to be no bugs. I guess the game is perfect! To report a bug, click the report button.");
        }

        //Display features
        $("#featureList").empty();
        if(feat.length > 0){

        }
        else{
            $("#featureList").append("It seems that there are no feature requests. To request a feature, click the request button.");
        }
    });
}
