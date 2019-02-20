// ---------------------------------------------------------------------------------------------
// EXPERIMENT CODE
// ---------------------------------------------------------------------------------------------
// // ------------
// // SVG data Kibana

// d3data = d3.select("body").selectAll("svg").data()
// for (var i=0; i<d3data.length; i++)
//     console.log(i  + d3data[i].xAxisLabel + ". " + d3data[i].series[0].label + " values[0] ka Y = " + d3data[i].series[0].values[0].y);


// // ------------
// // Parent Panel
//  	d3.select("body").selectAll("svg")[0][0].parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode





// -------------------------------------------------------------------------------------------------

// ------------------------------------
// One time during dashboard load tasks
// ------------------------------------

// ------------------------
// 1. Extracting threshold through JS calls to ES .kibana index




function loadGlobalVisualMetas() {
    current_host = window.location.host
// todo check what is 'preference' for?
    url = 'http://'+current_host+'/elasticsearch/_mget?timeout=0&ignore_unavailable=true&preference=1523735478386'
    resp = undefined;
    visualistionsReponse = {};
    kibanaPanelSources = {};

    $.ajax ({
        url: url,
        type: "POST",
// todo this needs to be made dynamic
        data: JSON.stringify({"docs":[{"_index":".kibana","_type":"dashboard","_id": dashboard_name}]}),
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function(data){
            panelsJson = JSON.parse(data.docs[0]._source.panelsJSON)

            debugger;
            for(i=0; i < panelsJson.length; i++ ) {
                vis_id = panelsJson[i].id
                resp = undefined;
                $.ajax ({
                    url: 'http://'+current_host+'/elasticsearch/_mget?timeout=0&ignore_unavailable=true&preference=1523735478386',
                    type: "POST",
                    data: JSON.stringify({"docs":[{"_index":".kibana","_type":"visualization","_id":vis_id}]}),
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    success: function(data){
                        console.log(data);
                        debugger;
                        kibanaPanelSources[data.docs[0]._id] = data.docs[0]._source;
                        if (data.docs[0]._source.uiStateJSON != undefined)
                            visualistionsReponse[data.docs[0]._id] = JSON.parse(data.docs[0]._source.uiStateJSON);

                    }
                });
            }
        }
    });
}


// ------------------------
// 2. Registering sound
function addAudioTags() {
    if ($(".audioDemo").length == 0) {
        $(".navbar-timepicker").first().append("<audio class=\"audioDemo\" loop> <source src=\"http://soundbible.com/mp3/Air%20Horn-SoundBible.com-1561808001.mp3\">   </audio>");
        $(".audioDemo").trigger('load');
    }
// $(".audioDemo").trigger('play');
}

function volumeUp(){
    var volume = $(".audioDemo").prop("volume")+0.2;
    if(volume >1){
        volume = 1;
    }
    $(".audioDemo").prop("volume",volume);
}

function volumeDown(){
    var volume = $(".audioDemo").prop("volume")-0.2;
    if(volume <0){
        volume = 0;
    }
    $(".audioDemo").prop("volume",volume);
}


// ------------
function updateSVGs() {
    allSVGElems = d3.select("body").selectAll("svg")
    d3data = allSVGElems.data();

// Panel titles collection
    parentTitlesRelative = [];
    parentTitlesOriginalRelative = [];
    for (var i=0; i<allSVGElems[0].length; i++) {
        str = $(allSVGElems[0][i].parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode).find('.panel-title').attr("title");
        parentTitlesOriginalRelative.push(str);
        parentTitlesRelative.push(typeof str !== 'undefined' ? str.replace(/\s\s*/g, '-').replace(/-+/g, '-') : str);
    }
}

// Timer utility
function Timer(fn, t) {
    var timerObj = setInterval(fn, t);
    var status = 'RUNNING';

    this.stop = function() {
        if (timerObj) {
            clearInterval(timerObj);
            timerObj = null;
        }
        this.status = 'STOPPED';
        return this;
    }

// start timer using current settings (if it's not already running)
    this.start = function() {
        if (!timerObj) {
            this.stop();
            timerObj = setInterval(fn, t);
        }
        this.status = 'RUNNING';
        return this;
    }

// start with new interval, stop current interval
    this.reset = function(newT) {
        t = newT;
        return this.stop().start();
    }
}

