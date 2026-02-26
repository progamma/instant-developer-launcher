/*
 * Instant Developer Next
 * Copyright Pro Gamma Spa 2000-2015
 * All rights reserved
 */


/* global cordova */

var Plugin = Plugin || {};
var PlugMan = PlugMan || {};

/*
 * Create plugin object
 */
Plugin.Geolocation = {};


/*
 * Init plugin
 */
Plugin.Geolocation.init = function ()
{
  this.watchList = [];
};


/*
 * Measures the current position
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Geolocation.getCurrentPosition = function (req)
{
  var options = req.params.options || {};
  options.timeout = options.timeout || 5000;
  options.maximumAge = options.maximumAge || 300000;
  options.enableHighAccuracy = options.enableHighAccuracy ?? true;
  //
  navigator.geolocation.getCurrentPosition(function (position) {
    var c = {
      accuracy: position.coords.accuracy || undefined,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      latitude: position.coords.latitude || undefined,
      longitude: position.coords.longitude || undefined,
      speed: position.coords.speed || undefined
    };
    req.setResult(c);
  }, function (error) {
    req.setError(error.message);
  }, options);
};


/*
 * Sets a watch
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Geolocation.watchPosition = function (req)
{
  var options = req.params.options || {};
  options.timeout = options.timeout || 5000;
  options.maximumAge = options.maximumAge || 300000;
  options.enableHighAccuracy = options.enableHighAccuracy ?? true;
  //
  // Clean, then set.
  this.clearWatch(req);
  //
  var watchID = navigator.geolocation.watchPosition(function (position) {
    var c = {
      accuracy: position.coords.accuracy || undefined,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      latitude: position.coords.latitude || undefined,
      longitude: position.coords.longitude || undefined,
      speed: position.coords.speed || undefined
    };
    req.result = c;
    PlugMan.sendEvent(req, "Position");
  }, function (error) {
    req.result = {error: error.message};
    PlugMan.sendEvent(req, "Position");
  }, options);
  //
  // Remember which app requests this watch
  this.watchList.push({id: watchID, app: req.app});
};


/*
 * Clears a position watch for an app
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Geolocation.clearWatch = function (req)
{
  var i = this.getWatch(req.app);
  if (i > -1) {
    navigator.geolocation.clearWatch(this.watchList[i].id);
    this.watchList.splice(i, 1);
  }
};


/*
 * Returns the watch position for a given app if any
 */
Plugin.Geolocation.getWatch = function (app)
{
  for (var i = 0; i < this.watchList.length; i++) {
    if (this.watchList[i].app === app)
      return i;
  }
  return -1;
};


/*
 * An app has stopped, clean up its watch
 */
Plugin.Geolocation.stopApp = function (app)
{
  this.clearWatch({app: app});
};

