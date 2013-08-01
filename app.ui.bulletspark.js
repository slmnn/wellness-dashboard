/*

WellMU debugging dashboard v. 0.0.1

Creates sparklines to visualize activity data (steps, floors, etc.). 

Signals: 
bullet_chart - Creates bullet spark chart for activity data
activity_piechart - Creates piechart containing activity data

Public functions:
init - initializes the component
clear - return to the init state

*/

var bulletSparkUI = (function(bulletSparkUI) {
  var _tabDivID = undefined;
	var _init = function() {
    if($("#activity_variables-container").length == 0) {
      var _tabDivID = tabUI.newTab('Activities');
      var HTML = $('<div id="activity_variables-container"></div>');
      $('#' + _tabDivID).append(HTML);
      $('#activity_variables-container').append($('<div class="table-wrapper" id="activity_variables-no_data"><p><b>No activity data available!</b></p></div>'));
    }
    
		amplify.subscribe('bullet_chart', function(data) {
      // console.log('update_bullet_chart spark', data.id, data.chart);
      $('#activity_variables-no_data').remove();
      if($("#activity_variables_table").length == 0) {
        var HTML = $('<div class="table-wrapper"><b>Activity variables</b><br/><table id="activity_variables_table"></table></div>');
        $('#activity_variables-container').append(HTML);
      }
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
      $('#activity_variables-no_data').remove();
      $('#activity_piechart_' + data.id).remove();
			var HTML = $(
        '<div id="activity_piechart_' + data.id + '" class="activity_piechart activity_variables table-wrapper"><b>' + data.title + '</b><br />'+
        '<table id="activity_piechart_table_' + data.id + '" class="activity_piechart_table"></table>' +
        '</div>'
      );
			$('#activity_variables-container').append(HTML);
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
		init: _init,
    clear: function() {
      $('#activity_variables-container').empty();
      $('#activity_variables-container').append($('<div class="table-wrapper" id="activity_variables-no_data"><p><b>No activity data available!</b></p></div>'));
    }
	}
}());