// USAGE
// var timer = new Timer(function() {
//     // your function here
// }, 5000);


// // switch interval to 10 seconds
// timer.reset(10000);

// // stop the timer
// timer.stop();

// // start the timer
// timer.start();




// -----------
// When to run the alert check

function isAutorefreshEnabled() { return $($(".navbar-timepicker span")[1]).text() !== "Off" }
function visualAlertsEnabled() { return localStorage.getItem('enableVisualAlerts') == "true";}
function audioAlertsEnabled() { return localStorage.getItem('enableAudioAlerts') == "true";}
function watchmanBetaEnabled() { return localStorage.getItem('watchmanBetaEnabled') == "true";}
function allAlertsAcked() { return localStorage.getItem('allAlertsAcked') == "true";}
function isSpyAlerterEnabled() { return watchmanReady && watchmanBetaEnabled() && isAutorefreshEnabled() && (visualAlertsEnabled() || audioAlertsEnabled()) }

function getAutoRefreshTimeInSecs() {
    actualTimeInSeconds = 365*24*60*60;
    autoRefreshTimeText = $($(".navbar-timepicker span")[1]).text()
    autoRefreshTimeVal = autoRefreshTimeText.split(" ")[0]

    if(autoRefreshTimeText.includes("minute"))
        actualTimeInSeconds = autoRefreshTimeVal * 60

    if(autoRefreshTimeText.includes("second"))
        actualTimeInSeconds = autoRefreshTimeVal

    if(autoRefreshTimeText.includes("hour"))
        actualTimeInSeconds = autoRefreshTimeVal * 60 * 60

    return actualTimeInSeconds;
}

// -----------
// Acking the alerts


function ackAlerts() {
    $(".panel-heading").css("background-color","#272727");
    $(".panel-heading").children(".panel-title").css("color","#eeeeee");
    $(".audioDemo").trigger('pause');

    localStorage.setItem('allAlertsAcked', true);
}

function ackVisualAlertsForSpecificPanel(panel_heading) {
    panel_heading.css("background-color","#272727");
    panel_heading.children(".panel-title").css("color","#eeeeee");
}

function lookingIntoIt() {
    localStorage.setItem('enableAudioAlerts', false);
    $("#checkboxAudioAlerts").attr("checked", false)
    ackAlerts();
}


// --------------
// Orchestration
// --------------

function getTargetPanel(d3_data_position) {
    target_panel = undefined
    parent_title_original = parentTitlesOriginalRelative[d3_data_position];

    title_elem = $(".panel-title[title='" + parent_title_original + "']");
    if(typeof title_elem !== 'undefined')
        return title_elem.parent();

    return target_panel
};

function getThreshold(d3_data_position) {
    threshold = undefined
    parent_title = parentTitlesRelative[d3_data_position];


    if(typeof parent_title !== 'undefined' &&
        typeof visualistionsReponse[parent_title] !== 'undefined' &&
        typeof visualistionsReponse[parent_title].meta !== 'undefined'
    )
        threshold =  visualistionsReponse[parent_title].meta.threshold;

    return threshold;
}

function alertSettingChangeHandler(setting) {
    switch(setting) {
        case "SPY_ALERTS_ENABLED":
            $("#alert-settings-ico").css("font-size", "14px").css("color", "#61da3b");
            break;
        default:
            alert("unknown setting for alertSettingChangeHandler");

    }
}

function titleToKibanaId(input_title) {
    return input_title.replace(/\s\s*/g, '-').replace(/-+/g, '-');
}

