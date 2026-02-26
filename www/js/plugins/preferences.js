/*
 * Instant Developer Next
 * Copyright Pro Gamma Spa 2000-2015
 * All rights reserved
 */

/* global cordova, StatusBar */

var Plugin = Plugin || {};

/*
 * Create plugin object
 */
Plugin.Preferences = {};


/*
 * Init plugin
 */
Plugin.Preferences.init = function ()
{
};


/*
 * Show the app preferences
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Preferences.show = function (req)
{
  var setting = req.params.setting || "application_details";
  cordova.plugins.settings.open(setting, function (ris) {
  }, function (err) {
  });
};


/*
 * Fetch an app preference (deprecated)
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Preferences.fetch = function (req)
{
  req.setError("This method is deprecated and will be removed in future versions");
};


/*
 * Store an app preference (deprecated)
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Preferences.store = function (req)
{
};


/*
 */
Plugin.Preferences.isIgnoringBatteryOptimizations = function (req)
{
  if (Shell.isIOS())
    req.setResult();
  else {
    cordova.plugins.DozeOptimize.IsIgnoringBatteryOptimizations(function (result) {
      req.setResult(result);
    }, function (error) {
      req.setError(error);
    });
  }
};


/*
 */
Plugin.Preferences.isIgnoringDataSaver = function (req)
{
  if (Shell.isIOS())
    req.setResult();
  else {
    cordova.plugins.DozeOptimize.IsIgnoringDataSaver(function (result) {
      req.setResult(result);
    }, function (error) {
      req.setError(error);
    });
  }
};


/*
 */
Plugin.Preferences.ignoreBatteryOptimizations = function (req)
{
  if (Shell.isIOS())
    req.setResult();
  else {
    cordova.plugins.DozeOptimize.RequestOptimizations(function (result) {
      req.setResult(result);
    }, function (error) {
      req.setError(error);
    });
  }
};


/*
 */
Plugin.Preferences.displayOptimizationsMenu = function (req)
{
  if (Shell.isIOS())
    req.setResult();
  else {
    cordova.plugins.DozeOptimize.RequestOptimizationsMenu(function (result) {
      req.setResult(result);
    }, function (error) {
      req.setError(error);
    });
  }
};


/*
 */
Plugin.Preferences.displayDataSaverMenu = function (req)
{
  if (Shell.isIOS())
    req.setResult();
  else {
    cordova.plugins.DozeOptimize.RequestDataSaverMenu(function (result) {
      req.setResult(result);
    }, function (error) {
      req.setError(error);
    });
  }
};