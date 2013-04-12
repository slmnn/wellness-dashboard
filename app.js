var userData = (function(userData) {
	var _data = undefined;
	var _credentials = undefined;
	var _username = undefined;
  var _services = [];
  var _calendars = [];
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
		calendars: _calendars,
		beddit: _beddit,
		withings: _withings,
		fitbit: _fitbit
	}
}());

var gaugeUI = (function(gaugeUI) {
  var _createGauge = function(targetDIVid, options, sourcedata) {
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
  var _setAllToZero = function() {
    $( ".gauge" ).each(function( index ) {
      var gauge = $(this).highcharts();
      var point = gauge.series[0].points[0];
      point.update(0);
    });
  }
  var _init = function() {
		amplify.subscribe('new_gauge', function(d) {
      console.log('new_gauge', d);
			_createGauge(d.targetDIVid, d.options, d.data);
		});
    amplify.subscribe('gauges_to_zero', function(d) {
      _setAllToZero();
		});
  };
  return {
    init: _init
  }
}());

var bulletChartUI = (function(bulletChartUI) {
	var chart, parentDIVID, margin, width, height;
	
	var _init = function() {
		parentDIVID = "#masonry-container";
		var parentwidth = $(parentDIVID).width() / 2;
		var HTML = $('<div id="bullet-chart-wrapper" style="width: '+ parentwidth + 'px" class="masonry-box"></div>');
    var wrapperwidth = $('#bullet-chart-wrapper').width();
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

  var _createBulletChart = function(id, data) {
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
  
  var _updateBulletChart = function(id, data) {
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
  
  var _remove = function(id) {
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
	
	var _arrayMin = function(a) {
    var min = a[0][1];
    for(var i = 0; i < a.length; i++) {
      if(a[i] != null) if(a[i][0] != null) if(a[i][1] < min) min = a[i][1];
    }
    console.log('min',min);
    return min;
	}
	
	var _createSeries = function(data, axisID) {
    var d = Date.parse(data.pointStart)
    var result;
    if(_chart().series.length >= 0) {
      if(_chart().get(data.id + '-axis') == null) {
        _chart().addAxis({
                id: data.id + '-axis',
                min: data.min,
                showEmpty: false,
                title: {
//                    align: 'high',
                    text: data.name + ' ' + data.unit
                },
                //labels: {
                //    formatter: function() {
                //       return this.value + ' ' + data.unit;
                //    }
                    //style: {
                    //   color: '#4572A7'
                    //}
                //},
                opposite: false
            }, true, true);
      }
      result = {
        'name': data.name,
        'type': data.type,
        'data': data.data, //_mapData(data.data),
        'visible': data.visible,
        'yAxis': data.id + '-axis',
        'data.marker.enabled': false,
        'pointStart': Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()),
        'pointInterval': data.pointInterval
      }
    } else {
      result = {
        'name': data.name,
        'type': data.type,
        'data': data.data, //_mapData(data.data),
        'visible': data.visible,
        // 'yAxis': name + '-axis',
        'data.marker.enabled': false,
        'pointStart': Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()),
        'pointInterval': data.pointInterval
      }
    }
		return result;
	};
	
	var _mapData = function(data) {
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
	
	var _clear = function() {
    var chart = $(_container).highcharts();
    if(typeof(chart) == 'object') {
      console.log('Removing highchart', chart.series.length);
      //highchartsUI.chart().destroy();
//      for (var i = 0; i < chart.series.length; i++) {
//        chart.series[i].remove(true); //forces the chart to redraw
//      }
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
	
	var _init = function(options) {
    $(_container).css({"display":"block"});
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
						text: 'Click and drag in the plot area to zoom in'
				},
				xAxis: {
          type: "datetime",    
//          dateTimeLabelFormats: {
//              day: '%H:%M'
//          },
          //tickInterval: 3600 * 1000,
          tickPixelInterval: 50
        },
				yAxis: {
            
						min: 0,
//            id: 'initial-y-axis',
						title: {
								text: _options.yAxisTitle
						},
						labels: {
              enabled: true
            }
				},
				plotOptions: {
            line: {
                showInLegend: false,
                lineWidth: 10,
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
                lineWidth: 3,
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
            scatter: {
                marker: {
                    radius: 6,
                    states: {
                        hover: {
                            enabled: true,
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b>',
                    pointFormat: '{point.key}'
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
						pointFormat:  '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                          '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
						footerFormat: '</table>',
						formatter: function() {
              var p = '<span style="font-size:10px">' + this.points[0].key + '</span><table>';
              // console.log(this);
              for(var i = 0; i < this.points.length; i++) {
                if(this.points[i].series.options.type != 'line')
                  p += '<tr><td style="color:{'+ this.points[i].series.color +'};padding:0">' + this.points[i].series.name + ': </td><td style="padding:0"><b>' + Math.round(this.points[i].point.y * 100)/100 + '</b></td></tr>';
              }
              p += '</table>';
              for(var i = 0; i < this.points.length; i++) {
                if(this.points[i].series.options.type == 'line')
                  p += '</br><b style="color:{'+ this.points[i].series.color +'};padding:0">' + this.points[i].series.name + '</b>';
              }
              return p;
						},
						shared: true,
						useHTML: true
				},
				series: _options.initSeries
		});
	};
	
	var _chart = function() {
		return $(_container).highcharts();
	}

  var _createMilestones = function(milestones) {
    var series = [];
    $.each(milestones, function(i, milestone) {
        var item = Highcharts.extend(milestone, {
            data: [[
                milestone.time,
                milestone.task
            ]],
            type: 'scatter'
        });
        series.push(item);
    });
    return series;
  };

	amplify.subscribe('new_timeline_dataset', function(data) {
		console.log('new_timeline_dataset', data);
		var series = _createSeries(data);
		console.log('new series', series);
		_chart().addSeries(series, false);
		_chart().redraw();
	});
	
  amplify.subscribe('new_timeline_milestone', function(data) {
		console.log('new_timeline_milestone', data);
		var series = _createMilestones(data);
		_chart().addSeries(series[0], false);
		_chart().redraw();
	});

	return {
		init: _init,
		chart: _chart,
    clear: _clear
	}
}());

var ganttUI = (function(ganttUI) {
  var _parentDIV = "gantt";
  var _series, _tasks, _chart;
  var _clearGraph = function() {
    if(typeof(_chart) == 'object') {
      console.log('Removing gantt', _chart.series.length);
      for (var i = 0; i < _chart.series.length; i++) {
        _chart.series[i].remove(true); //forces the chart to redraw
      }
      if(_chart.series.length > 0) {
        while(_chart.series.length > 0) {
          _chart.series[0].remove(true); //forces the chart to redraw
        }
        _chart.redraw();
        console.log('Removing gantt complete', _chart.series.length);
      }
      _series = []; 
      _tasks = [];
    }
  };
  var _createGraph = function() {
    // create the chart
    _chart = new Highcharts.Chart({
        chart: {
            renderTo: _parentDIV,
            type: 'line'
        },
        title: {
            text: null
        },
        xAxis: {
            type: 'datetime'
        },
        yAxis: {
            tickInterval: 1,
            labels: {
                formatter: function() {
                    if (_tasks[this.value]) {
                        return _tasks[this.value].name;
                    }
                }
            },
            startOnTick: false,
            endOnTick: false,
            title: {
                text: null
            },
                minPadding: 0.2,
                maxPadding: 0.2
        },
        legend: {
            enabled: false
        },
        tooltip: {
            formatter: function() {
              var label = "";
              if(typeof(this.point.label) != 'undefined') label = this.point.label;
              return '<b>'+ _tasks[this.y].name + '</b><br/>' +
                  Highcharts.dateFormat('%H:%M', this.point.options.from)  +
                  ' - ' + Highcharts.dateFormat('%H:%M', this.point.options.to) + ' ' + label;
            }
        },
        plotOptions: {
            line: {
                lineWidth: 9,
                marker: {
                    enabled: false
                },
                dataLabels: {
                    enabled: true,
                    align: 'left',
                    formatter: function() {
                        return this.point.options && this.point.options.label;
                    }
                }
            }
        },
        series: _series
    });
  };
  var _createSeries = function(tasks) {
    // re-structure the tasks into line seriesvar series = [];
    var series = [];
    var offset = 0;
    if(typeof(_chart) != 'undefined')
      offset = _chart.series.length;
    console.log("offset", offset);
    $.each(tasks, function(i, task) {
        var item = {
            name: task.name,
            data: []
        };
        $.each(task.intervals, function(j, interval) {
            item.data.push({
                x: interval.from,
                y: i + offset,
                label: interval.label,
                from: interval.from,
                to: interval.to
            }, {
                x: interval.to,
                y: i + offset,
                from: interval.from,
                to: interval.to
            });
            
            // add a null value between intervals
            if (task.intervals[j + 1]) {
                item.data.push(
                    [(interval.to + task.intervals[j + 1].from) / 2, null]
                );
            }
        });
        series.push(item); 
    });
    return series;
  };
  var _appendToSeries = function(task) {
    _tasks = _tasks.concat(task);
    var newItem = _createSeries(task);
    _series = _series.concat(newItem);
    for(var i = 0; i < newItem.length; i++) {
      _chart.addSeries(newItem[i], false);
      _chart.redraw();
		}
  }
  var _init = function() {
    amplify.subscribe('new_gantt_chart', function(data) {
      console.log("new_gantt_chart", data);
      if(typeof(_chart) == 'undefined') {
        $('#' + _parentDIV).css({"display":"block"});
        _tasks = data.tasks;
        _series = _createSeries(data.tasks);
        _createGraph();
        // var milestones = _createMilestones(data.milestones);
      } else {
        _appendToSeries(data.tasks);
      }
    });
  };
  return {
    init: _init,
    clear: _clearGraph
  }
}());

var bulletSparkUI = (function(weatherUI) {
	var _init = function() {
    var HTML = $('<div class="masonry-box activity_variables"><b>Activity variables</b></br><table id="activity_variables"></table></div>');
    $("#masonry-container").append(HTML).masonry('appended', HTML);
		amplify.subscribe('bullet_chart', function(data) {
      console.log('update_bullet_chart spark', data.id, data.chart);
      $('#activity_table_row_' + data.id).remove();
			var HTML = $(
        '<tr id="activity_table_row_' + data.id + '"><td class="activity_name">' + data.chart.title + '</td>'+
        '<td class="activity_value">' + data.chart.valuetxt + ' ' + data.chart.subtitle + '</td>'+
        '<td><span id="activity_sparkline_' + data.id + '"></span></td></tr>'
      );
			$('#activity_variables').append(HTML);
			// Goal, value, target1, target2, target3
      $('#activity_sparkline_' + data.id).sparkline([data.chart.markers[0], data.chart.measures[0], data.chart.ranges[2], data.chart.ranges[1], data.chart.ranges[0]], {type: 'bullet', width:'100px'});
      $('#masonry-container').masonry( 'reload' );
		});
	};
	return {
		init: _init
	}
}());

var weatherUI = (function(weatherUI) {
	var _init = function() {
		amplify.subscribe('weather_history', function(data) {
			var summary = data.history.dailysummary[0];
			console.log('Weather data for ' + summary.date.pretty, summary);
			var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			var weekday = weekdays[Date.parse(data.history.date.pretty).getDay()];
			if($("#weather_variables-container").length == 0) {
        var HTML = $('<div class="masonry-box weather_variables" id="weather_variables-container"></div>');
        $("#masonry-container").append(HTML).masonry('appended', HTML);
			}
			var HTML = $('<div id="weather_variables_'+ weekday +'"><b>Weather conditions (' + weekday + ')</b></br>' +
        '<table><tr><td class="weatherdata_name">Temperature</td><td class="weatherdata_value">' + summary.meantempm + ' C</td><td><span id="temperature_sparkline_' + weekday + '"></span></td></tr>' +
        '<tr><td class="weatherdata_name">Dew P.T.</td><td class="weatherdata_value">' + summary.meandewptm + ' C</td><td><span id="dewptm_sparkline_' + weekday + '"></span></td></tr>' + 
        '<tr><td class="weatherdata_name">Pressure</td><td class="weatherdata_value">' + summary.meanpressurem + ' hPa</td><td><span id="pressure_sparkline_' + weekday + '"></span></td></tr>' + 
        '<tr><td class="weatherdata_name">Humidity</td><td class="weatherdata_value">' + summary.humidity + ' %</td><td><span id="humidity_sparkline_' + weekday + '"></span></td></tr></table>' +
        '</div>');
			$("#weather_variables-container").append(HTML);
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

var calendarUI = (function(calendarUI) {
  var _clear = function() {
    $('.calendar_events').remove();
  }
	var _init = function() {
		amplify.subscribe('calendar_events', function(data) {
      var events = data.events;
      var etag = data.events.etag.replace(/"/g, 'A');
      etag = etag.replace(/\//g, 'ForwardSlash');
			console.log('Calendar data for ' + data.date, events);
			var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
			var weekday = weekdays[Date.parse(data.date).getDay()];
      var SUMMARY_MAX_LENGTH = 15;
      var summary = events.summary;
      if(summary.length > SUMMARY_MAX_LENGTH) {
        var summary = events.summary.substring(0,SUMMARY_MAX_LENGTH) + '...';
      }
      if($(".calendar_events-container").length == 0) {
        var HTML = $('<div class="masonry-box calendar_events-container" id="calendar_events-container"></div>');
        $("#masonry-container").append(HTML).masonry('appended', HTML);
      }
			var HTML = $('<div class="calendar_events" id="calendar_events_'+ etag +'">' + 
        '<b>Calendar: ' + summary + ' (' + weekday + ')</b></br>' +        
        '<table id="calendar_events_'+ etag +'_table">'+
        '</table>' +
        '</div>');
      $("#calendar_events-container").append(HTML);
      if(typeof(events.items) != 'undefined') {
        var result = [];
        for(var i = 0; i < events.items.length; i++) {
          if(typeof(events.items[i].start) != 'undefined' && typeof(events.items[i].start) != 'undefined') {
            console.log(i);
            var start, startstr, end, endstr, duration;
            if(typeof(events.items[i].start.dateTime) != 'undefined' && typeof(events.items[i].start.dateTime) != 'undefined') {
              start = Date.parse(events.items[i].start.dateTime);
              startstr = start.toString("HH:mm") + ' - ';
              end = Date.parse(events.items[i].end.dateTime); 
              endstr = end.toString("HH:mm");
              duration = end.getTime() - start.getTime();
            } else {
              startstr = 'All day';
              endstr = "";
            }
            var SUMMARY_MAX_LENGTH = 25 ;
            var eventSummary = events.items[i].summary;
            if(eventSummary.length > SUMMARY_MAX_LENGTH) {
              var eventSummary = events.items[i].summary.substring(0,SUMMARY_MAX_LENGTH) + '...';
            }
            var HTML = $(
              '<tr><td class="cal_start">' + startstr +'</td>'+
              '<td class="cal_end">' + endstr + '</td>' + 
              '<td class="cal_summary">' + eventSummary + '</td></tr>'
            );
            $('#calendar_events_' + etag + '_table').append(HTML);
            // Show only non requrring items
            if(duration != undefined && events.items[i].sequence == 0) {
              // Adding items to timeline
              //amplify.publish('new_timeline_dataset',
              //  {
              //    'name':'Cal. event ' + eventSummary,
              //    'pointInterval': duration, 
              //    'pointStart': start,
              //    'data':[
              //      [start.toString('yyyy-MM-ddTHH:mm:ss'), -50],
              //      [end.toString('yyyy-MM-ddTHH:mm:ss'),   -50]
              //     ],
              //    'type':'line'
              //  }
              //);
              result.push(
                {
                  from: start.getTime() - (start.getTimezoneOffset() * 60000), // time in UTC
                  to: end.getTime() - (end.getTimezoneOffset() * 60000),
                  label: eventSummary
                }
              );
            }
          }
        }
        var data = {
          id: 'calendar_events' + etag,
          tasks: [
            {
              name: 'Cal. ' + summary.substring(0,10) + '...',
              intervals: result
            }
          ]
        };
        amplify.publish('new_gantt_chart', data);        
      } else {
        var HTML = $(
          '<tr><td class="cal_empty">No events today!</td></tr>'
        );
        $('#calendar_events_' + etag + '_table').append(HTML);
      }
      $('#masonry-container').masonry( 'reload' );
		});
	};
	return {
		init: _init,
		clear: _clear
	}
}());

var weatherAPI = (function(weatherAPI) {
	var baseurl = 'http://ec2-54-247-149-187.eu-west-1.compute.amazonaws.com:8080/';
	var _weatherHistoryCB = function(data) {
		amplify.publish('weather_history', data);
	};
	var _getWeatherHistory = function(address, date) {
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
	var _sleepCB = function(data) {
    $('.sleep_variables').remove();
		var json = $.parseJSON(data);
    // Sleep phases
    var rem = [];
    var deep = [];
    var light = [];
    var wake = [];
    var fitbit_reallywake = [];
    var fitbit_awake = [];
    var fitbit_sleep = [];
    var noise = [];
    var luminosity = [];
    var actigram = [];
    var pulse = [];
    var start; 
    var end;
		for(var i = 0; i < json.data.length; i++) {
      if(typeof(json.data[i].common) != 'undefined'){
         if($('#sleep_variables-container').length == 0) {
          var HTML = $('<div class="masonry-box sleep_variables" id="sleep_variables-container"></div>');
          $('#masonry-container').append(HTML).masonry('appended', HTML);
        }
        var common = json.data[i].common;
        if(common.source == null) continue;
        var daynumber = Date.parse(common.date).getDay();       
        $('.sleep_variables').width(((i + 1) * $('.sleep_variables').width()) + 'px');
        $('#sleep_variables-container').append(
          '<div style="display: inline-block; float: left;" class="sleep_variables-' + i + '">' +
          '<table style="display: inline-block;" class="sleepdata_table" id="sleepdata_table_' + i + '">' +
          '<caption><b>Sleep variables (' + weekdays[daynumber] + ')</b></caption>' +
          '<tr><td class="sleepdata_name">Sleep efficiency</td><td class="sleepdata_value">' + Math.round(common.efficiency * 100) / 100 + '</td><td class="sleepdata_unit">%</td><!--<td class="sleepdata_sparkline"><span id="sleep_efficiency_sparkline_' + i + '">Loading..</span>--></td></tr>' +
          '<tr><td class="sleepdata_name">Total sleep time</td><td class="sleepdata_value">' + secondsToString(common.minutesAsleep * 60) + '</td><td class="sleepdata_unit"></td><td class="sleepdata_sparkline"><span id="sleep_time_sleeping_sparkline_' + i + '">Loading..</span></td></tr>' +
          '<tr><td class="sleepdata_name">Time awake in bed</td><td class="sleepdata_value">' + secondsToString(common.minutesAwake * 60) + '</td><td class="sleepdata_unit"></td></tr>' +
          '<tr><td class="sleepdata_name">Time to fall asleep</td><td class="sleepdata_value">' + secondsToString(common.minutesToFallAsleep) + '</td><td class="sleepdata_unit"></td></tr>' +
          '<tr><td class="sleepdata_name">Awakenings count</td><td class="sleepdata_value">' + common.awakeningsCount + '</td><td class="sleepdata_unit">times</td><!--<td class="sleepdata_sparkline"><span id="sleep_stress_sparkline_' + i + '">Loading..</span></td>--></tr>' +
          '</table></div>'
        );
        $('#sleep_time_sleeping_sparkline_' + i).sparkline([[ Math.round(common.minutesAsleep / 60 * 100) / 100],[Math.round(common.minutesAwake / 60 * 100) / 100]], {'type': 'pie', 'width':'10px'});
        
      }
      
      
      if(json.data[i].fitbit != null) {
        var fitbit = json.data[i].fitbit;
        var stageDur = 0;
        var d1, d2;
        for(j = 0; j < fitbit.minuteData.length; j++) {
          if(j == 0) {
            stageDur += 5;
            d1 = Date.parse(fitbit.minuteData[j][0]);
            continue;
          }
          if( fitbit.minuteData[j][1] !=  fitbit.minuteData[j-1][1]) {
            if( fitbit.minuteData[j-1][1] == '1') {
              fitbit_sleep.push({
                  from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                  to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                  label: ''
              });
            }
            if( fitbit.minuteData[j-1][1] == '2') {
              fitbit_awake.push({
                  from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                  to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                  label: ''
              });
            }
            if( fitbit.minuteData[j-1][1] == '3') {
              fitbit_reallywake.push({
                  from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                  to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                  label: ''
              });
            }
            stageDur = 5;
            d1 = Date.parse( fitbit.minuteData[j][0]);
          } else {
            stageDur += 5;
          }
          // Implement parseStages function that gives an array of intervals
        }
      }
      
      
      if(json.data[i].beddit != null) {
        var beddit = json.data[i].beddit;
        if(beddit.analysis_valid == false) {
          console.log('Invalid Beddit analysis on ' + _currentday.toDateString(), beddit);
          continue;
        } else {
          console.log('Valid Beddit analysis available on ' + beddit.date, beddit);

        }
        var j = 0;
        var stageDur = 0;
        var d1, d2;
        for(j = 0; j < beddit.sleep_stages.length; j++) {
          if(j == 0) {
            stageDur += 5;
            d1 = Date.parse(beddit.sleep_stages[j][0]);
            continue;
          }
          if(beddit.sleep_stages[j][1] != beddit.sleep_stages[j-1][1]) {
            if(beddit.sleep_stages[j-1][1] == 'D') {
              deep.push({
                  from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                  to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                  label: ''
              });
            }
            if(beddit.sleep_stages[j-1][1] == 'R') {
              rem.push({
                  from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                  to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                  label: ''
              });
            }
            if(beddit.sleep_stages[j-1][1] == 'L') {
              light.push({
                  from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                  to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                  label: ''
              });
            }
            if(beddit.sleep_stages[j-1][1] == 'W') {
              wake.push({
                  from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()),
                  to: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes() + stageDur),
                  label: ''
              });
            }
            stageDur = 5;
            d1 = Date.parse(beddit.sleep_stages[j][0]);
          } else {
            stageDur += 5;
          }
          // Implement parseStages function that gives an array of intervals
        } 						
        $('#sleepdata_table_' + i).append(
          '<tr><td class="sleepdata_name">Deep sleep time</td><td class="sleepdata_value">' + secondsToString(beddit.time_deep_sleep) + '</td><td class="sleepdata_unit"></td><!--<td class="sleepdata_sparkline"><span id="sleep_time_deep_sparkline_' + i + '">Loading..</span></td>--></tr>' +
          '<tr><td class="sleepdata_name">Light sleep time</td><td class="sleepdata_value">' + secondsToString(beddit.time_light_sleep) + '</td><td class="sleepdata_unit"></td><!--<td class="sleepdata_sparkline"><span id="sleep_time_light_sparkline_' + i + '">Loading..</span></td>--></tr>' +
          '<tr><td class="sleepdata_name">Time in bed</td><td class="sleepdata_value">' + secondsToString(beddit.time_in_bed) + '</td><td class="sleepdata_unit"></td><td class="sleepdata_sparkline"><span id="sleep_time_in_bed_sparkline_' + i + '">Loading..</span></td></tr>' +
          '<tr><td class="sleepdata_name">Resting heartrate</td><td class="sleepdata_value">' + Math.round(beddit.resting_heartrate*100)/100 + '</td><td class="sleepdata_unit">bpm</td></tr>' +
          '<tr><td class="sleepdata_name">Stress percent</td><td class="sleepdata_value">' + beddit.stress_percent + '</td><td class="sleepdata_unit">%</td><!--<td class="sleepdata_sparkline"><span id="sleep_stress_sparkline_' + i + '">Loading..</span></td>--></tr>'
        );
      
        $('#sleep_time_sleeping_sparkline_' + i).sparkline([[ Math.round(beddit.time_sleeping/3600 * 100) / 100],[Math.round(beddit.time_deep_sleep/3600 * 100) / 100],[ Math.round(beddit.time_light_sleep/3600 * 100) / 100]], {'type': 'pie', 'width':'10px'});
        $('#sleep_time_in_bed_sparkline_' + i).sparkline([ Math.round(beddit.time_in_bed/3600 * 100) / 100, Math.round((beddit.time_in_bed-beddit.time_sleeping)/3600 * 100) / 100], {'type': 'pie', width:'10px'});	  
        
        if(noise.length > 0) {
          var nightstart = Date.parse(noise[0][0]).getTime();
          var nightend = Date.parse(noise[noise.length - 1][0]).getTime();
          var timezoneoffset = Date.parse(noise[noise.length - 1][0]).getTimezoneOffset();
          var dayDurationMs = Math.abs(nightend - nightstart - (timezoneoffset * 60 * 1000));
          var dur = dayDurationMs / (5*60*1000);
          for(var k = 0; k < dur; k++) {
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
    amplify.publish('new_timeline_dataset',
      {'name':'Actigram','id':'actigram','unit':'','visible':true,'min':0,'pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(actigram[0][0]),'data':actigram,'type':'spline'});
    amplify.publish('new_timeline_dataset',
      {'name':'Pulse','id':'pulse','min':null,'unit':'bpm','visible':true,'pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(pulse[0][0]),'data':pulse,'type':'spline'});
    amplify.publish('new_timeline_dataset',
      {'name':'Noise','id':'noise','min':0,'unit':'dB','visible':false,'pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(noise[0][0]),'data':noise,'type':'area'});
    amplify.publish('new_timeline_dataset',
      {'name':'Luminosity','id':'luminosity','min':0,'visible':false,'unit':'lm','pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(luminosity[0][0]),'data':luminosity,'type':'area'});

    $('#masonry-container').masonry( 'reload' );
		
		var stages = [];
		if(fitbit_reallywake.length > 0) stages.push({name: 'Really wake', intervals: fitbit_reallywake});		
		if(fitbit_awake.length > 0) stages.push({name: 'Movements', intervals: fitbit_awake});		
		if(wake.length > 0) stages.push({name: 'Wake', intervals: wake});
		if(deep.length > 0) stages.push({name: 'Deep Sleep', intervals: deep});
		if(rem.length > 0) stages.push({name: 'REM', intervals: rem});
		if(light.length > 0) stages.push({name: 'Light Sleep', intervals: light});
		if(fitbit_sleep.length > 0) stages.push({name: 'Asleep', intervals: fitbit_sleep});		
		
    var sleepStageData = { 
      id: 'gantt_sleep_stages',
      tasks: stages
    };
    amplify.publish('new_gantt_chart', sleepStageData);    
	};

	var _withingsCB = function(data) {
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

	var _getData = function(apicall, cb) {
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

	var _getWeatherData =	function(date) {
		var daypath = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + (date.getDate());
		_getData('weather/history/' + daypath + '/', function(data) {
      amplify.publish('weather_history', JSON.parse(data));
		});
	};
	
	var _getWeightData = function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('api/unify/measures/' + daypath + '/days/1/', _withingsCB);
	};

	var _getSleepData =	function() {
		// We should get yesterdays and tomorrows data
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('api/unify/sleep/' + daypath + '/days/2/', _sleepCB);
	};

	var _getFitbitSummaryData =	function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('fitbit/api/activities/' + daypath + '/', _fitbitSummaryCB);
	};

	var _getCalendarData = function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		for(var i = 0; i < userData.calendars.length; i++) {
      var url = 'calendar/id/' + userData.calendars[i] + '/events/' + daypath + '/';
      var cacheValue; // = amplify.store(url); // TODO: there is an issue with the cache
      if(typeof(cacheValue) != 'undefined') {
        console.log("Found from local store " + url);
        var json = JSON.parse(cacheValue);
        amplify.publish('calendar_events', {'date': _currentday.toString("yyyy-MM-dd"), 'events': json});
      } else {
        console.log("Requesting from server " + url);
        _getData(url, function(data) {
          var json = JSON.parse(data);
          amplify.store(url, data, { expires: 12*60*(60*1000*Math.random()) });
          amplify.publish('calendar_events', {'date': _currentday.toString("yyyy-MM-dd"), 'events': json});
        });
      }
    }
	};

	var _getFitbitActivityDataset =	function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('api/unify/activities/' + daypath + '/days/1/', function(data) {
			var json = $.parseJSON(data);

			if(json.data[0].activities != undefined) {
				var activityDay = Date.parse(json.data[0].date);
				var year = activityDay.getFullYear();
				var month = activityDay.getMonth();
				var day = activityDay.getDate();
				var result = [];
				for(var i = 0; i < json.data[0].activities.length; i++) {
          var a = json.data[0].activities[i];
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
          var activityTimeStamp = json.data[0].date.split('T')[0] + 'T' + json.data[0].activities[i].startTime;

          //amplify.publish('new_timeline_dataset',
          //  {'name':a.name.substring(0,6) + '...',
          //  'type':'line','lineWidth':0,
          //  'pointInterval': json.data[0].activities[i].duration, 
          //  'pointStart': Date.parse(activityTimeStamp),
          //  'data':[activityTimeStamp, 0],
          //  'text':a.name}
          //); 

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
          amplify.publish('new_gantt_chart', data);
        }
			} else {
				console.log("No activities data available on " + daypath, json);
			}
			if(json.data[0].goals != undefined && json.data[0].summary != undefined) {
        
        goal = (json.data[0].goals.caloriesOut);
        value = (json.data[0].summary.activityCalories);
        var burnedcaloriesdata = {"title":"Calories burned","subtitle":"","ranges":[Math.round(goal*0.44),Math.round(goal*0.75),Math.round(goal*0.95)],"measures":[value],"markers":[goal],"valuetxt":value};
        amplify.publish('bullet_chart', 
          { 'id':'burnedcalories', 'chart': burnedcaloriesdata }
        );
        var goal, value;
        goal = (json.data[0].goals.steps);
        value = (json.data[0].summary.steps);
        var stepsdata = {"title":"Steps taken","subtitle":"","ranges":[Math.round(goal*0.35),Math.round(goal*0.65),Math.round(goal*0.85)],"measures":[value, goal],"markers":[goal],"valuetxt":value};
        amplify.publish('bullet_chart', 
          { 'id':'steps', 'chart': stepsdata}
        );
        goal = (json.data[0].goals.floors);
        value = (json.data[0].summary.floors);
        var floorsdata = {"title":"Floors climbed","subtitle":"","ranges":[Math.round(goal*0.35),Math.round(goal*0.65),Math.round(goal*0.85)],"measures":[value, goal],"markers":[goal],"valuetxt":value};
        amplify.publish('bullet_chart', 
          { 'id':'floors', 'chart': floorsdata}
        );
        goal = (json.data[0].goals.activeScore);
        value = (json.data[0].summary.activeScore);
        var activityscoredata = {"title":"Activity score","subtitle":"","ranges":[Math.round(goal*0.35),Math.round(goal*0.65),Math.round(goal*0.85)],"measures":[value, goal],"markers":[goal],"valuetxt":value};
        amplify.publish('bullet_chart', 
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
          {'name':'Steps','id':'steps','min':0,'unit':'','visible':true,'type':'spline','pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(mySteps[0][0]),'data':mySteps}
        );
			} else {
				console.log("No detailed activity data available on " + daypath, json);
			}
		});
	};

	var _setDate = function(dateString) {
		_currentday = Date.parse(dateString);
		if(_currentday == 'Invalid Date' || _currentday == null)
			_currentday = Date.today();
		_disableNextDayButton();
		_refreshData();
	};

	var _disableNextDayButton = function() {
		if(Date.compare(_currentday.clearTime(), _today) > 0) {
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

	var _today = Date.today();
	var _init = function() {
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
		bulletSparkUI.init();
		weatherUI.init();
		//weatherAPI.getWeatherHistory(userData.address, _currentday);
		//if(!Date.equals(Date.today(), _currentday.clone().clearTime())) {
    //  weatherAPI.getWeatherHistory(userData.address, _currentday.clone().add(1).days());
    //}
		_getWeatherData(_currentday);
		if(!Date.equals(Date.today(), _currentday.clone().clearTime())) {
      _getWeatherData(_currentday.clone().add(1).days());
    }
    if(userData.calendars.length > 0) {
      calendarUI.init();
      _getCalendarData();
    }
		if(userData.beddit) {
     	_getSleepData();
			$("#beddit").css({"visibility":"visible"});
		} 
		else {
			$("#beddit").css({"display":"none"});
		}
		if(userData.fitbit) {
			_getFitbitActivityDataset();
			$("#fitbit").css({"visibility":"visible"});
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
					{'type':'line','name':'Pulse','data': [["2013-03-26T06:20:00", 0], ["2013-03-26T06:25:00", 0], ["2013-03-26T06:30:00", 0]]}
				]
			};
			highchartsUI.init(options);
			highchartsUI.clear();
			ganttUI.init();
		}
	};

	var _refreshData = function() {
		var x = document.getElementById("datetext");
		x.innerHTML = "Analysis for " + _currentday.toDateString() + ".";
		if(userData.fitbit || userData.beddit) {
      highchartsUI.clear();
      ganttUI.clear();
		}
		if(userData.beddit) {
     	_getSleepData();
		}

		if(userData.withings) {
      amplify.publish('gauges_to_zero');
			_getWeightData();
		}

		if(userData.fitbit) {
			_getFitbitActivityDataset();
		}

    if(userData.calendars.length > 0) {
      calendarUI.clear();
      _getCalendarData();
    }

    $("div[id*=weather_variables-container]").remove();
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
	};

	var _nextDay = function() {
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
          if(typeof(data) != 'object')
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
						userData.calendars = json.calendars;
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
