var userData = (function(userData) {
	var _data = undefined;
	var _credentials = undefined;
	var _username = undefined;
  var _services = [];
	var _beddit = false;
	var _withings = false;
	var _fitbit = false;
	var _nightstart = null;
	var _nightend = null;
	return {
		username: _username,
		data: _data,
		credentials: _credentials,
		services: _services,
		beddit: _beddit,
		withings: _withings,
		fitbit: _fitbit
	}
}());


var gaugeUI = (function(gaugeUI) {
  _createGauge = function(targetDIVid, options, sourcedata) {
    var gauge = $('#gauge_' + options.id).highcharts();
    if(typeof(gauge) == 'undefined') {
      var HTML = $('<div id="gaugewrapper" class="masonry-box"><span class="gaugetext">' + options.name + '</span></br><div id="gauge_' + options.id + '" class="gauge"></div></div>');
      $(targetDIVid).append(HTML).masonry('appended', HTML);
      $('#masonry-container').masonry( 'reload' );
      $("#gauge_" + options.id).highcharts({
    
        chart: {
            type: 'gauge',
            plotBackgroundColor: null,
            plotBackgroundImage: null,
            plotBorderWidth: 0,
            plotShadow: false,
            spacingTop: 2,
            spacingBottom: 7,
            spacingLeft: 2,
            spacingRight: 2
        },      
        pane: {
            startAngle: -150,
            endAngle: 150,
            background: [{
                backgroundColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, '#FFF'],
                        [1, '#333']
                    ]
                },
                borderWidth: 0,
                outerRadius: '109%'
            }, {
                backgroundColor: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                    stops: [
                        [0, '#333'],
                        [1, '#FFF']
                    ]
                },
                borderWidth: 1,
                outerRadius: '107%'
            }, {
                // default background
            }, {
                backgroundColor: '#DDD',
                borderWidth: 0,
                outerRadius: '105%',
                innerRadius: '103%'
            }]
        },
        title: {
          text: null
        },
        // the value axis
        yAxis: {
            min: options.min,
            max: options.max,
            
            minorTickInterval: 'auto',
            minorTickWidth: 1,
            minorTickLength: 3,
            minorTickPosition: 'inside',
            minorTickColor: '#666',
    
            tickPixelInterval: 30,
            tickWidth: 2,
            tickPosition: 'inside',
            tickLength: 4,
            tickColor: '#666',
            labels: {
                step: 2,
                rotation: 'auto',
                enabled: false
            },
            title: {
                text: sourcedata.valueSuffix,
                margin: 0
            },
            plotBands: options.bands
        },
    
        series: [{
            name: options.name,
            data: [sourcedata.value],
            tooltip: {
                valueSuffix: sourcedata.valueSuffix
            }
        }]
      });
    } else {
      var point = gauge.series[0].points[0];
      point.update(sourcedata.value);
    }
  };

  _init = function() {
		amplify.subscribe('new_gauge', function(d) {
      console.log('new_gauge', d);
			_createGauge(d.targetDIVid, d.options, d.data);
		});
  };
  return {
    init: _init
  }
}());

