/*
 * Instant Developer Next
 * Copyright Pro Gamma Spa 2000-2015
 * All rights reserved
 */

/* global Client, componentHandler */

var PlugMan = PlugMan || {};
var AppMan = AppMan || {};

// Inplace apps need some variables to be defined elsewhere
var App = undefined;
var require = undefined;
var module = undefined;
var process = undefined;


/**
 * AppDef object
 * @param {Object} config
 * @param {Boolean} init
 */
var AppDef = AppDef || function (config, init)
{
  this.change(config, init === undefined ? true : init);
  this.id = this.name;
  this.loaded = false;
  this.stopped = false;
};


/**
 * Change some properties
 * @param {Object} config
 * @param {Boolean} init
 */
AppDef.prototype.change = function (config, init)
{
  var oldUrl = this.url;
  var oldVersion = this.version;
  var oldBuildDate = this.buildDate;
  //
  for (var p in config) {
    this[p] = config[p];
  }
  //
  // If the previous url was the root one, strip it to enable comparison with the new one
  if ((oldUrl || "").startsWith("root:"))
    oldUrl = oldUrl.substring(5);
  //
  // Try to install if the app is offline, it has an update url
  // and we are not only creating this app object
  // Hovewer, if the app was installing and something went wrong, we'll restart the installation
  var toInstall = (!init || this.installing) && !this.online && this.url;
  //
  // But, if this is the root app, it has been declared as installed
  // and the previuos url was empty, do not do it because the root app
  // is already on disk
  if ((!oldUrl || (this.url || "").startsWith("root:")) && this.root && this.installed) {
    toInstall = false;
  }
  //
  // installStarted is not saved in the app config, so it can be used
  // as a semaphore to run install only once
  if (toInstall && !this.installStarted) {
    if (this.url !== oldUrl || this.version !== oldVersion || this.buildDate !== oldBuildDate
            || this.error || this.installing) {
      var oldInstalled = this.installed;
      this.error = "";
      this.installed = false;
      this.installing = true;
      this.installStarted = true;
      //
      // An upgrade is available... stop app immediately
      if (this.root) {
        Shell.setWaitMode(true, Shell.config.strings["upgrading-app-HTML"]);
        this.stop();
      }
      //
      this.install(function (err) {
        // Only for errors, avoid unzip progress callback
        if (err && !err.total) {
          //
          Shell.setWaitMode(false);
          //
          this.installing = false;
          this.installStarted = false;
          this.installed = oldInstalled;
          this.url = oldUrl;
          this.version = oldVersion;
          this.buildDate = oldBuildDate;
          this.error = err;
          this.updateDom();
          AppMan.saveApps();
          //
          // Restart app as it was stopped when install started
          if (this.root) {
            setTimeout(function () {
              window.location.reload();
            }, 500);
          }
        }
        if (!err) {
          //
          this.installing = false;
          this.installStarted = false;
          //
          Shell.setWaitMode(false);
          //
          AppMan.saveApps();
          //
          // Setting new root item
          if (this.root) {
            localStorage.setItem("root", this.name);
            localStorage.setItem("root-lv", Shell.config.rootApp.name + "-" + Shell.config.rootApp.version);
          }
          //
          // Clearing cache as we want to reload this app without closing the shell
          window.cache.clear(function (status) {
            console.log("cache cleared: ", status);
            // we have a new version of a root app!
            if (this.root) {
              setTimeout(function () {
                window.location.reload();
              }, 500);
            }
          }.bind(this), function (error) {
            console.error("error while clearing cache: ", error);
            // Restart app anyway
            if (this.root) {
              setTimeout(function () {
                window.location.reload();
              }, 500);
            }
          }.bind(this));
        }
      }.bind(this));
    }
  }
};


/**
 * Check if the app is expired or not
 */
AppDef.prototype.isExpired = function ()
{
  return (this.expire && this.expire < new Date());
};


/**
 * Get the configuration object for this app
 */
