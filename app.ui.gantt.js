/*

WellMU debugging dashboard v. 0.0.1

Creates Gantt UI

Amplify signals: 
new_gantt_chart- + parentDIV - Initializes gantt UI to provided parentDIV

Public functions:
init - initializes the component
clear - removes rendered content

*/

var ganttUI = (function(ganttUI) {
  var _parentDIV = "gantt";
  var _series, _tasks, _chart;
  var _clearGraph = function() {
    if(typeof(_chart) == 'object') {
      // console.log('Removing gantt', _chart.series.length);
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
    $('#' + _parentDIV).empty();
    _chart = undefined;
  };
  var _createGraph = function(colors, height) {
    if(!height) var height = null;
    if(!colors) {
      colors = [
         '#2f7ed8', 
         '#0d233a', 
         '#8bbc21', 
         '#910000', 
         '#1aadce', 
         '#492970',
         '#f28f43', 
         '#77a1e5', 
         '#c42525', 
         '#a6c96a'
      ]
    }
    // create the chart
    _chart = new Highcharts.Chart({
        chart: {
            width: $(window).width()-40,
            height: height,
            renderTo: _parentDIV,
            type: 'line'
        },
        colors: colors,
        title: {
            text: null
        },
        xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: {
                day: '%H:%M'
            }
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
              try {
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
              } catch(err) { console.log('Gantt UI tooltip', err) }
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
                    symbol: 'triangle',
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
    // console.log("offset", offset);
    $.each(tasks, function(i, task) {
        if(!task.color) task.color = null;
        var item = {
            name: task.name,
            data: [],
            color: task.color,
            point: {
              events: {
                mouseOver: function(){
                  try{
                    commonTooltipUI.syncTooltip(this.series.chart.container, this.x);
                  } catch(err) {console.log("Common tooltip error in GanttUI", err);}
                }
              }
            }
        };
        $.each(task.intervals, function(j, interval) {
            if(!interval.color) interval.color = null;
            if(!interval.startMarkerEnabled) interval.startMarkerEnabled = false;
            item.data.push({
                x: interval.from,
                y: i + offset,
                marker: {
                    enabled: interval.startMarkerEnabled,
                    fillColor: interval.color
                },
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
  var _init = function(parentDIV) {
    _parentDIV = parentDIV;
    amplify.subscribe('new_gantt_chart-' + _parentDIV, function(data) {
      // console.log("new_gantt_chart", data);
      if(typeof(_chart) == 'undefined') {
        $('#' + _parentDIV).css({"display":"block"});
        _tasks = data.tasks;
        _series = _createSeries(data.tasks);
        _createGraph(data.colors, data.height);
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
});
