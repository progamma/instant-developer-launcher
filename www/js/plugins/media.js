/*
 * Instant Developer Next
 * Copyright Pro Gamma Spa 2000-2015
 * All rights reserved
 */

/* global cordova */

var Plugin = Plugin || {};

/*
 * Create plugin object
 */
Plugin.Media = {};


/*
 * Init plugin
 */
Plugin.Media.init = function ()
{
  this.mediaMap = {};
  this.defaultDir = Shell.isIOS() ? cordova.file.tempDirectory : cordova.file.dataDirectory;
};


/*
 * Initialize the directory used to sotre audio files
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.initStorage = function (req)
{
  window.resolveLocalFileSystemURL(Plugin.Media.defaultDir, function (dirEntry) {
    dirEntry.getDirectory("fs", {create: true, exclusive: false}, function (fsDirEntry) {
      fsDirEntry.getDirectory(req.app.name, {create: true, exclusive: false}, function (appDirEntry) {
        req.setResult(true);
      }, function () {
        req.setResult(false);
      });
    }, function () {
      req.setResult(false);
    });
  }, function () {
    req.setResult(false);
  });
};


/*
 * Returns the media object required
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.getMedia = function (req, cb)
{
  if (!req.params.src) {
    req.setError("No media specified");
  }
  else {
    var src = Plugin.Media.defaultDir + "fs/" + req.app.name + "/" + req.params.src;
    if (Shell.isIOS())
      src = src.replace("file://", "");
    //
    var mObj = this.mediaMap[req.params.src];
    if (mObj)
      return mObj.media;
    //
    if (!mObj) {
      var m = new Media(src, function (result) {
        req.setResult(result);
      }, function (error) {
        req.result = {code: error.code, message: error.message};
        PlugMan.sendEvent(req, "Error");
      }, function (status) {
        req.result = {src: req.params.src, status: status};
        PlugMan.sendEvent(req, "StatusChange");
      });
      //
      mObj = {media: m, app: req.app, src: req.params.src};
      this.mediaMap[req.params.src] = mObj;
      //
      return m;
    }
  }
};


/*
 * Measures the current position
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.getCurrentPosition = function (req)
{
  var media = this.getMedia(req);
  if (media)
    media.getCurrentPosition(function (result) {
      req.setResult(result);
    }, function (error) {
      req.setError(error);
    });
};


/*
 * Measures the media duration
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.getDuration = function (req)
{
  var media = this.getMedia(req);
  if (media)
    req.setResult(media.getDuration());
};


/*
 * Pauses media playback
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.pause = function (req)
{
  var media = this.getMedia(req);
  if (media)
    media.pause();
};


/*
 * Play audio
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.play = function (req)
{
  var media = this.getMedia(req);
  if (media)
    media.play(req.params.options);
};


/*
 * Play audio
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.release = function (req)
{
  var media = this.getMedia(req);
  if (media) {
    media.release();
    delete this.mediaMap[req.params.src];
  }
};


/*
 * Seek to
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.seekTo = function (req)
{
  var media = this.getMedia(req);
  if (media)
    media.seekTo(req.params.milliseconds);
};


/*
 * set volume
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.setVolume = function (req)
{
  var media = this.getMedia(req);
  if (media)
    media.setVolume(req.params.volume);
};


/*
 * stop
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.stop = function (req)
{
  var media = this.getMedia(req);
  if (media)
    media.stop();
};


/*
 * Start record / w compression
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.startRecord = function (req)
{
  var media = this.getMedia(req);
  if (media) {
    if (req.params.sampleRate)
      media.startRecordWithCompression({SampleRate: req.params.sampleRate, NumberOfChannels: 1});
    else
      media.startRecord();
  }
};


/*
 * Pauses media recording
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.pauseRecord = function (req)
{
  var media = this.getMedia(req);
  if (media)
    media.pauseRecord();
};


/*
 * Pauses media recording
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.resumeRecord = function (req)
{
  var media = this.getMedia(req);
  if (media)
    media.resumeRecord();
};


/*
 * Pauses media recording
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.stopRecord = function (req)
{
  var media = this.getMedia(req);
  if (media)
    media.stopRecord();
};


/*
 * Pauses media recording
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.getRecordLevels = function (req)
{
  var media = this.getMedia(req);
  if (media) {
    media.getRecordLevels(function (levels) {
      req.setResult(levels);
    }, function (error) {
      req.setError(error);
    });
  }
};


/*
 * remove recorded media
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.remove = function (req)
{
  this.getFileEntry(req, false, function (fe) {
    fe.remove(function () {
      req.setResult(true);
    }, function () {
      req.setResult(false);
    });
  });
};


/*
 * returns size
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.size = function (req)
{
  this.getFileEntry(req, true, function (fe) {
    fe.file(function (f) {
      req.setResult(f.size);
    }, function (err) {
      req.setError(err);
    });
  });
};


/*
 * returns true if the media exists
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.exists = function (req)
{
  this.getFileEntry(req, false, function (fe) {
    req.setResult(true);
  });
};


/*
 * returns the url for this audio file
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.url = function (req)
{
  var fn = cordova.file.dataDirectory + "fs/" + req.app.name + "/" + req.params.src;
  req.setResult(fn);
};


/*
 * upload the media to the cloud
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.upload = function (req)
{
  var fn = Plugin.Media.defaultDir + "fs/" + req.app.name + "/" + req.params.src;
  var opt = req.params.options || {};
  //
  var ft = new FileTransfer();
  //
  var options = new FileUploadOptions();
  options.fileKey = "file";
  options.fileName = opt.fileName || req.params.src;
  options.httpMethod = "POST";
  options.mimeType = "audio/m4a";
  options.headers = {Connection: "close"};
  //
  var fterrors = {
    1: "FILE_NOT_FOUND_ERR",
    2: "INVALID_URL_ERR",
    3: "CONNECTION_ERR",
    4: "ABORT_ERR",
    5: "NOT_MODIFIED_ERR"
  };
  //
  var cmd = "?mode=rest&";
  cmd += opt.cmd || "audio";
  //
  var online = req.app.online && req.app.mode !== "offline";
  if (online)
    cmd += "&sid=" + req.app.sid;
  //
  var aurl = req.app.url;
  var p = aurl.indexOf("?");
  if (p > -1)
    aurl = aurl.substring(0, p);
  var url = opt.url || aurl;
  //
  ft.upload(fn, url + cmd, function (result) {
    req.setResult({bytesSent: result.bytesSent, responseCode: result.responseCode, response: result.response});
  }, function (error) {
    var e = error.code ? fterrors[error.code] : error;
    req.setError(e);
  }, options);
};


/*
 * upload the media to the cloud
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.download = function (req)
{
  var fn = Plugin.Media.defaultDir + "fs/" + req.app.name + "/" + req.params.src;
  var opt = req.params.options || {};
  var uri = encodeURI(req.params.url);
  //
  var ft = new FileTransfer();
  //
  var fterrors = {
    1: "FILE_NOT_FOUND_ERR",
    2: "INVALID_URL_ERR",
    3: "CONNECTION_ERR",
    4: "ABORT_ERR",
    5: "NOT_MODIFIED_ERR"
  };
  //
  ft.download(uri, fn,
          function (entry) {
            var d = entry.toURL();
            d = Plugin.Shelldriverhandler.adaptUrl(d);
            req.setResult({publicUrl: d});
          },
          function (error) {
            var e = error.code ? fterrors[error.code] : error;
            req.setError(e);
          },
          /*
           //trustAllHosts: Optional parameter, defaults to false. If set to true, it accepts all security certificates.
           //This is useful since Android rejects self-signed security certificates. Not recommended for production use.
           //Supported on Android and iOS. (boolean)
           */
          false,
          //options: Optional parameters, currently only supports headers (such as Authorization (Basic Authentication), etc).
                  {headers: opt.headers}
          );
          //
        };

/*
 * Get the file entry
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Media.getFileEntry = function (req, throwError, cb)
{
  window.resolveLocalFileSystemURL(Plugin.Media.defaultDir, function (dirEntry) {
    dirEntry.getFile("fs/" + req.app.name + "/" + req.params.src, {create: false, exclusive: false}, function (fileEntry) {
      //
      cb(fileEntry);
      //
    }, function () {
      if (throwError)
        req.setError("FILE_NOT_FOUND");
      else
        req.setResult(false);
    });
  }, function () {
    if (throwError)
      req.setError("FILE_NOT_FOUND");
    else
      req.setResult(false);
  });
};


/*
 * An app has stopped, clean up its media
 */
Plugin.Media.stopApp = function (app)
{
  for (var s in this.mediaMap) {
    var mObj = this.mediaMap[s];
    if (mObj.app === app) {
      mObj.media.release();
      delete this.mediaMap[s];
    }
  }
};
