/*

WellMU debugging dashboard v. 0.0.1

Visualizes calendar data 

Signals: 
calendar_events - Initializes calendar UI with calendar event data

Public functions:
init - initializes the component
clear - resets the component

*/

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
              start = Common.parseUTCToLocalTime(events.items[i].start.dateTime);
              startstr = start.toString("HH:mm") + ' - ';
              end = Common.parseUTCToLocalTime(events.items[i].end.dateTime); 
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
        result.sort(function(a,b) {
          return a.from - b.from;
        });
        var data = {
          id: 'calendar_events' + etag,
          tasks: [
            {
              name: 'Cal. ' + summary.substring(0,10) + '...',
              intervals: result
            }
          ]
        };
        amplify.publish('new_gantt_chart-gantt', data);        
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