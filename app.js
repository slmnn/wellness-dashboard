var currentday;

function prevDay() {
	currentday = new Date(currentday.getTime() - (24 * 60 * 60 * 1000));
  wellnessAPI.getSleepData();
};

function nextDay() {
	currentday = new Date(currentday.getTime() + (24 * 60 * 60 * 1000));
  wellnessAPI.getSleepData();
//	wellnessAPI.getData('beddit/api/user/' + userData.username + '/' + daypath + '/sleep/');	
};

var userData = (function(userData) {
	var _data = undefined;
	var _credentials = undefined;
	var _username = undefined;
	return {
		username: _username,
		data: _data,
		credentials: _credentials
	}
}());

var weightData = (function(weightData) {
	var _weight = 0;
	var _weighttrend = 0;

	return {
		weight: _weight,
		trend: _weighttrend
	}

}());

var sleepData = (function(sleepData) {
	var _deepamount = 0;
  var _deepamountgoal = 5200;
	var _totalamount = 0;
  var _totalamountgoal = 36000;
	var _timeinbed = 0;
	var _efficiency = 0;
	var _heartrate = 0;
	var _heartratedata = [];
  var _noise = [0,0];
	var _lightdata = [];
	var _stesslevel = 0;
	var _stages = [];
	var _date = undefined;
	var _localstarttime = undefined;
	var _localendtime = undefined;

	_timeawake = function() {
		return Math.abs( this.timeinbed - this.total );
 	};

	_averageNoise = function() {
		var sum = this.noisedata.reduce(function(a, b) { return a + b });
		return Math.round( sum / this.noisedata.length );
	};

	return {
		total: _totalamount,
		totalgoal: _totalamountgoal,
		deep: _deepamount,
		deepgoal: _deepamountgoal,
		timeinbed: _timeinbed,
		efficiency: _efficiency,
		heartrate: _heartrate,		
		timeawake: _timeawake,
		heartratedata: _heartratedata,
		noise: _averageNoise,
		noisedata: _noise,
		lightdata: _lightdata,
		stresslevel: _stesslevel,
		stages: _stages,
		date: _date,
		localstarttime: _localstarttime,
		localendtime: _localendtime
	}
}());

