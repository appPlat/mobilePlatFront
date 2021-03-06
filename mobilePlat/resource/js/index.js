/**
 * Created by xuchen04 on 2015/3/18.
 */

//--------------------------------------------------------------------------variable definitions
var projectId = localStorage.getItem("openedProjectId");
var projectName = localStorage.getItem("openedProjectName");
//var restServiceBase = "http://cp01-rdqa-dev112.cp01.baidu.com:8081";
//var projectServerBase = "http://cp01-rdqa-dev112.cp01.baidu.com:8079/pubprojects/"+projectId;
var restServiceBase = "http://cp01-rdqa04-dev108.cp01.baidu.com:8081";
var projectServerBase = "http://cp01-rdqa04-dev108.cp01.baidu.com:8082/pubprojects/"+projectId+"/www";

var openedFiles = [];
var editingFiles = [];
var editorFileMap = {};
var startScreenFileName = "firstscreen.html";


//--------------------------------------------------------------------------function definitions

/* 如果tab是active的: 隐藏掉这个tab, 并把它旁边的tab设置为active，右侧优先
 * 如果tab不是active的：直接隐藏掉这个tab */
function closeTab(tab){
    if(tab.hasClass("active")){
        var tabSetActive = tab.nextAll("li:visible").first();
        if(0 == tabSetActive.length) {
            tabSetActive = tab.prevAll("li:visible").first();
        }
        if(0 != tabSetActive.length) {
            setTabAndContentVisiable(tabSetActive);
            setTabAndContentActive(tabSetActive)
        }else{
        }
    }else{
        //do nothing
    }
    setTabAndContentInvisiable(tab);
}

function setTabAndContentInvisiable(tab){
    tab.hide();
    var targetContent = tab.data("target");
    $(targetContent).removeClass("active");
}

function setTabAndContentVisiable(tab){
    tab.show();
    var targetContent = tab.data("target");
    $("#main_tabcontents div.tab-pane").removeClass("active");
    $(targetContent).addClass("active");
    var path = tab.data("path");
}

function setTabAndContentActive(tab){
    $("#main_tabs li").removeClass("active");
    tab.addClass("active");
}

function getTabByFilePath(path){
    return $("span.custom-icon-remove[data-path='"+ path +"']").parents("li");
}

