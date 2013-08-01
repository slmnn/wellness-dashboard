/*

WellMU debugging dashboard v. 0.0.1

Creates analysis UI. 

Signals: 
analysis_available - set of analysis data
analysis_possible - set of analysis that require user actions (e.g. PSQI form)

Public functions:
init - initializes the component
clear - resets the component

*/

var analysisUI = (function(analysisUI) {
  var _init = function() {
    $("#analysis-container").remove();
    amplify.subscribe('analysis_available', function(d) {
      if($('#analysis_available_' + d.type).length == 0) {
        $("#analysis-container").append('<div id="analysis_available_' + d.type + '"><b>' + d.type + '</b><br /><table id="analysis_available_table_' + d.type + '" style="width: 90%"></table></div>');
      }
      var HTML = '<tr><td style="align: left;">' + d.name + '</td><td style="align: right;"><b>' + d.value + '</b></td><td style="align: right;">' + d.date + '</td></tr>';
      $("#analysis_available_table_" + d.type).append(HTML);
    });
    amplify.subscribe('analysis_possible', function(d) {
      if($('#analysis_possible_' + d.type).length == 0) {
        var HTML = '<div id="analysis_possible_' + d.id + '" style="margin-bottom: 10px; margin-top: 6px;"><b>Possible Analysis (' + d.type + ')</b></br></div>';
        $("#analysis-container").append(HTML);
      }
      $("#analysis_possible_" + d.id).append(
        '<a href="#" data-rel="dialog" onClick="Common.runtimePopup(\''+ d.path +'\', function() {  } );">' + d.message + '</a><br/>'
      );
    });
    if($("#analysis-container").length == 0) {
      var HTML = $('<div class="analysis-container table-wrapper" id="analysis-container"><b>Wellness Analysis</b></div>');
      var targetDivID = tabUI.newTab('Analysis');
      $('#' + targetDivID).append(HTML);
    }
  }
  var _clear = function() {
    $("#analysis-container").empty();
  }
  return {
    init: _init,
    clear: _clear
  }
}());