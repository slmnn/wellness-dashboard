/*

WellMU debugging dashboard v. 0.0.1

Handler functions for jQueryMobile buttons and datescrollers

*/

$(document).ready(function() {
  $(document).bind("pagebeforechange", function( event, data ) {
    $.mobile.pageData = (data && data.options && data.options.pageData)
      ? data.options.pageData
      : null;
  });
  $( "#button-prev" ).on("click", function(){
    wellnessAPISingleDay.prevDay();
  });
  $( "#button-next" ).on("click", function(){
    wellnessAPISingleDay.nextDay();
  });
  var today = new Date();
  var lastEventTime = 0;
  $('#datescroller').mobiscroll().date({
    theme: 'jqm',
    display: 'bubble',
    mode: 'mixed',
    animate: 'fade',
    dateOrder: 'mmD ddyy',
    maxDate: today,
    onSelect: function(dateText, instance) {
      var d = new Date();
      if(d.getTime() - lastEventTime > 1000) {
        lastEventTime = d.getTime();
        try {
          wellnessAPISingleDay.setDate($('#datescroller').mobiscroll('getDate'));
        } catch (err) {
          console.log('Error with mobiscroll', err);
        }
        if(typeof event == 'undefined')
          event= window.Event;
        if(typeof event.stopPropagation !== 'undefined')
          event.stopPropagation();
        else
          window.event.cancelBubble = true
      } else {
        console.log('Preventing date change. Seems that you doubleclicked the change button');
      }
      return instance;
    }
  });
  $('#datescroller-periodstart').mobiscroll().date({
    theme: 'jqm',
    display: 'bubble',
    mode: 'mixed',
    animate: 'fade',
    dateOrder: 'mmD ddyy',
    maxDate: today,
    onSelect: function(dateText, instance) { 
      var d = new Date();
      if(d.getTime() - lastEventTime > 1000) {
        lastEventTime = d.getTime();
        try {
          var startDate = Date.parse($('#datescroller-periodstart').mobiscroll('getDate'));
        } catch (err) {
          console.log('Error with mobiscroll', err);
        }
        if(startDate == null) {
          startDate = Date.today().add({days: (wellnessAPILongerView.getPeriod() * -1)});
        }
        
        if(typeof event == 'undefined') {
          event = window.Event;
        }
        if(typeof event.stopPropagation !== 'undefined')
          event.stopPropagation();
        else
          window.event.cancelBubble = true
        wellnessAPILongerView.init(startDate);
      } else {
        console.log('Preventing date change. Seems that you doubleclicked the change button');
      }
      return instance;
    }
  });
  $('#datescroller-periodstart').mobiscroll('setDate', Date.today().add({days: (wellnessAPILongerView.getPeriod() * -1)}), true);
  $('#single-day-page').on('pageshow',function(event, ui){
    if(Common.gup('noDateChange') != 'true') {
      var date = Common.gup('date');
      wellnessAPISingleDay.setDate(date);
    }
  });
  $('#multiple-day-page').on('pageshow',function(event, ui){
    if(Common.gup('period') != '') {
      var period = parseInt(Common.gup('date'));
      $("#radio-choice-" + period).attr("checked",true).checkboxradio("refresh");
    }
  });
  $(".select-choice").bind( "change", function(event, ui) {
    console.log(event, ui);
    console.log(this.id, $(this).val());
    if ($(this).val() === '') return;
    if(this.id == 'select-choice-1') {
      $("#select-choice-2 option[disabled=disabled]").removeAttr('disabled');
      $("#select-choice-2 option:contains('" + $(this).val() + "')").attr('disabled','disabled');
    } else {
      $("#select-choice-1 option[disabled=disabled]").removeAttr('disabled');
      $("#select-choice-1 option:contains('" + $(this).val() + "')").attr('disabled','disabled');
    }
    if($('#select-choice-2').val() != '' && $('#select-choice-1').val() != '') {
      wellnessAPILongerView.hideOtherSeries($('#select-choice-2').val(), $('#select-choice-1').val())
    }
    if(event.stopPropagation)
      event.stopPropagation();
    else
      window.event.cancelBubble = true
    return instance;
  });
  $("input[name=radio-choice]").bind( "change", function(event, ui) {
    console.log(this.id, $(this).val());
    wellnessAPILongerView.setPeriod(parseInt($(this).val()));
  });
  setTimeout('$.mobile.changePage("#password-dialog", "none", true, true);', 500); 
});