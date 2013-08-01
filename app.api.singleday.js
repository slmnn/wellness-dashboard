/*

WellMU debugging dashboard v. 0.0.1

Single day view initializer that loads the data, makes transformations and passes it to UI modules.

*/

var wellnessAPISingleDay = (function(wellnessAPISingleDay) {
	var baseurl = Common.determineBaseURL();
  var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];  
  
  // Generic callback for data queries
	var _getData = function(apicall, done_cb, async) {
    async = typeof async !== 'undefined' ? async : 'true';
		var myurl = baseurl + apicall;
    
    // If using CORS on IE, we need some additional tricks
    if ('XDomainRequest' in window && window.XDomainRequest !== null) {
      IE8_ajax_fix();
      // also, override the support check
      jQuery.support.cors = true;
    }
		$.ajax(
			{
				url: myurl,
        async: async,
	    	type: 'GET',
				datatype: 'json',
        contentType: "application/json; charset=utf-8",
	    	headers: {
	        "Authorization": userData.credentials
   			},
        statusCode: {
          404: function() {
            console.log("404 " + myurl);
          }
				},
        // Use "Loading" text to indicate the action
        beforeSend: Common.showHourglass 
			}
		).done(done_cb).complete(Common.hideHourglass);
	};
  
  // Function to retrieve GPX data
  var _getGPX = function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('gpx/raw/' + daypath + '/days/1', function(data) {
      if(typeof(data) != 'object')
        var json = $.parseJSON(data);
      else 
        var json = data;
      amplify.publish('gpx_available', json.data);
    });
  };

  // Function to retrieve weather data
	var _getWeatherData =	function(date) {
		var daypath = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + (date.getDate());
		_getData('weather/history/' + daypath + '', function(data) {
      if(typeof(data) != 'object')
        var json = $.parseJSON(data);
      else 
        var json = data;
      json.currentday = _currentday.toString('yyyy-MM-dd');
      json.date = date.toString('yyyy-MM-dd');
      amplify.publish('weather_history', json);
		});
	};
  
  // Function to retrieve Twitter data, callback inlined
  var _getTwitterData =	function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('twitter/api/tweets/' + daypath + '/days/1', function(data) {
      if(typeof(data) != 'object')
        var tweets = $.parseJSON(data);
      else 
        var tweets = data;
      amplify.publish('tweets_available', tweets);
		});
	};

  // Function to retrieve calendar data, callback inlined
	var _getCalendarData = function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		for(var i = 0; i < userData.calendars.length; i++) {
      var url = 'calendar/id/' + userData.calendars[i] + '/events/' + daypath + '';
      var cacheValue; // = amplify.store(url); // TODO: there is an issue with the cache
      if(typeof(cacheValue) != 'undefined') {
        console.log("Found from local store " + url);
        var json = JSON.parse(cacheValue);
        amplify.publish('calendar_events', {'date': _currentday.toString("yyyy-MM-dd"), 'events': json});
      } else {
        console.log("Requesting from server " + url);
        _getData(url, function(data) {
          var json = JSON.parse(data);
		  if(typeof json.error != 'undefined')
          amplify.store(url, data, { expires: 12*60*(60*1000*Math.random()) });
          amplify.publish('calendar_events', {'date': _currentday.toString("yyyy-MM-dd"), 'events': json});
        });
      }
    }
	};
  
  // Function to retrieve merged measures data
	var _getMeasuresData = function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('data/' + userData.username + '/merge/measure/' + daypath + '/days/1', _measuresCB);
	};

  // Function to retrieve merged sleep data
	var _getSleepData =	function() {
		// We should get yesterdays and tomorrows data
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('data/' + userData.username + '/merge/sleep/' + daypath + '/days/2?inline=true', _sleepCB);
	};
  
  // Function to retrieve merged activity data
	var _getActivityData =	function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('data/' + userData.username + '/merge/activity/' + daypath + '/days/1', _activityCB);
	};

  // Function to retrieve Fitbit activity data
	var _getFitbitActivityData =	function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('fitbit/api/activities/' + daypath + '', _fitbitSummaryCB);
	};
	
  // Function to retrieve analysis data, callbacks inlined
  var _getAnalysisData =	function() {
    analysisUI.clear();
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('api/analysis/' + daypath + '', function(data) {
      if(typeof(data) != 'object')
        var analysis = $.parseJSON(data);
      else 
        var analysis = data;
      for(var j = 0; j < analysis.length; j++) {
        for(var i = 0; i < analysis[j].required_user_action.length; i++) {
          var act = analysis[j].required_user_action[i];
          var baseURL = Common.determineBaseURL();
          amplify.publish('analysis_possible', {
            'id': act.id,
            'path': baseURL.substring(0,baseURL.length-1) + act.path + '?dashboard=true',
            'message':act.message,
            'type': Common.capitaliseFirstLetter(act.type)
          });
        }
        for(var i = 0; i < analysis[j].latest.length; i++) {
          var ana = analysis[j].latest[i];
          if(ana == null) continue;
          amplify.publish('analysis_available', {
            'id': ana.id,
            'type': Common.capitaliseFirstLetter(ana.type),
            'name': Common.capitaliseFirstLetter(ana.name),
            'value': ana.value,
            'date': '(' + Common.parseUTCToLocalTime(ana.date).toString('MM/dd HH:mm') + ')'
          });
        }        
      }
		});
		_getData('api/analysis/sleepeffma/' + daypath + '/days/1/7', function(data) {
      if(typeof(data) != 'object')
        var analysis = $.parseJSON(data);
      else 
        var analysis = data;
      if(typeof analysis.error != 'undefined') {
        console.log('api/analysis/sleepeffma/ ' + analysis.error)
      }
      for(var i = 0; i < analysis.length; i++) {
        var ana = {
          id: 'sleepeffma',
          name: 'sleepeffma',
          type: 'sleep',
          value: Math.round(analysis[i][1] * 100) / 100,
          date: analysis[i][0]
        };
        if(ana == null) continue;
        amplify.publish('analysis_available', {
          'id': ana.id,
          'type': Common.capitaliseFirstLetter(ana.type),
          'name': Common.capitaliseFirstLetter(ana.name),
          'value': ana.value,
          'date': '(' + Common.parseUTCToLocalTime(ana.date).toString('MM/dd HH:mm') + ')'
        });
      }
		});
		_getData('api/analysis/sleeptimema/' + daypath + '/days/1/7', function(data) {
      if(typeof(data) != 'object')
        var analysis = $.parseJSON(data);
      else 
        var analysis = data;
      if(typeof analysis.error != 'undefined') {
        console.log('api/analysis/sleeptimema/ ' + analysis.error)
      }
      for(var i = 0; i < analysis.length; i++) {
        var ana = {
          id: 'sleeptimema',
          name: 'sleeptimema',
          type: 'sleep',
          value: analysis[i][1],
          date: analysis[i][0]
        };
        if(ana == null) continue;
        amplify.publish('analysis_available', {
          'id': ana.id,
          'type': Common.capitaliseFirstLetter(ana.type),
          'name': Common.capitaliseFirstLetter(ana.name),
          'value': ana.value,
          'date': '(' + Common.parseUTCToLocalTime(ana.date).toString('MM/dd HH:mm') + ')'
        });
      }
		});
		_getData('api/analysis/sleepwakeningsma/' + daypath + '/days/1/7', function(data) {
      if(typeof(data) != 'object')
        var analysis = $.parseJSON(data);
      else 
        var analysis = data;
      if(typeof analysis.error != 'undefined') {
        console.log('api/analysis/sleepwakeningsma/ ' + analysis.error)
      }
      for(var i = 0; i < analysis.length; i++) {
        var ana = {
          id: 'sleepwakeningsma',
          name: 'sleepwakeningsma',
          type: 'sleep',
          value: analysis[i][1],
          date: analysis[i][0]
        };
        if(ana == null) continue;
        amplify.publish('analysis_available', {
          'id': ana.id,
          'type': Common.capitaliseFirstLetter(ana.type),
          'name': Common.capitaliseFirstLetter(ana.name),
          'value': ana.value,
          'date': '(' + Common.parseUTCToLocalTime(ana.date).toString('MM/dd HH:mm') + ')'
        });
      }
		});
		_getData('api/analysis/sleepfallsleepma/' + daypath + '/days/1/7', function(data) {
      if(typeof(data) != 'object')
        var analysis = $.parseJSON(data);
      else 
        var analysis = data;
      if(typeof analysis.error != 'undefined') {
        console.log('api/analysis/sleepfallsleepma/ ' + analysis.error)
      }
      for(var i = 0; i < analysis.length; i++) {
        var ana = {
          id: 'sleepfallsleepma',
          name: 'sleepfallsleepma',
          type: 'sleep',
          value: analysis[i][1],
          date: analysis[i][0]
        };
        if(ana == null) continue;
        amplify.publish('analysis_available', {
          'id': ana.id,
          'type': Common.capitaliseFirstLetter(ana.type),
          'name': Common.capitaliseFirstLetter(ana.name),
          'value': ana.value,
          'date': '(' + Common.parseUTCToLocalTime(ana.date).toString('MM/dd HH:mm') + ')'
        });
      }
		});
	};
  
  // Callback functions parse the data from WellMU and pass it to 
  // UI components. Amplify.js pub/sub library is used to make the
  // rendering and parsing asynchronous
  // http://amplifyjs.com/api/pubsub/
  
  // Callback for merged sleep data
	var _sleepCB = function(data) {
    // Firefox response parsing fix
    if(typeof(data) != 'object')
      var json = $.parseJSON(data);
    else 
      var json = data;
    
    // We use an UI component to show the variables
    sleepUI.clear();
    amplify.publish("sleep_variables", data);
         
    // Sleep phases
    var rem = [];
    var deep = [];
    var light = [];
    var wake = [];
    var fitbit_reallywake = [];
    var fitbit_awake = [];
    var fitbit_sleep = [];
    
    // Timelines
    var noise = [];
    var luminosity = [];
    var actigram = [];
    var pulse = [];
    
    var start; 
    var end;
		for(var i = 0; i < json.length; i++) {      
      if(json[i].fitbit != null) {
        var fitbit = json[i].fitbit;
        if(fitbit.minuteData != null) {
          var data = fitbit.minuteData;
          // Push one bogus stage to the end. Parser needs to see change in stage
          // value to make a push to the array.
          data.push(['0000-00-00T00:00:00Z', 'X']);
          var stageDur = 0;
          var d1, d2;
          for(j = 0; j < data.length; j++) {
            if(j == 0) {
              stageDur += 5;
              d1 = Common.parseUTCToLocalTime(data[j][0]);
              continue;
            }
            if( data[j][1] !=  data[j-1][1]) {
              if( data[j-1][1] == 1) {
                fitbit_sleep.push({
                    from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                    to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                    label: ''
                });
              }
              if( data[j-1][1] == 2) {
                fitbit_awake.push({
                    from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                    to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                    label: ''
                });
              }
              if( data[j-1][1] == 3) {
                fitbit_reallywake.push({
                    from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                    to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                    label: ''
                });
              }
              stageDur = 5;
              d1 = Common.parseUTCToLocalTime(data[j][0]);
            } else {
              stageDur += 5;
            }
            // Implement parseStages function that gives an array of intervals
          }
          console.log(fitbit_sleep, fitbit_awake, fitbit_reallywake);
        }
      }
      
      if(json[i].beddit != undefined) {
        var beddit = json[i].beddit;
        if(beddit.analysis_valid == false) {
          console.log('Invalid Beddit analysis on ' + _currentday.toDateString(), beddit);
          continue;
        } else {
          console.log('Valid Beddit analysis available on ' + beddit.date, beddit);

        }
        // Push one bogus stage to the end. Parser needs to see change in stage
        // value to make a push to the array.
        var data = beddit.sleep_stages;
        data.push(['0000-00-00T00:00:00', 'X']);
        var j = 0;
        var stageDur = 0;
        var d1, d2;
        for(j = 0; j < data.length; j++) {
          if(j == 0) {
            stageDur += 5;
            d1 = Common.parseUTCToLocalTime(data[j][0]);
            continue;
          }
          if(data[j][1] != data[j-1][1]) {
            if(data[j-1][1] == 'D') {
              deep.push({
                  from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                  to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                  label: ''
              });
            }
            if(data[j-1][1] == 'R') {
              rem.push({
                  from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                  to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                  label: ''
              });
            }
            if(data[j-1][1] == 'L') {
              light.push({
                  from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                  to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                  label: ''
              });
            }
            if(data[j-1][1] == 'W') {
              wake.push({
                  from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                  to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                  label: ''
              });
            }
            stageDur = 5;
            d1 = Common.parseUTCToLocalTime(data[j][0]);
          } else {
            stageDur += 5;
          }
        } 						
        if(noise.length > 0) {
          var nightstart = Common.parseUTCToLocalTime(noise[0][0]).getTime();
          var nightend = Common.parseUTCToLocalTime(noise[noise.length - 1][0]).getTime();
          var dayDurationMs = 24 * 60 * 60 * 1000 - (nightend - nightstart);
          var dur = dayDurationMs / (5*60*1000);
          console.log(Common.parseUTCToLocalTime(noise[0][0]), Common.parseUTCToLocalTime(noise[noise.length - 1][0]), 'Day duration seems to be ' + Common.secondsToString(dur*60*5)); 
          for(var k = 0; k < dur - 1; k++) {
            noise.push(null);
            luminosity.push(null);
            actigram.push(null);
            pulse.push(null);
          }
        }
        noise = noise.concat(beddit.noise_measurements);
        luminosity = luminosity.concat(beddit.luminosity_measurements);
        actigram = actigram.concat(beddit.minutely_actigram);
        pulse = pulse.concat(beddit.averaged_heart_rate_curve);
      }
		}
    
    // Publishing timelines in the main Highcharts timeline
		if(actigram.length > 0) {
      actigram = Common.changeTimelineToLocal(actigram);
      amplify.publish('new_timeline_dataset',
        {'name':'Actigram','id':'actigram','unit':'','visible':true,'min':0,'pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(actigram[0][0]),'data':actigram,'type':'spline'});
    } if(pulse.length > 0) {
      pulse = Common.changeTimelineToLocal(pulse);
      amplify.publish('new_timeline_dataset',
        {'name':'Pulse','id':'pulse','min':null,'unit':'bpm','visible':true,'pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(pulse[0][0]),'data':pulse,'type':'spline'});
    } if(noise.length > 0) {
      noise = Common.changeTimelineToLocal(noise);
      amplify.publish('new_timeline_dataset',
        {'name':'Noise','id':'noise','min':0,'unit':'dB','visible':false,'pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(noise[0][0]),'data':noise,'type':'area'});
    } if(luminosity.length > 0) {
      luminosity = Common.changeTimelineToLocal(luminosity);
      amplify.publish('new_timeline_dataset',
        {'name':'Luminosity','id':'luminosity','min':0,'visible':false,'unit':'lm','pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(luminosity[0][0]),'data':luminosity,'type':'area'});
    }
		
    // Publishing sleep stages in the Gantt chart
		var stages = [];
		if(fitbit_reallywake.length > 0) stages.push({name: 'Moving a lot', intervals: fitbit_reallywake});		
		if(fitbit_awake.length > 0) stages.push({name: 'Moving a little', intervals: fitbit_awake});
		if(fitbit_sleep.length > 0) stages.push({name: 'Still', intervals: fitbit_sleep});		
		if(wake.length > 0) stages.push({name: 'Wake', intervals: wake});
		if(deep.length > 0) stages.push({name: 'Deep Sleep', intervals: deep});
		if(rem.length > 0) stages.push({name: 'REM', intervals: rem});
		if(light.length > 0) stages.push({name: 'Light Sleep', intervals: light});
		if(stages.length > 0) {
      var sleepStageData = { 
        id: 'gantt_sleep_stages',
        tasks: stages
      };
      amplify.publish('new_gantt_chart-gantt', sleepStageData);
    }
	};

  // Callback for merged measures data
	var _measuresCB = function(data) {
    // Firefox response parsing fix
    if(typeof(data) != 'object')
      var json = $.parseJSON(data);
    else 
      var json = data;
    
    // amplify.publish('gauges_to_zero');
    gaugeUI.clear();
    
    // See if there is no withings data available
    if(
      typeof json[0].withings == 'undefined') {
      return;
    }
    
    // Make out some complicated options for gauges, then publish each new gauge
    for(var i = 0; i < json[0].withings.length; i++) {
      var t = Common.parseUTCToLocalTime(json[0].withings[i].date).toString('HH:mm');
      try {
        if(typeof json[0].withings[i].weight != 'undefined') {
          var value = Math.round(json[0].withings[i].weight * 10) / 10;
          var gaugesettings = 
            {'targetDIVid':'#gauge-container',
             'data':{'value':value,'valueSuffix':' kg'}, 
             'options':{
                'id':'weight_' + i,
                'name':'Weight (' + t + ')','min':0,'max':value*1.4,
            'yAxis': [{
                'min': 0,
                'max': value*1.4,
                
                'minorTickInterval': 'auto',
                'minorTickWidth': 1,
                'minorTickLength': 3,
                'minorTickPosition': 'inside',
                'minorTickColor': '#666',
        
                'tickPixelInterval': 30,
                'tickWidth': 2,
                'tickPosition': 'inside',
                'tickLength': 4,
                'tickColor': '#666',
                'labels': {
                    'step': 2,
                    'rotation': 'auto',
                    'enabled': false
                },
                'title': {
                    'text': 'kg',
                    'margin': 0,
                    'style': { 'fontSize': '9px' }
                },
                'plotBands': [{    
                                'from': 0,
                                'to': value*1.1,
                                'innerRadius': '96%',
                                'outerRadius': '100%',
                                'color': '#55BF3B' // green
                            }, {
                                'from': value*1.1,
                                'to': value*1.2,
                                'innerRadius': '96%',
                                'outerRadius': '100%',
                                'color': '#DDDF0D' // yellow
                            }, {
                                'from': value*1.2,
                                'to': value*1.4,
                                'innerRadius': '96%',
                                'outerRadius': '100%',
                                'color': '#DF5353' // red
                            }]
            }],
                'series': [{
                  'name': 'Weight',
                  'data': [value],
                  'dataLabels': {
                    'borderWidth': 0,
                    'style': { 'fontSize': '9px' }
                  },
                  'tooltip': {
                      'valueSuffix': ' kg'
                  }
                 }]    
              }
            };
          amplify.publish('new_gauge', gaugesettings);
        } else {
          $('#gauge_weight').parent().remove();
        }
      }
      catch(err) {
        console.log("There is no Withings weight data available", json);
      }
      try {
        if(typeof json[0].withings[i].diasPressure != 'undefined' 
          && json[0].withings[i].sysPressure != 'undefined') {
          value = Math.round(json[0].withings[i].sysPressure * 10) / 10;
          var gaugesettings = 
            {'targetDIVid':'#gauge-container',
             'data':{'value':value,'valueSuffix':' mmHg'}, 
             'options':{'id':'sysp_' + i,'name':'DBP/SBP (' + t + ')','min':0,'max':180,
              'yAxis': [{
                  'min': 0,
                  'max': 180,
                  
                  'minorTickInterval': 'auto',
                  'minorTickWidth': 1,
                  'minorTickLength': 3,
                  'minorTickPosition': 'inside',
                  'minorTickColor': '#666',
          
                  'tickPixelInterval': 30,
                  'tickWidth': 2,
                  'tickPosition': 'inside',
                  'tickLength': 4,
                  'tickColor': '#666',
                  'labels': {
                      'enabled': false
                  },
                  'title': {
                      'text': 'mmHg',
                      'margin': 0,
                      'style': { 'fontSize': '9px' }
                  },
                  'plotBands': [{    
                                'from': 0,
                                'to': 90,
                                'innerRadius': '96%',
                                'outerRadius': '100%',
                                'color': '#DDDF0D' // yellow
                            },
                            {    
                                'from': 90,
                                'to': 120,
                                'innerRadius': '96%',
                                'outerRadius': '100%',
                                'color': '#55BF3B' // green
                            }, {
                                'from': 120,
                                'to': 140,
                                'innerRadius': '96%',
                                'outerRadius': '100%',
                                'color': '#DDDF0D' // yellow
                            }, {
                                'from': 140,
                                'to': 180,
                                'innerRadius': '96%',
                                'outerRadius': '100%',
                                'color': '#DF5353' // red
                            }]
              },{
                  'min': 0,
                  'max': 180,
                  
                  'minorTickInterval': 'auto',
                  'minorTickWidth': 1,
                  'minorTickLength': 3,
                  'minorTickPosition': 'inside',
                  'minorTickColor': '#666',
          
                  //'radius': '80%',
                  'offset': -7,
          
                  'tickPixelInterval': 30,
                  'tickWidth': 2,
                  'tickPosition': 'inside',
                  'tickLength': 4,
                  'tickColor': '#666',
                  'labels': {
                      'enabled': false
                  },
                  'plotBands': [{    
                                'from': 0,
                                'to': 60,
                                'innerRadius': '80%',
                                'outerRadius': '85%',
                                'color': '#DDDF0D' // yellow
                            },
                            {    
                                'from': 60,
                                'to': 80,
                                'innerRadius': '80%',
                                'outerRadius': '85%',
                                'color': '#55BF3B' // green
                            }, {
                                'from': 80,
                                'to': 100, 
                                'innerRadius': '80%',
                                'outerRadius': '85%',
                                'color': '#DDDF0D' // yellow
                            }, {
                                'from': 100,
                                'to': 180,
                                'innerRadius': '80%',
                                'outerRadius': '85%',
                                'color': '#DF5353' // red
                            }]
              }],
                'series': [{
                  'name': 'SPB',
                  'data': [value],
                  'dial': { 'radius' : '90%', 'borderWidth': 1, 'backgroundColor': 'brown', 'borderColor': 'black' },
                  'tooltip': {
                      'valueSuffix': 'mmHg'
                  },
                  'dataLabels': {
                    'borderWidth': 0,
                    'style': { 'fontSize': '9px' },
                    'formatter' : function() {
                        return this.series.chart.series[1].data[0].y + '/' + this.series.chart.series[0].data[0].y;
                      }
                  }
                 },{
                  'name': 'DPB',
                  'yAxis': 1,
                  'data': [Math.round(json[0].withings[i].diasPressure * 10) / 10],
                  'dial': { 'radius' : '76%', 'borderWidth': 1, 'backgroundColor': 'blue', 'borderColor': 'black'  },
                  'tooltip': {
                      'valueSuffix': 'mmHg'
                  },
                  'dataLabels': {
                    'enabled': false,
                    'formatter' : function() { return false; }
                  }
                 }]        
              }
            };
          amplify.publish('new_gauge', gaugesettings);
        } else {
          $('#gauge_sysp').parent().remove();
        }
      }
      catch(err) {
        console.log("There is no Withings systolic / diastolic pressure available", json);
      }
      try {
        if(typeof json[0].withings[i].pulse != 'undefined') {    
          value = Math.round(json[0].withings[i].pulse * 10) / 10;
          var gaugesettings = 
            {'targetDIVid':'#gauge-container',
             'data':{'value':value,'valueSuffix':' bpm'}, 
             'options':{'id':'pulse_' + i,'name':'Pulse (' + t + ')' ,'min':0,'max':160, 
                     'yAxis': [{
                'min': 0,
                'max': value*1.4,
                
                'minorTickInterval': 'auto',
                'minorTickWidth': 1,
                'minorTickLength': 3,
                'minorTickPosition': 'inside',
                'minorTickColor': '#666',
                'tickPixelInterval': 30,
                'tickWidth': 2,
                'tickPosition': 'inside',
                'tickLength': 4,
                'tickColor': '#666',
                'labels': {
                    'step': 2,
                    'rotation': 'auto',
                    'enabled': false
                },
                'title': {
                    'text': 'pbm',
                    'margin': 0,
                    'style': { 'fontSize': '9px' }
                },
                'plotBands': [{    
                                'from': 0,
                                'to': 160,
                                'innerRadius': '96%',
                                'outerRadius': '100%',
                                'color': '#0099FF' // blue
                            }]
            }],
                'series': [{
                  'name': 'Pulse',
                  'data': [value],
                  'dataLabels': {
                    'borderWidth': 0,
                    'style': { 'fontSize': '9px' }
                  },
                  'tooltip': {
                      'valueSuffix': ' bpm'
                  }
                 }]          
              }
            };
          amplify.publish('new_gauge', gaugesettings);
        } else {
          $('#gauge_pulse').parent().remove();
        }
      } 
      catch(err) {
        console.log("There is no Withings pulse available", json);
      }
    }
	};
  
  // Callback for merged activity data
  var _activityCB = function(data) {
    // Damn Firefox
    if(typeof(data) != 'object')
      var json = $.parseJSON(data);
    else 
      var json = data;
    
    // Clear the GPX UI component and pass the data forward
    gpxUI.clear();
    if(typeof json[0].gpx != 'undefined') {
      if(json[0].gpx.length > 0) {
        for(var i = 0; i < json[0].gpx.length; i++) {
          amplify.publish('gpx_available', json[0].gpx[i]);
        }
      }
    }

    // Publishing activities to Gantt chart
    if(json[0].fitbit != undefined && json[0].fitbit.activities != undefined) {
      var activityDay = Common.parseUTCToLocalTime(json[0].date);
      var year = activityDay.getFullYear();
      var month = activityDay.getMonth();
      var day = activityDay.getDate();
      var result = [];
      for(var i = 0; i < json[0].fitbit.activities.length; i++) {
        var a = json[0].fitbit.activities[i];
        var hour = parseInt(a.startTime.split(':')[0]);
        var minute = parseInt(a.startTime.split(':')[1]);
        var durMS = parseInt(a.duration);
        console.log("Publishing Activity", year, month, day, hour, minute, durMS);
        result.push(
          { // From-To pairs
            from: Date.UTC(year, month, day, hour, minute),
            to: Date.UTC(year, month, day, hour, minute, 0, durMS),
            label: a.name.substring(0,15) + '...'
          }
        );
        var activityTimeStamp = json[0].date.split('T')[0] + 'T' + json[0].fitbit.activities[i].startTime;
      }
      if(result.length > 0) {
        var data = {
          id: 'activity_stages',
          tasks: [
            {
              name: 'Activities',
              intervals: result
            }
          ]
        };
        amplify.publish('new_gantt_chart-gantt', data);
      }
    } else {
      console.log("No activities data available on " + json[0].date, json);
    }
    
    // We do not necessarily have goals for old data
    var goals = undefined
    if(typeof json[0].fitbit != 'undefined') {
      goals = json[0].fitbit.goals;
    }
    // If goals is found, we store it and use it.
    if(typeof goals != 'undefined') {
      userData.fitbitGoals = goals;
    }
    // If goals is not available, we use old goals data if available
    else if ( typeof userData.fitbitGoals != 'undefined' ) {
      goals = userData.fitbitGoals;
    }
    // If everything fails, we use fake goals data
    else {
      goals = {
        caloriesOut: 2500,
        steps: 10000,
        floors: 10,
        activeScore: 1000
      }
    }
    // Parsing Fitbit summary data and publishing it
    if(typeof json[0].fitbit != 'undefined' && typeof json[0].fitbit.summary != 'undefined') {
      goal = (goals.caloriesOut);
      value = (json[0].fitbit.summary.activityCalories);
      var burnedcaloriesdata = {"title":"Calories burned","subtitle":"","ranges":[Math.round(goal*0.44),Math.round(goal*0.75),Math.round(goal*0.95)],"measures":[value],"markers":[goal],"valuetxt":value};
      amplify.publish('bullet_chart', 
        { 'id':'burnedcalories', 'chart': burnedcaloriesdata }
      );
      var goal, value;
      goal = (goals.steps);
      value = (json[0].fitbit.summary.steps);
      var stepsdata = {"title":"Steps taken","subtitle":"","ranges":[Math.round(goal*0.35),Math.round(goal*0.65),Math.round(goal*0.85)],"measures":[value, goal],"markers":[goal],"valuetxt":value};
      amplify.publish('bullet_chart', 
        { 'id':'steps', 'chart': stepsdata}
      );
      goal = (goals.floors);
      value = (json[0].fitbit.summary.floors);
      var floorsdata = {"title":"Floors climbed","subtitle":"","ranges":[Math.round(goal*0.35),Math.round(goal*0.65),Math.round(goal*0.85)],"measures":[value, goal],"markers":[goal],"valuetxt":value};
      amplify.publish('bullet_chart', 
        { 'id':'floors', 'chart': floorsdata}
      );
      goal = (goals.activeScore);
      value = (json[0].fitbit.summary.activeScore);
      var activityscoredata = {"title":"Activity score","subtitle":"","ranges":[Math.round(goal*0.35),Math.round(goal*0.65),Math.round(goal*0.85)],"measures":[value, goal],"markers":[goal],"valuetxt":value};
      amplify.publish('bullet_chart', 
        { 'id':'activityscore', 'chart': activityscoredata}
      );
      
      var d = json[0].fitbit.summary.distances;
      var dValues = [];
      var dNames = [];
      for(var j = 0; j < d.length; j++) {
        if(d[j].activity == 'total' || d[j].activity == 'tracker' || d[j].activity == 'loggedActivities') continue;
        dNames.push(d[j].activity);
        dValues.push(d[j].distance);
      }
      var nameLookup={'veryActive':'Very active','moderatelyActive':'Moderately active','lightlyActive':'Lightly active','sedentaryActive':'Sedentary'};
      var strNames = "{";
      for(var j = 0; j < dNames.length; j++) {
        var name = "";
        if(nameLookup[dNames[j]] !== undefined) {
          name = nameLookup[dNames[j]];
        } else {
          name = dNames[j].substring(0,14) + "...";
        }
        if(j != dNames.length-1) strNames += '"' + j + '":"' + name + '",';
        else strNames += '"' + j + '":"' + name + '"}';
      }
      amplify.publish('activity_piechart', 
        { 
          'id':'distances', 
          'unit':'km', 
          'chart': dValues, 
          'names': JSON.parse(strNames), 
          'title':'Distances',
          'formatter': function(a) { return Math.round(a * 100) / 100; }
        }
      );
      
      var s = json[0].fitbit.summary;
      amplify.publish('activity_piechart', 
        { 
          'id':'activityminutes', 
          'chart': [s.veryActiveMinutes, s.fairlyActiveMinutes, s.lightlyActiveMinutes, s.sedentaryMinutes],
          'unit':'',
          'names':{0:'Very active',1:'Moderately active',2:'Lightly active',3:'Sedentary'},
          'title':'Activity times',
          'formatter': function(a) { return Common.secondsToString(a * 60); }
        }
      );
    } else {
      console.log("No activity goals / summary available on " + json[0].date, json);
    }
    
    // There may be linked timeline for steps
    if(typeof json[0].fitbit != 'undefined' && typeof json[0].fitbit.stepsMinuteData != 'undefined') {
      // Check if data is just linked
      if(typeof json[0].fitbit.stepsMinuteData.link != 'undefined') {
        // Get the linked data (omit the first slash in the URL)
        _getData(json[0].fitbit.stepsMinuteData.link.substring(1), function(data) {
          if(typeof(data) != 'object')
            var data = $.parseJSON(data);
          else 
            var data = data;
          var mySteps = [];
            var mySteps = [];
            for(var i = 1; i < data.length - 1; i++) {
              if(data[i-1][1] === 0 && data[i][1] === 0 && data[i+1][1] === 0)
                mySteps.push([data[i][0], null]);
              else
                mySteps.push(data[i]);
            }
            mySteps = Common.changeTimelineToLocal(mySteps);
            amplify.publish('new_timeline_dataset',
              {'name':'Steps','id':'steps','min':0,'unit':'','visible':true,'type':'spline','pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(mySteps[0][0]),'data':mySteps}
            );
        });
      }
    } else {
      console.log("No detailed activity data available on " + json[0].date, json);
    }
  };
  
  // Sets the date of the sigle day view. Refreshes the view
	var _setDate = function(dateString) {
		_currentday = Date.parse(dateString);
		if(_currentday == 'Invalid Date' || _currentday == null)
			_currentday = _today.clone().addDays(-1);
    $('#datescroller').mobiscroll('setDate', _currentday, true);
		_disableNextDayButton();
    highchartsUI.resetZoom();
		_refreshData();
	};

	var _disableNextDayButton = function() {
		if(Date.compare(_currentday.clearTime(), _today) >= 0) {
			$( "#button-next" ).button( "disable" );
		}	else {
			$( "#button-next" ).button( "enable" );
		}
	};

	var _disableLoginDialog = function() {
			$( "#username" ).textinput( "disable" );
			$( "#password" ).textinput( "disable" );
			$( "#login-btn" ).button( "disable" );
	};

  // New Gantt UI component
  var _ganttUI = ganttUI(); 
  
  // Reference for today
	var _today = Date.today();
  
  // Function for initializing the view after user data has been retrieved
	var _init = function(date) {
    console.log('Initializing single day view', date, Common.gup('date'));
    
    _currentday = Date.parse(Common.gup('date'));
    if(_currentday == null) _currentday = _today.clone().addDays(-1);
    if(userData.username == 'demo') _currentday = new Date(Date.parse('17.4.2013'));

		$("#dateselect").css({"visibility":"visible"});
		$("#tab-container").css({"visibility":"visible"});
		$('#datescroller').mobiscroll('setDate', _currentday, true);
    
		var x = document.getElementById("datetext");
		x.innerHTML = "Analysis for " + _currentday.toDateString() + ".";
		
    weatherUI.init();
		_getWeatherData(_currentday);
    
    gpxUI.init();
    
		if(!Date.equals(Date.today(), _currentday.clone().clearTime())) {
      _getWeatherData(_currentday.clone().add(1).days());
    }
    
    calendarUI.init();
    _getCalendarData();
    _getSleepData();
    
    $("#beddit").css({"visibility":"visible"});
    bulletSparkUI.init();
    
    _getActivityData();
    $("#fitbit").css({"visibility":"visible"});
    
    _getMeasuresData();
    $("#withings").css({"visibility":"visible"});
    gaugeUI.init();
    
    // Highcharts needs some fake data to be initialized properly
    var options = {
      'title': 'Wellness timeline', 
      'subtitle': 'Activities, sleeping, etc...', 
      'start': _currentday.clone().clearTime().add({days:-1,hours:-3}),
      'end': _currentday.clone().clearTime().add({days:1,hours:6}),
      'yAxisTitle':'',
      'initSeries': [
        {'type':'line','name':'Pulse','data': [["2013-03-26T06:20:00", 0], ["2013-03-26T06:25:00", 0], ["2013-03-26T06:30:00", 0]]}
      ]
    };
    highchartsUI.init(options);
    highchartsUI.clear(); // Removing the data we just added
    
    _ganttUI.init('gantt');
    
    sleepUI.init();
    
    analysisUI.init();
    _getAnalysisData();
    
    twitterUI.init();
    _getTwitterData();
	};

  // This function is used to refresh the whole view
	var _refreshData = function() {
		var x = document.getElementById("datetext");
		x.innerHTML = "Analysis for " + _currentday.toDateString() + ".";
    
    highchartsUI.clear();
    _ganttUI.clear();
    
    bulletSparkUI.clear();
    
    _getAnalysisData();
    _getSleepData();
    _getMeasuresData();
    _getActivityData();
    
    calendarUI.clear();
    _getCalendarData();
    
    twitterUI.clear();
    _getTwitterData();
    
    weatherUI.clear();  
		_getWeatherData(_currentday);
		if(!Date.equals(Date.today(), _currentday.clone().clearTime())) {
      _getWeatherData(_currentday.clone().add(1).days());
    }
	};

	var _currentday;

	var _prevDay = function() {
		_currentday = _currentday.addDays(-1);
		$('#datescroller').mobiscroll('setDate', _currentday, true);
		_disableNextDayButton();
		_refreshData();
    highchartsUI.resetZoom();
	};

	var _nextDay = function() {
		_currentday = _currentday.addDays(1);
		$('#datescroller').mobiscroll('setDate', _currentday, true);
		_disableNextDayButton();
		_refreshData();
    highchartsUI.resetZoom();
	};

	return {
		init: _init,
		register: function(path, cb) {
      Common.runtimePopup(path, cb);
		},
		login: function() {
			var username = $("#username").val();
			var password = $("#password").val();
			if(username.length > 0 && username.length < 20 && password.length > 0) {
				this.getUserData(username, password);
			}
		},
		getUserData: function(username, password) {
			var credentials = 'Basic ' + Base64.encode(username + ":" + password);

			// First we check the services available for the user
			var apicall = 'user/services';
			var myurl = baseurl + apicall;
      
      // Damn IE
      if ('XDomainRequest' in window && window.XDomainRequest !== null) {
        IE8_ajax_fix();
        // also, override the support check
        jQuery.support.cors = true;
      }
      
      // Request user data to see if cerdentials are ok
			$.ajax(
				{
					url: myurl,
		    	type: 'GET',
					datatype: 'json',
          contentType: "application/json; charset=utf-8",
		    	headers: {
		        "Authorization": credentials
    			},
					statusCode: {
						401: function() {
							alert("Login failed");
						}
					}
				} 
			).done(
				function(data) {
          if(typeof(data) != 'object')
            var json = $.parseJSON(data);
          else 
            var json = data;
					if(json.user_info.username) {
            userData.services = json.services_linked;
						if(json.services_linked.indexOf('beddit') != -1) {
	            userData.beddit = true;
						} if(json.services_linked.indexOf('withings') != -1) {
	            userData.withings = true;
						} if(json.services_linked.indexOf('fitbit') != -1) {
	            userData.fitbit = true;
						} if(json.services_linked.indexOf('twitter') != -1) {
	            userData.twitter = true;
						}
						$("#servicestext").text(" (" + userData.services.toString() + ") ");
            
						userData.calendars = json.calendars;
						userData.username = username;
						userData.credentials = credentials;
            
						if(typeof(json.user_info.city) != undefined) userData.address = json.user_info.city;
						$("#login-msg").text(" Hi " + json.user_info.username + ", login successful.");
						$(".headertext").text(json.user_info.first_name + "'s WellMU dashboard");
						$("div.login").hide(1000);
						_disableLoginDialog();
						$.mobile.changePage("#single-day-page");
            
						_init();
            
					} else {
          
						// Login unsuccessful, does not work as the server fails to respond
						$("#login-msg").text("Sorry, login failed!");
					}
				}
			);
		},
		setDate: _setDate,
		getSleepData: _getSleepData,
		getData: _getData,
		nextDay: _nextDay,
		prevDay: _prevDay
	}
}());