var bulletChartUI = (function(bulletChartUI) {
	var chart, parentDIVID, margin, width, height;
	
	_init = function() {
		parentDIVID = "#masonry-container";
		var parentwidth = $(parentDIVID).width() / 2;
		var HTML = $('<div id="bullet-chart-wrapper" style="width:' + parentwidth + 'px;" class="masonry-box"></div>');
    $(parentDIVID).append(HTML).masonry('appended', HTML);
		margin = {top: 5, right: parentwidth * 0.05, bottom: 20, left: 160},
			width = parentwidth - margin.left - margin.right,
			height = 50 - margin.top - margin.bottom;

		chart = d3.bullet()
				.width(width)
				.height(height);
		
		amplify.subscribe('new_bullet_chart', function(data) {
      console.log('new_bullet_chart', data);
			_createBulletChart(data.id, data.chart);
		});
		
		amplify.subscribe('update_bullet_chart', function(data) {
      console.log('update_bullet_chart', data);
			_updateBulletChart(data.id, data.chart);
		});
	}

  _createBulletChart = function(id, data) {
    var HTML = $('<div class="bullet-chart"  style="width:' + $(parentDIVID).width() / 2 + 'px;" id="'+ id +'"></div>');
    $('#bullet-chart-wrapper').append(HTML); //.masonry('appended', HTML);
    
    var svg = d3.select('#'+id).selectAll("svg")
        .data([data])
      .enter().insert("svg")
        .attr("class", "bullet")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .insert("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(chart);

    var title = svg.append("g")
        .style("text-anchor", "end")
        .attr("transform", "translate(-6," + height / 2 + ")");

    title.append("text")
        .attr("class", "title")
        .text(function(d) { return d.title; });

    title.append("text")
        .attr("class", "subtitle")
        .attr("dy", "1em")
        .text(function(d) { return d.subtitle; });
        
    title.append("text")
        .attr("class", "bulletvalue")
        .attr("dy", "1.8em")
        .attr("id", id + "-value")
        .text(function(d) { 
          return '' + data.valuetxt; 
        });
        
    chart.duration((1 + Math.random()) * 1000); 
    $('#masonry-container').masonry( 'reload' );
  };
  
  _updateBulletChart = function(id, data) {
    d3.select('#'+id).selectAll("svg") 
        .data([data]) 
        .call(chart); 

    d3.selectAll(".title") 
          .data(data) 
          .attr("class", "title") 
      .text(data.title) 
          .text(function(data) { return data.title; }); 

    d3.selectAll(".subtitle") 
          .data(data) 
      .attr("class", "subtitle") 
      .attr("dy", "1em") 
      .text(function(data) { return data.subtitle; });  
      
    d3.selectAll("#" + id + "-value")
      .attr("class", "bulletvalue")
      .attr("id", id + "-value")
      .attr("dy", "1.8em") 
      .text('' + data.valuetxt);  
  };
  
  _remove = function(id) {
    $('#'+id).remove();
  };
  
  return {
    createBulletChart: _createBulletChart,
    updateBulletChart: _updateBulletChart,
		init: _init
  }
}());

highchartsUI = (function(highchartsUI) {
	var _container = '#highchart';
	
	_createSeries = function(data) {
    var d = Date.parse(data.pointStart)
		return  {
			'name': data.name,
      'type': data.type,
			'data': data.data, //_mapData(data.data),
			'data.marker.enabled': false,
			'pointStart': Date.UTC(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()),
			'pointInterval': data.pointInterval
		}
	};
	
	_mapData = function(data) {
		var start = _options.start;
		var end = _options.end;
		var result = [];
		var i = 0;
		try {
			while(Date.parse(data[i][0]).isBefore(start)) i++;
			for(var j = i; j < data.length; j++) {
				if(Date.parse(data[j][0]).isAfter(end)) break;
				result.push(data[j][1]);
			}
		} catch(err) {
			console.log("Time parsing error", data, err, i, j);
			return [];
		}
		return result;
	};
	
	_clear = function() {
    var chart = $(_container).highcharts();
    if(typeof(chart) == 'object') {
      console.log('Removing highchart', chart.series.length);
      //highchartsUI.chart().destroy();
      for (var i = 0; i < chart.series.length; i++) {
        chart.series[i].remove(true); //forces the chart to redraw
      }
      if(chart.series.length > 0) {
        while(chart.series.length > 0) {
          chart.series[0].remove(true); //forces the chart to redraw
        }
        chart.redraw();
        console.log('Removing highchart complete', chart.series.length);
      }
    }
	};
		
	var _options = {
		'title': 'Wellness timeline', 
		'subtitle': 'Activities, sleeping, etc...', 
		'start': Date.today().clearTime().add(-1).days(),
		'end': Date.today().clearTime().add(1).days(),
		'yAxisTitle':'',
		'initSeries':[{'name':'foo', 'data': [1,2,3,4,5,6], 'type':'spline'},]
	}
	
	_init = function(options) {
		if(typeof(options) != 'undefined')	_options = options;
		$(_container).highcharts({
				chart: {
						type: 'spline',
						height: 400,
						zoomType: 'x'
				},
				title: {
						text: _options.title
				},
				subtitle: {
						text: _options.subtitle
				},
				xAxis: {
          type: "datetime",    
          dateTimeLabelFormats: {
              day: '%H:%M'
          },
          //tickInterval: 3600 * 1000,
          tickPixelInterval: 50
        },
				yAxis: {
						min: 0,
						title: {
								text: _options.yAxisTitle
						}
				},
				plotOptions: {
            line: {
                lineWidth: 2,
                states: {
                    hover: {
                        lineWidth: 4
                    }
                },
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: true
                        }
                    }
                }
            },
            spline: {
                lineWidth: 2,
                states: {
                    hover: {
                        lineWidth: 4
                    }
                },
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: true
                        }
                    }
                }
            },
            area: {
                lineWidth: 2,
                states: {
                    hover: {
                        lineWidth: 4
                    }
                },
                marker: {
                    enabled: false,
                    states: {
                        hover: {
                            enabled: true
                        }
                    }
                }
            }
        },
				tooltip: {
						headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
						pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
								'<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
						footerFormat: '</table>',
						shared: true,
						useHTML: true
				},
				series: _options.initSeries
		});
	};
	
	_chart = function() {
		return $(_container).highcharts();
	}

	amplify.subscribe('new_timeline_dataset', function(data) {
		console.log('new_timeline_dataset', data);
		var series = _createSeries(data);
		console.log('new series', series);
		_chart().addSeries(series, false);
		_chart().redraw();
	});

	return {
		init: _init,
		chart: _chart,
    clear: _clear
	}
}());

