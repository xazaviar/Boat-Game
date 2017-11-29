setTimeout(init,2);

function init(){
    //Set initial colors
    buildUI();

    //Build the wiki
    buildWiki();
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

    $(".sidebar").css({
        "border": "1px solid "+colors.hudColor
    });

}

function buildWiki(){
    getWikiInfo(function(data){
        for(var c in data){
            $(".sidebar").append('<a href="#'+data[c].sidebarLabel+'" class="contentLinkMain">'+data[c].sidebarLabel+'</a></br>');
            $(".contentBox").append('<div id="'+data[c].sidebarLabel+'" class="title">'+data[c].title+'</div>');
            $(".contentBox").append('<div id="sc'+c+'" class="content">'+data[c].content+'</div>');

            for(var s in data[c].subSections){
                $(".sidebar").append('<a href="#'+data[c].subSections[s].sidebarLabel+'" class="contentLinkSub">'+data[c].subSections[s].sidebarLabel+'</a></br>');
                $(".contentBox #sc"+c).append('<div id="'+data[c].subSections[s].sidebarLabel+'" class="subtitle">'+data[c].subSections[s].title+'</div>');
                $(".contentBox #sc"+c).append(''+data[c].subSections[s].content+'</br>');

                for(var l in data[c].subSections[s].subSections){
                    $(".sidebar").append('<a href="#'+data[c].subSections[s].subSections[l].sidebarLabel+'" class="contentLinkLab">'+data[c].subSections[s].subSections[l].sidebarLabel+'</a></br>');
                    $(".contentBox #sc"+c).append('<div id="'+data[c].subSections[s].subSections[l].sidebarLabel+'" class="label">'+data[c].subSections[s].subSections[l].title+'</div>');
                    $(".contentBox #sc"+c).append(''+data[c].subSections[s].subSections[l].content+'</br>');
                }
            }
        }
        // console.log(data);

        $(".contentLinkMain").css({
            "color": colors.hudColor
        });
        $(".contentLinkSub").css({
            "color": colors.hudColor
        });
        $(".contentLinkLab").css({
            "color": colors.hudColor
        });

        $("td").css({
            "border": "1px solid "+colors.hudColor
        });
        $("th").css({
            "border": "1px solid "+colors.hudColor
        });
    });
}