AppDef.prototype.getConfig = function ()
{
  // The root/ide app should not be saved
  if ((this.root && (!this.url || this.url === "root")) || this.ide)
    return;
  //
  var ris = {};
  //
  ris.name = this.name;
  ris.title = this.title;
  ris.version = this.version;
  ris.header = this.header;
  ris.url = this.url;
  ris.updateURL = this.updateURL;
  ris.dir = this.dir;
  ris.root = this.root;
  ris.online = this.online;
  ris.expire = this.expire;
  ris.installed = this.installed;
  ris.installing = this.installing;
  ris.visible = this.visible;
  ris.order = this.order;
  ris.icon = this.icon;
  ris.kick = this.kick;
  ris.beta = this.beta;
  ris.removable = this.removable;
  ris.buildDate = this.buildDate;
  ris.userSegment = this.userSegment;
  //
  return ris;
};


/**
 * create / update the Dom object for this app
 */
AppDef.prototype.updateDom = function ()
{
  var pthis = this;
  var apps = document.getElementById("apps-list");
  //
  if (this.visible) {
    if (!this.box) {
      this.box = document.createElement("div");
      this.box.id = "apps-" + this.name;
      this.box.app = this.name;
      this.box.className = "appbox";
      this.box.style.order = this.order;
      //
      this.boxContent = document.createElement("div");
      this.boxContent.className = "appbox-content";
      this.boxContent.onclick = function () {
        pthis.activate();
      };
      //
      this.boxContent.ontouchstart = function (ev) {
        pthis.touchStart(ev);
      };
      this.boxContent.ontouchmove = function (ev) {
        pthis.touchMove(ev);
      };
      this.boxContent.onmousedown = function (ev) {
        pthis.touchStart(ev);
      };
      this.boxContent.onmousemove = function (ev) {
        pthis.touchMove(ev);
      };
      //
      this.box.appendChild(this.boxContent);
      //
      this.boxActions = document.createElement("div");
      this.boxActions.className = "appbox-actions";
      this.box.appendChild(this.boxActions);
      //
      this.deleteButton = document.createElement("button");
      this.deleteButton.className = "btn btn-appbox icon-delete";
      this.deleteButton.onclick = function () {
        AppMan.deleteApp(pthis.name);
      };
      this.boxActions.appendChild(this.deleteButton);
      //
      this.boxMain = document.createElement("div");
      this.boxMain.className = "appbox-main";
      this.boxContent.appendChild(this.boxMain);
      //
      this.boxData = document.createElement("div");
      this.boxData.className = "appbox-data";
      this.boxMain.appendChild(this.boxData);
      //
      this.boxVersion = document.createElement("div");
      this.boxVersion.className = "appbox-version";
      this.boxMain.appendChild(this.boxVersion);
      //
      this.boxName = document.createElement("h1");
      this.boxMain.appendChild(this.boxName);
      //
      this.boxStatus = document.createElement("h3");
      this.boxMain.appendChild(this.boxStatus);
      //
      apps.appendChild(this.box);
    }
    // Update icon box
    if (this.icon && !this.boxIcon) {
      this.boxIcon = document.createElement("img");
      this.boxIcon.className = "appbox-icon";
      this.boxContent.insertBefore(this.boxIcon, this.boxMain);
    }
    if (!this.icon && this.boxIcon) {
      this.boxIcon.remove();
      delete this.boxIcon;
    }
    //
    var status = "";
    if (this.error) {
      status = _t("status-error") + this.error;
      this.boxStatus.classList.add("status-error");
    }
    else {
      this.boxStatus.classList.remove("status-error");
      if (!this.online && !this.installed)
        status = _t("status-install");
      if (this.online && Shell.isOffline)
        status = _t("status-offline");
    }
    this.boxStatus.display = status ? "" : "none";
    this.boxStatus.textContent = status;
    if (status)
      this.boxContent.classList.add("appbox-disabled");
    else
      this.boxContent.classList.remove("appbox-disabled");
    //
    if (this.iframe && !this.loaded)
      this.box.classList.add("appbox-loading");
    else
      this.box.classList.remove("appbox-loading");
    //
    this.boxData.innerHTML = this.header;
    this.boxVersion.innerHTML = this.version;
    if (this.beta)
      this.boxVersion.setAttribute("beta", "");
    else
      this.boxVersion.removeAttribute("beta");
    this.boxName.innerHTML = this.title;
    if (this.boxIcon)
      this.boxIcon.src = this.icon;
  }
  else {
    if (this.box) {
      this.box.parentNode.removeChild(this.box);
      this.box = undefined;
    }
  }
};


