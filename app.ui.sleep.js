/*

WellMU debugging dashboard v. 0.0.1

Creates the UI component for sleep data

Amplify signals: 
sleep_variables - Renders sleep data provided

Public functions:
init - initializes the component

*/

var sleepUI = (function(sleepUI) {
  var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];  
	var _init = function() {
    if($('#sleep_variables-container').length == 0) {
      var targetDivID = tabUI.newTab('Sleep');
      var HTML = $('<div class="sleep_variables-container" id="sleep_variables-container"></div>');
      $('#' + targetDivID).append(HTML);
    }
		amplify.subscribe('sleep_variables', function(data) {
      for(var i = 0; i < data.length; i++) {
        var daynumber = Date.parse(data[i].date).getDay();
        if(typeof(data[i].common) != 'undefined'){
          var common = data[i].common;
          if(common == null) continue;
          if(common.source == null) continue;
          $('#sleep_variables-container').append(
            '<div class="sleep_variables table-wrapper" id="sleep_variables-' + i + '">' +
            '<table class="sleepdata_table" id="sleepdata_table_' + i + '">' +
            '<caption><b>Sleep variables (' + weekdays[daynumber] + ')</b></caption>' +
            '<tr><td class="sleepdata_name">Sleep efficiency</td><td class="sleepdata_value">' + Math.round(common.efficiency * 100) / 100 + '</td><td class="sleepdata_unit">%</td><td></td></tr>' +
            '<tr><td class="sleepdata_name">Time in bed</td><td class="sleepdata_value">' + Common.secondsToString((common.minutesAsleep + common.minutesAwake) * 60) + '</td><td class="sleepdata_unit"></td><td class="sleepdata_sparkline"><span id="sleep_time_sleeping_sparkline_' + i + '">&nbsp;</span></td></tr>' +
            '<tr><td class="sleepdata_name">Total sleep time</td><td class="sleepdata_value">' + Common.secondsToString(common.minutesAsleep * 60) + '</td><td class="sleepdata_unit"></td><td class="sleepdata_sparkline"></td></tr>' +
            '<tr><td class="sleepdata_name">Time awake in bed</td><td class="sleepdata_value">' + Common.secondsToString(common.minutesAwake * 60) + '</td><td class="sleepdata_unit"></td><td class="sleepdata_sparkline"></td></tr>' +
            '<tr><td class="sleepdata_name">Time to fall asleep</td><td class="sleepdata_value">' + Common.secondsToString(common.minutesToFallAsleep) + '</td><td class="sleepdata_unit"></td><td class="sleepdata_sparkline"></td></tr>' +
            '<tr><td class="sleepdata_name">Awakenings count</td><td class="sleepdata_value">' + common.awakeningsCount + '</td><td class="sleepdata_unit">times</td><td class="sleepdata_sparkline"></td></tr>' +
            '</table></div>'
          );
          $('#sleep_time_sleeping_sparkline_' + i).sparkline([[ Math.round(common.minutesAsleep / 60 * 100) / 100],[Math.round(common.minutesAwake / 60 * 100) / 100]], {'type': 'pie', 'width':'10px'});
          $.sparkline_display_visible();
        } else {
          $('#sleep_variables-container').append($('<div class="table-wrapper" id="sleep-no_data"><p><b>No sleep data available (' + weekdays[daynumber] + ')</b></p></div>'));        
        }
        
        // Add Beddit data if it is available
        if(typeof data[i].beddit != 'undefined') {
          var beddit = data[i].beddit;
          if(beddit.analysis_valid == false) {
            console.log('Invalid Beddit analysis on ' + _currentday.toDateString(), beddit);
            continue;
          }					
          $('#sleepdata_table_' + i).append(
            '<tr><td class="sleepdata_name">Deep sleep time</td><td class="sleepdata_value">' + Common.secondsToString(beddit.time_deep_sleep) + '</td><td class="sleepdata_unit"></td><!--<td class="sleepdata_sparkline"><span id="sleep_time_deep_sparkline_' + i + '">&nbsp;</span></td>--></tr>' +
            '<tr><td class="sleepdata_name">Light sleep time</td><td class="sleepdata_value">' + Common.secondsToString(beddit.time_light_sleep) + '</td><td class="sleepdata_unit"></td><!--<td class="sleepdata_sparkline"><span id="sleep_time_light_sparkline_' + i + '">&nbsp;</span></td>--></tr>' +
            '<tr><td class="sleepdata_name">Resting heartrate</td><td class="sleepdata_value">' + Math.round(beddit.resting_heartrate*100)/100 + '</td><td class="sleepdata_unit">bpm</td></tr>' +
            '<tr><td class="sleepdata_name">Stress percent</td><td class="sleepdata_value">' + beddit.stress_percent + '</td><td class="sleepdata_unit">%</td><!--<td class="sleepdata_sparkline"><span id="sleep_stress_sparkline_' + i + '">&nbsp;</span></td>--></tr>'
          );
          $('#sleep_time_sleeping_sparkline_' + i).sparkline([[ Math.round(beddit.time_sleeping/3600 * 100) / 100],[Math.round(beddit.time_deep_sleep/3600 * 100) / 100],[ Math.round(beddit.time_light_sleep/3600 * 100) / 100]], {'type': 'pie', 'width':'10px'});
        }
      }
		});
	};
	return {
		init: _init,
    clear: function() {
      // Empty the UI component we are going to render on
      $('#sleep_variables-container').empty();
    }
	}
}());