function spyForAlerts() {
    if( isSpyAlerterEnabled() && allAlertsAcked() ) {

        console.log("time running now");
        alertSettingChangeHandler("SPY_ALERTS_ENABLED");

// handle line_graph visualisations
        updateSVGs();
        allAlertsGone = true
        ongoingAlerts = {}

        for (i=0; i< d3data.length; i=i+1) {
            series = d3data[i].series;
            targetPanel = getTargetPanel(i);
            threshold = getThreshold(i);
// debugger;

            if((typeof targetPanel !== 'undefined') && (typeof threshold !== 'undefined'))
            {
                for(j=0; j<series.length; j++) {
                    values = series[j].values
                    for(k=0; k<values.length; k++) {

                        if(values[k].y > threshold){
                            allAlertsGone = false
                            ongoingAlerts[targetPanel.find("span.panel-title").attr("title")] = targetPanel

                            if(audioAlertsEnabled())
                                $(".audioDemo").trigger('play');
// alert("more than threshold " + series[j].label  + " yValue " + values[k].y)
                            if(visualAlertsEnabled()) {
                                targetPanel.css("background-color","red")
                                targetPanel.attr("isAlerted", true)
                                targetPanel.children(".panel-title").css("color","white");
                            }
                        }
                    }

                }
            }
        }

// handle metrics_graph visualisations
// debugger;
        _.forEach(allMetricTitlesOriginal, function(origTitle) {
            kibanaId = titleToKibanaId(origTitle);
            value = visualistionsReponse[kibanaId];

            if(value.meta && value.meta.visType && value.meta.visType == "metrics_graph") {
                threshold = value.meta.threshold;
                targetPanel = $("span[title='" + origTitle + "']").parent();
                currentMetric = parseInt(targetPanel.parent().find("div.metric-value").html().replace(",",""));

                if (currentMetric > threshold) {
                    allAlertsGone = false
                    ongoingAlerts[targetPanel.find("span.panel-title").attr("title")] = targetPanel

                    if(audioAlertsEnabled())
                        $(".audioDemo").trigger('play');
// alert("more than threshold " + series[j].label  + " yValue " + values[k].y)

                    if(visualAlertsEnabled()) {
                        targetPanel.css("background-color","red");
                        targetPanel.attr("isAlerted", true)
                        targetPanel.children(".panel-title").css("color","white");
                    }
                }

            }
        });


// auto-ack if all alerts gone
        if(allAlertsGone)
            ackAlerts();

        allPanelHeadings = $(".panel-heading");
        _.forEach(allPanelHeadings, function(panel_heading) {
            panel_heading_elem = $(panel_heading)
            titleInUse = panel_heading_elem.find("span.panel-title").attr("title")
            if(!_.has(ongoingAlerts, titleInUse))
                ackVisualAlertsForSpecificPanel(panel_heading_elem);
        })
    }
}

function resetTheCronTime(customTimeInSeconds = 0) {
    if(customTimeInSeconds == 0 || (typeof customTimeInSeconds === 'undefined'))
        customTimeInSeconds = getAutoRefreshTimeInSecs();

    spyAlertRunTimer.reset(customTimeInSeconds * 1000);
    $("#spy_alerter_status").html(spyAlertRunTimer.status);
}

function stopSpyAlerter() {
    if(typeof spyAlertRunTimer == 'undefined')
        return;

    spyAlertRunTimer.stop();
    ackAlerts()
    $("#spy_alerter_status").html(spyAlertRunTimer.status);
    $("#alert-settings-ico").css("font-size", "14px").css("color", "#fffcef");
}

function startSpyAlerter() {
    var spy_time_manual_input_time = $("#spy_time_manual_input").val();
    resetTheCronTime(spy_time_manual_input_time);

    $("#spy_alerter_status").html(spyAlertRunTimer.status);
    $("#alert-settings-ico").css("font-size", "14px").css("color", "#61da3b");
}

function syncWithAutorefreshTime() {
    $("#spy_time_manual_input").val(getAutoRefreshTimeInSecs());
    startSpyAlerter();
}


// ---

// Enable alerting

// Set command=enableAlerts in query parameter

// $.urlParam = function (name) {
//     var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);

//     return results[1] || 0;
// }

// if ($.urlParam('command') == 'enableAlerts') {
// 	localStorage.setItem('enableAlerts', true);
// } else {
// 	localStorage.setItem('enableAlerts', false);
// }


// -------------
// Form controls - Settings

function setTheViews() {
    if(visualAlertsEnabled())
        $("input#checkboxVisualAlerts").attr("checked", true)
    if(audioAlertsEnabled())
        $("input#checkboxAudioAlerts").attr("checked", true)
    if(watchmanBetaEnabled())
        $("input#enableWatchmanBeta").attr("checked", true)
}

function toggleAlertSettings() {
    setTheViews();
    if($("#alert-settings-drop").is(":visible"))
        $("#alert-settings-drop").hide();
    else
        $("#alert-settings-drop").show();
}