/**
 * An app box has been touched
 * @param {event} ev
 */
AppDef.prototype.touchStart = function (ev)
{
  this.touchX = ev.screenX;
  if (ev.targetTouches)
    this.touchX = ev.targetTouches[0].screenX;
};


/**
 * An app box has been touched
 * @param {event} ev
 */
AppDef.prototype.touchMove = function (ev)
{
  if (this.touchX) {
    var x = ev.screenX;
    if (ev.targetTouches)
      x = ev.targetTouches[0].screenX;
    if (this.touchX - x > 60 && this.removable)
      this.setSwiped(true);
  }
};


/**
 * An app box has been touched
 * @param {boolean} flag
 */
AppDef.prototype.setSwiped = function (flag)
{
  if (flag)
    this.box.classList.add("swiped");
  else
    this.box.classList.remove("swiped");
  this.swiped = flag;
  this.touchX = undefined;
};


/**
 * An app content has been clicked
 */
AppDef.prototype.activate = function ()
{
  if (this.touchX) {
    if (this.swiped)
      this.setSwiped(false);
    else {
      //
      var canStart = !this.error;
      if (this.online && Shell.isOffline)
        canStart = false;
      if (!this.online && !this.installed)
        canStart = false;
      //
      if (canStart)
        AppMan.startApp(this.name);
    }
  }
};


/**
 * filter the app list
 * @param {string} f filter
 */
AppDef.prototype.filter = function (f)
{
  var ok = !f || this.name.toUpperCase().indexOf(f.toUpperCase()) > -1;
  if (this.box)
    this.box.style.display = ok ? "" : "none";
  return ok;
};


/**
 * Initialize the app
 * @param {Object} params
 */
AppDef.prototype.start = function (params)
{
  this.stopped = false;
  this.startParams = params;
  //
  // App already started?
  if (this.iframe) {
    if (this.online) {
      if (this.iframe.contentWindow)
        this.iframe.contentWindow.location.reload();
      else {
        this.iframe.src = "about:blank";
        this.iframe.src = this.url;
      }
    }
    //
    // New startParams and the app is loaded?
    // launch onCommand again
    if (this.startParams && this.loaded) {
      this.sendMessage({id: "onCommand", content: {query: this.startParams}});
      delete this.startParams;
    }
    return;
  }
  //
  // Cannot start right now
  if (!this.online && !this.installed)
    return;
  if (this.online && Shell.isOffline)
    return;
  //
  // Not started... start it!
  this.iframe = document.createElement("iframe");
  this.iframe.id = this.id;
  this.iframe.frameBorder = 0;
  this.iframe.className = "app-ui";
  if (this.root)
    this.iframe.classList.add("root");
  //
  var d = this.dir;
  //
  if (this.root && !d)
    d = "apps/" + this.name + "/";
  //
  if (d && Shell.isIOS()) {
    var idx = d.indexOf("Library/NoCloud");
    if (idx > 0) {
      var d = cordova.file.dataDirectory + d.substring(idx + 16);
      d = window.WkWebView.convertFilePath(d);
    }
  }
  //
  // Start the process to load the app
  if (this.online)
    this.iframe.src = this.url;
  else
    this.iframe.src = d + "client/offlineLocal.html?" + this.version;
  //
  var pthis = this;
  //
  // Don't know why, but on iOS we need a "kick" to load an online app
  // using the "kick" property we can set a refresh timeout
  if (this.kick && this.online && Shell.getMobileOperatingSystem() === "iOS") {
    this.reloadTimer = setTimeout(function () {
      if (pthis.iframe.contentWindow)
        pthis.iframe.contentWindow.location.reload();
    }, this.kick);
  }
  //
  document.body.appendChild(this.iframe);
  //
  this.updateDom();
};


/**
 * A message from the app
 * @param {object} event
 */
