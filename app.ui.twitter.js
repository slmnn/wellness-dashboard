/*

WellMU debugging dashboard v. 0.0.1

Creates the UI component for Twitter messages

Amplify signals: 
tweets_available - Renders Twitter data provided

Public functions:
init - initializes the component
clear - removes rendered content

*/

var twitterUI = (function(twitterUI) {
	var _init = function() {
    if($("#some_variables-container").length == 0) {
      var targetDivID = tabUI.newTab('Twitter');
      var HTML = $('<div class="some_variables-container" id="some_variables-container"></div>');
      $('#' + targetDivID).append(HTML);
    }  
		amplify.subscribe('tweets_available', function(data) {
			if(data.length > 0) {
        console.log('Twitter data for ' + data[0].created_at);
        var weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        var weekday = weekdays[Date.parse(data[0].created_at).getDay()];			
        var HTML = $('<div id="twitter_variables_'+ weekday +'" class="twitter_variables table-wrapper"><b>Tweets (' + weekday + ')</b></br>' +
          '<table id="twitter_variables_table"></table>' +
          '</div>');
        $("#some_variables-container").append(HTML);
        for(var i = 0; i < data.length; i++) {
          var date = Common.parseUTCToLocalTime(data[i].created_at);
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
      $('#some_variables-container').empty();
		}
	}
}());