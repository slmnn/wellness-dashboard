var userData = (function(userData) {
	var _data = undefined;
	var _credentials = undefined;
	var _username = undefined;
  var _services = [];
  var _calendars = [];
	var _beddit = false;
	var _withings = false;
	var _fitbit = false;
	var _twitter = false;
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
		fitbit: _fitbit,
		twitter: _twitter
	}
}());


var gaugeUI = (function(gaugeUI) {
  var _createGauge = function(targetDIVid, options, sourcedata) {
    var gauge = $('#gauge_' + options.id).highcharts();
    if(typeof(gauge) == 'undefined') {
      var HTML = $('<div class="gauge-wrapper"><span class="gaugetext">' + options.name + '</span></br><div id="gauge_' + options.id + '" class="gauge"></div></div>');
      $('#gauge-container').append(HTML);
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
        yAxis: options.yAxis,
        series: options.series
      });
    } else {
      for(var i = 0; i < gauge.series.length; i++) {
        var point = gauge.series[i].points[0];
        point.update(options.series[i].data[0]);
      }
    }
  };
  var _setAllToZero = function() {
    $( ".gauge" ).each(function( index ) {
      var gauge = $(this).highcharts();
      for(var i = 0; i < gauge.series.length; i++) {
        var point = gauge.series[i].points[0];
        point.update(0);
      }
    });
  }
  var _init = function() {
    var targetDivID = tabUI.newTab('Measures');
    var HTML = $('<div id="gauge-container"></div>');
    $('#' + targetDivID).append(HTML);
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

commonTooltipUI = (function(commonTooltipUI) {
	var charts = [];
	var _setupTooltips = function (container) {
    if(charts.indexOf(container) != -1) return;
    charts.push($(container).highcharts());
    $(charts).each(function(i, el){
        $(el.container).mouseleave(function(){
            for(i=0; i < charts.length; i++) {
              charts[i].tooltip.hide();
            }        
        });
    });
	};
  _syncTooltip = function (container, p) {
    var i=0, j=0, k=0, data;
    for(i=0; i < charts.length; i++) {
      if(container.id != charts[i].container.id){
        for(k=0; k < charts[i].series.length; k++) {
          data = charts[i].series[k].data;
          for(j=0; j<data.length; j++) {
            if (data[j].x === p) {

              charts[i].tooltip.refresh( charts[i].series[k].data[j] );
              // charts[i].series[k].tooltipOptions.formatter = formatter;
              return;
            }
          }
        }
        charts[i].tooltip.hide();
      } else {
        for(k=0; k < charts[i].series.length; k++) {
          data = charts[i].series[k].data;
          for(j=0; j<data.length; j++) {
            if (data[j].x === p) {
              charts[i].tooltip.refresh( charts[i].series[k].data[j] );
            }
          }
        }
      }
    }
  };
  return {
    setupTooltips: _setupTooltips,
    syncTooltip: _syncTooltip
  };

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
        'pointInterval': data.pointInterval,
        'point': {
          'events': {
            'mouseOver': function(){
              commonTooltipUI.syncTooltip(this.series.chart.container, this.x);
            }
          } 
        }
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
        'pointInterval': data.pointInterval,
        point: {
          events: {
            mouseOver: function(){
              commonTooltipUI.syncTooltip(this.series.chart.container, this.x);
            }
          } 
        }
      }
    };
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
						width: $(window).width()-40,
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
						formatter: _tooltipFormatter,
						crosshairs: {
                width: 2,
                color: 'gray',
                dashStyle: 'shortdot'
            },
			//			shared: true,
						useHTML: true
				},
				series: _options.initSeries
		});
		commonTooltipUI.setupTooltips(_container);
	};
	
	var _tooltipFormatter = function() {
              var p = '<span style="font-size:10px">' + this.key + '</span><table>';
              // console.log(this);
              for(var i = 0; i < this.series.chart.series.length; i++) {
                if(this.series.chart.series[i].options.type != 'line') {
                  if(this.series.chart.series[i].visible === false) continue;
                  var index = -1;
                  for(var j = 0; j < this.series.chart.series[i].points.length; j++) {
                    if(this.series.chart.series[i].points[j].x === this.point.x) index = j;
                  }
                  if(index !== -1) {
                    p += '<tr><td style="color:{'+ this.series.chart.series[i].color +'};padding:0">' + 
                      this.series.chart.series[i].name + ': </td><td style="padding:0"><b>' + 
                      Math.round(this.series.chart.series[i].points[index].y * 100) / 100 + '</b></td></tr>';
                  }
                }
              }
              p += '</table>';
              //for(var i = 0; i < this.series.points.length; i++) {
                if(this.series.options.type == 'line')
                  p += '</br><b style="color:{'+ this.series.color +'};padding:0">' + this.series.name + '</b>';
             // }
              return p;
						}
	
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
            width: $(window).width()-40,
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
            useHTML: true,
            formatter: function() {
              var label = "";
              if(typeof(this.point.label) != 'undefined') {
                label = this.point.label;
              }
              var result = "<table>";
              var allSeries = this.series.chart.series.reverse();
              for(var i = 0; i < allSeries.length; i++) {
                for(var k = 0; k < allSeries[i].points.length; k++) {
                  if(allSeries[i].points[k].options.from <= this.x && allSeries[i].points[k].options.to >= this.x && allSeries[i].points[k].y !== null) {
                    result += '<tr><td><b>'+ allSeries[i].name + '</b></td><td>' +
                      Highcharts.dateFormat('%H:%M', allSeries[i].points[k].options.from)  +
                      ' - ' + Highcharts.dateFormat('%H:%M', allSeries[i].points[k].options.to) + '</td>';
                    if(this.series._i === allSeries[i]._i)
                      result += '<td>' + label + '</td></tr>';
                    else 
                      result += '<td></td></tr>';
                    break;
                  }
                } 
              }
              result += '</table>';
              return result;
            },
            crosshairs: {
                width: 2,
                color: 'gray',
                dashStyle: 'shortdot'
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
    commonTooltipUI.setupTooltips('#' + _parentDIV);
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
            data: [],
            point: {
              events: {
                mouseOver: function(){
                  commonTooltipUI.syncTooltip(this.series.chart.container, this.x);
                }
              }
            } 
        };
        $.each(task.intervals, function(j, interval) {
            item.data.push({
                x: interval.from,
                y: i + offset,
                label: interval.label,
                from: interval.from,
                to: interval.to
            });
            
            // add some stuff between start and end
            var step = 5 * 60 * 1000; // 5 minutes
            var pointtime = interval.from + step;
            while(pointtime < interval.to) {
              item.data.push({
                x: pointtime,
                y: i + offset,
                from: interval.from,
                to: interval.to
              });
              pointtime += step;
            }
            
            item.data.push({
                x: interval.to,
                y: i + offset,
                from: interval.from,
                to: interval.to
            });            
            
            // add a null value between intervals
            if (task.intervals[j + 1]) {
              pointtime = interval.to + step;
              while(pointtime < task.intervals[j + 1].from) {
                item.data.push(
                    [pointtime, null]
                );
                pointtime += step;
              }
            } else {
              //item.data.push(
              //    [interval.to + step, null]
              //);
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
      _chart.addSeries(newItem[i], true);
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

var bulletSparkUI = (function(bulletSparkUI) {
	var _init = function() {
    if($(".activity_variables").length == 0) {
      var targetDivID = tabUI.newTab('Activities');
      var HTML = $('<div class="activity_variables">'+
        '<div id="activity_variables" class="table-wrapper"><b>Activity variables</b><br/><table id="activity_variables_table"></table></div>'+
        '</div>');
      $('#' + targetDivID).append(HTML);
    }
		amplify.subscribe('bullet_chart', function(data) {
      console.log('update_bullet_chart spark', data.id, data.chart);
      $('#activity_table_row_' + data.id).remove();
			var HTML = $(
        '<tr id="activity_table_row_' + data.id + '"><td class="activity_name">' + data.chart.title + '</td>'+
        '<td class="activity_value">' + data.chart.valuetxt + ' ' + data.chart.subtitle + '</td>'+
        '<td><span id="activity_sparkline_' + data.id + '">&nbsp;</span></td></tr>'
      );
			$('#activity_variables_table').append(HTML);
			// Goal, value, target1, target2, target3
      $('#activity_sparkline_' + data.id).sparkline([data.chart.markers[0], data.chart.measures[0], data.chart.ranges[2], data.chart.ranges[1], data.chart.ranges[0]], {type: 'bullet', width:'100px'});
		});
		amplify.subscribe('activity_piechart', function(data) {
      $('#activity_piechart_' + data.id).remove();
			var HTML = $(
        '<div id="activity_piechart_' + data.id + '" class="activity_piechart table-wrapper"><b>' + data.title + '</b><br />'+
        '<table id="activity_piechart_table_' + data.id + '" class="activity_piechart_table"></table>' +
        '</div>'
      );
			$('.activity_variables').append(HTML);
			HTML = "";
			for(var i = 0; i < data.chart.length; i++) {
        if(i == 0) HTML += '<tr><td rowspan="' + data.chart.length + '"><span id="activity_sparkline_pie_' + data.id + '">&nbsp;</span></td><td style="text-align: left;">' + data.names[i] + '</td><td style="text-align: right; font-weight:bold;">' + data.formatter(data.chart[i]) + '</td><td>' + data.unit + '</td></tr>';
        else HTML += '<tr><td style="text-align: left;">' + data.names[i] + '</td><td style="text-align: right; font-weight:bold;">' + data.formatter(data.chart[i]) + '</td><td>' + data.unit + '</td></tr>';
			}
			$('#activity_piechart_table_' + data.id).append(HTML);
      $('#activity_sparkline_pie_' + data.id).sparkline(data.chart, {type: 'pie', width:'50px', height: '50px', tooltipFormat: '<span style="color: {{color}}">&#9679;</span> {{offset:names}} ({{percent.1}}%)',
        'tooltipValueLookups': {
            'names': data.names
        }});
		});
	};
	return {
		init: _init
	}
}());

var analysisUI = (function(analysisUI) {
  var _init = function() {
    $("#analysis-container").remove();
    amplify.subscribe('analysis_available', function(d) {
      if($('#analysis_available_' + d.type).length == 0) {
        $("#analysis-container").append('<div id="analysis_available_' + d.type + '"><b>' + d.type + '</b><br /><table id="analysis_available_table_' + d.type + '" style="width: 90%"></table></div>');
      }
      var HTML = '<tr><td style="align: left;">' + d.name + '</td><td style="align: right;"><b>' + d.value + '</b></td><td style="align: right;">' + d.date + '</td></tr>';
      $("#analysis_available_table_" + d.type).append(HTML);
    });
    amplify.subscribe('analysis_possible', function(d) {
      if($('#analysis_possible_' + d.type).length == 0) {
        var HTML = '<div id="analysis_possible_' + d.id + '" style="margin-bottom: 10px; margin-top: 6px;"><b>Possible Analysis</b></br></div>';
        $("#analysis-container").append(HTML);
      }
      $("#analysis_possible_" + d.id).append(
        '<a href="#" data-rel="dialog" onClick="runtimePopup(\''+ d.path +'\', function() {  } );">' + d.message + '</a><br/>'
      );
    });
    if($("#analysis-container").length == 0) {
      var HTML = $('<div class="analysis-container table-wrapper" id="analysis-container"><b>Wellness Analysis</b></div>');
      var targetDivID = tabUI.newTab('Analysis');
      $('#' + targetDivID).append(HTML);
    }
  }
  var _clear = function() {
    $("#analysis-container").empty();
  }
  return {
    init: _init,
    clear: _clear
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
        var targetDivID = tabUI.newTab('Weather');
        var HTML = $('<div class="weather_variables-container" id="weather_variables-container"></div>');
        $('#' + targetDivID).append(HTML);
			}
			var HTML = $('<div id="weather_variables_'+ weekday +'" class="weather_variables table-wrapper"><b>Weather conditions (' + weekday + ')</b></br>' +
        '<table><tr><td class="weatherdata_name">Temperature</td><td class="weatherdata_value">' + summary.meantempm + ' C</td><td><span id="temperature_sparkline_' + weekday + '">&nbsp;</span></td></tr>' +
        '<tr><td class="weatherdata_name">Dew P.T.</td><td class="weatherdata_value">' + summary.meandewptm + ' C</td><td><span id="dewptm_sparkline_' + weekday + '">&nbsp;</span></td></tr>' + 
        '<tr><td class="weatherdata_name">Pressure</td><td class="weatherdata_value">' + summary.meanpressurem + ' hPa</td><td><span id="pressure_sparkline_' + weekday + '">&nbsp;</span></td></tr>' + 
        '<tr><td class="weatherdata_name">Humidity</td><td class="weatherdata_value">' + summary.humidity + ' %</td><td><span id="humidity_sparkline_' + weekday + '">&nbsp;</span></td></tr></table>' +
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
		});
	};
	return {
		init: _init
	}
}());

var twitterUI = (function(twitterUI) {
	var _init = function() {
		amplify.subscribe('tweets_available', function(data) {

			if($("#some_variables-container").length == 0) {
        var targetDivID = tabUI.newTab('Twitter');
        var HTML = $('<div class="some_variables-container" id="some_variables-container"></div>');
        $('#' + targetDivID).append(HTML);
			}
			if(data.length > 0) {
        console.log('Twitter data for ' + data[0].created_at);
        var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var weekday = weekdays[Date.parse(data[0].created_at).getDay()];			
        var HTML = $('<div id="twitter_variables_'+ weekday +'" class="twitter_variables table-wrapper"><b>Tweets (' + weekday + ')</b></br>' +
          '<table id="twitter_variables_table"></table>' +
          '</div>');
        $("#some_variables-container").append(HTML);
        for(var i = 0; i < data.length; i++) {
          var date = Date.parse(data[i].created_at);
          var time = date.toString('HH:mm')
          var text = processTweetLinks(data[i].text)
          var HTML = $('<tr><td class="twitterdata"><b>' + time + '</b></td><td class="twitterdata">' + text + '</td></tr>');
          $("#twitter_variables_table").append(HTML);
        }
      }
      else {
        var HTML = $('<div class="twitter_variables table-wrapper"><p><b>No tweets for today!</b></p></div>');
        $("#some_variables-container").append(HTML);
      }
		});
	};
	return {
		init: _init,
		clear: function() {
      $('#some_variables-container').remove();
		}
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
        var targetDivID = tabUI.newTab('Calendar');
        var HTML = $('<div class="calendar_events-container" id="calendar_events-container"></div>');
        $('#' + targetDivID).append(HTML);
      }
			var HTML = $('<div class="calendar_events table-wrapper" id="calendar_events_'+ etag +'">' + 
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
            if(duration != undefined) {
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
        console.log('Before sort', result);
        result.sort(function(a,b) {
          return a.from - b.from;
        });
        console.log('After sort', result);
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
		});
	};
	return {
		init: _init,
		clear: _clear
	}
}());

