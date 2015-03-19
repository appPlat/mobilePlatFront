/**
 * Created by xuchen04 on 2015/3/19.
 */



$(function(){

    var projectId = localStorage.getItem("openedProjectId");
    var projectServerBase = "http://cp01-rdqa04-dev108.cp01.baidu.com:8082/pubprojects/"+projectId+"/www";
    var appInitPath = projectServerBase + "/firstscreen.html";

    $("#frame_viewport").attr('src', appInitPath + "?_" +Math.random());

    $("#qrcode").attr('src',"http://qr.liantu.com/api.php?el=l&w=200&text="+appInitPath);

//-----------------------------------------------------------------------事件绑定
    $(".sizebtn ").click(function(){
        $(".sizebtn").removeClass("active");
        $(this).addClass("active")
        var sizedefine = $(this).data("size");
        var size = sizedefine.split("x");
        var width = parseInt(size[0]) + 17*2 + 2;
        $("#frame").width(width);
        var height = parseInt(size[1])+51+53+2;
        $("#frame").height(height);
        console.log(width);
        console.log(height);
    });

    $("#view_on_phone_link").click(function(){
        $("#dropdown_columns").toggleClass("open_phone_content");
        $("#dropdown_columns").toggleClass("close_phone_content");
        $("#view_on_phone_link").toggleClass("close");
        $("#view_on_phone_link").toggleClass("open");
    });
})