var weatherUI = (function(weatherUI) {
	_init = function() {
		amplify.subscribe('weather_history', function(data) {
			var summary = data.history.dailysummary[0];
			console.log('Weather data for ' + summary.date.pretty, summary);
			var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			var weekday = weekdays[Date.parse(data.history.date.pretty).getDay()];
			var HTML = $('<div class="masonry-box weather_variables" id="weather_variables_'+ weekday +'"><b>Weather conditions (' + weekday + ')</b></br>' +
        '<table><tr><td class="weatherdata_name">Temperature</td><td class="weatherdata_value">' + summary.meantempm + ' C</td><td><span id="temperature_sparkline_' + weekday + '"></span></td></tr>' +
        '<tr><td class="weatherdata_name">Dew P.T.</td><td class="weatherdata_value">' + summary.meandewptm + ' C</td><td><span id="dewptm_sparkline_' + weekday + '"></span></td></tr>' + 
        '<tr><td class="weatherdata_name">Pressure</td><td class="weatherdata_value">' + summary.meanpressurem + ' hPa</td><td><span id="pressure_sparkline_' + weekday + '"></span></td></tr>' + 
        '<tr><td class="weatherdata_name">Humidity</td><td class="weatherdata_value">' + summary.humidity + ' %</td><td><span id="humidity_sparkline_' + weekday + '"></span></td></tr></table>' +
        '</div>');
			$("#masonry-container").append(HTML).masonry('appended', HTML);
      var o = data.history.observations;
      var temperature_sparkline = [];
      var pressure_sparkline = [];
      var humidity_sparkline = [];
      var dewptm_sparkline = [];
      for(var i = 0; i < o.length; i++) {
        temperature_sparkline.push(o[i].tempm);
        pressure_sparkline.push(o[i].pressurem);
        humidity_sparkline.push(o[i].hum);
        dewptm_sparkline.push(o[i].dewptm);
      }
      $('#temperature_sparkline_' + weekday).sparkline(temperature_sparkline, {width:'100px'});
      $('#pressure_sparkline_' + weekday).sparkline(pressure_sparkline, {width:'100px'});
      $('#humidity_sparkline_' + weekday).sparkline(humidity_sparkline, {width:'100px'});
      $('#dewptm_sparkline_' + weekday).sparkline(dewptm_sparkline, {width:'100px'});
      $('#masonry-container').masonry( 'reload' );
		});
	};
	return {
		init: _init
	}
}());

