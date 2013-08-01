/*

WellMU debugging dashboard v. 0.0.1

Creates GPX UI

Amplify signals: 
gpx_available - Initializes GPX ui with link to GPX data

Public functions:
init - initializes the component
clear - removes rendered content

*/

var gpxUI = (function(gpxUI) {
  var _baseURL = Common.determineBaseURL();
  var _gpxTrailsDrawn = [];  
  
  var _loadGPX = function(link) {
    // Trying to use IE to make the call but no avail
    if ('XDomainRequest' in window && window.XDomainRequest !== null) {
     
      // override default jQuery transport
      //jQuery.ajaxSettings.xhr = function() {
      //    try { return new XDomainRequest(); }
      //    catch(e) { }
      //};
      
      IE8_ajax_fix();
     
      // also, override the support check
      jQuery.support.cors = true;
    }
    $.ajax(
      {
        url: _baseURL + link.substring(1),
        type: 'GET',
        headers: {
          "Authorization": userData.credentials
        }
      }
    ).done(function(data) {
      amplify.publish('gpx_show_map', {'data':data, 'url':link});
    });    
  };
  
  var _clear = function() {
    $('#gpx_links-container').remove();
    _gpxTrailsDrawn = [];
  };
  
  var _changeSeriesInterval = function (series, newInterval) {
    var start = Date.parse(series[0][0]);
    var end = Date.parse(series[series.length-1][0]);
    var temp = start.clone();
    var result = [];
    while(temp <= end) {
      result.push([temp.toString('yyyy-MM-ddTHH:mm:ss'), null]);
      temp = new Date(temp.getTime() + newInterval);
    }
    for(var i = 0, j = 0; i < result.length; i++) {
      if(j >= series.length) { break; }
      if(Date.compare(Date.parse(result[i][0]), Date.parse(series[j][0])) >= 0) {
        result[i][1] = series[j][1];
        j++;
      } else {
        result[i][1] = null;
      }
    }
    return result;
  };
  
  var _init = function() {

    amplify.subscribe('gpx_available', function(data) {
      if(data != null && $(".gpx_links-container").length == 0) {
        var HTML = $('<div class="gpx_links-container" id="gpx_links-container"><b>GPX Trails</b><br></div>');
        $('#gpx_events-container').append(HTML);
      } else if (data == null) {
        $('#gpx_links-container').remove();
      }
      var start = "", end = ""
      if(typeof data.startDate != 'undefined') {
        start = Common.parseUTCToLocalTime(data.startDate).toString('HH:mm');
      }
      if(typeof data.endDate != 'undefined') {
        end = Common.parseUTCToLocalTime(data.endDate).toString('HH:mm');
      }
      var sportType = typeof data.sportType !== 'undefined' ? data.sportType : "unknown";
      var HTML = $('<span style="float:left; font-weight:bold; width: 80px;">' 
        + start + '-' + end + '</span>'
        + '<span style="float:right; width:220px"><a href="#" onClick="gpxUI.loadGPX(\'' 
        + data.gpxdata.link + '\');">Sport type - ' + sportType + '</a></span><br>');
      $("#gpx_links-container").append(HTML);
      
      if(typeof data.startDate != 'undefined' && typeof data.endDate != 'undefined') {
        var d1 = Common.parseUTCToLocalTime(data.startDate);
        var d2 = Common.parseUTCToLocalTime(data.endDate);
        var interval = d2.getTime() - d1.getTime();
        var row = [
          { from: Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()), 
            to:   Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes()) + interval, 
            label: sportType }
        ];
        var rows = {
          id: 'trail_' + data.gpxdata.link,
          tasks: [
            {
              name: 'Trail ' + d1.toString('HH:mm'),
              intervals: row
            }
          ]
        };
        amplify.publish('new_gantt_chart-gantt', rows);          
      }
    });
    
    amplify.subscribe('gpx_show_map', function(data) {
      var gpx = data.data;
      var link = data.link;
      var maxWidth = window.innerWidth * 0.8;
      var maxHeight = window.innerHeight * 0.8;
      var chartHeight = 200;
      var template = "<div data-role='popup' class='ui-content mapPopup' style='min-width:" + maxWidth + "px; min-height:" + maxHeight + "px;'>" 
          + "<a href='#' data-role='button' data-theme='g' data-icon='delete' data-iconpos='notext' " 
          + " class='ui-btn-right closePopup'>Close</a> "
          + "<div id='gpx_metadata'></div>"
          + "<div id='map' style='overflow:hidden; min-width:" + maxWidth + "px; min-height:" + (maxHeight - chartHeight) + "px;'></div>"
          + "<div id='gpx_highcharts_container' style='height:200px;'></div></div>";
      
      var popupafterclose = undefined;
      popupafterclose = popupafterclose ? popupafterclose : function () {};
     
      $.mobile.activePage.append(template).trigger("create");
     
      $.mobile.activePage.find(".closePopup").bind("tap", function (e) {
        $.mobile.activePage.find(".mapPopup").popup("close");
      });
     
      $.mobile.activePage.find(".mapPopup").popup({ dismissible: false, history: false }).popup("open").bind({
        popupafterclose: function () {
          $(this).unbind("popupafterclose").remove();
          popupafterclose();
          $.mobile.ajaxEnabled = true;
        },
        popupafteropen: function() { 
          var mapOptions = {
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };
          var map = new google.maps.Map(document.getElementById("map"), mapOptions);
          var parser = new GPXParser(gpx, map);
          parser.setTrackColour("#ff0000");     // Set the track line colour
          parser.setTrackWidth(5);              // Set the track line width
          parser.setMinTrackPointDelta(0.001);  // Set the minimum distance between track points
          parser.centerAndZoom(gpx);
          parser.addTrackpointsToMap();         // Add the trackpoints
          parser.addWaypointsToMap();           // Add the waypoints
          
          // Let's try to get some more details out of the GPX file
          var gpxJson = $.xml2json(gpx);
          console.log('GPX as JSON', gpxJson);
          $('#gpx_metadata').empty();
          if(typeof gpxJson.metadata.name != undefined) {
            $('#gpx_metadata').text(gpxJson.metadata.name);
          }
          if(typeof gpxJson.trk.trkseg == 'object') {
            try {
              var elevation = [];
              var elevationOriginalTimes = [];
              var speed = [];
              var speedOriginalTimes = [];
              var points = [];
              var heartrateOriginalTimes = [];
              
              var trkpt = []
              if(gpxJson.trk.trkseg.length) {
                for(var i = 0; i < gpxJson.trk.trkseg.length; i++) {
                  trkpt = trkpt.concat(gpxJson.trk.trkseg[i].trkpt);
                }
              } else {
                trkpt = gpxJson.trk.trkseg.trkpt;
              }
              
              for(var i = 0; i < trkpt.length; i++) {
                var p = new google.maps.LatLng(parseFloat(trkpt[i].lat, 10), parseFloat(trkpt[i].lon, 10))
                if(points.length > 0 && i > 0) {
                  try{
                    var distance = google.maps.geometry.spherical.computeDistanceBetween(points[points.length-1],p)
                    var timediff = (Date.parse(trkpt[i].time) - Date.parse(trkpt[i-1].time)) / 1000;
                    var pointSpeed = Math.round((distance / timediff) * 360)/100;
                    if(!isNaN(pointSpeed) && pointSpeed != "Infinity") {
                      speed.push([trkpt[i].time, pointSpeed]);
                      speedOriginalTimes.push([trkpt[i].time, pointSpeed]);
                    }
                  } catch(err) {
                    
                  }
                }
                points.push(p);
                if(isNaN(parseInt(trkpt[i].ele)) == false) {
                  elevation.push([trkpt[i].time.split('.')[0], parseInt(trkpt[i].ele)]);
                  elevationOriginalTimes.push([trkpt[i].time, parseInt(trkpt[i].ele)]);
                }
                if(typeof trkpt[i].extensions !== 'undefined' && 
                   typeof trkpt[i].extensions.TrackPointExtension !== 'undefined' && 
                   typeof trkpt[i].extensions.TrackPointExtension.hr !== 'undefined') {
                  heartrateOriginalTimes.push([trkpt[i].time.split('.')[0], parseInt(trkpt[i].extensions.TrackPointExtension.hr)]);
                }
              }
              if(elevation.length > 0) {
                elevation = Common.changeTimelineToLocal(elevation);
                elevation = _changeSeriesInterval(elevation, 1000 * 15);
                speed = Common.changeTimelineToLocal(speed);
                speed = _changeSeriesInterval(speed, 1000 * 15);
                
                var timeStr = Date.parse(elevation[0][0]).toString('HH:mm');
                
                // See if this has been already added (matching start time), if not, add it to the main timeline
                if(_gpxTrailsDrawn.indexOf(trkpt[0].time) == -1) {
                  amplify.publish('new_timeline_dataset',
                    {'name':'Elevation (' + timeStr + ')','id':'ele-' + timeStr,'min':0,'unit':'m','visible':true,'type':'spline','pointInterval': 1000 * 15, 'pointStart': Date.parse(elevation[0][0]),'data':elevation}
                  );
                  amplify.publish('new_timeline_dataset',
                    {'name':'Speed (' + timeStr + ')','id':'speed-' + timeStr,'min':0,'unit':'km/h','visible':true,'type':'spline','pointInterval': 1000 * 15, 'pointStart': Date.parse(speed[0][0]),'data':speed}
                  );
                  _gpxTrailsDrawn.push(trkpt[0].time);
                }
                
                for(var i = 0; i < elevationOriginalTimes.length; i++) {
                  var d = Date.parse(elevationOriginalTimes[i][0]);
                  var tzo = d.getTimezoneOffset();
                  elevationOriginalTimes[i] = 
                    [
                      Date.UTC(
                        d.getFullYear(), 
                        d.getMonth(), 
                        d.getDate(), 
                        d.getHours(), 
                        d.getMinutes() - (tzo), 
                        d.getSeconds(), 
                        d.getMilliseconds()
                      ), 
                      elevationOriginalTimes[i][1]
                    ];
                }
                var chart = $('#gpx_highcharts_container').highcharts({
                  chart: {
                      type: 'spline',
                      height: chartHeight
                  },
                  title: {
                      text: 'Track elevation and speed'
                  },
                  xAxis: {
                      type: 'datetime'
                  },
                  yAxis: {
                      title: {
                          text: 'Elevation (m)'
                      },
                      min: 0
                  },
                  tooltip: {
                    formatter: function() {
                      var s = '<b>' + Highcharts.dateFormat('%H:%M:%S', this.points[0].point.x) + '</b><br>';
                      for(var i = 0; i < this.points.length; i++) {
                        s += '<b>' + this.points[i].series.name + ':</b> ' + this.points[i].point.y + '<br>';
                      }
                      return s;
                    },
                    shared: true
                  },
                  plotOptions: {
                      spline: {
                          marker: {
                              enabled: false
                          }
                      }
                  },
                  series: [{
                    name: 'Elevation',
                    unit: 'm',
                    data: elevationOriginalTimes
                  }]
                });
                if(heartrateOriginalTimes.length > 0) {
                  for(var i = 0; i < heartrateOriginalTimes.length; i++) {
                    var d = Date.parse(heartrateOriginalTimes[i][0]);
                    var tzo = d.getTimezoneOffset();
                    heartrateOriginalTimes[i] = 
                      [
                        Date.UTC(
                          d.getFullYear(), 
                          d.getMonth(), 
                          d.getDate(), 
                          d.getHours(), 
                          d.getMinutes() - (tzo), 
                          d.getSeconds(), 
                          d.getMilliseconds()
                        ), 
                        heartrateOriginalTimes[i][1]
                      ];
                  }
                  $('#gpx_highcharts_container').highcharts().addAxis({
                    id: 'hr-axis',
                    min: null,
                    showEmpty: true,
                    title: {
                      text: 'Heart rate (pbm)'
                    }
                  }, true, true);
                  $('#gpx_highcharts_container').highcharts().addSeries({
                    type: 'spline',
                    yAxis: 'hr-axis',
                    name: 'Heart rate',
                    data: heartrateOriginalTimes,
                    unit: 'bpm'
                  }, true);
                }
                if(speedOriginalTimes.length > 0) {
                  for(var i = 0; i < speedOriginalTimes.length; i++) {
                    var d = Date.parse(speedOriginalTimes[i][0]);
                    var tzo = d.getTimezoneOffset();
                    speedOriginalTimes[i] = 
                      [
                        Date.UTC(
                          d.getFullYear(), 
                          d.getMonth(), 
                          d.getDate(), 
                          d.getHours(), 
                          d.getMinutes() - (tzo), 
                          d.getSeconds(), 
                          d.getMilliseconds()
                        ), 
                        speedOriginalTimes[i][1]
                      ];
                  }
                  $('#gpx_highcharts_container').highcharts().addAxis({
                    id: 'speed-axis',
                    min: 0,
                    showEmpty: true,
                    title: {
                      text: 'Speed (km/h)'
                    }
                  }, true, true);
                  $('#gpx_highcharts_container').highcharts().addSeries({
                    type: 'spline',
                    yAxis: 'speed-axis',
                    name: 'Speed',
                    data: speedOriginalTimes,
                    unit: 'km/h'
                  }, true);
                }
              } else {
                $('#gpx_highcharts_container').empty()
                $('#map').height($('#map').height() + chartHeight)
              }
            } catch(err) {
              console.log("ERROR, GPX parsing", err);
            }
          }
        }
      });
    });
    
    if($(".gpx_events-container").length == 0) {
      var targetDivID = tabUI.newTab('Trails');
      var HTML = $('<div class="gpx_events-container table-wrapper" id="gpx_events-container"></div>');
      $('#' + targetDivID).append(HTML);
    }
    var HTML = $('<div class="gpx_upload" id="gpx_upload">' + 
      '<b>Upload GPX File</b></br>' +
      '<input type="file" name="file" onchange="gpxUI.handleFiles(this.files)" multiple /><br>' + 
      '<span id="gpx_upload_result"></span>' +
      '</div>');
    $("#gpx_events-container").append(HTML);
  };
  
  var _handleFiles = function(files) {
    if(location.protocol == "http:") {
      console.log("Wellmu accepts POST only from HTTPS origins, not HTTP.");
      return;
    }
    for(var i = 0; i < files.length; i++) {
      var file = files[i];
      var xhr = new XMLHttpRequest();
      xhr.addEventListener('progress', function(e) {
          var done = e.position || e.loaded, total = e.totalSize || e.total;
          console.log('xhr progress: ' + (Math.floor(done/total*1000)/10) + '%');
      }, false);
      if ( xhr.upload ) {
          xhr.upload.onprogress = function(e) {
              var done = e.position || e.loaded, total = e.totalSize || e.total;
              $('#gpx_upload_result').text('Upload progress: ' + done + ' / ' + total + ' = ' + (Math.floor(done/total*1000)/10) + '%');
          };
      }
      xhr.onreadystatechange = function(e) {
          if ( 4 == this.readyState ) {
            console.log(['xhr upload complete', e]);
            $('#gpx_upload_result').text('Upload complete (' + e.currentTarget.status + ' ' + e.currentTarget.statusText + ')');
            setTimeout("$('#gpx_upload_result').text('');", 5000);
          }
      };
      xhr.open('post', Common.determineBaseURL() + 'gpx/upload', true);
      xhr.withCredentials = true;
      xhr.setRequestHeader('Authorization', userData.credentials);
      xhr.setRequestHeader('Accept', '*/*');

      var formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    }
  }
  return {
    init: _init,
    loadGPX: _loadGPX,
    clear: _clear,
    handleFiles: _handleFiles
  }
  
}());