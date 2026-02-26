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
Plugin.StatusBar = {};


/*
 * Init plugin
 */
Plugin.StatusBar.init = function ()
{
};


/*
 * Hides the status bar
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.StatusBar.hide = function (req)
{
  StatusBar.hide();
};


/*
 * Shows the status bar
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.StatusBar.show = function (req)
{
  StatusBar.show();
};


/*
 * Sets the status bar color
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.StatusBar.setBackgroundColor = function (req)
{
  StatusBar.backgroundColorByHexString(req.params.color);
};


/*
 * Changes status bar status
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.StatusBar.overlaysWebView = function (req)
{
  req.app.setFullscreen(req.params.status);
  //
  StatusBar.overlaysWebView(req.params.status);
};