function handleAlertCBClick(cb) {
    switch(cb.id) {
        case "checkboxVisualAlerts":
            if(cb.checked) {
                localStorage.setItem('enableVisualAlerts', true);
            } else {
                localStorage.setItem('enableVisualAlerts', false);
            }
            break;
        case "checkboxAudioAlerts":
            if(cb.checked) {
                localStorage.setItem('enableAudioAlerts', true);
            } else {
                $(".audioDemo").trigger('pause');
                localStorage.setItem('enableAudioAlerts', false);
            }
            break;
        case "enableWatchmanBeta":
            if(cb.checked) {
                localStorage.setItem('watchmanBetaEnabled', true);
                completeWatchmanInitiation();
                toggleAlertSettings();

            } else {
                localStorage.setItem('watchmanBetaEnabled', false);
                stopWatchman();
                addRequiredWatchmanUIElements();
                toggleAlertSettings();
            }
            break;
        default:
            alert("unidentified cb clicked");
    }
}

function completeWatchmanInitiation() {
    addRequiredWatchmanUIElements();

    if (!watchmanBetaEnabled())
        return;

    loadGlobalVisualMetas();
    addAudioTags();
    volumeUp();
    volumeUp();
    volumeUp();
    volumeUp();

    allMetricTitlesOriginal = []
    _.forEach($("i[title='Metric']"), function(metric_tag) {
        allMetricTitlesOriginal.push($(metric_tag).parent().attr("title"));
    });

    localStorage.setItem('allAlertsAcked', true);

    initialTimeInterval = getAutoRefreshTimeInSecs()*1000;
    
    if(typeof spyAlertRunTimer == 'undefined')
    	spyAlertRunTimer = new Timer(spyForAlerts, initialTimeInterval);

    stopSpyAlerter();
    watchmanReady = true;
}

function addRequiredWatchmanUIElements() {
// Add Bell
    if ($("#watchman-settings-toggle-control").length == 0)
        $($("ul.nav")[2]).append("<li class=\"to-body ng-scope\" id=\"watchman-settings-toggle-control\"><a id=\"alert-settings-ico\" onClick=\"toggleAlertSettings();\" style=\"font-size: 13px;\"><i class=\"fa fa-bell\" alt=\"Show alert settings\"></i></a></li>")

// add Settings
    $("#alert-settings-drop").remove();
    if (watchmanBetaEnabled()) {
        $("<div id='alert-settings-drop' class='config ng-scope' ng-show='configTemplate' hidden><div class='container-fluid'><h4>Watchman V0.1_Beta</h4><label><input id='enableWatchmanBeta' type='checkbox' onclick='handleAlertCBClick(this);'> Enable Watchman (extra fine grained control only during Beta phase) </label><br><label> Status: </label>  <span id='spy_alerter_status'>STOPPED</span><br><br><h4>Controls:</h4><label> Set spy interval:<input id='spy_time_manual_input' placeholder='spy time in seconds'></label> <button type='button' onclick='startSpyAlerter()' style='background-color: #dcdcdc;/* color: white; */border-width: 2px;border-color: #444444;width: 183px;'>Enable custom interval</button> <button type='button' onclick='syncWithAutorefreshTime()' style='background-color: #dcdcdc;/* color: white; */border-width: 2px;border-color: #444444;'>Sync Auto-refresh interval</button><br><br><label><input id='checkboxVisualAlerts' type='checkbox' onclick='handleAlertCBClick(this);'> Enable soft alerts</label><br><label><input id='checkboxAudioAlerts' type='checkbox' onclick='handleAlertCBClick(this);'> Enable hard alerts</label><br><br><button type='button' onclick='loadGlobalVisualMetas()' style='border-color: #444444;color: white;width: 113px;border-width: 2px;background-color: #444444;'>Reload configs</button> <label> Reload configs</label><br><br><button type='button' onclick='ackAlerts()' style='background-color: #444444; color: white;width: 113px;'>Ack alerts</button>  <label> This will dismiss the alerts temporarily. Alerts will again get caugth in next spy interval (if still persist) </label><br><br><button type='button' onclick='lookingIntoIt()' style='background-color: #444444;color: white;width: 113px;'>Looking into it!</button> <label> This will dismiss all alerts. Will disable hard alerts from next spy interval. </label><br><br><button type='button' onclick='stopSpyAlerter()' style='background-color: #444444;color: white;width: 113px;'>Stop Alerter</button> <label> Stop the alerter. </label></div><div class='config-close remove' ng-click='close()' onclick='toggleAlertSettings();'> <i class='fa fa-chevron-up'></i></div></div>").insertAfter("nav");
    } else {
        $("<div id='alert-settings-drop' class='config ng-scope' ng-show='configTemplate' hidden><div class='container-fluid'><h4>Watchman V0.1_Beta</h4><label><input id='enableWatchmanBeta' type='checkbox' onclick='handleAlertCBClick(this);'> Enable Watchman (extra fine grained control only during Beta phase) </label><br></div><div class='config-close remove' ng-click='close()' onclick='toggleAlertSettings();'> <i class='fa fa-chevron-up'></i></div></div>").insertAfter("nav");
    }
    setTheViews();

// -------- related to config editor --------------
    addWMEditorSupport();
}


