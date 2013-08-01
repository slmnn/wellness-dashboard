/*

WellMU debugging dashboard v. 0.0.1

Creates the tab component for single day view

Amplify signals: 
-

Public functions:
newTab - creates a new tab with title
clearTab - removes content from a given tab

*/

var tabUI = (function(tabUI) {
  var _tabs = [];
  return {
    newTab: function(title) {
      // Event binding
      $('a[data-toggle="tab"]').on('shown', function (e) {
        e.target // activated tab
        e.relatedTarget // previous tab
        $.sparkline_display_visible();
      })
    
      // See if tab already exists
      if($('#tab-content-' + title).length > 0)
        return 'tab-content-' + title;
      
      // First we create the tab
      var liActive = '';
      var divActive = '';
      if(_tabs.length == 0) { 
        liActive = ' class="active"'; 
        divActive = ' active';
      }
      var HTML = '<li' + liActive + '><a data-toggle="tab" href="#tab-content-' + title + '">' + title + '</a></li>';
      $('.nav-tabs').append(HTML);
      
      // Then we create the contents div
      var HTML = '<div class="tab-pane ' + divActive + '" id="tab-content-' + title + '"></div>';
      $('.tab-content').append(HTML);
      
      // Returning content div id
      _tabs.push('tab-content-' + title);
      return 'tab-content-' + title;
    },
    clearTab: function(title) {
      $('#tab-content-' + title).empty();
    }
  };
}());