var graphUI = (function(graphUI) {
	_drawStages = function(canvasid, data) {
    var starttime = new Date(sleepData.localstarttime.getTime()); // Start time today
    var endtime = new Date(sleepData.localendtime.getTime()); // End time tomorrow

		var total = endtime.getTime() - starttime.getTime();

		var parsedData = [];
		var colors = [];
		var tooltips = [];
	
		var stagelength = 0;
		for(var i = 0; i < data.length; i++) {
			if(i == 0) {
				stagelength = 5*60*1000;
				continue;
			} else {
				if(i != data.length-1 && data[i-1][1] === data[i][1]) {
					stagelength += 5*60*1000;
					continue;
				} else {
					var progress = Math.round(stagelength / total * 100 * 100) / 100;
					parsedData.push(progress);
					stagelength = 5*60*1000;
					switch(data[i-1][1]) {
						case 'A':
							colors.push('rgba(44, 44, 44, 0.4)');
							tooltips.push('Away');
							break;
						case 'W':
							colors.push('rgba(255, 0, 0, 0.6)');
							tooltips.push('Wake');
							break;
						case 'L':		
							colors.push('rgba(0, 196, 255, 0.6)');
							tooltips.push('Light');
							break;
						case 'R':
							colors.push('rgba(0, 196, 36, 0.6)');
							tooltips.push('REM');
							break;
						case 'D':
							colors.push('rgba(0, 63, 255, 0.6)');
							tooltips.push('Deep');
							break;
						default:
							colors.push('rgba(255, 147, 0, 1)');
							tooltips.push('Unknown');
							break;					
					}
				}
			} 
//			console.log(data[i][0], data[i][1], activitystart, stagelength, progress, tooltips[i]);
		}
		var progress1 = new RGraph.HProgress(canvasid, parsedData, 100);
		progress1.Set('colors', colors);
    progress1.Set('tooltips', tooltips);
		progress1.Set('chart.tickmarks', false);
		progress1.Set('chart.gutter.top', 20);
		progress1.Set('chart.gutter.bottom', 0);
    progress1.Set('units.post', '');
		progress1.Set('chart.text.color', 'rgba(255, 147, 0, 0)') // invisible text
		progress1.Set('key', ['Away', 'Wake', 'Light sleep', 'REM', 'Deep sleep']);
		progress1.Set('key.colors', ['rgba(44, 44, 44, 0.4)', 'rgba(255, 0, 0, 0.6)', 'rgba(0, 196, 255, 0.6)', 'rgba(0, 196, 36, 0.6)', 'rgba(0, 63, 255, 0.6)']);
//    progress1.Set('tickmarks.zerostart', true);
//    progress1.Set('bevel', true);        
    progress1.Draw();
	}

	_clearLineGraph = function(canvasid) {
		var canvas  = document.getElementById(canvasid)
		RGraph.Clear(canvas, 'white');
		RGraph.Reset(canvas);
		RGraph.ObjectRegistry.Clear(canvasid);
	};

	_graphs = [];
	_drawGraphs = function(graphname) {
		_clearLineGraph('heartlinegraph');
		if($( "#checkbox-noise").is(':checked')) {
			_drawBarGraph('heartlinegraph', sleepData.noisedata, 'rgba(0,255,0,0.4)', 'right', 'Noise', 140);
		}
		if($( "#checkbox-luminosity").is(':checked')) {
			_drawBarGraph('heartlinegraph', sleepData.lightdata, 'rgba(0,0,255,0.4)', 'right', 'Luminosity', 220);
		}
		if($( "#checkbox-heartrate").is(':checked')) {
			_initLineGraph('heartlinegraph', 'Heart rate', sleepData.heartratedata);
		}
		_initLineGraph('heartlinegraph', 'Heart rate', sleepData.heartratedata);
    _drawStages('sleepstagegraph', sleepData.stages);
	};

	_drawBarGraph = function(canvasid, data, color, yaxispos, key, keyxpos) {
		var tooltips = [];
		for(var i = 0; i < data.length; i++) { tooltips.push(data[i] + ''); }
		var bar = new RGraph.Bar(canvasid, data);
		bar.Set('tooltips',tooltips);
		bar.Set('colors', [color]);
    bar.Set('hmargin', 0);
		bar.Set('background.grid', false);
		bar.Set('chart.yaxispos', yaxispos);
		bar.Set('chart.ylabels.count', 3);
		bar.Set('chart.scale.decimals', 0);
		bar.Set('ylabels', false);
    bar.Set('chart.noaxes', false);
    bar.Set('chart.key', [key]);
    bar.Set('chart.key.position.x', keyxpos);
    bar.Set('chart.key.position', 'gutter');
	  bar.Set('chart.ymin', Math.max(0, Math.min.apply(null, data)));
		bar.Set('chart.filled.accumulative', true);
		bar.Draw();
		_graphs.push(bar);
//		RGraph.RedrawCanvas(bar.canvas);
	};

	_initLineGraph = function(canvasid, title, data) {
		var labelarray = [];
		var starttime = new Date(); // Start time today
		starttime.setHours(userData.data.night_start_time.split(':')[0]);
		starttime.setMinutes(userData.data.night_start_time.split(':')[1]);
		starttime.setSeconds(0);
		starttime.setMilliseconds(0);
		var endtime = new Date(starttime.getTime() + 24*60*60*1000); // End time tomorrow
		endtime.setHours(userData.data.night_end_time.split(':')[0]);
		endtime.setMinutes(userData.data.night_end_time.split(':')[1]);
		endtime.setSeconds(0);
		endtime.setMilliseconds(0);
		var temptime = new Date(starttime.getTime());
		console.log(starttime, endtime, temptime);
		while(temptime <= endtime) {
			if(temptime.getMinutes() == 0)
				labelarray.push(temptime.getHours() + ":" + (temptime.getMinutes()<10?'0':'') + temptime.getMinutes());
			else
				labelarray.push('');
			temptime = new Date(temptime.getTime() + 5*60*1000);
		}
//		console.log(labelarray, labelarray.length);

		var mappedData = _mapData(data, starttime, endtime);
		var tooltips = [];
		for(var i = 0; i < mappedData.length; i++) { tooltips.push(mappedData[i] + ''); }
		var canvas  = document.getElementById(canvasid)
		var line = new RGraph.Line(
			canvasid, mappedData
		);
		line.Set('chart.curvy', true);
		line.Set('background.grid', false);
		line.Set('chart.linewidth', 3);
		line.Set('chart.hmargin', 5);
		line.Set('chart.labels', labelarray);
		line.Set('chart.tooltips', tooltips);
		line.Set('chart.ylabels.count', 3);
		line.Set('chart.scale.decimals', 0);
		line.Set('chart.shadow.blur', 15);
		line.Set('chart.ymin', Math.max(0, Math.min.apply(null, mappedData)));
		line.Set('chart.key', [ title + "" ]);
		line.Set('chart.key.position.x', 40);
		line.Set('chart.key.position', 'gutter');
		line.Set('chart.outofbounds', true);
		line.Draw();
		_graphs.push(line);
	};

	_mapData = function(data, starttime, endtime) {
		// data should have data.time and data.value
		var result = [];
		var temptime = new Date(starttime.getTime());
		var valuefound = false;
		var lastfoundvalue = sleepData.heartrate;
		while(temptime <= endtime) {
			for(var i = 0; i < data.length; i++) {
				var datatime = new Date(data[i].time);
				datatime = new Date(datatime.getTime() - 2*60*60*1000);
				datatime.setDate(temptime.getDate());
				datatime.setMonth(temptime.getMonth());
				datatime.setFullYear(temptime.getFullYear());
				if(
						Math.abs(datatime.getTime()-temptime.getTime()) <= 5*60*1000
					) {
					var value = Math.round(data[i].value * 100) / 100;
					result.push(value);
					lastfoundvalue = value;
					valuefound = true;
					break;
				}
			}
			if(valuefound == false) {
				result.push(lastfoundvalue);
			}
			valuefound = false;
			temptime = new Date(temptime.getTime() + 5*60*1000);
		}
//		console.log(result);
		return result;
	};

	return {
		clearLineGraph: _clearLineGraph,
    drawGraphs: _drawGraphs
	}
}());