function stopWatchman() {
    console.log("Stopping watchmanV0.1 gracefully");
    watchmanReady = false;

    stopSpyAlerter();
    $(".audioDemo").trigger('pause');
}

function detachWatchmanUIElements() {
    $("#watchman-settings-toggle-control").remove();
    $("#alert-settings-drop").remove();
}

function isDashboardUrl() {
    return (window.location.hash.includes("#/dashboard") && !window.location.hash.includes("#/dashboard?"));
}



// boot Watchman only for dashboard urls
watchmanReady = false;
bootAttempts = 0;
function bootWatchman() {
    href_location = window.location.href;

    if (isDashboardUrl()) {
        dashboard_name = href_location.substring(href_location.indexOf("#/dashboard")+12, href_location.indexOf("?"));

        if(!watchmanReady && bootAttempts < 10) {
            bootAttempts++;

            if (window.jQuery) {
                completeWatchmanInitiation();

                console.log("Watchman ready with bootAttempts:" + bootAttempts);

            } else {
                console.log("Sheduling next bootAttempt. Current: " + bootAttempts);
                window.setTimeout("bootWatchman();", 5000 * bootAttempts);

            }
        } else {
            console.log("Stopped attempting for bootWatchman: " + bootAttempts);
        }
    }
}

// handle navigation on Kibana SPA app
window.addEventListener("hashchange", function() {
    console.log("-------- hash changed. Validating Watchman requirements")

    if (watchmanReady && !isDashboardUrl()) { // non dashboard hash accessed
        stopWatchman();
        detachWatchmanUIElements();

    } else if (isDashboardUrl()) { // assuming watchman is not running 'watchmanReady == false'
        console.log("Refreshing watchman");
        watchmanReady = false;
        bootAttempts = 0;
        bootWatchman();

    } else {
        detachWatchmanUIElements();
        console.log("URL not supported for watchman");
    }
}, false);

// boot on first load
bootWatchman();



// ----------------------------------
// update panels from dashboards
// ----------------------------------

