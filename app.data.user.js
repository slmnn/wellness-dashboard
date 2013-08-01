/*

WellMU debugging dashboard v. 0.0.1

User data structure. Used across modules.

*/

var userData = (function(userData) {
	var _data = undefined;
	var _credentials = undefined;
	var _username = undefined;
  var _services = [];
  var _calendars = [];
	var _beddit = false;
	var _withings = false;
	var _fitbit = false;
  var _fitbitGoals = undefined;
	var _twitter = false;
	var _nightstart = null;
	var _nightend = null;
	return {
		username: _username,
		data: _data,
		credentials: _credentials,
		services: _services,
		calendars: _calendars,
		beddit: _beddit,
		withings: _withings,
		fitbit: _fitbit,
		fitbitGoals: _fitbitGoals,
		twitter: _twitter
	}
}());