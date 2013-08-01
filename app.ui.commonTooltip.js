/*

WellMU debugging dashboard v. 0.0.1

Common tooltip is shared between highcharts and gantt charts

Public functions:
setupTooltips - initializes the component
syncTooltip - called by highcharts event handler when tooltips are desired to be shown

*/

commonTooltipUI = (function(commonTooltipUI) {
	var charts = [];
	var _setupTooltips = function (container) {
    if(charts.indexOf(container) != -1) return;
    charts.push($(container).highcharts());
    $(charts).each(function(i, el){
        $(el.container).mouseleave(function(){
          try {
            for(i=0; i < charts.length; i++) {
              charts[i].tooltip.hide();
            }
          }catch(err) {}
        });
    });
	};
  _syncTooltip = function (container, p) {
    var i=0, j=0, k=0, data;
    try {
      for(i=0; i < charts.length; i++) {
        if(container.id != charts[i].container.id){
          for(k=0; k < charts[i].series.length; k++) {
            data = charts[i].series[k].data;
            for(j=0; j<data.length; j++) {
              if (data[j].x === p) {
                charts[i].tooltip.refresh( charts[i].series[k].data[j] );
                // charts[i].series[k].tooltipOptions.formatter = formatter;
                return;
              }
            }
          }
          charts[i].tooltip.hide();
        } else {
          for(k=0; k < charts[i].series.length; k++) {
            data = charts[i].series[k].data;
            for(j=0; j<data.length; j++) {
              if (data[j].x === p) {
                charts[i].tooltip.refresh( charts[i].series[k].data[j] );
              }
            }
          }
        }
      }
    } catch(err) {
    
    }
  };
  return {
    setupTooltips: _setupTooltips,
    syncTooltip: _syncTooltip
  };

}());