var gaugeUI = (function(graphUI) {
	_setGaugeValue = function(gauge, maxvalue, value) {
		gauge.refresh(value);
		if(gauge.convert === true)
			gauge.txtTitle[0].textContent = secondsToString(value) + gauge.unittxt;
		else
			gauge.txtTitle[0].textContent = value + gauge.unittxt;
		console.log(value, gauge.txtTitle[0].textContent);
	};

	var _gauges = [];
	_initGauges = function() {
		_gauges.push(_initGauge('deepsleep', 'deepsleeptext', 'good', Math.max(sleepData.deepgoal, sleepData.deep) + 600, sleepData.deep, true, ''));
		_gauges.push(_initGauge('totalsleep', 'totalsleeptext', 'good', Math.max(sleepData.totalgoal, sleepData.total) + 600, sleepData.total, true, ''));
		_gauges.push(_initGauge('efficiency', 'efficiencytext', 'good', Math.max(100, sleepData.efficiency), sleepData.efficiency, false, ' %'));
		_gauges.push(_initGauge('timeawake', 'timeawaketext', 'bad', Math.max(5100, sleepData.timeawake()) + 600, sleepData.timeawake(), true, ''));
		_gauges.push(_initGauge('heartrate', 'heartratetext', 'neutral', Math.max(sleepData.heartrate, 80), sleepData.heartrate, false, ' BPM'));
		_gauges.push(_initGauge('noise', 'noisetext', 'bad', Math.max(sleepData.noise(), 120), sleepData.noise(), false, ' db'));
	};

	_setGaugesToZero = function() {
		for(var i = 0; i < _gauges.length; i++) {
			_setGaugeValue(_gauges[i], _gauges[i].maxvalue, 0);
		}
	};

	// For justGage
	_initGauge = function(canvas, textfield, type, maxvalue, gaugevalue, gaugeconversion, unittxt) {
    var colorset = {
      good: ['#B40404', '#DF3A01',  '#C8FE2E', '#31B404' ],
      neutral: ['#00BFFF', '#0174DF', '#0431B4', '#08088A'],
      bad: ['#31B404', '#C8FE2E', '#DF3A01', '#B40404']
    };

    var colors;
    switch(type) {
      case 'good':
        colors = colorset.good;
        break;
      case 'bad':
        colors = colorset.bad;
        break;
      default:
        colors = colorset.neutral;
        break;
    }
		
		JustGage.prototype.convert = false;
		var g = new JustGage({
			id: canvas, 
			value: gaugevalue,
			showMinMax: false,
			min: 0,
			max: maxvalue,
			levelColors: colors,
			levelColorsGradient: false,
			startAnimationType: "bounce",
			refreshAnimationType: "bounce",
			showInnerShadow: true,
			gaugeWidthScale: 0.5,
			title: "foo"
	  }); 
		g.convert = gaugeconversion;
		g.unittxt = unittxt;
		return g;
	};

	return {
		initGauges: _initGauges,
		gauges: _gauges,
		setGaugeValue: _setGaugeValue
	}
}());