/*  生成GUID */
function s4(){
    return Math.floor((1+Math.random())*0x10000).toString(16).substring(0);
}
function genUUID(){
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/* 懒加载子节点 */
function lazyLoadSub(node, data) {
    if(data.code == "success"){
        for(var i=0 ; i<data.content.length ; i++) {
            node.addChild({
                title: data.content[i].fileName,
                key: data.content[i].relativePath,
                isFolder : data.content[i].isFolder,
                isLazy: data.content[i].isFolder
            });
        }
        //获取根目录子节点，默认打开首屏文件
        if(node.data.key == "/"){
            var tree = $("#source_tree").dynatree("getTree");
            var node = tree.getNodeByKey("//" + startScreenFileName);
            if(node){
                node.activate();
            }else{
                console.log("get start screen file error!");
            }
        }
    }else{
        alert("获取目录文件失败，请稍后再试");
    }
}

/* 传入文件路径和文件名，创建(如果需要)显示相应tab和文件内容*/
function openNewTabAndContent(path, filename) {
    var tab = getTabByFilePath(path);
    var fileContent = ajaxGetFileContent(path);
    if(tab.length == 0){
        var uuid = genUUID();
        createNewTabAndTabContent(filename, path, uuid);
        initCodeMirror(path,fileContent,uuid);
    }else{
        setTabAndContentVisiable(tab);
        setTabAndContentActive(tab);
        if(isFileEditing(path)){
            //do nothing
        }else{
            // change codemirror content
            var editor = editorFileMap[path];
            if(editor){
                editor.setValue(fileContent);
            }
        }
    }
}


//--------------------------------------------------------------------------file functions
/*  获取文件内容 */
function ajaxGetFileContent(path){
    var jsondata = {};
    var result;
    jsondata.filePath = path;
    $.ajax({
        url     : restServiceBase + "/api/rest/file/source/" + projectId + "/read",
        method  : "POST",
        data    : JSON.stringify(jsondata),
        dataType: "json",
        contentType: "application/json",
        async   : false,
        timeout : 10000,
        success : function(data){
            if(data.code == 'success'){
                result = data.content;
            }else{
                result =  "error";
            }
        }
    });
    return result;
}

/*  保存文件 */
function saveFileContent(path, content) {
    var jsondata = {};
    jsondata.filePath = path;
    jsondata.fileContent = content;

    $.ajax({
        'url'     : restServiceBase + "/api/rest/file/source/" + projectId + "/update",
        'data'    : JSON.stringify(jsondata),
        'type'    : "POST",
        'timeout' : 10000,
        'success' : function(data){
            if(data.code == 'success'){
                $("#saveFileText").text("保存修改");
            }else{

            }
        },
        'dataType': "json",
        'contentType': "application/json"
    });
}

function stringEndWith(src, target){
    if(target==null||target==""||src.length==0||target.length>src.length)
        return false;
    if(src.substring(src.length-target.length)==target)
        return true;
    else
        return false;
    return true;
}

function initCodeMirror(path, fileContent, uuid){
    var selector = "#" + uuid + "> div.source-editor";
    var cmEditor
    if(stringEndWith(path, ".js")){
        cmEditor = initACodeMirrorEditor($(selector), fileContent, "js");
    }else{
        cmEditor = initACodeMirrorEditor($(selector), fileContent, "htmlmix");
    }

    // 记录 文件路径--> codemirror 的映射
    editorFileMap[path] = cmEditor;
}

/*  根据文件名称和文件路径，新建tab及其内容DOM节点 */
function createNewTabAndTabContent(filename, filepath, uuid) {
    var tabData = {
        title : filename,
        path  : filepath,
        id    : uuid
    }
    var tabHtml = baidu.template('tabTemplate', tabData);
    $("#main_tabs > ul").append(tabHtml);
    var tabContentHtml = baidu.template('tabContentTemplat', tabData);
    $("#main_tabs > div").append(tabContentHtml);
}

/*  根据path判断是否该文件已经打开tab页 */
function alreadyOpen(path) {
    for(var i = 0 ; i < openedFiles.length ; i++){
        if(openedFiles[i] === path){
            return true;
        }
        else{
            return false;
        }
    }
}

/*  根据path判断是否该文件是否被编辑过 */
function isFileEditing(path) {
    for(var i = 0 ; i < editingFiles.length ; i++){
        if(editingFiles[i] === path){
            return true;
        }
        else{
            return false;
        }
    }
}

function testApp(){
    var a = $("<a href='simulator.html' target='_blank'>Apple</a>").get(0);
    var e = document.createEvent('MouseEvents');
    e.initEvent( 'click', true, true );
    a.dispatchEvent(e);
}

var mixedMode = {
    name: "htmlmixed",
    scriptTypes: [{matches: /\/x-handlebars-template|\/x-mustache/i,
        mode: null},
        {matches: /(text|application)\/(x-)?vb(a|script)/i,
            mode: "javascript"}]
};

function initACodeMirrorEditor(inWhich, content,filetype){
    var myCodeMirror = CodeMirror(inWhich.get(0),{
        lineNumbers: true,
        mode: filetype == 'js' ? "javascript" : mixedMode,
        height:"100%",
        value: content,
        theme:"night",
        autoCloseBrackets:true,
        autoCloseTags: true,
        indentUnit:4,
        foldGutter: true,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        lineWrapping: true
    });
    myCodeMirror.setOption("extraKeys", {
        "F11" : function(cm) {
            if (cm.getOption("fullScreen")) {
                $("#main_tabs ul").show();
                $("#project_panel").show();
                cm.setOption("fullScreen", false)
            }else{
                $("#project_panel").hide();
                $("#main_tabs ul").hide();
                cm.setOption("fullScreen", true)
            }
        },
        "Ctrl-S": function(cm) {
            $("#saveFileText").text("正在保存..");
            var fileContent = cm.getValue();
            var filePath = $("#main_tabs li.active span.custom-icon-remove").data("path");
            saveFileContent(filePath, fileContent);
        }
    });
//    myCodeMirror.foldCode(CodeMirror.Pos(0, 0));
    myCodeMirror.foldCode(CodeMirror.Pos(5, 0));
    return myCodeMirror;
}

//获取子目录文件，并将其添加到树节点
function getSubFilesAndAddNodes(node){
    var jsondata = {};
    jsondata.path = node.data.key;
    $.ajax({
        type:       "POST",
        url:        restServiceBase + "/api/rest/file/source/" + projectId + "/getsubfile",
        data:       JSON.stringify(jsondata),
        dataType:   "json" ,
        contentType: "application/json",
        async: false,
        success:    function(data){
            lazyLoadSub(node, data);
        }
    });
}

//----------------------------------------------------用户指导

function adjust_fullbg_size(){
    if(localStorage.guideShowCount==1) {
        $("#fullbg").css({
            height: $("body").height(),
            width: $("body").width(),
            display: "block"
        });
        $("#guide-code-app").css("left", $("body").width() / 2 - 100);
    }
}

$(function(){
    /*  ----------------------------------------------初始化项目源码树  */
    $("#source_tree").dynatree({
            title: "SourceCode Tree",
            /* 树节点激活逻辑 */
            onActivate: function(node) {
                if(node.data.isFolder){
                }else{
                    openNewTabAndContent(node.data.key, node.data.title);
                }
            },
            /* 懒加载节点逻辑 */
            onLazyRead: function(node) {
                getSubFilesAndAddNodes(node);
            }
        }
    );

    var rootNode = $("#source_tree").dynatree("getRoot");
    var childNode = rootNode.addChild({
        title: projectName,
        tooltip: projectName,
        isFolder: true,
        isLazy: true,
        expand: false,
        key: "/"
    });

    function initWorkspace(){
        var tree = $("#source_tree").dynatree("getTree");
        var node = tree.getNodeByKey("/");
        node.expand();
    }

    function showUserGuid(){
        if (localStorage.guideShowCount){
            localStorage.guideShowCount=Number(localStorage.guideShowCount) +1;
        }else{
            localStorage.guideShowCount=1;
        }

        if(localStorage.guideShowCount==1){
            adjust_fullbg_size();
            $("#guide-generate-app").show();
            $("#guide-show-app").show();
            $("#guide-code-app").show();
        }
    }

    function newFileAndFolder(){
        var top = $("#testbtn").offset().top + $("#testbtn").height + 10;
        var left = 0;
        $("#testbtn").attr('disabled','true');
        var pageii = $.layer({
            type: 1,
            title: false,
            area: ['auto', 'auto'],
            border: [0], //去掉默认边框
            shade: [0], //去掉遮罩
            closeBtn: [0, false], //去掉默认关闭按钮
            shift: 'top', //从左动画弹出,
            page: {
                html: '<div style="width:247px; height:400px; padding:20px; border:1px solid #ccc; background-color:#eee;">' +
                    '<p>创建文件及目录功能，敬请期待</p>' +
                    '<button id="pagebtn" class="btns" onclick="">关闭</button>' +
                    '</div>'
            }
        });
        $('#pagebtn').on('click', function(){
            $("#testbtn").removeAttr('disabled');
            layer.close(pageii);
        });
    }

//--------------------------------------------------------------------------事件绑定*/

    /*左侧边框的伸缩和拖动  */
    $("#project_panel").resizable({
        maxWidth: 500,
        minWidth: 220
    });
    $("#project_panel").resize(function(){
        $("#main_tabs").css("margin-left",$("#project_panel").width()+2);
    });

    $("#hide-tree").click(function(){
        $("#project_panel").toggleClass("panel-collapsed ui-resizable-disable ui-state-disable");
        if($("#project_panel").hasClass("panel-collapsed")){
            $("#main_tabs").css("margin-left", "35px");
        }else{
            $("#main_tabs").css("margin-left", $("#project_panel").width()+2);
        }
    });

    /*编辑区tab事件绑定*/
    $("#main_tabs ul").on('click', 'li', function(){
        setTabAndContentVisiable($(this));
        setTabAndContentActive($(this));
        var path = $(this).data("path");
        var fileContent = ajaxGetFileContent(path);
        var editor = editorFileMap[path];
        if(editor){
            editor.setValue(fileContent);
        }
    });

    $("#main_tabs ul").on('click', 'span.custom-icon-remove', function(event){
        event.stopPropagation();
        var tab = $(this).parents("li");
        closeTab(tab);
    });

    /*  关闭项目*/
    $("#closeProject").click(function(){
        var a = $("<a href='projectmanage.html'>Apple</a>").get(0);
        var e = document.createEvent('MouseEvents');
        e.initEvent( 'click', true, true );
        a.dispatchEvent(e);
    });

    $("#testbtn").click(function(){
        newFileAndFolder();
    });

    /*  启动预览*/
    $("#testApp").click(function(){
        testApp();
    });

    /* 窗口调整，用户指引遮罩位置调整 */
    $(window).resize(function(){
        adjust_fullbg_size();
    });
    /*  指引遮罩层点击绑定*/
    $("#fullbg").click(function(){
        $("#fullbg").hide();
        $("#fullbg")
        $("#guide-generate-app").hide();
        $("#guide-show-app").hide();
        $("#guide-code-app").hide();
        localStorage.guideShowCount=Number(localStorage.guideShowCount) +1;
    });

//--------------------------------------------------------------------------页面显示数据初始化
    //项目名称
    $("#panel-project-name").text(projectName);

    initWorkspace();

    showUserGuid();

})