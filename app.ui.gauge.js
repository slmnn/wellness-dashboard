/*

WellMU debugging dashboard v. 0.0.1

Creates Gauge UI (weight/SBP/DBP)

Amplify signals: 
new_gauge - creates new gauge / updates value of and old one if found
gauges_to_zero - reset gauge to zero

Public functions:
init - initializes the component
clear - resets the component

*/

var gaugeUI = (function(gaugeUI) {
  var _createGauge = function(targetDIVid, options, sourcedata) {
    $('#gauge-no_measures').remove();
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
    // Actually, lets remove them all...
    // 
    //$( ".gauge" ).each(function( index ) {
    //  var gauge = $(this).highcharts();
    //  for(var i = 0; i < gauge.series.length; i++) {
    //    var point = gauge.series[i].points[0];
    //    point.update(0);
    //    point.update(0);
    //  }
    //});
    //
    // Actually, lets remove them all
    $( ".gauge" ).each(function( index ) {
      $(this).highcharts().destroy();
    });
    $('#gauge-container').empty();
    $('#gauge-container').append($('<div class="table-wrapper" id="gauge-no_measures"><p><b>No measures today!</b></p></div>'));
    console.log('Removed all gauges');
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
    init: _init,
    clear: _setAllToZero
  }
}());