AppDef.prototype.onMessage = function (event)
{
  if (typeof (event.data) === "string") {
    //
    if (event.data === "appStopped" && this.loaded) {
      document.getElementById("wait-msg").textContent = _t("wait-msg");
      this.stop(true);
    }
  }
  else if (event.data.viewmsg) {
    if (event.data.viewmsg === "appStarted")
      this.onLoad(event.data.params);
  }
  else {
    // this is a command to a plugin from this app
    event.data.app = this;
    PlugMan.processRequest(event.data);
  }
};


/**
 * Called when the app has been loaded and initialized
 * @param {type} params
 */
AppDef.prototype.onLoad = function (params)
{
  if (this.reloadTimer) {
    clearTimeout(this.reloadTimer);
    delete this.reloadTimer;
  }
  //
  if (params && params.sid)
    this.sid = params.sid;
  //
  // If it is already loaded, exit
  if (this.loaded)
    return;
  //
  this.loaded = true;
  //
  if (this.root) {
    if (this.iframe)
      ac(this.iframe.id, "effect-fadeIn");
  }
  else {
    if (Shell.isIOS())
      ac("wrapper", "effect-scaleDown");
    else
      ac("wrapper", "effect-fadeOut");
    if (this.iframe)
      ac(this.iframe.id, "effect-moveFromRight");
  }
  //
  // Set fullscreen by default
  this.setFullscreen(true);
  Shell.setSafeAreaVariables();
  //
  // Initializing app plugins
  PlugMan.startApp(this);
  //
  // Start other clients connected to the same session
  this.sendMessage({obj: "device-ui", id: "startGuests"});
  //
  // The app has just loaded, send startParams if present
  if (this.startParams) {
    this.sendMessage({id: "onCommand", content: {query: this.startParams}});
    delete this.startParams;
  }
  //
  this.updateDom();
};


/**
 * Stops the app
 * @param {bool} fromApp true if the stop was requested from the app itself
 */
AppDef.prototype.stop = function (fromApp)
{
  this.stopped = true;
  delete this.startParams;
  //
  // Hide App
  rc("wrapper", "effect-scaleDown");
  rc("wrapper", "effect-fadeOut");
  if (this.iframe && !this.root)
    rc(this.iframe.id, "effect-moveFromRight");
  //
  // if requested by the app, the root app should stop, if possible
  if (this.root && fromApp && navigator.app && navigator.app.exitApp) {
    navigator.app.exitApp();
    return;
  }
  //
  this.loaded = false;
  var pthis = this;
  //
  // Remove app after a while
  setTimeout(function () {
    pthis.remove();
  }, this.root ? 10 : 700);
  //
  PlugMan.stopApp(this);
};


/**
 * Removes the app from the DOM
 */
AppDef.prototype.remove = function ()
{
  if (this.iframe && this.iframe.parentNode)
    this.iframe.parentNode.removeChild(this.iframe);
  this.iframe = null;
  //
  // Restart root apps
  if (this.root) {
    var reload = this.root;
    //
    // Terminate session
    if (Client && Client.socket) {
      Client.socket.disconnect();
      Client.socket = undefined;
    }
    if (Client.Proxy && Client.Proxy.socket && Client.Proxy.socket.disconnect) {
      Client.Proxy.socket.disconnect();
      Client.Proxy.socket = undefined;
    }
    //
    // Unload scripts
    if (App && App.Observers && !reload) {
      Object.observe = undefined;
      Object.unobserve = undefined;
      Object.getNotifier = undefined;
      Object.clone = undefined;
    }
    //
    // removing MD objects
    if (window.componentHandler && !reload) {
      for (var v in Client.eleMap) {
        var d = Client.eleMap[v].domObj;
        if (d)
          componentHandler.downgradeElements(d);
      }
      for (var v in window) {
        if (v.substring(0, 8) === "Material") {
          delete window[v];
        }
      }
      delete window.componentHandler;
      componentHandler = undefined;
      //
      // MD requires a complete reload
      reload = true;
    }
    //
    if (!reload) {
      if (Client && Client.mainFrame && Client.mainFrame.removeAddedObjects)
        Client.mainFrame.removeAddedObjects();
      //
      Client = undefined;
      App = undefined;
      Client.Proxy = undefined;
      //
      // Reset file system instances
      Plugin.Shelldriverhandler.init();
    }
    //
    // Don't reload while installing...
    if (reload && !this.installStarted) {
      //
      // Loaded from IDE... activate reconnection after reload
      if (this.name === "ideapp")
        window.sessionStorage.setItem("reconnect", true);
      //
      window.location.reload();
    }
  }
};


