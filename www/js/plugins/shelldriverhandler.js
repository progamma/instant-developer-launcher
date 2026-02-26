/*
 * Instant Developer Next
 * Copyright Pro Gamma Spa 2000-2016
 * All rights reserved
 */


/* global cordova, Shell, ArrayBuffer, FileError, FileTransferError, Error, zip */

var Plugin = Plugin || {};

/*
 * Create plugin object
 */
Plugin.Shelldriverhandler = {};


/*
 * Init plugin
 * Since Cordova uses the File API from WebKit,
 * this class adapts app/server/fs/localdriver.js to run
 * inside the shell, by just copy-pasting and substituting
 * Shell.ShellDriver instead of App.LocalDriver.
 */
Plugin.Shelldriverhandler.init = function ()
{
  this.instances = {};
};


/*
 * Adapt local Url to local web server
 */
Plugin.Shelldriverhandler.adaptUrl = function (url)
{
  if (!Shell.isIOS())
    return url;
  //
  let idx = url.indexOf("Library/NoCloud");
  if (idx > 0) {
    let d = cordova.file.dataDirectory + url.substring(idx + 16);
    url = window.WkWebView.convertFilePath(d);
  }
  return url;
};


/*
 * Adapts to calls coming from different driver objects server-side
 */
Plugin.Shelldriverhandler.exec = function (req)
{
  let sd = this.instances[req.params.nid];
  if (!sd) {
    sd = new Shell.ShellDriver(req.app.name, req.app.root && !req.app.dir);
    this.instances[req.params.nid] = sd;
  }
  //
  let argsArray = [];
  //
  // Deserialize arguments of type File/Directory
  for (let i = 0; i < req.params.args.length - 1; i++) {
    let arg = req.params.args[i];
    if (typeof arg === "object" && arg._t)
      argsArray.push(sd.deserializeObject(arg));
    else
      argsArray.push(arg);
  }
  //
  // Last argument is always the callbackID
  // Prepare a callback function for the instance
  let cbId = req.params.args[req.params.args.length - 1];
  argsArray.push(function () {
    req.method = "";
    req.plugin = "shelldriverhandler" + req.params.nid;
    let args = [];
    for (let i = 0; i < arguments.length; i++) {
      args.push(Shell.ShellDriver.decodeError(arguments[i]));
      if (req.params.cid === "httpRequest" && i === 0 && args[0].error)
        args[0].error = Shell.ShellDriver.decodeError(args[0].error);
    }
    req.setResult({cbId: cbId, args: args});
  });
  //
  // Call function
  sd[req.params.cid].apply(sd, argsArray);
};


/**
 * @class ShellDriver
 * Represents a local driver object,that will handle files and folders
 * @param {string} appName
 * @param {boolean} isRoot
 */
Shell.ShellDriver = function (appName, isRoot)
{
  this.appName = appName; // used by initLocalFs
  this.isRoot = isRoot;
  //
  // Local file systems (temporary e persistent)
  this.fs = {};
  //
  // Files opened
  this.files = {};
};