var weatherAPI = (function(weatherAPI) {
	var baseurl = 'http://ec2-54-247-149-187.eu-west-1.compute.amazonaws.com:8080/';
	_weatherHistoryCB = function(data) {
		amplify.publish('weather_history', data);
	};
	_getWeatherHistory = function(address, date) {
		// First we check the services available for the user
		var day = ("0" + date.getDate()).slice(-2);
		var month = ("0" + (date.getMonth() + 1)).slice(-2);
		var apicall = 'history?address=' + address + '&year=' + date.getFullYear() + '&day=' + day + '&month=' + month;
		var myurl = baseurl + apicall;
		var cacheValue = amplify.store(myurl);
		if(typeof(cacheValue) != 'undefined') {
			console.log("Found from local store " + myurl, cacheValue);
			_weatherHistoryCB(cacheValue);
		} else {
			$.getJSON(myurl,
				function(data) {
					amplify.store(myurl, data, { expires: 12*60*(60*1000*Math.random()) });
					_weatherHistoryCB(data);
				}
			);		
		}
	};
	return {
		getWeatherHistory: _getWeatherHistory
	}
}());

var wellnessAPI =(function(wellnessAPI) {
	var baseurl = 'https://wellness.cs.tut.fi/';
  var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	_sleepCB = function(data) {
    $('.sleep_variables').remove();
		var json = $.parseJSON(data);
		for(var i = 0; i < json.data.length; i++) {
			var data = json.data[i];
			if(data == null || data.analysis_valid == null) {
				console.log("No valid sleep data available on " + _currentday.toDateString(), data);
				return;
			}
			if(data.analysis_valid == false) {
				console.log('Invalid Beddit analysis on ' + _currentday.toDateString(), data);
				return;
			} else {
				console.log('Valid Beddit analysis available on ' + data.date, data);
			}
						
			var daynumber = Date.parse(data.date).getDay(); 
			console.log('Publishing sleep data ', daynumber, weekdays[daynumber], i, json.data.length)
			amplify.publish('new_timeline_dataset',
        {'name':'Noise (' + weekdays[daynumber] + ')','pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(data.noise_measurements[0][0]),'data':data.noise_measurements,'type':'area'});
			amplify.publish('new_timeline_dataset',
        {'name':'Luminosity (' + weekdays[daynumber] + ')','pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(data.luminosity_measurements[0][0]),'data':data.luminosity_measurements,'type':'area'});
			amplify.publish('new_timeline_dataset',
        {'name':'Heart rate (' + weekdays[daynumber] + ')','pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(data.averaged_heart_rate_curve[0][0]),'data':data.averaged_heart_rate_curve,'type':'spline'});

//			amplify.publish('new_timeline_dataset',
//        {'name':'Temperature (' + weekdays[daynumber] + ')','pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(data.temperature_measurements[0][0]),'data':data.temperature_measurements,'type':'line'});

//			var value = Math.round(data.sleep_efficiency * 100) / 100;
//			amplify.publish('update_bullet_chart', 
//        { 'id':'sleep_efficiency', 'chart': {"title":"Sleep efficiency","subtitle":"percent","ranges":[70,80,90],"measures":[value],"markers":[100],"valuetxt":value}}
//      );
      
      var HTML = $('<div class="masonry-box sleep_variables" id="sleep_variables_' + i + '">' +
        '<b>Sleep variables (' + weekdays[daynumber] + ')</b></br>' +
        '<table id="sleepdata_table_' + i + '"></table></div>');
      $('#masonry-container').append(HTML).masonry('appended', HTML);
      
      $('#sleepdata_table_' + i ).append(
        '<tr><td class="sleepdata_name">Sleep efficiency</td><td class="sleepdata_value">' + Math.round(data.sleep_efficiency * 100) / 100 + '</td><td class="sleepdata_unit">%</td><!--<td class="sleepdata_sparkline"><span id="sleep_efficiency_sparkline_' + i + '">Loading..</span>--></td></tr>' +
        '<tr><td class="sleepdata_name">Total sleep time</td><td class="sleepdata_value">' + secondsToString(data.time_sleeping) + '</td><td class="sleepdata_unit">hours</td><td class="sleepdata_sparkline"><span id="sleep_time_sleeping_sparkline_' + i + '">Loading..</span></td></tr>' +
        '<tr><td class="sleepdata_name">Deep sleep time</td><td class="sleepdata_value">' + secondsToString(data.time_deep_sleep) + '</td><td class="sleepdata_unit">hours</td><!--<td class="sleepdata_sparkline"><span id="sleep_time_deep_sparkline_' + i + '">Loading..</span></td>--></tr>' +
        '<tr><td class="sleepdata_name">Light sleep time</td><td class="sleepdata_value">' + secondsToString(data.time_light_sleep) + '</td><td class="sleepdata_unit">hours</td><!--<td class="sleepdata_sparkline"><span id="sleep_time_light_sparkline_' + i + '">Loading..</span></td>--></tr>' +
        '<tr><td class="sleepdata_name">Time in bed</td><td class="sleepdata_value">' + secondsToString(data.time_in_bed) + '</td><td class="sleepdata_unit">hours</td><td class="sleepdata_sparkline"><span id="sleep_time_in_bed_sparkline_' + i + '">Loading..</span></td></tr>' +
        '<tr><td class="sleepdata_name">Resting heartrate</td><td class="sleepdata_value">' + Math.round(data.resting_heartrate*100)/100 + '</td><td class="sleepdata_unit">bpm</td></tr>' +
        '<tr><td class="sleepdata_name">Stress percent</td><td class="sleepdata_value">' + data.stress_percent + '</td><td class="sleepdata_unit">%</td><!--<td class="sleepdata_sparkline"><span id="sleep_stress_sparkline_' + i + '">Loading..</span></td>--></tr>'
      );
	  
//      $('#sleep_efficiency_sparkline_' + i).sparkline(temperature_sparkline, {'type': 'pie', 'width':'100px'});
      $('#sleep_time_sleeping_sparkline_' + i).sparkline([[ Math.round(data.time_sleeping/3600 * 100) / 100],[Math.round(data.time_deep_sleep/3600 * 100) / 100],[ Math.round(data.time_light_sleep/3600 * 100) / 100]], {'type': 'pie', 'width':'10px'});
//      $('#sleep_time_deep_sparkline_' + i).sparkline(humidity_sparkline, {'type': 'pie', width:'100px'});	  
//      $('#sleep_time_light_sparkline_' + i).sparkline(humidity_sparkline, {'type': 'pie', width:'100px'});	  
      $('#sleep_time_in_bed_sparkline_' + i).sparkline([ Math.round(data.time_in_bed/3600 * 100) / 100, Math.round((data.time_in_bed-data.time_sleeping)/3600 * 100) / 100], {'type': 'pie', width:'10px'});	  
//      $('#sleep_stress_sparkline_' + i).sparkline(humidity_sparkline, {'type': 'pie', width:'100px'});	  
      
      $('#masonry-container').masonry( 'reload' );
		}
	};

	_withingsCB = function(data) {
		var json = $.parseJSON(data);
		
		if(json.data[0].latest.weight != undefined) {
      var value = Math.round(json.data[0].latest.weight.value * 10) / 10;
      var gaugesettings = 
        {'targetDIVid':'#masonry-container',
         'data':{'value':value,'valueSuffix':' kg'}, 
         'options':{'id':'weight','name':'Weight','min':0,'max':value*1.4, 
            'bands':  [{    
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
	        }
        };
      amplify.publish('new_gauge', gaugesettings);
		}
		else {
			console.log("There is no Withings weight data available", json);
		}
		if(json.data[0].latest.sysPressure != undefined) {
      value = Math.round(json.data[0].latest.sysPressure.value * 10) / 10;
      var gaugesettings = 
        {'targetDIVid':'#masonry-container',
         'data':{'value':value,'valueSuffix':' mmHg'}, 
         'options':{'id':'sysp','name':'SBP','min':0,'max':180, 
            'bands':  [{    
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
	        }
        };
      amplify.publish('new_gauge', gaugesettings);
		}
		else {
			console.log("There is no Withings systolic pressure available", json);
		}
		if(json.data[0].latest.diasPressure != undefined) {
      value = Math.round(json.data[0].latest.diasPressure.value * 10) / 10;
      var gaugesettings = 
        {'targetDIVid':'#masonry-container',
         'data':{'value':value,'valueSuffix':' mmHg'}, 
         'options':{'id':'diap','name':'DBP','min':0,'max':110, 
            'bands':  [{    
                            'from': 0,
                            'to': 60,
                            'innerRadius': '96%',
                            'outerRadius': '100%',
                            'color': '#DDDF0D' // yellow
                        },
                        {    
                            'from': 60,
                            'to': 80,
                            'innerRadius': '96%',
                            'outerRadius': '100%',
                            'color': '#55BF3B' // green
                        }, {
                            'from': 80,
                            'to': 100,
                            'innerRadius': '96%',
                            'outerRadius': '100%',
                            'color': '#DDDF0D' // yellow
                        }, {
                            'from': 100,
                            'to': 110,
                            'innerRadius': '96%',
                            'outerRadius': '100%',
                            'color': '#DF5353' // red
                        }]        
	        }
        };
      amplify.publish('new_gauge', gaugesettings);
		}
		else {
			console.log("There is no Withings diastolic pressure available", json);
		}
		if(json.data[0].latest.pulse != undefined) {    
      value = Math.round(json.data[0].latest.pulse.value * 10) / 10;
      var gaugesettings = 
        {'targetDIVid':'#masonry-container',
         'data':{'value':value,'valueSuffix':' bpm'}, 
         'options':{'id':'pulse','name':'Pulse','min':0,'max':160, 
            'bands':  [{    
                            'from': 0,
                            'to': 160,
                            'innerRadius': '96%',
                            'outerRadius': '100%',
                            'color': '#0099FF' // blue
                        }]        
	        }
        };
      amplify.publish('new_gauge', gaugesettings);
		}
		else {
			console.log("There is no Withings pulse available", json);
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
	
	_getWeightData = function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('api/unify/measures/' + daypath + '/days/1/', _withingsCB);
	};

	_getSleepData =	function() {
		// We should get yesterdays and tomorrows data
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('api/unify/sleep/' + daypath + '/days/2/', _sleepCB);
	};

	_getFitbitSummaryData =	function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('fitbit/api/activities/' + daypath + '/', _fitbitSummaryCB);
	};

	_getFitbitActivityDataset =	function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('api/unify/activities/' + daypath + '/days/1/', function(data) {
			var json = $.parseJSON(data);

			if(json.data[0].activities != undefined) {
				console.log("TODO: Handle activities");
			} else {
				console.log("No activities data available on " + daypath, json);
			}
			if(json.data[0].goals != undefined && json.data[0].summary != undefined) {

				// Publishing the values
				amplify.publish('activity_floors', { 'value' : json.data[0].summary.floors, 'goal' : json.data[0].goals.floors })
        amplify.publish('activity_calories', { 'value' : json.data[0].summary.activityCalories, 'goal' : json.data[0].goals.caloriesOut });
        amplify.publish('activity_steps', { 'value' : json.data[0].summary.steps, 'goal' : json.data[0].goals.steps });
        amplify.publish('activity_score', { 'value' : json.data[0].summary.activeScore, 'goal' : json.data[0].goals.activeScore });
        
        goal = (json.data[0].goals.caloriesOut) / 1000;
        value = (json.data[0].summary.activityCalories) / 1000;
        var burnedcaloriesdata = {"title":"Calories burned","subtitle":"count in thousands","ranges":[goal*0.44,goal*0.75,goal*0.95],"measures":[Math.min(value, goal)],"markers":[goal],"valuetxt":value};
        amplify.publish('update_bullet_chart', 
          { 'id':'burnedcalories', 'chart': burnedcaloriesdata }
        );
        var goal, value;
        goal = (json.data[0].goals.steps) /1000;
        value = (json.data[0].summary.steps) / 1000;
        var stepsdata = {"title":"Steps taken","subtitle":"count in thousands","ranges":[goal*0.35,goal*0.65,goal*0.85],"measures":[Math.min(value, goal)],"markers":[goal],"valuetxt":value};
        amplify.publish('update_bullet_chart', 
          { 'id':'steps', 'chart': stepsdata}
        );
        goal = (json.data[0].goals.floors);
        value = (json.data[0].summary.floors);
        var floorsdata = {"title":"Floors climbed","subtitle":"count","ranges":[goal*0.35,goal*0.65,goal*0.85],"measures":[Math.min(value, goal)],"markers":[goal],"valuetxt":value};
        amplify.publish('update_bullet_chart', 
          { 'id':'floors', 'chart': floorsdata}
        );
        goal = (json.data[0].goals.activeScore) / 100;
        value = (json.data[0].summary.activeScore) / 100;
        var activityscoredata = {"title":"Activity score","subtitle":"count in hundreds","ranges":[goal*0.35,goal*0.65,goal*0.85],"measures":[Math.min(value, goal)],"markers":[goal],"valuetxt":value};
        amplify.publish('update_bullet_chart', 
          { 'id':'activityscore', 'chart': activityscoredata}
        );

			} else {
				console.log("No activity goals / summary available on " + daypath, json);
			}
			if(json.data[0].steps != undefined) {
        var mySteps = [];
        for(var i = 1; i < json.data[0].steps.length - 1; i++) {
          if(json.data[0].steps[i-1][1] === 0 && json.data[0].steps[i][1] === 0 && json.data[0].steps[i+1][1] === 0)
            mySteps.push([json.data[0].steps[i][0], null]);
          else
            mySteps.push(json.data[0].steps[i]);
        }
				amplify.publish('new_timeline_dataset',
          {'name':'Steps','type':'spline','pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(mySteps[0][0]),'data':mySteps}
        );
			} else {
				console.log("No detailed activity data available on " + daypath, json);
			}
		});
	};

	_setDate = function(dateString) {
		_currentday = Date.parse(dateString);
		if(_currentday == 'Invalid Date' || _currentday == null)
			_currentday = Date.today();
		_disableNextDayButton();
		_refreshData();
	};

	_disableNextDayButton = function() {
		if(Date.compare(_currentday.clearTime(), _today) > 0) {
			$( "#button-next" ).button( "disable" );
		}	else {
			$( "#button-next" ).button( "enable" );
		}
	};

	_disableLoginDialog = function() {
			$( "#username" ).textinput( "disable" );
			$( "#password" ).textinput( "disable" );
			$( "#login-btn" ).button( "disable" );
	};

	var _today = Date.today();
	_init = function() {
		_currentday = new Date(_today.addDays(-1));
		$("#dateselect").css({"visibility":"visible"});
		$('#datescroller').mobiscroll('setDate', _currentday, true);
		var x = document.getElementById("datetext");
		x.innerHTML = "Analysis for " + _currentday.toDateString() + ".";
		$('#masonry-container').masonry({
      itemSelector: '.masonry-box',
      columnWidth: $('#masonry-container').width() / 36,
      isAnimated: true,
      animationOptions: {
        duration: 400
      }
    });
		bulletChartUI.init();
		weatherUI.init();
		weatherAPI.getWeatherHistory(userData.address, _currentday);
		if(!Date.equals(Date.today(), _currentday.clone().clearTime()))
      weatherAPI.getWeatherHistory(userData.address, _currentday.clone().add(1).days());
		if(userData.beddit) {

//      amplify.publish('new_bullet_chart', 
//        { 'id':'sleep_efficiency', 'chart': {"title":"Sleep efficiency","subtitle":"percent","ranges":[70,80,90],"measures":[0],"markers":[100],"valuetxt":0} }
//      );

     	_getSleepData();
			$("#beddit").css({"visibility":"visible"});
		} 
		else {
			$("#beddit").css({"display":"none"});
		}
		if(userData.fitbit) {
			_getFitbitActivityDataset();
			$("#fitbit").css({"visibility":"visible"});

      amplify.publish('new_bullet_chart', 
        { 'id':'burnedcalories', 'chart': {"title":"Calories burned","subtitle":"count in thousands","ranges":[0.96096,1.6380000000000001,2.0748],"measures":[1.205],"markers":[2.184],"valuetxt":1.205} }
      );			
      amplify.publish('new_bullet_chart', 
        { 'id':'steps', 'chart': {"title":"Steps taken","subtitle":"count in thousands","ranges":[4,6,8],"measures":[0],"markers":[10],"valuetxt":0} }
      );
      amplify.publish('new_bullet_chart', 
        { 'id':'floors', 'chart': {"title":"Floors climbed","subtitle":"count","ranges":[4,6,8],"measures":[0],"markers":[10],"valuetxt":0} }
      );
      amplify.publish('new_bullet_chart', 
        { 'id':'activityscore', 'chart': {"title":"Activity score","subtitle":"count in hundreds","ranges":[4,6,8],"measures":[0],"markers":[10],"valuetxt":0} }
      );

		}
		else {
			$("#fitbit").css({"display":"none"});
		}
		if(userData.withings) {
			_getWeightData();
			$("#withings").css({"visibility":"visible"});
			gaugeUI.init();
		}
		else {
			$("#withings").css({"display":"none"});
		}
		if(userData.fitbit || userData.beddit) {
      var options = {
				'title': 'Wellness timeline', 
				'subtitle': 'Activities, sleeping, etc...', 
				'start': _currentday.clone().clearTime().add({days:-1,hours:-3}),
				'end': _currentday.clone().clearTime().add({days:1,hours:6}),
				'yAxisTitle':'',
				'initSeries': [
					{'type':'line','name':'Heart rate','data': [["2013-03-26T06:20:00", 0], ["2013-03-26T06:25:00", 0], ["2013-03-26T06:30:00", 0]]}
				]
			};
			highchartsUI.init(options);
			highchartsUI.clear();
		}
	};

	_refreshData = function() {
		var x = document.getElementById("datetext");
		x.innerHTML = "Analysis for " + _currentday.toDateString() + ".";
		if(userData.fitbit || userData.beddit) {
      highchartsUI.clear();
		}
		if(userData.beddit) {
     	_getSleepData();
		}

		if(userData.withings) {
			_getWeightData();
		}

		if(userData.fitbit) {
			_getFitbitActivityDataset();
		}

    $("div[id*=weather_variables]").remove();
		weatherAPI.getWeatherHistory(userData.address, _currentday);
		if(!Date.equals(Date.today(), _currentday.clone().clearTime()))
      weatherAPI.getWeatherHistory(userData.address, _currentday.clone().add(1).days());
	};

	var _currentday;

	_prevDay = function() {
		_currentday = _currentday.addDays(-1);
		$('#datescroller').mobiscroll('setDate', _currentday, true);
		_disableNextDayButton();
		_refreshData();
	};

	_nextDay = function() {
		_currentday = _currentday.addDays(1);
		$('#datescroller').mobiscroll('setDate', _currentday, true);
		_disableNextDayButton();
		_refreshData();
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
			var credentials = 'Basic ' + Base64.encode(username + ":" + password);

			// First we check the services available for the user
			var apicall = 'user/services/';
			var myurl = baseurl + apicall;
			$.ajax(
				{
					url: myurl,
		    	type: 'GET',
					datatype: 'json',
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
					var json = $.parseJSON(data);
					if(json.user_info.username) {
            userData.services = json.services_linked;
						if(json.services_linked.indexOf('beddit') != -1) {
	            userData.beddit = true;
						} if(json.services_linked.indexOf('withings') != -1) {
	            userData.withings = true;
						} if(json.services_linked.indexOf('fitbit') != -1) {
	            userData.fitbit = true;
						}
						$("#servicestext").text(" (" + userData.services.toString() + ") ");
						
						// Login successfull
						userData.username = username;
						userData.credentials = credentials;
						if(typeof(json.user_info.city) != undefined) userData.address = json.user_info.city;
						$("#login-msg").text(" Hi " + json.user_info.username + ", login successful.");
						$("#usertext").text(json.user_info.firstName + "'s wellness dashboard");
						$("div.login").hide(1000);
						$( "#password-dialog" ).popup( "close" );
						_disableLoginDialog();

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
  

resizeCanvas = function (id, height){          
  canvas = document.getElementById(id);
  if (canvas.width  < window.innerWidth) {
    canvas.width  = window.innerWidth - 50;
  }
  if(typeof(height) != 'number') {
    canvas.height = canvas.width / 8;
  } else {
    canvas.height = height;
  }
};
