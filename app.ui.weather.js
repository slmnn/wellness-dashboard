/*

WellMU debugging dashboard v. 0.0.1

Creates the UI component for Weather data

Amplify signals: 
weather_history - Renders Weather data provided

Public functions:
init - initializes the component

*/

var weatherUI = (function(weatherUI) {
	var _init = function() {
    if($("#weather_variables-container").length == 0) {
      var targetDivID = tabUI.newTab('Weather');
      var HTML = $('<div class="weather_variables-container" id="weather_variables-container"></div>');
      $('#' + targetDivID).append(HTML);
    }
		amplify.subscribe('weather_history', function(data) {
      if(typeof data.history !== 'undefined') {
        
        var summary = data.history.dailysummary[0];
        console.log('Weather data for ' + summary.date, summary);
        var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var weekday = weekdays[Date.parse(data.history.date.pretty).getDay()];
        var HTML = $('<div id="weather_variables_'+ weekday +'" class="weather_variables table-wrapper"><b>Weather conditions (' + weekday + ')</b></br>' +
          '<table><tr><td class="weatherdata_name">Temp.</td><td class="weatherdata_value">' + summary.meantempm + ' C</td><td><span id="temperature_sparkline_' + weekday + '">&nbsp;</span></td></tr>' +
          '<tr><td class="weatherdata_name">Dew P.T.</td><td class="weatherdata_value">' + summary.meandewptm + ' C</td><td><span id="dewptm_sparkline_' + weekday + '">&nbsp;</span></td></tr>' + 
          '<tr><td class="weatherdata_name">Press.</td><td class="weatherdata_value">' + summary.meanpressurem + ' hPa</td><td><span id="pressure_sparkline_' + weekday + '">&nbsp;</span></td></tr>' + 
          '<tr><td class="weatherdata_name">Hum.</td><td class="weatherdata_value">' + summary.humidity + ' %</td><td><span id="humidity_sparkline_' + weekday + '">&nbsp;</span></td></tr></table>' +
          '</div>');
        $("#weather_variables-container").append(HTML);
        
        var o = data.history.observations;
        var temperature_sparkline = [];
        var pressure_sparkline = [];
        var humidity_sparkline = [];
        var dewptm_sparkline = [];
        
        var temperature_timeline = [];
        var humidity_timeline = [];
        var pressure_timeline = [];
        
        for(var i = 0; i < o.length; i++) {
          temperature_sparkline.push(o[i].tempm);
          pressure_sparkline.push(o[i].pressurem);
          humidity_sparkline.push(o[i].hum);
          dewptm_sparkline.push(o[i].dewptm);
          
          var mon = parseInt(o[i].date.mon)-1;
          temperature_timeline.push([Date.UTC(o[i].date.year, mon, o[i].date.mday, o[i].date.hour, o[i].date.min), parseFloat(o[i].tempm)]);
          humidity_timeline.push([Date.UTC(o[i].date.year, mon, o[i].date.mday, o[i].date.hour, o[i].date.min), parseFloat(o[i].hum)]);
          pressure_timeline.push([Date.UTC(o[i].date.year, mon, o[i].date.mday, o[i].date.hour, o[i].date.min), parseFloat(o[i].pressurem)]);
        }
        
        if(data.date == data.currentday) {
          amplify.publish('new_timeline_dataset',
            {'name':'Temperature (' + weekday + ')','id':'temp-' + weekday,'min':null,'unit':'deg. celcius','visible':false,'type':'spline','pointInterval': null, 'pointStart': new Date(temperature_timeline[0][0]),'data':temperature_timeline}
          );
          amplify.publish('new_timeline_dataset',
            {'name':'Humidity (' + weekday + ')','id':'hum-' + weekday,'min':null,'unit':'%','visible':false,'type':'spline','pointInterval': null, 'pointStart': new Date(humidity_timeline[0][0]),'data':humidity_timeline}
          );
          amplify.publish('new_timeline_dataset',
            {'name':'Pressure (' + weekday + ')','id':'press-' + weekday,'min':null,'unit':'hPa','visible':false,'type':'spline','pointInterval': null, 'pointStart': new Date(pressure_timeline[0][0]),'data':pressure_timeline}
          );
        }
        
        $('#temperature_sparkline_' + weekday).sparkline(temperature_sparkline, {width:'100px'});
        $('#pressure_sparkline_' + weekday).sparkline(pressure_sparkline, {width:'100px'});
        $('#humidity_sparkline_' + weekday).sparkline(humidity_sparkline, {width:'100px'});
        $('#dewptm_sparkline_' + weekday).sparkline(dewptm_sparkline, {width:'100px'});
      } else {
        $('#weather_variables-container').append($('<div class="table-wrapper" id="weather-no_data"><p><b>No weather data available!</b></p></div>'));
      }
		});
	};
	return {
		init: _init,
    clear: function() {
      $("#weather_variables-container").empty();
    }
	}
}());
