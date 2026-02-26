/*
 * Instant Developer Next
 * Copyright Pro Gamma Spa 2000-2015
 * All rights reserved
 */


/* global cordova, device */

var Plugin = Plugin || {};

/*
 * Create plugin object
 */
Plugin.Device = {};
var AppMan = AppMan || {};

/*
 * Init plugin
 */
Plugin.Device.init = function (cb)
{
  this.model = device.model;
  this.platform = device.platform;
  this.uuid = device.uuid;
  this.version = device.version;
  this.deviceName = cordova.plugins.deviceName.name;
  this.offlineTimeout = 0;
  this.onlineInterval = 0;
  this.onlineCount = 0;
  //
  // Set battery properties
  var pthis = this;
  window.addEventListener("batterystatus", function (info) {
    pthis.batteryLevel = info.level;
    pthis.isPlugged = info.isPlugged;
    AppMan.onDeviceChange({batteryLevel: pthis.batteryLevel, isPlugged: pthis.isPlugged});
  }, false);
  //
  // Set network properties
  this.networkState = navigator.connection.type;
  if (this.networkState === "none")
    Shell.setOffline(true);
  //
  window.addEventListener("offline", function () {
    //
    // Cancel online interval
    if (pthis.onlineInterval) {
      clearInterval(pthis.onlineInterval);
      pthis.onlineInterval = 0;
    }
    //
    // Wait for 300ms before send offline message to app
    if (!pthis.offlineTimeout) {
      pthis.offlineTimeout = setTimeout(function () {
        // push NONE as network state and send message
        pthis.networkState = "none";
        console.log("NETWORK OFFLINE status=" + pthis.networkState);
        AppMan.onDeviceChange({networkState: pthis.networkState});
        pthis.offlineTimeout = 0;
      }, 300);
    }
    Shell.setOffline(true);
  });
  //
  window.addEventListener("online", function () {
    //
    // Cancel offline timeout
    if (pthis.offlineTimeout) {
      clearTimeout(pthis.offlineTimeout);
      pthis.offlineTimeout = 0;
    }
    //
    // wait for 30*300ms to allow network connection to stabilize
    if (!pthis.onlineInterval) {
      pthis.onlineCount = 0;
      pthis.onlineInterval = setInterval(function () {
        pthis.networkState = navigator.connection.type;
        if (pthis.networkState === "none") {
          pthis.onlineCount++;
          if (pthis.onlineCount === 30) {
            clearInterval(pthis.onlineInterval);
            pthis.onlineInterval = 0;
          }
        }
        else {
          clearInterval(pthis.onlineInterval);
          pthis.onlineInterval = 0;
          console.log("NETWORK ONLINE status=" + pthis.networkState);
          AppMan.onDeviceChange({networkState: pthis.networkState});
        }
      }, 300);
    }
    Shell.setOffline(false);
  });
  //
  // Call cb after a while to decrement callback count
  setTimeout(function () {
    cb();
  }, 0);
  //
  // Return true to increment callback count
  return true;
};


/*
 * Returns any info for this device
 */
Plugin.Device.getProp = function (app)
{
  var p = {};
  p.model = this.model;
  p.platform = this.platform;
  p.uuid = this.uuid;
  p.version = this.version;
  p.name = this.deviceName;
  p.batteryLevel = this.batteryLevel;
  p.isPlugged = this.isPlugged;
  p.networkState = this.networkState;
  p.launcherID = Shell.config.launcherID;
  p.launcherName = Shell.config.launcherName;
  p.launcherVersion = Shell.config.launcherVersion;
  //
  // Send the username/authorization token to the app (if any)
  if (Shell.profileData && Shell.profileData.autk)
    p.autk = Shell.profileData.autk;
  if (Shell.profileData && Shell.profileData.username)
    p.username = Shell.profileData.username;
  //
  // Send user segment to the app (if any)
  var userSegments = JSON.parse(localStorage.getItem("user-segments") || "{}");
  if (app && userSegments[app.name])
    p.userSegment = userSegments[app.name];
  //
  return p;
};

/*
 * An app has started, setting device property
 */
Plugin.Device.startApp = function (app)
{
  app.setProp(this.getProp(app));
  if (app.root)
    app.setProp({rootApp: true}, true);
};

/*
 * Lock orientation
 */
Plugin.Device.lockOrientation = function (req)
{
  if (!!window.screen.orientation.lock)
    window.screen.orientation.lock(req.params);
};


/*
 * Unlock orientation
 */
Plugin.Device.unlockOrientation = function ()
{
  if (!!window.screen.orientation.unlock)
    window.screen.orientation.unlock();
};


/*
 * Prevent or allow standby
 */
Plugin.Device.keepAwake = function (req)
{
  if (req.params)
    window.plugins.insomnia.keepAwake();
  else
    window.plugins.insomnia.allowSleepAgain();
};


/**
 * checkForUpdates
 **/
Plugin.Device.checkForUpdates = function (options)
{
  Shell.updateLauncher();
  Shell.updateParams();
  AppMan.updateApps();
};


/*
 * An app has stopped, allow stand by
 */
Plugin.Device.stopApp = function (app)
{
  window.plugins.insomnia.allowSleepAgain();
  Plugin.Device.unlockOrientation();
};


/*
 * Set user segment
 * @param {Object} req
 */
Plugin.Device.setUserSegment = function (req)
{
  var appName = req.app.name;
  var userSegment = req.params.userSegment;
  //
  // Get user segments map and update it
  var userSegments = JSON.parse(localStorage.getItem("user-segments") || "{}");
  userSegments[appName] = userSegment || undefined;
  localStorage.setItem("user-segments", JSON.stringify(userSegments));
  //
  this.checkForUpdates();
};


/*
 * Evaluate javascript
 * @param {Object} req
 */
Plugin.Device.eval = function (req)
{
  try {
    let res = eval(req.params.jscode);
    req.setResult(res);
  }
  catch (ex) {
    req.setError(ex.message || ex);
  }
};