/*

WellMU debugging dashboard v. 0.0.1

Common functions used across modules.

Public functions:
determineBaseURL - returns base url used in queries (devwellness / wellness)
parseUTCToLocalTime - parses time string (UTC) and returns date object (local time)
changeUTCStringToLocalString - parses time string (UTC) and returns time string (local time)
changeTimelineToLocal - changes timeline time strings (UTC) to local time strings
changeTimelineToUTCPresentation - changes timeline time strings (UTC) to local time strings in UTC presentation
showHourglass - shows loading indicator
hideHourglass - hides loading indicator

*/

var Common = (function(Common) {
  return {
    determineBaseURL:function(port) {
      if(window.document.location.host == "ec2-54-247-149-187.eu-west-1.compute.amazonaws.com:1337")
        return 'https://devwellness.cs.tut.fi/';
      // We use only https
      var result = "https://";
      result += window.document.location.host;
      port = typeof port !== 'undefined' ? port : window.document.location.port;
      if(port == "")
        result += "/";
      else
        result += ":" + port + "/";
      return result;
    },
    
    parseUTCToLocalTime:function(UTCdateString) {
      try {
        var localTime = new Date(
          Date.parse(UTCdateString).getTime() 
            + (Date.parse(UTCdateString).getUTCOffset() / 100 * 60 * 60 * 1000))
      } catch (err) {
        var localTime = null;
      }
      return localTime;
    },
    
    changeUTCStringToLocalString:function(UTCdateString) {
      try {
        var local = this.parseUTCToLocalTime(UTCdateString);
        var result = local.toString('yyyy-MM-dd HH:mm');
      } catch(err) {
        var result = '';
      }
      return result;
    },
    
    changeTimelineToLocal:function(arr) {
      for(var i = 0; i < arr.length; i++) {
        if(arr[i] != null) {
          arr[i][0] = this.changeUTCStringToLocalString(arr[i][0]);
        } else {
          continue;
        }
      }
      return arr;
    },
    
    changeTimelineToUTCPresentation:function(arr) {
      for(var i = 0; i < arr.length; i++) {
        if(arr[i] != null) {
          var d = Date.parse(arr[i][0])
          if(d != null)
            arr[i][0] = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
          else 
            arr[i][0] = null;
        } else {
          continue;
        }
      }
      return arr;
    },
    
    showHourglass : function() {
      //$('body').append('<div id="hourglass_visible" class="waiting"></div>');
      $('body').append('<div id="hourglass_visible" style="position: absolute; top: 40px; left: 5px;">Loading...</div>');
    },
    
    hideHourglass : function() {
      $('#hourglass_visible').remove();
    },
    
    // Converts seconds (int) to string
    secondsToString : function(sec) {
      var hr, min;
      sec = Math.floor(sec);
      hr = Math.floor(sec / 3600);
      min = Math.floor((sec - (hr * 3600)) / 60);
      sec -= (hr * 3600) + (min * 60);
      sec += '';
      min += '';
      while (min.length < 2) {
        min = '0' + min;
      }
      while (sec.length < 2) {
        sec = '0' + sec;
      }
      hr = hr ? hr + ':' : '';
      return hr + min + ':' + sec;
    },
      
    // Resizes canvas found with the id provided
    resizeCanvas : function (id, height){          
      canvas = document.getElementById(id);
      if (canvas.width  < window.innerWidth) {
        canvas.width  = window.innerWidth - 50;
      }
      if(typeof(height) != 'number') {
        canvas.height = canvas.width / 8;
      } else {
        canvas.height = height;
      }
    },

    // Capitalizes the first letter
    capitaliseFirstLetter : function (string)
    {
      try {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }
      catch(err) {
        console.log(err);
      }
    },

    // Runtime popup is used to show iframe content
    runtimePopup : function (path, popupafterclose) {
      var maxWidth = window.innerWidth * 0.8;
      var maxHeight = window.innerHeight * 0.8;
      var template = "<div data-role='popup' class='ui-content messagePopup' style='max-width:" + maxWidth + "px;'>" 
          + "<a href='#' data-role='button' data-theme='g' data-icon='delete' data-iconpos='notext' " 
          + " class='ui-btn-right closePopup'>Close</a> <span> " 
          + "<iframe src='" + path + "' style='overflow:hidden; height:" + maxHeight + "; width:" + maxWidth + ";' height='" + maxHeight + "' width='" + maxWidth + "' seamless></iframe></div>";
      
      popupafterclose = popupafterclose ? popupafterclose : function () {};
     
      $.mobile.ajaxEnabled = false;
      $.mobile.activePage.append(template).trigger("create");
     
      $.mobile.activePage.find(".closePopup").bind("tap", function (e) {
        $.mobile.activePage.find(".messagePopup").popup("close");
      });
     
      $.mobile.activePage.find(".messagePopup").popup({ dismissible: false, history: false }).popup("open").bind({
        popupafterclose: function () {
          $(this).unbind("popupafterclose").remove();
          popupafterclose();
          $.mobile.ajaxEnabled = true;
        }
      });
    },

    // Get URL parameter with name
    gup : function ( name ){
      name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");  
      var regexS = "[\\?&]"+name+"=([^&#]*)";  
      var regex = new RegExp( regexS );  
      var results = regex.exec( window.location.href ); 
       if( results == null )    return "";  
      else    return results[1];
    }
  };
}());