/**
 * Send a message to the app
 * @param {object} msg
 * @param {string} orig
 */
AppDef.prototype.sendMessage = function (msg, orig)
{
  if (this.stopped)
    return;
  //
  msg.source = "shell";
  //
  if (this.iframe && this.iframe.contentWindow)
    this.iframe.contentWindow.postMessage(msg, orig || "*");
};


/**
 * Set device properties
 * @param {object} prop to set
 * @param {bool} client
 */
AppDef.prototype.setProp = function (prop, client)
{
  if (client) {
    this.sendMessage({obj: "device-ui", id: "setProp", content: prop, client: true});
  }
  else {
    this.sendMessage({obj: "device-ui", id: "setProp", content: prop});
    this.sendMessage({obj: "device-ui", id: "onChange", content: prop});
  }
};


/**
 * Put this app to front
 */
AppDef.prototype.bringToFront = function ()
{
};


/*
 * Create the app fs root dir
 * @returns {undefined}
 */
AppDef.prototype.createFs = function (cb)
{
  var fserror = {
    1: "NOT_FOUND_ERR",
    2: "SECURITY_ERR",
    3: "ABORT_ERR",
    4: "NOT_READABLE_ERR",
    5: "ENCODING_ERR",
    6: "NO_MODIFICATION_ALLOWED_ERR",
    7: "INVALID_STATE_ERR",
    8: "SYNTAX_ERR",
    9: "INVALID_MODIFICATION_ERR",
    10: "QUOTA_EXCEEDED_ERR",
    11: "TYPE_MISMATCH_ERR",
    12: "PATH_EXISTS_ERR"
  };
  //
  var fsErrorHandler = function (error) {
    var err = fserror[error.code] || error;
    if (cb)
      cb(err);
  };
  //
  var dataDir = cordova.file.dataDirectory;
  var cacheDir = cordova.file.cacheDirectory;
  var pthis = this;
  //
  // {CONTAINER DATA DIR} / fs / {appname}
  // {CONTAINER CACHE DIR} / fs / {appname}
  window.resolveLocalFileSystemURL(dataDir, function (dataDirEntry) {
    dataDirEntry.getDirectory("fs", {create: true, exclusive: false}, function (dataFsDirEntry) {
      dataFsDirEntry.getDirectory(pthis.name, {create: true, exclusive: false}, function () {
        window.resolveLocalFileSystemURL(cacheDir, function (cacheDirEntry) {
          cacheDirEntry.getDirectory("fs", {create: true, exclusive: false}, function (cacheFsDirEntry) {
            cacheFsDirEntry.getDirectory(pthis.name, {create: true, exclusive: false}, function () {
              cb();
            }, fsErrorHandler);
          }, fsErrorHandler);
        }, fsErrorHandler);
      }, fsErrorHandler);
    }, fsErrorHandler);
  }, fsErrorHandler);
};


/*
 * Returns true if the app is already installed
 * @returns {undefined}
 */
AppDef.prototype.checkInstall = function (cb)
{
  var dataDir = cordova.file.dataDirectory;
  var appDir = "apps/" + this.name;
  window.resolveLocalFileSystemURL(dataDir, function (dirEntry) {
    dirEntry.getDirectory(appDir, {create: false, exclusive: false}, function (dirEntry) {
      cb(true);
    }, function () {
      cb(false);
    });
  }, function () {
    cb(false);
  });
};


/*
 * Delete the app fs root dir
 * @returns {undefined}
 */