var wellnessAPI =(function(wellnessAPI) {
	var baseurl = 'https://wellness.cs.tut.fi/';

	_sleepCB = function(data) {
		var json = $.parseJSON(data);
		for(var i = 0; i < json.data.length; i++) {
			var data = json.data[i];
			if(data.analysis_valid == false) {
				var x = document.getElementById("datetext");
				x.innerHTML = "Analysis for " + data.date + " is invalid.";
				_setGaugesToZero();
				graphUI.clearLineGraph('heartlinegraph');
				graphUI.clearLineGraph('sleepstagegraph');
				return;
			} else {
				var x = document.getElementById("datetext");
				x.innerHTML = "Analysis for " + data.date + ".";
			}
			sleepData.total = data.time_sleeping;
			sleepData.deep = data.time_deep_sleep;
			sleepData.timeinbed = data.time_in_bed;
			sleepData.efficiency = Math.round(data.sleep_efficiency * 100) / 100;
			sleepData.heartrate = Math.round(data.resting_heartrate * 100) / 100;
			sleepData.stages = data.sleep_stages;
			sleepData.date = new Date(data.date);
			sleepData.localstarttime = new Date(data.local_start_time); // - 2*60*60*1000);
			sleepData.localendtime = new Date(data.local_end_time); // - 2*60*60*1000);

	    gaugeUI.setGaugeValue(_gauges[0], Math.max(sleepData.deepgoal, sleepData.deep), sleepData.deep);
			gaugeUI.setGaugeValue(_gauges[1], Math.max(sleepData.totalgoal, sleepData.total), sleepData.total);
 		  gaugeUI.setGaugeValue(_gauges[2], Math.max(100, sleepData.efficiency), sleepData.efficiency);
 		  gaugeUI.setGaugeValue(_gauges[3], Math.max(5100, sleepData.timeawake()), sleepData.timeawake());
 		  gaugeUI.setGaugeValue(_gauges[4], Math.max(sleepData.heartrate, 80), sleepData.heartrate);

			sleepData.heartratedata = [];
			for(var i = 0; i < data.averaged_heart_rate_curve.length; i++) {
				if(data.averaged_heart_rate_curve[i][1] != null) {
					sleepData.heartratedata.push(
						{
							'time'  : data.averaged_heart_rate_curve[i][0],
							'value' : data.averaged_heart_rate_curve[i][1] 
						}
					);
				}
				else {
					sleepData.heartratedata.push(
						{
							'time'  : data.averaged_heart_rate_curve[i][0],
							'value' : data.resting_heartrate
						}
					);
				}	
			}

			sleepData.noisedata = [];
			for(var i = 0; i < data.noise_measurements.length; i++) {
				sleepData.noisedata.push(parseInt(data.noise_measurements[i][1]));
			}
 	    gaugeUI.setGaugeValue(_gauges[5], Math.max(sleepData.noise(), 80), sleepData.noise());

			sleepData.lightdata = [];
			for(var i = 0; i < data.luminosity_measurements.length; i++) {
				sleepData.lightdata.push(parseInt(data.luminosity_measurements[i][1]));
			}
			
			graphUI.drawGraphs();
		}
	};

	_getData = function(apicall, cb) {
		var myurl = baseurl + apicall;
		$.ajax(
			{
				url: myurl,
	    	type: 'GET',
				datatype: 'json',
	    	headers: {
	        "Authorization": userData.credentials
   			}
			} 
		).done(cb);
	};

	_init = function() {
		var today = new Date();
		currentday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
		var daypath = currentday.getFullYear() + '/' + (currentday.getMonth() + 1) + '/' + (currentday.getDate());
		// _getData('beddit/api/user/slmnn/' + daypath + '/sleep/');
		_getData('analysis/api/user/' + userData.username +  '/sleep/' + daypath + '/days/1/');
 	 	resizeCanvas = function (id, height){          
			canvas = document.getElementById(id);
			if (canvas.width  < window.innerWidth) {
				canvas.width  = window.innerWidth - 50;
			}
			if(typeof(height) != 'number') {
				canvas.height = canvas.width / 4;
			} else {
				canvas.height = height;
			}
		};
		resizeCanvas('heartlinegraph');
		resizeCanvas('sleepstagegraph', 40);
		_initGauges();
	};
	
	return {
		init: _init,
		login: function() {
			var username = $("#username").val();
			var password = $("#password").val();
			if(username.length > 0 && username.length < 20 && password.length > 0) {
				this.getUserData(username, password);
			}
		},
		getUserData: function(username, password) {
			var apicall = 'beddit/api/user/' + username + '/';
			var credentials = 'Basic ' + Base64.encode(username + ":" + password);
			var myurl = baseurl + apicall;
			$.ajax(
				{
					url: myurl,
		    	type: 'GET',
					datatype: 'json',
		    	headers: {
		        "Authorization": credentials
    			}
				} 
			).done(
				function(data) {
					var json = $.parseJSON(data);
					if(json.status == "ok" && json.code == 200) {
						userData.data = json.data;
						userData.username = json.data.username;
						userData.credentials = credentials;
						$("#login-msg").text("Hi " + userData.data.first_name + ", login successful.");
						$("#usertext").text(userData.data.first_name + "'s health dashboard.");
						$("div.login").hide(1000);
						$( "#password-dialog" ).popup( "close" );
						_init();
					} else {
						$("#login-msg").text("Sorry, login failed");
					}
				}
			);
		},
    getSleepData: function() {
      var daypath = currentday.getFullYear() + '/' + (currentday.getMonth() + 1) + '/' + (currentday.getDate());
      graphUI.clearLineGraph('heartlinegraph');
      graphUI.clearLineGraph('sleepstagegraph');
      _getData('analysis/api/user/' + userData.username +  '/sleep/' + daypath + '/days/1/', _sleepCB);
    }
		getData: _getData
	}
}());