var tabUI = (function(tabUI) {
  var _tabs = [];
  return {
    newTab: function(title) {
      // Event binding
      $('a[data-toggle="tab"]').on('shown', function (e) {
        e.target // activated tab
        e.relatedTarget // previous tab
        $.sparkline_display_visible();
      })
    
      // See if tab already exists
      if($('#tab-content-' + title).length > 0)
        return 'tab-content-' + title;
      
      // First we create the tab
      var liActive = '';
      var divActive = '';
      if(_tabs.length == 0) { 
        liActive = ' class="active"'; 
        divActive = ' active';
      }
      var HTML = '<li' + liActive + '><a data-toggle="tab" href="#tab-content-' + title + '">' + title + '</a></li>';
      $('.nav-tabs').append(HTML);
      
      // Then we create the contents div
      var HTML = '<div class="tab-pane ' + divActive + '" id="tab-content-' + title + '"></div>';
      $('.tab-content').append(HTML);
      
      // Returning content div id
      _tabs.push('tab-content-' + title);
      return 'tab-content-' + title;
    },
    clearTab: function(title) {
      $('#tab-content-' + title).empty();
    }
  };
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

var wellnessAPISingleDay =(function(wellnessAPISingleDay) {
	var baseurl = 'https://wellness.cs.tut.fi/';
  var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	var _sleepCB = function(data) {
    $('.sleep_variables').remove();
    if(typeof(data) != 'object')
      var json = $.parseJSON(data);
    else 
      var json = data;
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
          var targetDivID = tabUI.newTab('Sleep');
          var HTML = $('<div class="sleep_variables-container" id="sleep_variables-container"></div>');
          $('#' + targetDivID).append(HTML);
        }
        var common = json.data[i].common;
        if(common == null) continue;
        if(common.source == null) continue;
        var daynumber = Date.parse(common.date).getDay();       
        // $('.sleep_variables').width(((i + 1) * $('.sleep_variables').width()) + 'px');
        $('#sleep_variables-container').append(
          '<div class="sleep_variables table-wrapper" id="sleep_variables-' + i + '">' +
          '<table class="sleepdata_table" id="sleepdata_table_' + i + '">' +
          '<caption><b>Sleep variables (' + weekdays[daynumber] + ')</b></caption>' +
          '<tr><td class="sleepdata_name">Sleep efficiency</td><td class="sleepdata_value">' + Math.round(common.efficiency * 100) / 100 + '</td><td class="sleepdata_unit">%</td><td></td></tr>' +
          '<tr><td class="sleepdata_name">Time in bed</td><td class="sleepdata_value">' + secondsToString((common.minutesAsleep + common.minutesAwake) * 60) + '</td><td class="sleepdata_unit"></td><td class="sleepdata_sparkline"><span id="sleep_time_sleeping_sparkline_' + i + '">&nbsp;</span></td></tr>' +
          '<tr><td class="sleepdata_name">Total sleep time</td><td class="sleepdata_value">' + secondsToString(common.minutesAsleep * 60) + '</td><td class="sleepdata_unit"></td><td class="sleepdata_sparkline"></td></tr>' +
          '<tr><td class="sleepdata_name">Time awake in bed</td><td class="sleepdata_value">' + secondsToString(common.minutesAwake * 60) + '</td><td class="sleepdata_unit"></td><td class="sleepdata_sparkline"></td></tr>' +
          '<tr><td class="sleepdata_name">Time to fall asleep</td><td class="sleepdata_value">' + secondsToString(common.minutesToFallAsleep) + '</td><td class="sleepdata_unit"></td><td class="sleepdata_sparkline"></td></tr>' +
          '<tr><td class="sleepdata_name">Awakenings count</td><td class="sleepdata_value">' + common.awakeningsCount + '</td><td class="sleepdata_unit">times</td><td class="sleepdata_sparkline"></td></tr>' +
          '</table></div>'
        );
        $('#sleep_time_sleeping_sparkline_' + i).sparkline([[ Math.round(common.minutesAsleep / 60 * 100) / 100],[Math.round(common.minutesAwake / 60 * 100) / 100]], {'type': 'pie', 'width':'10px'});
        $.sparkline_display_visible();
      }
      
      if(json.data[i].fitbit != null) {
        var fitbit = json.data[i].fitbit;
        // Push one bogus stage to the end. Parser needs to see change in stage
        // value to make a push to the array.
        fitbit.minuteData.push(['0000-00-00T00:00:00', 'X']);
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
        // Push one bogus stage to the end. Parser needs to see change in stage
        // value to make a push to the array.
        beddit.sleep_stages.push(['0000-00-00T00:00:00', 'X']);
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
          '<tr><td class="sleepdata_name">Deep sleep time</td><td class="sleepdata_value">' + secondsToString(beddit.time_deep_sleep) + '</td><td class="sleepdata_unit"></td><!--<td class="sleepdata_sparkline"><span id="sleep_time_deep_sparkline_' + i + '">&nbsp;</span></td>--></tr>' +
          '<tr><td class="sleepdata_name">Light sleep time</td><td class="sleepdata_value">' + secondsToString(beddit.time_light_sleep) + '</td><td class="sleepdata_unit"></td><!--<td class="sleepdata_sparkline"><span id="sleep_time_light_sparkline_' + i + '">&nbsp;</span></td>--></tr>' +
//          '<tr><td class="sleepdata_name">Time in bed</td><td class="sleepdata_value">' + secondsToString(beddit.time_in_bed) + '</td><td class="sleepdata_unit"></td><td class="sleepdata_sparkline"><span id="sleep_time_in_bed_sparkline_' + i + '">&nbsp;</span></td></tr>' +
          '<tr><td class="sleepdata_name">Resting heartrate</td><td class="sleepdata_value">' + Math.round(beddit.resting_heartrate*100)/100 + '</td><td class="sleepdata_unit">bpm</td></tr>' +
          '<tr><td class="sleepdata_name">Stress percent</td><td class="sleepdata_value">' + beddit.stress_percent + '</td><td class="sleepdata_unit">%</td><!--<td class="sleepdata_sparkline"><span id="sleep_stress_sparkline_' + i + '">&nbsp;</span></td>--></tr>'
        );
      
        $('#sleep_time_sleeping_sparkline_' + i).sparkline([[ Math.round(beddit.time_sleeping/3600 * 100) / 100],[Math.round(beddit.time_deep_sleep/3600 * 100) / 100],[ Math.round(beddit.time_light_sleep/3600 * 100) / 100]], {'type': 'pie', 'width':'10px'});
//        $('#sleep_time_in_bed_sparkline_' + i).sparkline([ Math.round(beddit.time_in_bed/3600 * 100) / 100, Math.round((beddit.time_in_bed-beddit.time_sleeping)/3600 * 100) / 100], {'type': 'pie', width:'10px'});	  
        
        if(noise.length > 0) {
          var nightstart = Date.parse(noise[0][0]).getTime();
          var nightend = Date.parse(noise[noise.length - 1][0]).getTime();
          var dayDurationMs = 24 * 60 * 60 * 1000 - (nightend - nightstart);
          var dur = dayDurationMs / (5*60*1000);
          console.log(Date.parse(noise[0][0]), Date.parse(noise[noise.length - 1][0]), 'Day duration seems to be ' + secondsToString(dur*60*5)); 
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
		
		if(actigram.length > 0) {
    amplify.publish('new_timeline_dataset',
      {'name':'Actigram','id':'actigram','unit':'','visible':true,'min':0,'pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(actigram[0][0]),'data':actigram,'type':'spline'});
    } if(pulse.length > 0) {
    amplify.publish('new_timeline_dataset',
      {'name':'Pulse','id':'pulse','min':null,'unit':'bpm','visible':true,'pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(pulse[0][0]),'data':pulse,'type':'spline'});
    } if(noise.length > 0) {
    amplify.publish('new_timeline_dataset',
      {'name':'Noise','id':'noise','min':0,'unit':'dB','visible':false,'pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(noise[0][0]),'data':noise,'type':'area'});
    } if(luminosity.length > 0) {
    amplify.publish('new_timeline_dataset',
      {'name':'Luminosity','id':'luminosity','min':0,'visible':false,'unit':'lm','pointInterval': 5 * 60 * 1000, 'pointStart': Date.parse(luminosity[0][0]),'data':luminosity,'type':'area'});
    }
		
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
      amplify.publish('new_gantt_chart', sleepStageData);
    }
	};

	var _withingsCB = function(data) {
    if(typeof(data) != 'object')
      var json = $.parseJSON(data);
    else 
      var json = data;
		if(json.data[0].latest.weight != undefined) {
      var value = Math.round(json.data[0].latest.weight.value * 10) / 10;
      var gaugesettings = 
        {'targetDIVid':'#gauge-container',
         'data':{'value':value,'valueSuffix':' kg'}, 
         'options':{
            'id':'weight',
            'name':'Weight','min':0,'max':value*1.4,
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
		}
		else {
			console.log("There is no Withings weight data available", json);
		}
		if(json.data[0].latest.diasPressure != undefined 
      && json.data[0].latest.sysPressure != undefined) {
      value = Math.round(json.data[0].latest.sysPressure.value * 10) / 10;
      var gaugesettings = 
        {'targetDIVid':'#gauge-container',
         'data':{'value':value,'valueSuffix':' mmHg'}, 
         'options':{'id':'sysp','name':'DBP/SBP','min':0,'max':180,
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
              'data': [Math.round(json.data[0].latest.diasPressure.value * 10) / 10],
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
		}
		else {
			console.log("There is no Withings systolic / diastolic pressure available", json);
		}

		if(json.data[0].latest.pulse != undefined) {    
      value = Math.round(json.data[0].latest.pulse.value * 10) / 10;
      var gaugesettings = 
        {'targetDIVid':'#gauge-container',
         'data':{'value':value,'valueSuffix':' bpm'}, 
         'options':{'id':'pulse','name':'Pulse','min':0,'max':160, 
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
      if(typeof(data) != 'object')
        var json = $.parseJSON(data);
      else 
        var json = data;
      amplify.publish('weather_history', json);
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
	
  var _getAnalysisData =	function() {
    analysisUI.clear();
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('api/analysis/' + daypath + '/', function(data) {
      if(typeof(data) != 'object')
        var analysis = $.parseJSON(data);
      else 
        var analysis = data;
      for(var i = 0; i < analysis.required_user_action.length; i++) {
        var act = analysis.required_user_action[i];
        amplify.publish('analysis_possible', {
          'id': act.id,
          'path':'http://wellness.cs.tut.fi' + act.path + '?dashboard=true',
          'message':act.message,
          'type': capitaliseFirstLetter(act.type)
        });
      }
      for(var i = 0; i < analysis.latest.length; i++) {
        var ana = analysis.latest[i];
        if(ana == null) continue;
        amplify.publish('analysis_available', {
          'id': ana.id,
          'type': capitaliseFirstLetter(ana.type),
          'name': capitaliseFirstLetter(ana.name),
          'value': ana.value,
          'date': '(' + Date.parse(ana.date).toString('MM/dd HH:mm') + ')'
        });
      }
		});
	};
	
  var _getTwitterData =	function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('twitter/api/tweets/' + daypath + '/', function(data) {
      if(typeof(data) != 'object')
        var tweets = $.parseJSON(data).data;
      else 
        var tweets = data.data;
      amplify.publish('tweets_available', tweets);
		});
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
		  if(typeof json.error != 'undefined')
          amplify.store(url, data, { expires: 12*60*(60*1000*Math.random()) });
          amplify.publish('calendar_events', {'date': _currentday.toString("yyyy-MM-dd"), 'events': json});
        });
      }
    }
	};

	var _getFitbitActivityDataset =	function() {
		var daypath = _currentday.getFullYear() + '/' + (_currentday.getMonth() + 1) + '/' + (_currentday.getDate());
		_getData('api/unify/activities/' + daypath + '/days/1/', function(data) {
      if(typeof(data) != 'object')
        var json = $.parseJSON(data);
      else 
        var json = data;

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
        
        var d = json.data[0].summary.distances;
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
        
        var s = json.data[0].summary;
        amplify.publish('activity_piechart', 
          { 
            'id':'activityminutes', 
            'chart': [s.veryActiveMinutes, s.fairlyActiveMinutes, s.lightlyActiveMinutes, s.sedentaryMinutes],
            'unit':'',
            'names':{0:'Very active',1:'Moderately active',2:'Lightly active',3:'Sedentary'},
            'title':'Activity times',
            'formatter': function(a) { return secondsToString(a * 60); }
          }
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
			_currentday = new Date(_today.addDays(-1));
    $('#datescroller').mobiscroll('setDate', _currentday, true);
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
	var _init = function(date) {
    console.log('Initializing single day view', date, gup('date'));
    _currentday = Date.parse(gup('date'));
    if(_currentday == null) _currentday = new Date(_today.addDays(-1));
    if(userData.username == 'demo') {
      _currentday = new Date(Date.parse('17.4.2013'));
    }
		$("#dateselect").css({"visibility":"visible"});
		$("#tab-container").css({"visibility":"visible"});
		$('#datescroller').mobiscroll('setDate', _currentday, true);
		var x = document.getElementById("datetext");
		x.innerHTML = "Analysis for " + _currentday.toDateString() + ".";
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
      bulletSparkUI.init();
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
			
			analysisUI.init();
			_getAnalysisData();
			
			if(userData.twitter) {
        twitterUI.init();
        _getTwitterData();
			}
		}
	};

	var _refreshData = function() {
		var x = document.getElementById("datetext");
		x.innerHTML = "Analysis for " + _currentday.toDateString() + ".";
		if(userData.fitbit || userData.beddit) {
      highchartsUI.clear();
      ganttUI.clear();
      _getAnalysisData();
		}
		if(userData.beddit) {
     	_getSleepData();
		}

		if(userData.withings) {
      // amplify.publish('gauges_to_zero');
			_getWeightData();
		}

		if(userData.fitbit) {
			_getFitbitActivityDataset();
		}

    if(userData.calendars.length > 0) {
      calendarUI.clear();
      _getCalendarData();
    }
    
    if(userData.twitter) {
      twitterUI.clear();
      _getTwitterData();
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
		register: function(path, cb) {
      runtimePopup(path, cb);
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
						// Login successfull
						userData.username = username;
						userData.credentials = credentials;
						if(typeof(json.user_info.city) != undefined) userData.address = json.user_info.city;
						$("#login-msg").text(" Hi " + json.user_info.username + ", login successful.");
						$(".headertext").text(json.user_info.firstName + "'s WellMU dashboard");
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

var wellnessAPI =(function(wellnessAPI) {
	var baseurl = 'https://wellness.cs.tut.fi/';
  var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

	var _today = Date.today();
	var _currentday;
	var _chart;
	
	var _daypath = function(date) {
    return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + (date.getDate()) + '/';
	};
	
	var _createSeries = function(container) {
    $(container).highcharts(
    {
      chart: {
        type: 'column',
        width: $(window).width()-40
      },
      title: {
        text: 'Wellness timeline',
      },
      subtitle: {
          text: 'Click a point to see more details'
      },
      plotOptions: {
        series: {
          cursor: 'pointer',
          point: {
            events: {
              click: function() {
                $.mobile.changePage(
                  '#single-day-page?date=' + Highcharts.dateFormat('%Y-%m-%d', this.x), 
                  {transition: 'flip'}
                );
                
                //hs.htmlExpand(null, {
                //  pageOrigin: {
                //    x: this.pageX,
                //    y: this.pageY
                //  },
                //  headingText: Highcharts.dateFormat('%A, %b %e, %Y', this.x),
                //  maincontentText: '<a href="#single-day-page?date=' + Highcharts.dateFormat('%Y-%m-%d', this.x) + 
                //    '" data-params="date=' + Highcharts.dateFormat('%Y-%m-%d', this.x) + 
                //    '" onclick="javascript:parent.window.hs.close(); /*wellnessAPISingleDay.setDate(' + 
                //    Highcharts.dateFormat('%Y-%m-%d', this.x) +') */">See details in single day view</a>',
                //  width: 200
                //});
                
              }
            }
          },
          marker: {
            lineWidth: 1
          }
        }
      },
      xAxis: {
        type: 'datetime'
      },
      yAxis: [
        {
          min: 0,
          id: 'asleep',
          showEmpty: false,
          title: {
            text: 'Min. asleep'
          }
        }
      ],
      tooltip: {
        shared: true,
        useHTML: true,
        formatter: function() {
          var day = new Date(this.x);
          var dayString = day.toString('yyyy-MM-dd');
        	var s = '<b><a href="#single-day-page?date=' + dayString + 
                    '" data-params="date=' + dayString + '" onclick="/*wellnessAPISingleDay.setDate(' + 
                    Highcharts.dateFormat('%Y-%m-%d', this.x) +')/*">' + 
            Highcharts.dateFormat('%A, %b %e, %Y', this.x) + '</a></b><br />';
        	s += '<table>'
          $.each(this.points, function(i, point) {
            s += '<tr><td>' + this.series.name + '</td><td><b>' + point.y + '</b></td></tr>'; 
          });
          s += '</table>';
          return s;
        }
      },
      series: [
        { 
          type: 'line',
          yAxis: 'asleep',
          name: 'Min. asleep',
          data: []
          
        }
      ]
    });
    
    var chart = $(container).highcharts();
    if(typeof(chart) == 'object') {
      if(chart.series.length > 0) {
        while(chart.series.length > 0) {
          chart.series[0].remove(true); //forces the chart to redraw
        }
        chart.redraw();
      }
      if(chart.yAxis.length > 0) {
        while(chart.yAxis.length > 0) {
          chart.yAxis[0].remove(true); //forces the chart to redraw
        }
        chart.redraw();
      }
    }
    return chart;
	};
	
	var _addAxisAndSeries = function(seriesId, seriesName, seriesData, seriesVisible) {
    seriesVisible = typeof seriesVisible !== 'undefined' ? seriesVisible : false;
    _chart.addAxis({
      id: seriesId,
  //    min: 0,
      showEmpty: false,
      title: {
        text: seriesName
      }
    }, true, true);
    _chart.addSeries({
      visible: seriesVisible,
      type: 'line',
      yAxis: seriesId,
      name: seriesName,
      data: seriesData
    }, false);
    $('#select-choice-1').append('<option value="' + seriesName + '">' + seriesName + '</option>');
    $('#select-choice-2').append('<option value="' + seriesName + '">' + seriesName + '</option>');
	}
	
	// Leave two series with exact names to be shown
	var _hideOtherSeries = function(name1, name2) {
    var series1, series2;
    for(var i = 0; i < _chart.series.length; i++) {
      _chart.series[i].hide();
      if(_chart.series[i].name == name1)
        series1 = _chart.series[i];
      if(_chart.series[i].name == name2)
        series2 = _chart.series[i];
    }
    if(typeof(series1) != 'undefined' && typeof(series2) != 'undefined') {
      series1.show();
      series2.show();
      return true;
    }
    return false;
	}
	
	var _period = 7;
	
	// Initialize the application based on available services
	var _init = function() {
    if(userData.username != 'demo') {
      _currentday = new Date(_today.clone().add({days: (_period * -1)}));
    } else {
      _currentday = new Date(Date.parse('15.4.2013'));
    }
		
		// Create something to draw on
    if($('#series-container').length == 0) {
      var targetDivID = 'highcharts';
      var HTML = $('<div id="series-container"></div>');
      $('#' + targetDivID).append(HTML);
    }		
		_chart = _createSeries('#series-container');
		
    _populateChart();
	};
	
	var _setPeriod = function(newPeriod) {
    _period = newPeriod;
    _destroyChart();
    _init();
	}
	
	var _destroyChart = function() {
    _chart.destroy();
    $('#series-container').remove();
    $('#select-choice-1').empty();
    $('#select-choice-2').empty();
    $('#select-choice-1').append('<option value="" selected>- Select -</option>');
    $('#select-choice-2').append('<option value="" selected>- Select -</option>');
    $('#select-choice-1').selectmenu("refresh", true);
    $('#select-choice-2').selectmenu("refresh", true);
	};
	
	var _populateChart = function() {		
    // Sleep
		if(userData.fitbit || userData.beddit) {
      _getData('api/unify/sleep/' + _daypath(_currentday) + 'days/' + _period + '/?omit_fields=fitbit,beddit', function(data) {

        if(typeof(data) != 'object')
          var json = $.parseJSON(data);
        else 
          var json = data;
        
        var series = { 
          minutesAsleep: [], 
          minutesAwake: [],
          minutesToFallAsleep: [], 
          efficiency: [] 
        };
        for(var i = 0; i < json.data.length; i++) {
          var current = json.data[i].common;
          if(typeof(current) == 'undefined' || current == null) continue;
          var day = Date.parse(current.date);
          if(day != null) {
            var utcDay = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
            series.minutesAsleep.push([utcDay, isNaN(current.minutesAsleep) == false ? current.minutesAsleep : null]);
            series.minutesAwake.push([utcDay, isNaN(current.minutesAwake) == false ? current.minutesAwake : null]);
            series.efficiency.push([utcDay, isNaN(current.efficiency) == false ? Math.round(current.efficiency * 100) / 100 : null]);
            series.minutesToFallAsleep.push([utcDay, isNaN(current.minutesToFallAsleep) == false ? current.minutesToFallAsleep : null]);
          }
        }
        if(series.minutesAwake.length > 0)
          _addAxisAndSeries('minutesAwake', 'Min. awake', series.minutesAwake);
        if(series.minutesAsleep.length > 0)
          _addAxisAndSeries('minutesAsleep', 'Min. asleep', series.minutesAsleep);
        if(series.efficiency.length > 0)
          _addAxisAndSeries('efficiency', 'Sleep efficiency', series.efficiency, true);
        if(series.minutesToFallAsleep.length > 0)
          _addAxisAndSeries('minutesToFallAsleep', 'Min. to fall asleep', series.minutesToFallAsleep);
       
        _chart.redraw();
      });
      _getData('api/analysis/sleepeffma/' + _daypath(_currentday) + 'days/' + _period + '/7/', function(data) {
        if(typeof(data) != 'object')
          var json = $.parseJSON(data);
        else 
          var json = data;
        if(typeof json.error != "undefined") {
          console.log(json.error);
          return;
        }
        var result = []
        for( var i = 0; i < json.length; i++ ) {
          var day = Date.parse(json[i][0]);
          var utcDay = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
          result.push([utcDay, json[i][1] != null ? Math.round(json[i][1]*100)/100 : null])
        }
        if(result.length > 0)
          _addAxisAndSeries('sleepeffma', 'Sleep efficiency (Av.)', result);
        _chart.redraw();
      });
      _getData('api/analysis/sleeptimema/' + _daypath(_currentday) + 'days/' + _period + '/7/', function(data) {
        if(typeof(data) != 'object')
          var json = $.parseJSON(data);
        else 
          var json = data;
        if(typeof json.error != "undefined") {
          console.log(json.error);
          return;
        }
        var result = []
        for( var i = 0; i < json.length; i++ ) {
          var day = Date.parse(json[i][0]);
          var utcDay = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
          result.push([utcDay, json[i][1] != null ? Math.round(json[i][1]*100)/100 : null])
        }
        if(result.length > 0)
          _addAxisAndSeries('sleeptimema', 'Sleep time (Av.)', result);
        _chart.redraw();
      });
    }
    
    // Activities
    if(userData.fitbit) {
      _getData('api/unify/activities/' + _daypath(_currentday) + 'days/' + _period + '/', function(data) {
        if(typeof(data) != 'object')
          var json = $.parseJSON(data);
        else 
          var json = data;
        var series = { 
          steps: [], 
          minutesSedentary: [],
          activityCalories: [],
          activeScore: []
        };
        for(var i = 0; i < json.data.length; i++) {
          var current = json.data[i];
          if(current == null) continue;
          if(current.summary == null) continue;
          if(typeof(current.summary) == 'undefined') continue;
          var day = Date.parse(current.date);
          if(day != null) {
            var utcDay = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
            series.steps.push([utcDay, isNaN(current.summary.steps) == false ? current.summary.steps : null]);
            series.minutesSedentary.push([utcDay, isNaN(current.summary.sedentaryMinutes) == false ? current.summary.sedentaryMinutes : null]);
            series.activityCalories.push([utcDay, isNaN(current.summary.activityCalories) == false ? current.summary.activityCalories : null]);
            series.activeScore.push([utcDay, isNaN(current.summary.activeScore) == false ? current.summary.activeScore : null]);
          }
        }
        if(series.steps.length > 0)
          _addAxisAndSeries('steps', 'Steps', series.steps, true);
        if(series.minutesSedentary.length > 0)
          _addAxisAndSeries('minutesSedentary', 'Min. sedentary', series.minutesSedentary);
        if(series.activityCalories.length > 0)
          _addAxisAndSeries('activityCalories', 'Activity calories', series.activityCalories);
        if(series.activeScore.length > 0)
          _addAxisAndSeries('activeScore', 'Active score', series.activeScore);
                
        _chart.redraw();
      });
    }
    
    // Weight, height, blood pressure
    if(userData.withings) {
      _getData('api/unify/measures/' + _daypath(_currentday) + 'days/' + _period + '/', function(data) {
        if(typeof(data) != 'object')
          var json = $.parseJSON(data);
        else 
          var json = data;
        var series = { 
          weight: [], 
          pulse: [],
          diasPressure: [],
          sysPressure: []
        };
        for(var i = 0; i < json.data.length; i++) {
          var current = json.data[i];
          if(typeof(current.latest) == 'undefined') continue;
          if(typeof(current.latest.weight) == 'undefined') continue;
          if(typeof(current.latest.pulse) == 'undefined') continue;
          if(typeof(current.latest.diasPressure) == 'undefined') continue;
          if(typeof(current.latest.sysPressure) == 'undefined') continue;
          var day = Date.parse(current.date);
          if(day != null) {
            var utcDay = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
            series.weight.push([utcDay, isNaN(current.latest.weight.value) == false ? Math.round(current.latest.weight.value * 100) / 100 : null]);
            series.pulse.push([utcDay, isNaN(current.latest.pulse.value) == false ? current.latest.pulse.value : null]);
            series.diasPressure.push([utcDay, isNaN(current.latest.diasPressure.value) == false ? current.latest.diasPressure.value : null]);
            series.sysPressure.push([utcDay, isNaN(current.latest.sysPressure.value) == false ? current.latest.sysPressure.value : null]);
          }
        }
        if(series.weight.length > 0)
          _addAxisAndSeries('weight', 'Weight', series.weight);
        if(series.pulse.length > 0)
          _addAxisAndSeries('pulse', 'Pulse', series.pulse);
        if(series.diasPressure.length > 0)
          _addAxisAndSeries('diasPressure', 'Dias. pressure', series.diasPressure);
        if(series.sysPressure.length > 0)
          _addAxisAndSeries('sysPressure', 'Sys. pressure', series.sysPressure);
                
        _chart.redraw();
      });
    }
    
    // Weather
    if(true) {
      _getData('weather/history/overview/' + _daypath(_currentday) + 'days/' + _period + '/', function(data) {
        if(typeof(data) != 'object')
          var json = $.parseJSON(data);
        else 
          var json = data;
        if(typeof json.error == "undefined") {
          var series = { 
            temperature: [], 
            pressure: [],
            humidity: []
          };
          for(var i = 0; i < json.length; i++) {
            var day = Date.parse(json[i].date);
            if(day != null) {
              var utcDay = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
              series.temperature.push([utcDay, isNaN(parseFloat(json[i].summary[0].meantempm)) == false ? parseFloat(json[i].summary[0].meantempm) : null]);
              series.pressure.push([utcDay, isNaN(parseFloat(json[i].summary[0].meanpressurem)) == false ? parseFloat(json[i].summary[0].meanpressurem) : null]);
              series.humidity.push([utcDay, isNaN(parseFloat(json[i].summary[0].humidity)) == false ? parseFloat(json[i].summary[0].humidity) : null]);
            }
          }
          if(series.humidity.length > 0)
            _addAxisAndSeries('humidity', 'Humidity', series.humidity);
          if(series.pressure.length > 0)
            _addAxisAndSeries('pressure', 'Air Pressure', series.pressure);
          if(series.temperature.length > 0)
            _addAxisAndSeries('temperature', 'Air Temperature', series.temperature);

          _chart.redraw();
        }
      });
    }
	};
  
  // Make login dialog to be unusable
  var _disableLoginDialog = function() {
    $( "#username" ).textinput( "disable" );
    $( "#password" ).textinput( "disable" );
    $( "#login-btn" ).button( "disable" );
  };

  _getUserData = function(username, password) {
    // Create authorization header for queries
    var credentials = 'Basic ' + Base64.encode(username + ":" + password);
    
    // First we check the services available for the user
    // If the call is successfull we consider credentials to be ok
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
            $("#login-msg").text("Sorry, login failed!");
          }
        }
      } 
    ).done(
      function(data) {
        // If the response is not yet parsed, parse it
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
          $(".headertext").text(json.user_info.firstName + "'s WellMU dashboard");
          $("div.login").hide(1000);
          $.mobile.changePage("#multiple-day-page");
          $( ".show-after-init" ).css({"visibility":"visible"});
          _disableLoginDialog();
          _init();
          wellnessAPISingleDay.init();
        } else {
          // Login unsuccessful, does not work as the server fails to respond
          $("#login-msg").text("Sorry, login failed!");
        }
      }
    );
  };

	return {
		init: _init,
		period: _period,
		setPeriod: _setPeriod,
		hideOtherSeries: _hideOtherSeries,
		register: function(path, cb) {
      runtimePopup(path, cb);
		},
		login: function() {
      // Read the username and password. Try to retrieve user basic data.
			var username = $("#username").val();
			var password = $("#password").val();
			if(username.length > 0 && username.length < 20 && password.length > 0) {
				_getUserData(username, password);
			}
		}
	};
	
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

function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function runtimePopup(path, popupafterclose) {
  var maxWidth = window.innerWidth * 0.8;
  var maxHeight = window.innerHeight * 0.8;
  var template = "<div data-role='popup' class='ui-content messagePopup' style='max-width:" + maxWidth + "px;'>" 
      + "<a href='#' data-role='button' data-theme='g' data-icon='delete' data-iconpos='notext' " 
      + " class='ui-btn-right closePopup'>Close</a> <span> " 
      + "<iframe src='" + path + "' style='overflow:hidden; height:" + maxHeight + "; width:" + maxWidth + ";' height='" + maxHeight + "' width='" + maxWidth + "' seamless></iframe></div>";
  
  popupafterclose = popupafterclose ? popupafterclose : function () {};
 
  $.mobile.ajaxEnabled = false;
  $.mobile.activePage.append(template).trigger("create");
 
  $.mobile.activePage.find(".closePopup").bind("tap", function (e) {
    $.mobile.activePage.find(".messagePopup").popup("close");
  });
 
  $.mobile.activePage.find(".messagePopup").popup({ dismissible: false, history: false }).popup("open").bind({
    popupafterclose: function () {
      $(this).unbind("popupafterclose").remove();
      popupafterclose();
      $.mobile.ajaxEnabled = true;
    }
  });
}

function gup( name ){
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");  
  var regexS = "[\\?&]"+name+"=([^&#]*)";  
  var regex = new RegExp( regexS );  
  var results = regex.exec( window.location.href ); 
   if( results == null )    return "";  
  else    return results[1];
}


// jqm.page.params.js - version 0.1
// Copyright (c) 2011, Kin Blas
// All rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the <organization> nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

(function( $, window, undefined ) {

// Given a query string, convert all the name/value pairs
// into a property/value object. If a name appears more than
// once in a query string, the value is automatically turned
// into an array.
function queryStringToObject( qstr )
{
	var result = {},
		nvPairs = ( ( qstr || "" ).replace( /^\?/, "" ).split( /&/ ) ),
		i, pair, n, v;

	for ( i = 0; i < nvPairs.length; i++ ) {
		var pstr = nvPairs[ i ];
		if ( pstr ) {
			pair = pstr.split( /=/ );
			n = pair[ 0 ];
			v = pair[ 1 ];
			if ( result[ n ] === undefined ) {
				result[ n ] = v;
			} else {
				if ( typeof result[ n ] !== "object" ) {
					result[ n ] = [ result[ n ] ];
				}
				result[ n ].push( v );
			}
		}
	}

	return result;
}

// The idea here is to listen for any pagebeforechange notifications from
// jQuery Mobile, and then muck with the toPage and options so that query
// params can be passed to embedded/internal pages. So for example, if a
// changePage() request for a URL like:
//
//    http://mycompany.com/myapp/#page-1?foo=1&bar=2
//
// is made, the page that will actually get shown is:
//
//    http://mycompany.com/myapp/#page-1
//
// The browser's location will still be updated to show the original URL.
// The query params for the embedded page are also added as a property/value
// object on the options object. You can access it from your page notifications
// via data.options.pageData.
$( document ).bind( "pagebeforechange", function( e, data ) {

	// We only want to handle the case where we are being asked
	// to go to a page by URL, and only if that URL is referring
	// to an internal page by id.

	if ( typeof data.toPage === "string" ) {
		var u = $.mobile.path.parseUrl( data.toPage );
		if ( $.mobile.path.isEmbeddedPage( u ) ) {

			// The request is for an internal page, if the hash
			// contains query (search) params, strip them off the
			// toPage URL and then set options.dataUrl appropriately
			// so the location.hash shows the originally requested URL
			// that hash the query params in the hash.

			var u2 = $.mobile.path.parseUrl( u.hash.replace( /^#/, "" ) );
			if ( u2.search ) {
				if ( !data.options.dataUrl ) {
					data.options.dataUrl = data.toPage;
				}
				data.options.pageData = queryStringToObject( u2.search );
				data.toPage = u.hrefNoHash + "#" + u2.pathname;
			}
		}
	}
});

})( jQuery, window );

// http://twitter.com/search?q=%23searchterms&src=hash
function processTweetLinks(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
    text = text.replace(exp, "<a href='$1' target='_blank'>$1</a>");
    exp = /(^|\s)#(\w+)/g;
    text = text.replace(exp, "$1<a href='http://twitter.com/search?q=%23$2&src=hash' target='_blank'>#$2</a>");
    exp = /(^|\s)@(\w+)/g;
    text = text.replace(exp, "$1<a href='http://www.twitter.com/$2' target='_blank'>@$2</a>");
    return text;
}