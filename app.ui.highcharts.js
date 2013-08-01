/*

WellMU debugging dashboard v. 0.0.1

Creates Highcharts UI, the main timeline in single day view

Amplify signals: 
new_timeline_dataset - Passes timeline to be rendered

Public functions:
init - initializes the component
clear - removes rendered content
resetZoom - resets chart zoom
chart - provides the chart object

*/

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
    if(!(data.pointStart instanceof Date)) {
      var d = Date.parse(data.pointStart)
    } else {
      var d = data.pointStart;
    }
    if(d === null) {
      console.log("Creating series is not possible, data.pointStart is not ok.", data);
      return undefined;
    }
    var result;
    if(_chart().series.length >= 0) {
      if(_chart().get(data.id + '-axis') == null) {
        _chart().addAxis({
                id: data.id + '-axis',
                min: data.min,
                showEmpty: false,
                title: {
                    text: data.name + ' ' + data.unit
                },
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
			while(Common.parseUTCToLocalTime(data[i][0]).isBefore(start)) i++;
			for(var j = i; j < data.length; j++) {
				if(Common.parseUTCToLocalTime(data[j][0]).isAfter(end)) break;
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
                            enabled: true
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
              var d;
              try {
                d = Date.parse(this.key);
                if(d == null)
                  d = new Date(this.key);
              }
              catch (err) {
              
              }
              if(d == null) {
                d = new Date();
              }
              var p = '<span style="font-size:10px;text-align:center;"><b>' + d.toString('yyyy-MM-dd HH:mm') + '</b></span><table>';
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
    clear: _clear,
    resetZoom: function() {
      _chart().zoomOut();
    }
	}
}());