var Base64 = {
  // private property
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  // public method for encoding
  encode : function (input) {
      var output = "";
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0;

      input = Base64._utf8_encode(input);

      while (i < input.length) {

          chr1 = input.charCodeAt(i++);
          chr2 = input.charCodeAt(i++);
          chr3 = input.charCodeAt(i++);

          enc1 = chr1 >> 2;
          enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
          enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
          enc4 = chr3 & 63;

          if (isNaN(chr2)) {
              enc3 = enc4 = 64;
          } else if (isNaN(chr3)) {
              enc4 = 64;
          }

          output = output +
          this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
          this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

      }

      return output;
  },

  // public method for decoding
  decode : function (input) {
      var output = "";
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;

      input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

      while (i < input.length) {

          enc1 = this._keyStr.indexOf(input.charAt(i++));
          enc2 = this._keyStr.indexOf(input.charAt(i++));
          enc3 = this._keyStr.indexOf(input.charAt(i++));
          enc4 = this._keyStr.indexOf(input.charAt(i++));

          chr1 = (enc1 << 2) | (enc2 >> 4);
          chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
          chr3 = ((enc3 & 3) << 6) | enc4;

          output = output + String.fromCharCode(chr1);

          if (enc3 != 64) {
              output = output + String.fromCharCode(chr2);
          }
          if (enc4 != 64) {
              output = output + String.fromCharCode(chr3);
          }

      }

      output = Base64._utf8_decode(output);

      return output;

  },

  // private method for UTF-8 encoding
  _utf8_encode : function (string) {
      string = string.replace(/\r\n/g,"\n");
      var utftext = "";

      for (var n = 0; n < string.length; n++) {

          var c = string.charCodeAt(n);

          if (c < 128) {
              utftext += String.fromCharCode(c);
          }
          else if((c > 127) && (c < 2048)) {
              utftext += String.fromCharCode((c >> 6) | 192);
              utftext += String.fromCharCode((c & 63) | 128);
          }
          else {
              utftext += String.fromCharCode((c >> 12) | 224);
              utftext += String.fromCharCode(((c >> 6) & 63) | 128);
              utftext += String.fromCharCode((c & 63) | 128);
          }

      }

      return utftext;
  },

  // private method for UTF-8 decoding
  _utf8_decode : function (utftext) {
      var string = "";
      var i = 0;
      var c = c1 = c2 = 0;

      while ( i < utftext.length ) {

          c = utftext.charCodeAt(i);

          if (c < 128) {
              string += String.fromCharCode(c);
              i++;
          }
          else if((c > 191) && (c < 224)) {
              c2 = utftext.charCodeAt(i+1);
              string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
              i += 2;
          }
          else {
              c2 = utftext.charCodeAt(i+1);
              c3 = utftext.charCodeAt(i+2);
              string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
              i += 3;
          }

      }

      return string;
  }
}


