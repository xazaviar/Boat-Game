function canPurchase(costs, inventory){
    if(costs.gold    <= inventory.gold &&
       costs.iron    <= inventory.iron &&
       costs.uranium <= inventory.uranium)
        return true;

    return false;
}

function getCookie(name){
    var cname = name + "=";
    var decodedCookie = decodeURIComponent(document.cookie);

    var ca = decodedCookie.split(";");
    for(var i = 0; i < ca.length; i++){
        var c = ca[i];
        while(c.charAt(0)==' ')
            c.substring(1);

        if(c.indexOf(cname) == 0){
            return c.substring(name.length+1, c.length);
        }
    }

    return "";
}

function teamValidation(base, area, name, teamList){
    if(base=="" || area=="")
        return "Base and/or area color missing";
    if(base === area)
        return "Base and area need to be different colors";
    if(tName.length<4)
        return "Need a longer Team Name";

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

    for(var b in teamList){
        if(teamList[b].id!=null){
            hex = teamList[b].colors.baseColor.replace('#','');
            var br2 = parseInt(hex.substring(0,2), 16);
            var bg2 = parseInt(hex.substring(2,4), 16);
            var bb2 = parseInt(hex.substring(4,6), 16);
            hex = teamList[b].colors.areaColor.replace('#','');
            var ar2 = parseInt(hex.substring(0,2), 16);
            var ag2 = parseInt(hex.substring(2,4), 16);
            var ab2 = parseInt(hex.substring(4,6), 16);

            if(Math.abs(br2-br)<20 && Math.abs(bg2-bg)<20 && Math.abs(bb2-bb)<20 &&
               Math.abs(ar2-ar)<30 && Math.abs(ag2-ag)<30 && Math.abs(ab2-ab)<30){
                return "Color combo has been  taken";
            }

            if(teamList[b].name.toLowerCase()===name.toLowerCase()){
                return "Name has been taken";
            }
        }
    }

    return true;
}

function toggleSaving(token){
    var cookie = getCookie("token");
    if(cookie==="" || cookie!==token){
        document.cookie = "token="+token+"; expires=Mon, 30 Dec 2019 12:00:00 UTC; path=/";
    }
    else{
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    }
}

function filterMemberList(members, admins, leader){
    var mems = [];
    for(var m in members){
        if(members[m].id != leader.id){
            var adm = false;
            for(var a in admins){
                if(members[m].id == admins[a].id){
                    adm = true;
                    break;
                }
            }
            if(!adm)
                mems.push({
                    "id":members[m].id,
                    "name":members[m].name,
                    "powerLevel":members[m].powerLevel,
                    "online": members[m].online
                });
        }
    }

    //Sort the list
    mems.sort(function(a, b){
        var idA = a.online, idB = b.online;

        if(idA && !idB) return -1;
        if(!idA && idB) return 1;
        return 0;
    });

    return mems;
}

function filterPlayerList(list){
    var newList = [];
    for(var i = 0; i < list.length; i++){
        if(typeof list[i].powerLevel !=="undefined")
            newList.push(list[i]);
    }

    return newList;
}

function saveColorScheme(color){
    localStorage.setItem('savedColors', JSON.stringify(colors));
}
