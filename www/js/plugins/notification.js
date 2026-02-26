/*
 * Instant Developer Next
 * Copyright Pro Gamma Spa 2000-2015
 * All rights reserved
 */


/* global cordova, PushNotification, device */

var Plugin = Plugin || {};

/*
 * Create plugin object
 * see also nativedialogs.js
 */
Plugin.Notification = Plugin.Notification || {};


/*
 * Init plugin
 */
Plugin.Notification.init = function ()
{
  this.dialogQueue = [];
  this.clearingDialogQueue = false;
  //
  cordova.plugins.notification.local.on("click", function (notification, state) {
    notification.state = state;
    // Send to every app until we can identify the app that created the notification
    AppMan.sendMessage({obj: "device-notification", id: "onClick", content: notification});
  });
  cordova.plugins.notification.local.on("trigger", function (notification, state) {
    notification.state = state;
    // Send to every app until we can identify the app that created the notification
    AppMan.sendMessage({obj: "device-notification", id: "onTrigger", content: notification});
  });
};


/*
 * Makes the device beep for a give number of times
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Notification.beep = function (req)
{
  navigator.notification.beep(req.params.number);
};


/*
 * Schedule a local notification
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Notification.schedule = function (req)
{
  cordova.plugins.notification.local.schedule(req.params.notification);
};


/*
 * update a local notification
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Notification.update = function (req)
{
  cordova.plugins.notification.local.update(req.params.notification);
};


/*
 * clear a local notification
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Notification.clear = function (req)
{
  cordova.plugins.notification.local.clear(req.params.notification);
};


/*
 * clear all local notifications
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Notification.clearAll = function ()
{
  cordova.plugins.notification.local.clearAll();
};


/*
 * cancel a local notification
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Notification.cancel = function (req)
{
  cordova.plugins.notification.local.cancel(req.params.notification);
};


/*
 * cancel all local notifications
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Notification.cancelAll = function ()
{
  cordova.plugins.notification.local.cancelAll();
};


/*
 * query for permissions
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Notification.hasPermission = function (req)
{
  cordova.plugins.notification.local.hasPermission(
          function (granted) {
            req.setResult(granted);
          }
  );
};


/*
 * register for push notifications
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Notification.register = function (req)
{
  this.push = PushNotification.init({
    android: {
      senderID: req.params.senderID || "643945480332"
    },
    ios: {
      badge: true,
      sound: true,
      alert: true
    },
    windows: {
      channelName: req.params.senderID + ""
    }
  });
  //
  this.push.on('registration', function (data) {
    var tktype = "";
    if (device.platform === "Android")
      tktype = "gcm-";
    if (device.platform === "iOS")
      tktype = "apn-";
    req.setResult(tktype + data.registrationId);
  });
  //
  this.push.on('notification', function (data) {
    if (device.platform === "iOS") {
      if (!this.lastPushTimeStamp) {
        this.lastPushTimeStamp = new Date();
        this.lastPushNotification = JSON.stringify(data);
      }
      else {
        let elapsedTime = new Date() - this.lastPushTimeStamp;
        let sameNotification = JSON.stringify(data) === this.lastPushNotification;
        //
        delete this.lastPushTimeStamp;
        delete this.lastPushNotification;
        //
        // Due to a bug in iOS 18, the "notification" listener fires twice (https://forums.developer.apple.com/forums/thread/761597)
        // So I skip the second notification if it's the same as the first one and it arrived after less than 500ms
        if (elapsedTime < 500 && sameNotification)
          return;
      }
    }
    //
    req.app.sendMessage({obj: "device-notification", id: "onClick", content: data});
    //
    if (data.additionalData.notId) {
      setTimeout(function () {
        this.push.finish(function () {
          //console.log("processing of push data is finished");
        }, function () {
          //console.log("something went wrong with push.finish for ID = " + data.additionalData.notId);
        }, data.additionalData.notId);
      }.bind(this), 20000);
    }
  }.bind(this));
  //
  this.push.on('error', function (e) {
    var msg = e.message || "error";
    req.setError(msg);
  });
};


/*
 * set application icon badge count
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Notification.setBadge = function (req)
{
  if (!this.push)
    return;
  //
  this.push.setApplicationIconBadgeNumber(function () {
    console.log('success');
  }, function () {
    console.log('error');
  }, req.params.count);
};


/*
 * get application icon badge count
 * @param {type} req - pluginmanager.js request obj
 * @returns {undefined}
 */
Plugin.Notification.getBadge = function (req)
{
  if (!this.push) {
    req.setError("push notification not registered");
    return;
  }
  //
  this.push.getApplicationIconBadgeNumber(function (n) {
    req.setResult(n);
  }, function () {
    req.setError("error");
  });
};