AppDef.prototype.cleanFs = function (cb)
{
  var fserror = {
    1: "NOT_FOUND_ERR",
    2: "SECURITY_ERR",
    3: "ABORT_ERR",
    4: "NOT_READABLE_ERR",
    5: "ENCODING_ERR",
    6: "NO_MODIFICATION_ALLOWED_ERR",
    7: "INVALID_STATE_ERR",
    8: "SYNTAX_ERR",
    9: "INVALID_MODIFICATION_ERR",
    10: "QUOTA_EXCEEDED_ERR",
    11: "TYPE_MISMATCH_ERR",
    12: "PATH_EXISTS_ERR"
  };
  var dataDir = cordova.file.dataDirectory;
  var cacheDir = cordova.file.cacheDirectory;
  var pthis = this;
  //
  // prepare remove functions
  var removeDataDir = function (c) {
    window.resolveLocalFileSystemURL(dataDir + "/fs/", function (dataDirEntry) {
      dataDirEntry.getDirectory(pthis.name, {create: false}, function (dataFsDirEntry) {
        dataFsDirEntry.removeRecursively(function () {
          c();
        }, function (error) {
          if (error.code !== 1)
            c(fserror[error.code]);
          else
            c();
        });
      }, function (error) {
        if (error.code !== 1)
          c(fserror[error.code]);
        else
          c();
      });
    });
  };
  //
  var removeCacheDir = function (c) {
    window.resolveLocalFileSystemURL(cacheDir + "/fs/", function (dataDirEntry) {
      dataDirEntry.getDirectory(pthis.name, {create: false}, function (dataFsDirEntry) {
        dataFsDirEntry.removeRecursively(function () {
          c();
        }, function (error) {
          if (error.code !== 1)
            c(fserror[error.code]);
          else
            c();
        });
      }, function (error) {
        if (error.code !== 1)
          c(fserror[error.code]);
        else
          c();
      });
    });
  };
  //
  // Execute remove functions
  removeDataDir(function (error) {
    if (error) {
      cb(error);
      return;
    }
    //
    removeCacheDir(function (error) {
      if (error) {
        cb(error);
        return;
      }
      //
      cb();
    });
  });
};


/*
 * Install a new app (called by AppManager plugin)
 * @returns {undefined}
 */
AppDef.prototype.install = function (cb)
{
  let dataPath = cordova.file.dataDirectory;
  let tempPath = dataPath + "/liveupdate/";
  //
  // Say to to user
  this.updateDom();
  //
  // error codes
  let fserror = {
    1: "NOT_FOUND_ERR",
    2: "SECURITY_ERR",
    3: "ABORT_ERR",
    4: "NOT_READABLE_ERR",
    5: "ENCODING_ERR",
    6: "NO_MODIFICATION_ALLOWED_ERR",
    7: "INVALID_STATE_ERR",
    8: "SYNTAX_ERR",
    9: "INVALID_MODIFICATION_ERR",
    10: "QUOTA_EXCEEDED_ERR",
    11: "TYPE_MISMATCH_ERR",
    12: "PATH_EXISTS_ERR"
  };
  //
  let fterror = {
    1: "FILE_NOT_FOUND_ERR",
    2: "INVALID_URL_ERR",
    3: "CONNECTION_ERR",
    4: "ABORT_ERR",
    5: "NOT_MODIFIED_ERR"
  };
  //
  let ftErrorHandler = function (error) {
    let err = fterror[error.code] || error;
    cb(err);
  };
  //
  let fsErrorHandler = function (error) {
    let err = fserror[error.code] || error;
    cb(err);
  };
  //
  let pthis = this;
  //
  // 1. download the version to tempdir/version.zip
  // 2. unzip it to apps/appname/
  // 3. delete it from tempdir/
  window.resolveLocalFileSystemURL(dataPath, function (mainDir) {
    // {create: true, exclusive: false} create if not there, don't complain if it's there
    mainDir.getDirectory("liveupdate/", {create: true, exclusive: false}, function (liveupdateDir) {
      let fileTransfer = new FileTransfer();
      let uri = encodeURI(pthis.url);
      fileTransfer.download(uri, tempPath + pthis.name + ".zip", function (zipFile) {
        // Create apps/appname
        mainDir.getDirectory("apps/", {create: true, exclusive: false}, function (appsDir) {
          // In case we are updating, exclusive false
          appsDir.getDirectory(pthis.name, {create: true, exclusive: false}, function (appDir) {
            // Delete previous app files
            appDir.removeRecursively(function () {
              // Unzip app bundle and then delete zip file
              zip.unzip(zipFile.nativeURL, appDir.nativeURL, function (unzipResult) {
                // result = 0 success, result = -1 failure
                zipFile.remove(function (removeZipResult) {
                  if (unzipResult === -1 || removeZipResult === -1)
                    cb("error unzipping app");
                  else {
                    pthis.createFs(function (err) {
                      if (err)
                        cb(err);
                      else {
                        pthis.installed = true;
                        pthis.dir = appDir.toURL();
                        pthis.updateDom();
                        AppMan.saveApps();
                        //
                        cb();
                      }
                    });
                  }
                }, fsErrorHandler);
              }, fsErrorHandler);
            }, fsErrorHandler);
          }, fsErrorHandler);
        }, fsErrorHandler);
      }, ftErrorHandler, false);
    }, fsErrorHandler);
  }, fsErrorHandler);
};


