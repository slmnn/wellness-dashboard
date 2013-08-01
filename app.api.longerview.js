/*

WellMU debugging dashboard v. 0.0.1

Time period view initializer that loads the data, makes transformations and passes it to UI modules.

*/

var wellnessAPILongerView =(function(wellnessAPILongerView) {
	var baseurl = Common.determineBaseURL();
  var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


	var _getData = function(apicall, cb) {
		var myurl = baseurl + apicall;
    
    // Damn IE
    if ('XDomainRequest' in window && window.XDomainRequest !== null) {
      IE8_ajax_fix();
      jQuery.support.cors = true;
    }
		$.ajax(
			{
				url: myurl,
	    	type: 'GET',
				datatype: 'json',
        contentType: "application/json; charset=utf-8",
	    	headers: {
	        "Authorization": userData.credentials
   			},
        beforeSend: Common.showHourglass
			}
		).done(cb).complete(Common.hideHourglass);
	};

	var _today = Date.today();
	var _currentday;
	var _chart;
  
	var _ganttChart = ganttUI();
  _ganttChart.init('gantt_longer_view');
  
	var _daypath = function(date) {
    return date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + (date.getDate()) + '/';
	};
  
  // Initializes the Highcharts widget
	var _createSeries = function(container) {
    $(container).highcharts(
    {
      chart: {
        type: 'column',
        width: $(window).width()-40
      },
      title: {
        text: 'Wellness timeline'
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
                  {
                    transition: 'flip'
                  }
                );
              }
            }
          },
          marker: {
            lineWidth: 1
          }
        }
      },
      xAxis: {
        type: 'datetime',
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
	
  // Function for adding new axis and series pair to the widget
	var _addAxisAndSeries = function(seriesId, seriesName, seriesData, seriesVisible) {
    seriesVisible = typeof seriesVisible !== 'undefined' ? seriesVisible : false;
    _chart.addAxis({
      id: seriesId,
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
	var _init = function(startDate) {
    if(typeof startDate != 'object' || startDate == null) {
      if(userData.username != 'demo') {
        _currentday = new Date(_today.clone().add({days: (_period * -1)}));
      } else {
        _currentday = new Date(Date.parse('15.4.2013'));
      }
    } else {
      _currentday = startDate;
    }
		
		// Create something to draw on
    if($('#series-container').length == 0) {
      var targetDivID = 'highcharts';
      var HTML = $('<div id="series-container"></div>');
      $('#' + targetDivID).append(HTML);
    }		
		_chart = _createSeries('#series-container');
		
    // Get the data and add to chart
    _populateChart();
	};
	
	var _setPeriod = function(newPeriod) {
    _period = newPeriod;
    _destroyChart();
    var lastDayOfPeriod = _currentday.add({days:_period});
    if(Date.compare(_today, lastDayOfPeriod) < 0) {
      $('#datescroller-periodstart').mobiscroll('setDate', _today.clone().add({days: -1 * _period}), true);
    }
    _init(Date.parse($('#datescroller-periodstart').mobiscroll('getDate')));
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
	
  // Function requests the data and adds it to the chart in the callback functions that are inlined
	var _populateChart = function() {
    var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    _ganttChart.clear();
        
    // Sleep
		if(/*userData.fitbit || userData.beddit*/ true) {
    
      // Request merged sleep data
      _getData('data/' + userData.username + '/merge/sleep/' + _daypath(_currentday) + 'days/' + _period + '', function(data) {

        if(typeof(data) != 'object')
          var json = $.parseJSON(data);
        else 
          var json = data;
          
        for(var i = 0; i < json.length; i++) {
          var current = json[i].common;
          var day = Date.parse(json[i].date);
          
          // Parse data for Gantt graph
          if(_period < 14) {
            try {
              if(typeof current != 'undefined' && day != null) {
                var intoBed = Date.parse(current.timeToBed);
                var tzOffset = -1 * intoBed.getTimezoneOffset() * 60 * 1000;
                var fromBed = Date.parse(current.timeOutOfBed);
                var sleepLength = fromBed - intoBed;
                var row = [
                  { from: Date.UTC(0, 0, 0, intoBed.getHours(), intoBed.getMinutes()) + tzOffset, 
                    to:   Date.UTC(0, 0, 0, intoBed.getHours(), intoBed.getMinutes() + current.minutesToFallAsleep) + tzOffset, 
                    label: "",
                    color: '#FF0033',
                    startMarkerEnabled: false
                  },
                  { from: Date.UTC(0, 0, 0, intoBed.getHours(), intoBed.getMinutes() + current.minutesToFallAsleep) + tzOffset, 
                    to:   Date.UTC(0, 0, 0, intoBed.getHours(), intoBed.getMinutes()) + sleepLength - current.minutesToFallAsleep - current.minutesAfterWakeup + tzOffset, 
                    label: "Sleep begins",
                    color: '#33FF99',
                    startMarkerEnabled: true
                  }
                ];
                if(current.minutesAfterWakeup > 0) {
                  row.push({ from: Date.UTC(0, 0, 0, intoBed.getHours(), intoBed.getMinutes()) + sleepLength - current.minutesToFallAsleep - current.minutesAfterWakeup + tzOffset, 
                    to:   Date.UTC(0, 0, 0, intoBed.getHours(), intoBed.getMinutes()) + sleepLength - current.minutesToFallAsleep + current.minutesAfterWakeup + tzOffset, 
                    label: "",
                    color: '#FF0099',
                    startMarkerEnabled: true
                  });
                }
              } else {
                console.log("No sleep data", day);
                var row = [];
              }
              var weekday = weekdays[day.getDay()];
              var rows = {
                id: 'sleep_duration_' + i,
                height: 300,
                // colors: ['#3399FF'],
                tasks: [
                  {
                    color: "#3399FF",
                    name: 'Sleep ' + day.toString('yyyy-MM-dd') + ' (' + weekday + ')',
                    intervals: row
                  }
                ]
              };
              if(typeof current != 'undefined') {
                if(current.minutesAsleep < 420) { rows.tasks[0].color = "#FFFF00" } 
                else if(current.minutesAsleep < 360) { rows.tasks[0].color = "#FF6600" } 
                else if(current.minutesAsleep < 300) { rows.tasks[0].color = "#FF0000" } 
              }
              amplify.publish('new_gantt_chart-gantt_longer_view', rows);           
            } catch(err) {
              console.log('ERROR: Sleep data, gantt long view', err);
            }
          } else {
            $('#gantt_longer_view').text("Sleep rythm chart is available only for 7 day periods.");
          }
        }
        
        // Parse data for timeline
        var series = { 
          minutesAsleep: [], 
          minutesAwake: [],
          minutesToFallAsleep: [], 
          efficiency: [],
          sleepIntervals: []
        };
        
        for(var i = 0; i < json.length; i++) {
          try {
            var current = json[i].common;
            var day = Date.parse(current.date);
            if(day != null) {
              var utcDay = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
              series.minutesAsleep.push([utcDay, isNaN(current.minutesAsleep) == false ? current.minutesAsleep : null]);
              series.minutesAwake.push([utcDay, isNaN(current.minutesAwake) == false ? current.minutesAwake : null]);
              series.efficiency.push([utcDay, isNaN(current.efficiency) == false ? Math.round(current.efficiency * 100) / 100 : null]);
              series.minutesToFallAsleep.push([utcDay, isNaN(current.minutesToFallAsleep) == false ? current.minutesToFallAsleep : null]);
            }
          } catch(err) {
            console.log('ERROR: Sleep data, long view', err);
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
      
      // Generic callback for analysis data
      var genericAnalysisCB = function(data, seriesName, seriesTitle) {
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
          _addAxisAndSeries(seriesName, seriesTitle, result);
        _chart.redraw();
      };
      
      // Analysis
      _getData('api/analysis/sleepeffma/' + _daypath(_currentday) + 'days/' + _period + '/7', function(data) {
        genericAnalysisCB(data, 'sleepeffma', 'Sleep efficiency (Av.)');
      });
      _getData('api/analysis/sleeptimema/' + _daypath(_currentday) + 'days/' + _period + '/7', function(data) {
        genericAnalysisCB(data, 'sleeptimema', 'Sleep time (Av.)');
      });
      _getData('api/analysis/sleepwakeningsma/' + _daypath(_currentday) + 'days/' + _period + '/7', function(data) {
        genericAnalysisCB(data, 'sleepwakeningsma', 'Awakenings (Av.)');
      });
      _getData('api/analysis/sleepfallsleepma/' + _daypath(_currentday) + 'days/' + _period + '/7', function(data) {
        genericAnalysisCB(data, 'sleepfallsleepma', 'Time to fall asleep (Av.)');
      });
    }
    
    // Activities
    if(/*userData.fitbit*/ true) {
      _getData('data/' + userData.username + '/merge/activity/' + _daypath(_currentday) + 'days/' + _period + '', function(data) {
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
        for(var i = 0; i < json.length; i++) {
          var current = json[i];
          try {
            var day = Date.parse(current.date);
            if(day != null) {
              var utcDay = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
              series.steps.push([utcDay, isNaN(current.fitbit.summary.steps) == false ? current.fitbit.summary.steps : null]);
              series.minutesSedentary.push([utcDay, isNaN(current.fitbit.summary.sedentaryMinutes) == false ? current.fitbit.summary.sedentaryMinutes : null]);
              series.activityCalories.push([utcDay, isNaN(current.fitbit.summary.activityCalories) == false ? current.fitbit.summary.activityCalories : null]);
              series.activeScore.push([utcDay, isNaN(current.fitbit.summary.activeScore) == false ? current.fitbit.summary.activeScore : null]);
            }
          } catch(err) {
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
    if(/*userData.withings*/ true) {
      _getData('data/' + userData.username + '/merge/measure/' + _daypath(_currentday) + 'days/' + _period + '', function(data) {
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
        for(var i = 0; i < json.length; i++) {
          try {
            var current = json[i];
            if(typeof current.withings !== 'undefined') {
              for(var j = 0; j < current.withings.length; j++) {
                var day = Date.parse(current.withings[j].date);
                if(day != null) {
                  var utcDay = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), day.getHours(), day.getMinutes());
                  if(!isNaN(current.withings[j].weight))
                    series.weight.push([utcDay, Math.round(current.withings[j].weight * 100) / 100]);
                  if(!isNaN(current.withings[j].pulse))
                    series.pulse.push([utcDay, current.withings[j].pulse]);
                  if(!isNaN(current.withings[j].diasPressure))
                    series.diasPressure.push([utcDay, current.withings[j].diasPressure]);
                  if(!isNaN(current.withings[j].sysPressure))
                    series.sysPressure.push([utcDay, current.withings[j].sysPressure]);
                }
              }
            }
          } catch(err) {
            console.log(err);
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
      _getData('weather/history/overview/' + _daypath(_currentday) + 'days/' + _period + '', function(data) {
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
            if(day != null && typeof json[i].summary != 'undefined') {
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
            _addAxisAndSeries('temperature', 'Air Temperature', series.temperature, true);

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

  var _getUserData = function(username, password) {
    // Create authorization header for queries
    var credentials = 'Basic ' + Base64.encode(username + ":" + password);
    
    // First we check the services available for the user
    // If the call is successfull we consider credentials to be ok
    var apicall = 'user/services';
    var myurl = baseurl + apicall;
    
    // Trying to use IE to make the call
    if ('XDomainRequest' in window && window.XDomainRequest !== null) {
      IE8_ajax_fix();
      jQuery.support.cors = true;
    }
    
    $.ajax(
      {
        url: myurl,
        type: 'GET',
        context: this,
        dataType: 'json',
        crossdomain: true,
        contentType: "application/json; charset=utf-8",
        beforeSend: function(jqXHR, settings) {
          jqXHR.withCredentials = true;
          jqXHR.setRequestHeader('Authorization', credentials);
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
          $(".headertext").text(json.user_info.first_name + "'s WellMU dashboard");
          $("div.login").hide(1000);
          $.mobile.changePage("#multiple-day-page");
          $( ".show-after-init" ).css({"visibility":"visible"});
          _disableLoginDialog();
          
          // Init the longer view
          _init();
          
          // Init the single day view
          wellnessAPISingleDay.init();
          
        } else {
          // Login unsuccessful, does not work as the server fails to respond
          $("#login-msg").text("Sorry, login failed!");
        }
      }
    ).error(function(jqXHR, textStatus, errorThrown) { 
      alert("Error: " + errorThrown); 
      console.log(jqXHR, textStatus, errorThrown);
      if ('XDomainRequest' in window && window.XDomainRequest !== null) {
        alert("       Seems that you are using IE which \ndoes not support HTTP Basic Authorization. \n\n Please, install a proper browser and try again.");
      }
    });
    
  };

	return {
		init: _init,
		period: _period,
		setPeriod: _setPeriod,
    getPeriod: function() {
      return _period;
    },
		hideOtherSeries: _hideOtherSeries,
		register: function(path, cb) {
      Common.runtimePopup(path, cb);
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