secondsToString = function(sec) {
  var hr, min;
  sec = Math.floor(sec);
  hr = Math.floor(sec / 3600);
  min = Math.floor((sec - (hr * 3600)) / 60);
  sec -= (hr * 3600) + (min * 60);
  sec += '';
  min += '';
  while (min.length < 2) {
    min = '0' + min;
  }
  while (sec.length < 2) {
    sec = '0' + sec;
  }
  hr = hr ? hr + ':' : '';
  return hr + min + ':' + sec;
};
  
// Gauge UI with gauge.js
var gaugeUI_gauge-js = (function(graphUI) {
	// for gauge.js
	setGaugeValue = function(gauge, maxvalue, value) {
		gauge.set(value); 					// set actual value		
		gauge.maxValue = maxvalue; 	// set max gauge value
	};

	var _gauges = [];
	_initGauges = function() {
		_gauges.push(initGauge('deepsleep', 'deepsleeptext', 'good', Math.max(sleepData.deepgoal, sleepData.deep) + 600, sleepData.deep, true, ''));
		_gauges.push(initGauge('totalsleep', 'totalsleeptext', 'good', Math.max(sleepData.totalgoal, sleepData.total) + 600, sleepData.total, true, ''));
		_gauges.push(initGauge('efficiency', 'efficiencytext', 'good', Math.max(100, sleepData.efficiency), sleepData.efficiency, false, ' %'));
		_gauges.push(initGauge('timeawake', 'timeawaketext', 'bad', Math.max(5100, sleepData.timeawake()) + 600, sleepData.timeawake(), true, ''));
		_gauges.push(initGauge('heartrate', 'heartratetext', 'neutral', Math.max(sleepData.heartrate, 80), sleepData.heartrate, false, ' BPM'));
		_gauges.push(initGauge('noise', 'noisetext', 'bad', Math.max(sleepData.noise(), 120), sleepData.noise(), false, ' db'));
	};

	_setGaugesToZero = function() {
		for(var i = 0; i < _gauges.length; i++) {
			setGaugeValue(_gauges[i], _gauges[i].maxvalue, 0);
		}
	};

	// For gauge.js
	initGauge = function(canvas, textfield, type, maxvalue, value) {
		var colors = {
			good: ['#FF0000', '#00FF00' ],
			neutral: ['#66FFFF','#2B87FF'],
			bad: ['#00FF00','#FF0000']
		};

		var color1, color2;
		switch(type) {
			case 'good':
				color1 = colors.good[0];
				color2 = colors.good[1];
				break;
			case 'bad':
				color1 = colors.bad[0];
				color2 = colors.bad[1];
				break;
			default:
				color1 = colors.neutral[0];
				color2 = colors.neutral[1];
				break;
		}

		var opts = {
			lines: 12, 					// The number of lines to draw
			angle: 0.15, 				// The length of each line
			lineWidth: 0.20, 		// The line thickness
			fontSize: 30,
			pointer: {
				length: 0.6, 				// The radius of the inner circle
				strokeWidth: 0.035, // The rotation offset
				color: '#000000' 		// Fill color
			},	
			percentColors : [
							[ 0.0, "#a9d70b" ],
							[ 0.50, "#f9c802" ],
							[ 1.0, "#ff0000" ]
						],
			colorStart: color1,   		// Colors
			colorStop: color2,    		// just experiment with them 
			strokeColor: '#E0E0E0',   // to see which ones work best for you
			generateGradient: true,
			gradientType: 1
		};

		var gd = document.getElementById(canvas);
		var gauge = new Gauge(gd).setOptions(opts); // create sexy gauge!
		gauge.setTextField(document.getElementById(textfield));
		gauge.maxValue = maxvalue; // set max gauge value
		gauge.animationSpeed = 32; // set animation speed (32 is default value)
		gauge.set(value); // set actual value
		return gauge;
	};
	return {
		initGauges: _initGauges,
		gauges: _gauges
	}
}());