/*
 * Uninstall a new app (called by AppManager plugin)
 * @returns {undefined}
 */
AppDef.prototype.uninstall = function (cb)
{
  if (!cordova || this.online)
    return;
  //
  var dataDir = cordova.file.dataDirectory;
  var appDir = dataDir + "/apps/";
  var pthis = this;
  //
  var fserror = {
    1: "NOT_FOUND_ERR",
    2: "SECURITY_ERR",
    3: "ABORT_ERR",
    4: "NOT_READABLE_ERR",
    5: "ENCODING_ERR",
    6: "NO_MODIFICATION_ALLOWED_ERR",
    7: "INVALID_STATE_ERR",
    8: "SYNTAX_ERR",
    9: "INVALID_MODIFICATION_ERR",
    10: "QUOTA_EXCEEDED_ERR",
    11: "TYPE_MISMATCH_ERR",
    12: "PATH_EXISTS_ERR"
  };
  var fsErrorHandler = function (error) {
    var err = fserror[error.code] || error;
    cb(err);
  };
  //
  // delete app source
  window.resolveLocalFileSystemURL(appDir + pthis.name, function (dirEntry) {
    dirEntry.removeRecursively(function () {
      //
      // delete app file system
      pthis.cleanFs(function (err) {
        if (err)
          cb(err);
        else
          cb();
      });
    }, fsErrorHandler);
  }, fsErrorHandler);
};


/**
 * IOS DOM Parser is bugged. This parsers works like a charm
 * @param {object} DOMParser
 */
(function (DOMParser) {
  "use strict";
  var proto = DOMParser.prototype, nativeParse = proto.parseFromString;
  proto.parseFromString = function (markup, type) {
    if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
      var doc = document.implementation.createHTMLDocument("");
      if (markup.toLowerCase().indexOf('<!doctype') > -1) {
        doc.documentElement.innerHTML = markup;
      }
      else {
        doc.body.innerHTML = markup;
      }
      return doc;
    }
    else {
      return nativeParse.apply(this, arguments);
    }
  };
}(DOMParser));


/**
 * Update app using URL
 */
AppDef.prototype.updateApp = function ()
{
  if (!this.updateURL)
    return;
  //
  console.log("Updating app " + this.name + "...");
  //
  var req = new XMLHttpRequest();
  //
  req.responseType = "json";
  req.open("GET", this.updateURL + "?" + Math.random(), true);
  //
  req.onload = function () {
    var res = [].concat(this.response);
    AppMan.changeApps(res);
  };
  //
  req.send();
};


/**
 * Returns true if the app il loading
 */
AppDef.prototype.isLoading = function ()
{
  return this.iframe && !this.loaded;
};


/**
 * update params using url
 * @param {Object} params
 */
AppDef.prototype.updateParams = function (params)
{
  for (var pname in params) {
    this.sendMessage({id: "handleChangedAppParamOffline", content: {par: pname, new : params[pname]}});
  }
  Plugin.Lscookies.setCookie({app: this, params: {name: "app_params", value: JSON.stringify(params), exdays: 10000}});
};


/**
 * Tell device to set fullscreen
 * @param {Boolean} fullscreen
 */
AppDef.prototype.setFullscreen = function (fullscreen)
{
  this.sendMessage({obj: "device-ui", id: "setFullscreen", client: true, content: fullscreen});
};