Shell.ShellDriver.FileErrors = {
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

Shell.ShellDriver.FileTransferErrors = {
  1: "FILE_NOT_FOUND_ERR",
  2: "INVALID_URL_ERR",
  3: "CONNECTION_ERR",
  4: "ABORT_ERR",
  5: "NOT_MODIFIED_ERR"
};


/*
 * Decode an error
 * @param {Object} err
 */
Shell.ShellDriver.decodeError = function (err) {
  if (err instanceof FileError)
    return Shell.ShellDriver.FileErrors[err.code];
  else if (err instanceof FileTransferError)
    return Shell.ShellDriver.FileTransferErrors[err.code];
  else if (err instanceof Error)
    return err.message;
  else
    return err;
};


/*
 * This class fakes being an app/server/fs/file.js class instance
 * so that ShellDriver can be imported
 */
Shell.ShellDriver.File = function (props)
{
  this.path = props.path;
  this.encoding = props.encoding;
  this.type = props.type;
  this.id = props.id;
};


/*
 * This class fakes being an app/server/fs/file.js class instance
 * so that ShellDriver can be imported
 */
Shell.ShellDriver.Directory = function (props)
{
  this.path = props.path;
  this.type = props.type;
};


/**
 * Get public url for a certain path
 * @param {File} file
 * @param {function} cb
 */
Shell.ShellDriver.prototype.getFilePublicUrl = function (file, cb)
{
  this.initLocalFs(file.type, function (err) {
    if (err)
      return cb(null, err);
    //
    this.checkEntry(file, function (err) {
      if (err)
        return cb(null, err);
      //
      let d = file.entry.toURL();
      d = Plugin.Shelldriverhandler.adaptUrl(d);
      cb(d);
    });
  }.bind(this));
};


/**
 * Given a relative path, return the internal (server) path to the file
 * @param {File} file
 * @param {function} cb
 */
Shell.ShellDriver.prototype.getFileFullPath = function (file, cb)
{
  return cb();
};


/*
 * Deserialize File/Directory
 * @param {Object} obj
 */
Shell.ShellDriver.prototype.deserializeObject = function (obj) {
  if (obj.id && this.files[obj.id])
    return this.files[obj.id];
  //
  // "path" must be modify: start every path with a appName/ prefix in case of EAC
  if (obj.path) {
    if (obj.type === "resource" && obj.path.startsWith("../resources"))
      obj.path = "apps/" + this.appName + "/" + obj.path.substring(3);
    else
      obj.path = "fs/" + this.appName + "/" + obj.path;
  }
  //
  return new Shell.ShellDriver[obj._t](obj);
};


/**
 * Check and create fs object
 * @param {String} type
 * @param {function} cb
 */
Shell.ShellDriver.prototype.initLocalFs = function (type, cb)
{
  // If the object already exists fs will not be created
  if (this.fs[type])
    return cb();
  //
  let datadir = "";
  if (type === "temp")
    datadir = cordova.file.cacheDirectory;
  else if (type === "resource") {
    if (this.isRoot)
      datadir = cordova.file.applicationDirectory + "www/";
    else
      datadir = cordova.file.dataDirectory;
  }
  else
    datadir = cordova.file.dataDirectory;
  //
  window.resolveLocalFileSystemURL(datadir, function (dirEntry) {
    this.fs[type] = {root: dirEntry};
    //
    if (type === "resource")
      return cb();
    //
    // Since we are writing in fs/appName/, make sure these two directories exist
    dirEntry.getDirectory("fs", {create: true, exclusive: false}, function (fsDirEntry) {
      fsDirEntry.getDirectory(this.appName, {create: true, exclusive: false}, function (appDirEntry) {
        cb();
      }, cb);
    }.bind(this), cb);
  }.bind(this), cb);
};


/**
 * Check and create entry
 * @param {File/Directory} obj
 * @param {function} cb
 */
Shell.ShellDriver.prototype.checkEntry = function (obj, cb)
{
  if (obj.entry)
    return cb();
  //
  let funcName = (obj instanceof Shell.ShellDriver.File ? "getFile" : "getDirectory");
  this.fs[obj.type].root[funcName](obj.path, {create: false}, function (entry) {
    // Save entry object
    obj.entry = entry;
    cb();
  }, cb);
};


/**
 * Creates the file physically (Opens the file and overwrites it)
 * @param {File} file
 * @param {function} cb
 */
Shell.ShellDriver.prototype.createFile = function (file, cb)
{
  let create = function () {
    // Sets the attribute "create" to true to create the file
    this.fs[file.type].root.getFile(file.path, {create: true, exclusive: false}, function (entry) {
      // Create the object writer
      entry.createWriter(function (fileWriter) {
        file.writer = fileWriter;
        //
        // entry object
        file.entry = entry;
        this.files[file.id] = file;
        cb();
      }.bind(this), cb); // Writer creation error
    }.bind(this), cb); // getFile() error
  }.bind(this);
  //
  this.initLocalFs(file.type, function (err) {
    if (err)
      return cb(err);
    //
    this.fs[file.type].root.getFile(file.path, {create: false}, function (entry) {
      entry.remove(function () {
        // If a file with the same name already exists, delete it and create
        delete file.entry;
        create();
      }, cb);// Deleting error
    }, create); // If a file with the same name not exists, create it
  }.bind(this));
};


/**
 * Opens the file to append data
 * @param {File} file
 * @param {function} cb
 */
Shell.ShellDriver.prototype.openFileForAppend = function (file, cb)
{
  // Checks and creates  fs object (if it doesn't exist)
  this.initLocalFs(file.type, function (err) {
    if (err)
      return cb(err);
    //
    // Checks and sets  the entry property (if it doesn't exist)
    this.checkEntry(file, function (err) {
      if (err)
        return cb(err);
      //
      // Create the object writer
      file.entry.createWriter(function (fileWriter) {
        file.writer = fileWriter;
        //
        // I bet the writer at the end of the file (to allow append mode)
        file.writer.seek(file.writer.length);
        this.files[file.id] = file;
        cb();
      }.bind(this), cb); // Writer creation error
    }.bind(this));
  }.bind(this));
};


/**
 * Opens the file for reading
 * @param {File} file
 * @param {function} cb
 */
Shell.ShellDriver.prototype.openFile = function (file, cb)
{
  // Checks and creates  fs object (if it doesn't exist)
  this.initLocalFs(file.type, function (err) {
    if (err)
      return cb(err);
    //
    // Checks and sets  the entry property (if it doesn't exist)
    this.checkEntry(file, function (err) {
      if (err)
        return cb(err);
      //
      // Gets object file from a entry and save it in a relative property
      file.entry.file(function (f) {
        file.fileObject = f;
        //
        // Create the object reader
        file.reader = new FileReader(f);
        //
        // Property that contains the current position of reader
        file.readerPosition = 0;
        this.files[file.id] = file;
        cb();
      }.bind(this));
    }.bind(this));
  }.bind(this));
};


/**
 * Closes the file
 * @param {File} file
 * @param {function} cb
 */
Shell.ShellDriver.prototype.close = function (file, cb)
{
  delete file.reader;
  delete file.lineReader;
  delete file.writer;
  delete this.files[file.id];
  cb();
};


/**
 * Checks existence of a file
 * @param {File} file
 * @param {function} cb
 */
Shell.ShellDriver.prototype.fileExists = function (file, cb)
{
  // Checks and creates fs object (if it doesn't exist)
  this.initLocalFs(file.type, function (err) {
    if (err)
      return cb(false);
    //
    // Try to get the entry to see if there is
    this.fs[file.type].root.getFile(file.path, {create: false}, function () {
      cb(true);
    }, function () {
      cb(false);
    });
  }.bind(this));
};


/**
 * Reads a text file line by line through a loop that reads each line of the file
 * @param {File} file
 * @param {function} cb
 * @param {function} cbEnd
 */
Shell.ShellDriver.prototype.readLine = function (file, cb, cbEnd)
{
  cbEnd(new Error("Method not supported inside shell"));
};


/**
 * Stops reading line by line
 * @param {File} file
 */
Shell.ShellDriver.prototype.break = function (file)
{
  cbEnd(new Error("Method not supported inside shell"));
};


/**
 * Reads a block of data, return a array buffer
 * @param {File} file
 * @param {int} length
 * @param {int} offset
 * @param {function} cb
 */
Shell.ShellDriver.prototype.read = function (file, length, offset, cb)
{
  // Check that the file is opened (reading)
  if (!file.reader || !file.fileObject)
    return cb(null, new Error("file not open"));
  //
  // Setting the correct limit: if length or offset are null take respectively the current position of the
  // reader and the position of the last byte of the file
  let start = file.readerPosition;
  if (typeof offset === "number")
    start = offset;
  //
  let end = file.fileObject.size;
  if (length)
    end = start + length;
  //
  // Get the part of file
  let blob = file.fileObject.slice(start, end);
  //
  // If the size of the blob is less than 1, the reader position is beyond the end of file (eof)
  if (blob.size < 1)
    return cb(null, new Error("File EOF"));
  //
  // Listen to read end events
  file.reader.onloadend = function () {
    // Updates the current position of the reader
    file.readerPosition = end;
    //
    // evt.target.result contains the string
    cb(file.reader.result);
  };
  //
  // Listen to error events
  file.reader.onerror = function (err) {
    cb(null, err);
  };
  //
  // Read cunck as array buffer
  file.reader.readAsArrayBuffer(blob);
};


/**
 * Read the whole file as text
 * @param {File} file
 * @param {function} cb
 */
Shell.ShellDriver.prototype.readAll = function (file, cb)
{
  // Checks and creates fs object (if it doesn't exist)
  this.initLocalFs(file.type, function (err) {
    if (err)
      return cb(null, err);
    //
    // Checks and sets the entry property (if it doesn't exist)
    this.checkEntry(file, function (err) {
      if (err)
        return cb(null, err);
      //
      file.entry.file(function (f) {
        let reader = new FileReader(f);
        reader.onloadend = function () {
          cb(reader.result, reader.error);
        };
        reader.readAsText(f, file.encoding);
      });
    });
  }.bind(this));
};


/**
 * Writes the data or the  string given
 * @param {File} file
 * @param {string/buffer} data
 * @param {int} offset
 * @param {int} size
 * @param {int} position
 * @param {function} cb
 */
Shell.ShellDriver.prototype.write = function (file, data, offset, size, position, cb)
{
  // Check that the file is opened (writing)
  if (!file.writer)
    return cb(new Error("File not open for write"));
  //
  // Updates the current position of the writer
  if (position >= 0 && position !== null)
    file.writer.seek(position);
  //
  let blob;
  //
  // If "data" is a string
  if (typeof data === "string") {
    // If not specified the default encoding is utf-8
    file.encoding = file.encoding || "utf-8";
    blob = new Blob([data], {type: "text/plain;charset=" + file.encoding});
  }
  else {
    // If "data" is a set of bytes
    //calculates the limits of writing
    if (!size)
      size = data.byteLength;
    //
    if (!offset || offset < 0)
      offset = 0;
    //
    blob = new Blob([data]);
    //
    // Get the part of "data"
    blob.slice(offset, offset + size);
  }
  //
  // Listen to error events
  file.writer.onerror = cb;
  //
  // Listen to write end events
  file.writer.onwriteend = function (progressEvent) {
    cb();
  };
  //
  // Write
  file.writer.write(blob);
};


/**
 * Copy the file
 * @param {File} file
 * @param {File} newFile
 * @param {function} cb
 */
Shell.ShellDriver.prototype.copyFile = function (file, newFile, cb)
{
  // Checks and creates  fs object (if it doesn't exist)
  this.initLocalFs(file.type, function (err) {
    if (err)
      return cb(err);
    //
    // Get the parent directory
    let pathParts = newFile.path.split("/");
    let dirPath = pathParts.slice(0, pathParts.length - 1).join("/");
    if (dirPath[0] === "/")
      dirPath = dirPath.substr(1);
    //
    let newName = pathParts[pathParts.length - 1];
    //
    // Gets new dir entry
    this.fs[file.type].root.getDirectory(dirPath, {create: false}, function (destinationDirEntry) {
      // Checks and sets  the entry property (if it doesn't exist)
      this.checkEntry(file, function (err) {
        if (err)
          return cb(err);
        //
        // Copy
        file.entry.copyTo(destinationDirEntry, newName, function (newEntry) {
          // Create the new object file by setting the property correctly
          newFile.entry = newEntry;
          cb();
        }, cb); // Raise error
      });
    }.bind(this), cb); // Getting new dir entry error
  }.bind(this));
};


/**
 * Rename a file or directory
 * @param {File/Directory} obj
 * @param {File/Directory} newObj
 * @param {function} cb
 */
Shell.ShellDriver.prototype.renameObject = function (obj, newObj, cb)
{
  // Checks and creates fs object (if it doesn't exist)
  this.initLocalFs(obj.type, function (err) {
    if (err)
      return cb(err);
    //
    // If newObj is an object, it has to have the same type as obj
    if (typeof newObj !== "string" && obj.type !== newObj.type)
      return cb(new Error("Unable to move file or directory between different file systems"));
    //
    // Checks and sets the entry property (if it doesn't exist)
    this.checkEntry(obj, function (err) {
      if (err)
        return cb(err);
      //
      var getType = obj instanceof Shell.ShellDriver.File ? "getFile" : "getDirectory";
      //
      // Get new path keeping in mind that newObj could be an object (file or directory) or a string (for back compatibility)
      var newPath = newObj.path || obj.path.substring(0, obj.path.lastIndexOf("/") + 1) + newObj;
      //
      this.fs[obj.type].root[getType](newPath, {create: true}, function (newEntry) {
        newEntry.getParent(function (parentDirEntry) {
          obj.entry.moveTo(parentDirEntry, newPath.split("/").pop(), function (newEntry) {
            // Update the entry
            obj.entry = newEntry;
            cb();
          }, cb); // moveTo error
        }, cb); // getParent dir error
      }, cb); // getFile/getDirectory error
    }.bind(this));
  }.bind(this));
};


/**
 * Return the file size (in bytes)
 * @param {File} file
 * @param {function} cb
 */
Shell.ShellDriver.prototype.fileLength = function (file, cb)
{
  // Checks and creates fs object (if it doesn't exist)
  this.initLocalFs(file.type, function (err) {
    if (err)
      return cb(null, err);
    //
    // Checks and sets the entry property (if it doesn't exist)
    this.checkEntry(file, function (err) {
      if (err)
        return cb(null, err);
      //
      // Get size
      file.entry.file(function (f) {
        cb(f.size);
      });
    });
  }.bind(this));
};


/**
 * Return the last modified file date
 * @param {File} file
 * @param {function} cb
 */
Shell.ShellDriver.prototype.fileDateTime = function (file, cb)
{
  // Checks and creates fs object (if it doesn't exist)
  this.initLocalFs(file.type, function (err) {
    if (err)
      return cb(null, err);
    //
    // Checks and sets the entry property (if it doesn't exist)
    this.checkEntry(file, function (err) {
      if (err)
        return cb(null, err);
      //
      // Get dateTime (contained in a metadata entry object)
      file.entry.getMetadata(function (md) {
        cb(md.modificationTime);
      });
    });
  }.bind(this));
};


/**
 * Deletes a file
 * @param {File} file
 * @param {function} cb
 */
Shell.ShellDriver.prototype.deleteFile = function (file, cb)
{
  // Checks and creates fs object (if it doesn't exist)
  this.initLocalFs(file.type, function (err) {
    if (err)
      return cb(err);
    //
    // Checks and sets the entry property (if it doesn't exist)
    this.checkEntry(file, function (err) {
      if (err)
        return cb(err);
      //
      // Remove file
      file.entry.remove(function () {
        delete file.entry;
        cb();
      }, cb);
    });
  }.bind(this));
};


/**
 * Zip a file
 * @param {File} file
 * @param {File} zipFile
 * @param {function} cb
 */
Shell.ShellDriver.prototype.zipFile = function (file, zipFile, cb)
{
  cb(new Error("Method not supported inside shell"));
};


/**
 * Unzip an archiver
 * @param {File} file
 * @param {Directory} directory
 * @param {function} cb
 */
Shell.ShellDriver.prototype.unzip = function (file, directory, cb)
{
  this.initLocalFs(directory.type, function (err) {
    if (err)
      return cb(err);
    //
    this.fs[directory.type].root.getDirectory(directory.path, {create: true}, function (destinationDirEntry) {
      zip.unzip(this.fs[file.type].root.nativeURL + "/" + file.path, this.fs[directory.type].root.nativeURL + "/" + directory.path, function (err) {
        if (err === -1) //failure => err = -1, success => err = 0
          return cb(new Error("unknown error"));
        //
        cb();
      });
    }.bind(this), cb); // Creation error
  }.bind(this));
};


/**
 * Create the directory
 * @param {Directory} directory
 * @param {function} cb
 */
Shell.ShellDriver.prototype.mkDir = function (directory, cb)
{
  // Checks and creates  fs object (if it doesn't exist)
  this.initLocalFs(directory.type, function (err) {
    if (err)
      return cb(err);
    //
    // Check if the directory is the root
    if (directory.path === "/")
      return cb();
    //
    this.mkDirRecursive(this.fs[directory.type].root, directory.path.split("/"), function (entry, err) {
      directory.entry = entry;
      cb(err);
    });
  }.bind(this));
};


/**
 * Creates recursive folder
 * @param {Object} entry
 * @param {string} folders
 * @param {function} cb
 */
Shell.ShellDriver.prototype.mkDirRecursive = function (entry, folders, cb)
{
  // Throw out './' or '/' if present on the beginning of our path.
  let folder = folders.shift();
  if (folder === "." || folder === "")
    folder = folders.shift();
  //
  entry.getDirectory(folder, {create: true}, function (dirEntry) {
    // Recursively add the new subfolder (if we still another to create).
    if (folders.length)
      this.mkDirRecursive(dirEntry, folders, cb);
    else
      cb(dirEntry);
  }.bind(this), function (err) {
    // Creation error
    cb(null, err);
  });
};


/**
 * checks the existence of the directory
 * @param {Directory} directory
 * @param {function} cb
 */
Shell.ShellDriver.prototype.dirExists = function (directory, cb)
{
  // Checks and creates  fs object (if it doesn't exist)
  this.initLocalFs(directory.type, function (err) {
    if (err)
      return cb(false);
    //
    // Try to get the dirEntry to see if there is
    this.fs[directory.type].root.getDirectory(directory.path, {create: false}, function () {
      cb(true);
    }, function () {
      cb(false);
    });
  }.bind(this));
};


/**
 * Copies the entire directory
 * @param {Directory} srcDir
 * @param {Directory} dstDir
 * @param {function} cb
 */
Shell.ShellDriver.prototype.copyDir = function (srcDir, dstDir, cb)
{
  // Checks and creates fs object (if it doesn't exist)
  this.initLocalFs(srcDir.type, function (err) {
    if (err)
      return cb(err);
    //
    // Get the parent directory
    let pathParts = dstDir.path.split("/");
    let dirPath = pathParts.slice(0, pathParts.length - 1).join("/");
    if (dirPath[0] === "/")
      dirPath = dirPath.substr(1);
    //
    let newName = pathParts[pathParts.length - 1];
    //
    this.fs[srcDir.type].root.getDirectory(dirPath, {create: true}, function (destinationDirEntry) {
      // Checks and sets the entry property (if it doesn't exist)
      this.checkEntry(srcDir, function (err) {
        if (err)
          return cb(err);
        //
        // Copy
        srcDir.entry.copyTo(destinationDirEntry, newName, function (newEntry) {
          dstDir.entry = newEntry;
          cb();
        }, cb); // copyTo error
      });
    }.bind(this), cb); // getDirectory error
  }.bind(this));
};


/**
 * Read recursively the content of directory
 * @param {Directory} directory
 * @param {Integer} depth
 * @param {function} cb
 */
Shell.ShellDriver.prototype.readDirectory = function (directory, depth, cb)
{
  if (typeof depth === "function") {
    cb = depth;
    depth = 0;
  }
  //
  // Checks and creates  fs object (if it doesn't exist)
  this.initLocalFs(directory.type, function (err) {
    if (err)
      return cb(null, err);
    //
    // Checks and sets the entry property (if it doesn't exist)
    this.checkEntry(directory, function (err) {
      if (err)
        return cb(null, err);
      //
      // Recursive core
      let readDirRecursive = function (entries, content, cbRec) {
        // No directory unexplored: end of recursion
        if (!entries.length)
          return cbRec(content);
        //
        if (entries[0].depth > depth) {
          // Remove the folder because is deeper than depth
          entries.shift();
          //
          // recall the function
          return readDirRecursive(entries, content, cbRec);
        }
        //
        // Reads the current directory
        this.fs[directory.type].root.getDirectory(entries[0].entry.fullPath, {create: false}, function (entry) {
          // Create dirReader object
          let dirReader = entry.createReader();
          dirReader.readEntries(function (results) {
            //
            for (let i = 0; i < results.length; i++) {
              // Add the element to the content array
              content = content.concat(results[i]);
              //
              // If the element is a directory, I add it to the array of folders to be scanned
              if (results[i].isDirectory)
                entries.push({depth: entries[0].depth + 1, entry: results[i]});
            }
            //
            // Remove the folder just examined from the array
            entries.shift();
            //
            // Recall the function
            readDirRecursive(entries, content, cbRec);
          }, function (err) {
            //readEntries error
            cbRec(null, err);
          });
        });
      }.bind(this);
      //
      // Set default depth to 0
      depth = depth || 0;
      //
      // Array of files/directory objects
      let content = [];
      //
      // Array of directories yet to be examined
      let dir = [];
      dir.push({depth: 0, entry: directory.entry});
      //
      readDirRecursive(dir, content, function (entries, err) {
        if (err)
          return cb(null, err);
        //
        let content = [];
        //
        // No file/directory inside
        if (entries.length < 1)
          return cb(content);
        //
        // Order the entries by name
        let s = "fs/" + this.appName + "/";
        for (let i = 0; i < entries.length; i++) {
          // Create file/directory object by setting the property correctly
          let p = entries[i].fullPath.substr(1);
          if (p.startsWith(s))
            p = p.substring(s.length);
          let object = {path: p, type: entries[i].isFile ? "file" : "directory"};
          content.push(object);
        }
        cb(content);
      }.bind(this));
    }.bind(this));
  }.bind(this));
};


/**
 * Zip directory
 * @param {Directory} directory
 * @param {File} zipFile
 * @param {function} cb
 */
Shell.ShellDriver.prototype.zipDirectory = function (directory, zipFile, cb)
{
  cb(new Error("Method not supported inside shell"));
};


/**
 * Removes the entire directory
 * @param {Directory} directory
 * @param {function} cb
 */
Shell.ShellDriver.prototype.removeDirRecursive = function (directory, cb)
{
  // Checks and creates fs object (if it doesn't exist)
  this.initLocalFs(directory.type, function (err) {
    if (err)
      return cb(err);
    //
    // Checks and sets the entry property (if it doesn't exist)
    this.checkEntry(directory, function (err) {
      // If file not exists it's ok, do nothing
      if (err)
        return cb();
      //
      // Remove
      directory.entry.removeRecursively(function () {
        delete directory.entry;
        cb();
      }, cb); // Remove error
    });
  }.bind(this));
};


/**
 * Makes a HTTP request to a web server
 * @param {Object} url
 * @param {String} method
 * @param {Object} options
 * @param {function} cb
 */
Shell.ShellDriver.prototype.httpRequest = function (url, method, options, cb)
{
  options = Object.assign({
    responseType: "text",
    params: {},
    headers: {}
  }, options);
  //
  // Make the header keys lowercase
  let headers = {};
  for (let key in options.headers)
    headers[key.toLowerCase()] = options.headers[key];
  options.headers = headers;
  //
  // Extract and encode params from  options
  // * @param {Object} obj
  let parseParams = function (obj) {
    let str = [];
    for (let p in obj) {
      if (obj.hasOwnProperty(p))
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
    return str.join("&");
  };
  //
  let multiPart = false;
  let download = false;
  let upload = false;
  //
  // Checks case
  switch (method) {
    case "POST":
      multiPart = true;
      break;

    case "DOWNLOAD":
      download = true;
      method = options.method || "GET";
      break;

    case "UPLOAD":
      multiPart = true;
      upload = true;
      method = "POST";
      break;
  }
  //
  // If not specified, the post request type is multipart
  if (options.headers["content-type"])
    multiPart = false;
  //
  // Get eventually values for the autentication
  if (options.authentication)
    options.headers.authorization = "Basic " + btoa(options.authentication.username + ":" + options.authentication.password);
  //
  // Create the complete query string
  let params = parseParams(options.params);
  //
  // Add it to the url (for GET method)
  let uri = url.url;
  if (method !== "POST" && params)
    uri += (uri.includes("?") ? "&" : "?") + params;
  //
  if (upload || download) {
    let filePath = cordova.file[options._file.type === "temp" ? "cacheDirectory" : "dataDirectory"];
    filePath += "fs/" + this.appName + "/" + options._file.path;
    let fileTransfer = new FileTransfer();
    //
    // Third download method parameter (fourth for upload method) is "trustAllHosts".
    // It's an optional parameter, defaults to false. If set to true, it accepts all security certificates.
    // This is useful since Android rejects self-signed security certificates. Not recommended for production use.
    // Supported on Android and iOS
    if (download) {
      fileTransfer.download(uri, filePath, entry => {
        let d = entry.toURL();
        d = Plugin.Shelldriverhandler.adaptUrl(d);
        cb({publicUrl: d});
      }, error => cb({error}), false, {headers: options.headers});
      //
      return;
    }
    else if (upload) {
      // fileKey: The name of the form element. Defaults to file. (DOMString)
      // fileName: The file name to use when saving the file on the server. Defaults to image.jpg. (DOMString)
      // httpMethod: The HTTP method to use - either PUT or POST. Defaults to POST. (DOMString)
      // mimeType: The mime type of the data to upload. Defaults to image/jpeg. (DOMString)
      // params: A set of optional key/value pairs to pass in the HTTP request. (Object)
      // chunkedMode: Whether to upload the data in chunked streaming mode. Defaults to true. (Boolean)
      // headers: A map of header name/header values. Use an array to specify more than one value. (Object)
      let opts = new FileUploadOptions();
      opts.fileKey = options._nameField;
      opts.fileName = options._fileName;
      opts.httpMethod = "POST";
      opts.mimeType = options._fileContentType;
      opts.params = options.params;
      opts.chunkedMode = true;
      opts.headers = options.headers;
      //
      fileTransfer.upload(filePath, uri, r => cb({status: r.responseCode, headers: r.headers, body: r.response}), error => cb({error}), opts, false);
      return;
    }
  }
  //
  // Creates request object
  let req = new XMLHttpRequest();
  //
  // Set request timeout
  if (options.timeOut)
    req.timeout = options.timeOut;
  //
  // Initialize request
  req.open(method, uri, true);
  //
  // To handle better response, want receive binary data
  req.responseType = (download ? "arraybuffer" : options.responseType || "text");
  //
  let data;
  //
  // Custom body case
  if (options.body) {
    data = options.body;
    //
    if (typeof options.bodyType === "string")
      options.headers["content-type"] = options.bodyType;
    else if (!options.headers["content-type"])
      options.headers["content-type"] = "application/octet-stream";
    //
    // Types allowed for the custom body are: string and ArrayBuffer, but you can pass an object to
    // get a JSON custom body
    if (typeof options.body === "object") {
      if (!(options.body instanceof ArrayBuffer)) {
        try {
          data = JSON.stringify(options.body);
          options.headers["content-type"] = "application/json";
        }
        catch (e) {
          return cb({error: new Error(`Cannot stringify custom body: ${e.message}`)});
        }
      }
    }
    else if (typeof options.body !== "string")
      return cb({error: new Error("Custom body must be String, Object or ArrayBuffer")});
  }
  else if (multiPart) { // Multipart request
    // Create formdata object
    data = new FormData();
    //
    // Add params to formData object
    let sepParams = params.split("&");
    for (let i = 0; i < sepParams.length; i++) {
      let [key, value] = sepParams[i].split("=");
      if (key && value)
        data.append(decodeURIComponent(key), decodeURIComponent(value));
    }
  }
  //
  // Add custom headers
  for (let header in options.headers)
    req.setRequestHeader(header, options.headers[header]);
  //
  req.send(data);
  //
  // Listen to timeout event
  req.ontimeout = () => cb({error: new Error("timeout request error")});
  //
  // Listen to request error events
  req.onerror = error => cb({error: new Error("unknown error")});
  //
  // Listen to response load event
  req.onload = () => {
    // default encoding
    let encoding;
    let body = req.response;
    //
    if (body instanceof ArrayBuffer && options.responseType === "text") {
      // get encoding
      let responseContentType = req.getResponseHeader("Content-Type");
      if (responseContentType?.includes("text")
              || responseContentType?.endsWith("xml")
              || responseContentType?.includes("application/json")) {
        //
        // Default encoding
        encoding = "utf-8";
        //
        // Get encoding from "text/... charset=..." header
        if (responseContentType.includes("charset"))
          encoding = responseContentType.substr(responseContentType.indexOf("charset") + 8);
      }
      //
      // Encode the response
      if (encoding && typeof TextDecoder !== "undefined") {
        let dataView = new DataView(req.response);
        try {
          body = new TextDecoder(encoding).decode(dataView);
        }
        catch (e) {
          // If there is an error, the default decoding uses utf-8
          body = new TextDecoder("utf-8").decode(dataView);
        }
      }
    }
    //
    // Create the response object
    let response = {
      status: req.status,
      headers: {},
      body
    };
    //
    // Headers as map
    req.getAllResponseHeaders()?.trim().split("\n").forEach(v => {
      let [key, value] = v.split(":");
      response.headers[key.trim()] = value.trim();
    });
    //
    cb(response);
  };
};