function addWMEditorSupport() {
	if($(".edit_wm_rule").length == 0) {
    	$(".btn-group").prepend("<a id=\"panel-name-edit_rule\" class=\"edit_wm_rule\" onClick=\"showWatchmanRuleEditor(this);\" style=\"font-size: 13px;\"> <i class=\"fa fa-cogs\" alt=\"Edit rule\"></i> </a>")
		$(".dashboard-container").append("<style>.wm-modal {z-index: 3;display: none;padding-top: 100px;position: fixed;left: 0;top: 0;width: 100%;height: 100%;overflow: auto;background-color: rgb(0, 0, 0);background-color: rgba(0, 0, 0, 0.4)}.wm-modal-content {margin: auto;background-color: #fff;position: relative;padding: 0;outline: 0;width: 600px}@media (max-width:600px) {.wm-modal-content {margin: 0 10px;width: auto!important}.wm-modal {padding-top: 30px}}@media (max-width:768px) {.wm-modal-content {width: 500px}.wm-modal {padding-top: 50px}}@media (min-width:993px) {.wm-modal-content {width: 900px}}.wm-container,.wm-panel {padding: 0.01em 16px}.wm-container:after,.wm-container:before {content: \"\";display: table;clear: both}.wm-button:hover {color: #000!important;background-color: #ccc!important}.wm-button {border: none;display: inline-block;padding: 8px 16px;vertical-align: middle;overflow: hidden;text-decoration: none;color: inherit;background-color: inherit;text-align: center;cursor: pointer;white-space: nowrap}.wm-display-topright {position: absolute;right: 0;top: 0}</style><div id=\"wm-modal-config-rule\" class=\"wm-modal\"><div class=\"wm-modal-content\"><div class=\"wm-container\"><span onclick=\"cancelWatchmanRuleEditor();\" class=\"wm-button wm-display-topright\">CLOSE</span><br><h4 id=\"wm_editor_title\">Configure Watchman Rules for: Bifrost Transactions Funnel Vizualisation</h4><br><div id=\"wm_ui_json_editor\" style=\"position: relative;display: list-item;height: 345px;\"></div><br><div style=\"align-items:  center;align-content:center;text-align:center;margin-bottom: 15px;\"><button type=\"button\" onclick=\"saveWMConfig();\" style=\"border-color: #444444;color: white;width: 113px;border-width: 2px;background-color: #444444;margin-right: 34px;\">Save configs</button><button type=\"button\" onclick=\"cancelWatchmanRuleEditor();\" style=\"border-color: #444444;color: #444444;width: 113px;border-width: 2px;background-color: #ffffff;\">Cancel</button></div></div></div></div>");
	}
}

function showWatchmanRuleEditor(rule_link) {
    wmConfigEditor = ace.edit("wm_ui_json_editor");
    title = $(rule_link.parentNode.parentNode).find('.panel-title').attr("title");
    panelId = titleToKibanaId(title);

    $("h4#wm_editor_title").html("Configure Watchman rules for: " + title);

    config_edit_inprogress_for = panelId;

    document.getElementById('wm-modal-config-rule').style.display='block';

    uiJson = kibanaPanelSources[panelId].uiStateJSON;

    if(typeof uiJson !== 'undefined')
        wmConfigEditor.setValue(uiJson);
}

function saveWMConfig() {

    if (config_edit_inprogress_for == null || typeof config_edit_inprogress_for == 'undefined')
        return;

    try {
        JSON.parse(wmConfigEditor.getValue());
    } catch(e) {
        alert("Invalid JSON");
        return;
    }

// todo add json validation

    kibanaPanelSources[config_edit_inprogress_for].uiStateJSON = wmConfigEditor.getValue();

    $.ajax ({
        url: 'http://'+current_host+'/elasticsearch/.kibana/visualization/' + config_edit_inprogress_for,
        type: "POST",
        data: JSON.stringify(kibanaPanelSources[config_edit_inprogress_for]),
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function(data) {

            if(data._shards.successful > 0) {
                console.log("configs updated");
                visualistionsReponse[config_edit_inprogress_for] = JSON.parse(wmConfigEditor.getValue());

// loadGlobalVisualMetas();

            } else
                alert("Unable to save new configs");

            closeWatchmanRuleEditor();
        },
        error: function (jqXHR, status, err) {
            alert("Unable to save new configs");
            closeWatchmanRuleEditor();

        }
    });
}

function cancelWatchmanRuleEditor() {
    closeWatchmanRuleEditor();
}

function closeWatchmanRuleEditor() {
    config_edit_inprogress_for = null;
    wmConfigEditor.setValue();
    document.getElementById('wm-modal-config-rule').style.display='none';
}




// -----------
// RULE_CONFIG
// -----------

// "meta": {
// 	"visType": "line_graph",
//     "gt_threshold": 15,
//     "plots": [
// 	    {
// 	    	"timePeriodInSecs": 900,
// 	    	"lt_threshold": 20
// 	    }
//     ],
//     "include_only": [
//     	{
//     		"metric": "Timelogger.Controller.getSource.p95",
//     		"gt_threshold": 200,
//     		"alert_color": "tomato"
//     	},
//     	{
//     		"metric": "Timelogger.Controller.getSource.p95",
//     		"lt_threshold": 200,
//     		"alert_color": "green",
//     		"alert_tone" : "party-song.mp3"
//     	}
//     ],
//     "exclude_all": []
//   }
