
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
	current_host = window.location.hostname
	url = 'http://'+current_host+':5602/elasticsearch/_mget?timeout=0&ignore_unavailable=true&preference=1523735478386'
	resp = undefined;
	visualistionsReponse = {}
	$.ajax ({
	    url: url,
	    type: "POST",
	    data: JSON.stringify({"docs":[{"_index":".kibana","_type":"dashboard","_id":"Bifrost-Critical-Monitoring"}]}),
	    dataType: "json",
	    contentType: "application/json; charset=utf-8",
	    success: function(data){
	        panelsJson = JSON.parse(data.docs[0]._source.panelsJSON)


			for(i=0; i < panelsJson.length; i++ ) {
				vis_id = panelsJson[i].id						
				resp = undefined;
			    $.ajax ({
			        url: 'http://'+current_host+':5602/elasticsearch/_mget?timeout=0&ignore_unavailable=true&preference=1523735478386',
			        type: "POST",
			        data: JSON.stringify({"docs":[{"_index":".kibana","_type":"visualization","_id":vis_id}]}),
			        dataType: "json",
			        contentType: "application/json; charset=utf-8",
			        success: function(data){
			            console.log(data);
						visualistionsReponse[data.docs[0]._id] = JSON.parse(data.docs[0]._source.uiStateJSON);
			        }
			    });
			}
	    }
	});
}

loadGlobalVisualMetas();


// ------------------------
// 2. Registering sound

$(".navbar-timepicker").first().append("<audio class=\"audioDemo\" loop> <source src=\"http://soundbible.com/mp3/Air%20Horn-SoundBible.com-1561808001.mp3\">   </audio>")

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

volumeUp()
volumeUp()
volumeUp()
volumeUp()

$(".audioDemo").trigger('load');
// $(".audioDemo").trigger('play');



// ------------
function updateSVGs() {
	allSVGElems = d3.select("body").selectAll("svg")
	d3data = allSVGElems.data()

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
function allAlertsAcked() { return localStorage.getItem('allAlertsAcked') == "true";}
function isSpyAlerterEnabled() { return isAutorefreshEnabled() && (visualAlertsEnabled() || audioAlertsEnabled()) }

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

allMetricTitlesOriginal = []
_.forEach($("i[title='Metric']"), function(metric_tag) {
	allMetricTitlesOriginal.push($(metric_tag).parent().attr("title"));
});

localStorage.setItem('allAlertsAcked', true);


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

var initialTimeInterval = getAutoRefreshTimeInSecs()*1000;
var spyAlertRunTimer = new Timer(spyForAlerts, initialTimeInterval);

function resetTheCronTime(customTimeInSeconds = 0) {	
	if(customTimeInSeconds == 0 || (typeof customTimeInSeconds === 'undefined'))
		customTimeInSeconds = getAutoRefreshTimeInSecs();
	
	spyAlertRunTimer.reset(customTimeInSeconds * 1000);
	$("#spy_alerter_status").html(spyAlertRunTimer.status);
}

function stopSpyAlerter() {		
	spyAlertRunTimer.stop();
	ackAlerts()
	$("#spy_alerter_status").html(spyAlertRunTimer.status);
	$("#alert-settings-ico").css("font-size", "17px").css("color", "#fffcef");
}

function startSpyAlerter() {
	var spy_time_manual_input_time = $("#spy_time_manual_input").val();	
	resetTheCronTime(spy_time_manual_input_time);

	$("#spy_alerter_status").html(spyAlertRunTimer.status);
	$("#alert-settings-ico").css("font-size", "17px").css("color", "#61da3b");
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
}

setTheViews();

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
			default:
	        	alert("unidentified cb clicked");	  
	   }
}

// -----
// Settings add
$("<div id='alert-settings-drop' class='config ng-scope' ng-show='configTemplate' hidden><div class='container-fluid'><h4>Watchman info:</h4><label> Status: </label>  <span id='spy_alerter_status'>STOPPED</span><br><br><h4>Controls:</h4><label> Set spy interval:<input id='spy_time_manual_input' placeholder='spy time in seconds'></label> <button type='button' onclick='startSpyAlerter()' style='background-color: #c5d8bc;/* color: white; */border-width: 2px;border-color: #539234;width: 183px;'>Enable custom interval</button> <button type='button' onclick='syncWithAutorefreshTime()' style='background-color: #f3e6c0;/* color: white; */border-width: 2px;border-color: #c59e27;'>Sync Auto-refresh interval</button><br><br><label><input id='checkboxVisualAlerts' type='checkbox' onclick='handleAlertCBClick(this);'> Enable soft alerts</label><br><label><input id='checkboxAudioAlerts' type='checkbox' onclick='handleAlertCBClick(this);'> Enable hard alerts</label><br><br><button type='button' onclick='loadGlobalVisualMetas()' style='border-color: #c59e27;color: black;width: 113px;border-width: 2px;background-color: #f3e6c0;'>Reload configs</button> <label> Reload configs</label><br><br><button type='button' onclick='ackAlerts()' style='background-color: #9cab2c;color: white;width: 113px;'>Ack alerts</button>  <label> This will dismiss the alerts temporarily. Alerts will again get caugth in next spy interval (if still persist) </label><br><br><button type='button' onclick='lookingIntoIt()' style='background-color: #9cab2c;color: white;width: 113px;'>Looking into it!</button><label> This will dismiss all alerts. Will disable hard alerts from next spy interval. </label><br><br><button type='button' onclick='stopSpyAlerter()' style='background-color: tomato;color: white;width: 113px;'>Stop Alerter</button><label> Stop the alerter. </label></div><div class='config-close remove' ng-click='close()' onclick='toggleAlertSettings();'> <i class='fa fa-chevron-up'></i></div></div>").insertAfter("nav")

// ----
// Add Bell
$($("ul.nav")[2]).append("<li class=\"to-body ng-scope\"><a id=\"alert-settings-ico\" onClick=\"toggleAlertSettings();\" style=\"font-size: 13px;\"><i class=\"fa fa-bell\" alt=\"Show alert settings\"></i></a></li>")



