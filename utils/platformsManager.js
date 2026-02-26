var PlatformsManager = {};

PlatformsManager.platforms = {
  android: "android",
  ios: "ios"
};


/**
 * Require modules and set working directories paths
 */
PlatformsManager.init = function () {
  this.fs = require("fs");
  this.path = require("path");
  //
  this.rootDir = process.cwd();
  this.androidDir = this.rootDir + "/platforms/android";
  this.iosDir = this.rootDir + "/platforms/ios";
  this.androidManifestPath = this.androidDir + "/app/src/main/AndroidManifest.xml";
};

// Init platforms manager
PlatformsManager.init();


/**
 * Append give tag to queries
 * @param {Object} options
 */
PlatformsManager.appendTagToQueries = function (options) {
  let {tag, name, pluginPath} = options;
  //
  // If no android manifest, do nothing
  if (!this.fs.existsSync(this.androidManifestPath))
    return;
  //
  // If plugin does not exist, do nothing
  if (!this.fs.existsSync(this.rootDir + pluginPath))
    return;
  //
  // Get manifest content
  let manifestContent = this.fs.readFileSync(this.androidManifestPath).toString("utf-8");
  //
  // If tag already exists, do nothing
  if (manifestContent.indexOf(name) !== -1)
    return;
  //
  // If "queries" tag does not exist, I have to wrap given tag into <queries></queries> and append the whole string under </application>
  if (manifestContent.indexOf("</queries>") === -1)
    manifestContent = manifestContent.replace("</application>", "</application>\n\t" + "<queries>\n" + tag + "\n\t</queries>");
  else // Otherwise simply append given tag to "queries" tag
    manifestContent = manifestContent.replace("</queries>", "\n" + tag + "\n\t</queries>");
  //
  this.fs.writeFileSync(this.androidManifestPath, manifestContent);
};


/**
 * Replace searchValue with newValue in given file
 * @param {Object} options
 */
PlatformsManager.replaceTextInFile = function (options) {
  let {searchValue, newValue, filePath, all, platform, skipCondition} = options;
  //
  let pathToUse;
  switch (platform) {
    case this.platforms.ios:
      pathToUse = this.iosDir + filePath;
      break;

    case this.platforms.android:
      // If no file path provided, use android manifest path
      pathToUse = filePath ? this.androidDir + filePath : this.androidManifestPath;
      break;

    default:
      // No platform provided. Use rootDir to get the path
      pathToUse = this.rootDir + filePath;
      break;
  }
  //
  // If pathToUse does not exist, do nothing
  if (!this.fs.existsSync(pathToUse))
    return console.log("missing", pathToUse);
  //
  let fileContent = this.fs.readFileSync(pathToUse).toString("utf-8");
  //
  console.log("searchFor", pathToUse);
  //
  if (typeof searchValue === "string")
    searchValue = [searchValue];
  //
  if (typeof newValue === "string")
    newValue = [newValue];
  //
  if (!skipCondition)
    skipCondition = [];
  else if (!(skipCondition instanceof Array))
    skipCondition = [skipCondition];
  //
  let fileChanged;
  searchValue.forEach((value, i) => {
    let con = skipCondition[i];
    //
    // Set default statement
    let exitStatement;
    if (!con)
      con = {type: "includes", not: true, text: value};
    //
    if (con.type === "includes")
      exitStatement = fileContent.includes(con.text);
    //
    if (con.not)
      exitStatement = !exitStatement;
    //
    // If text doesn't exists, do nothing
    if (exitStatement)
      return;
    //
    fileChanged = true;
    if (all)
      fileContent = fileContent.replaceAll(value, newValue[i]);
    else
      fileContent = fileContent.replace(value, newValue[i]);
  });
  //
  if (fileChanged) {
    console.log("wrote", pathToUse);
    this.fs.writeFileSync(pathToUse, fileContent);
  }
};


/**
 * Copy srcPath to dstPath
 * @param {Object} options
 */
PlatformsManager.copyFileFromRootToPlatform = function (options) {
  let {srcPath, dstPath, platform} = options;
  //
  // If no dstPath, use srcPath for bot src and dst
  dstPath = dstPath || srcPath;
  //
  let platformDir = platform === this.platforms.ios ? this.iosDir : this.androidDir;
  //
  srcPath = this.rootDir + srcPath;
  dstPath = platformDir + dstPath;
  //
  if (!this.fs.existsSync(platformDir))
    return console.log("Skip", srcPath, "copy (missing", platform, "platform)");
  //
  if (!this.fs.existsSync(srcPath))
    return console.log("Skip", srcPath, "copy (path does not exist)");
  //
  console.log("Copy", srcPath, "to", platformDir);
  this.fs.createReadStream(srcPath).pipe(this.fs.createWriteStream(dstPath));
};


/**
 * Find files
 * @param {Object} options
 *                 - platform: android or ios
 *                 - isCompleteDirPath: true if given dirPath is complete and I don't have to add platformPath
 *                 - dirPath: directory to look for files
 *                 - ext: file extension to find
 *                 - files: list of directory's files
 *                 - result: files found
 */
PlatformsManager.findFiles = function (options) {
  let {platform, isCompleteDirPath, dirPath, ext, files, result} = options;
  //
  if (!isCompleteDirPath) {
    let platformDir = platform === this.platforms.ios ? this.iosDir : this.androidDir;
    dirPath = platformDir + (dirPath || "");
  }
  //
  result = result || [];
  //
  if (!this.fs.existsSync(dirPath))
    return result;
  //
  files = files || this.fs.readdirSync(dirPath);
  //
  files.forEach(file => {
    let subDirPath = this.path.join(dirPath, file);
    if (this.fs.statSync(subDirPath).isDirectory())
      result = this.findFiles({platform, isCompleteDirPath: true, dirPath: subDirPath, ext, files: this.fs.readdirSync(subDirPath), result});
    else if (file.substr(-1 * (ext.length + 1)) === '.' + ext)
      result.push(subDirPath);
  });
  //
  return result;
};


/**
 * Change permissions to files having given extension inside given platform directory
 * @param {Object} options
 *                 - platform: android or ios
 *                 - ext: file extension to find
 *                 - permissions: permissions to apply
 */
PlatformsManager.changePermissions = function (options) {
  let {platform, ext, permissions} = options;
  //
  // Find files having given extension inside given platform directory
  let files = this.findFiles({platform, ext});
  files.forEach(file => {
    if (file.toLowerCase().includes("pods") || file.includes("scripts")) {
      console.log("cambio i permessi per: " + file);
      this.fs.chmodSync(file, permissions);
    }
  });
};


/**
 * Change permissions to files having given extension inside given platform directory
 * @param {Object} options
 *                 - srcPath: android or ios
 *                 - dstPath: file extension to find
 *                 - permissions: permissions to apply
 */
PlatformsManager.moveFile = function (options) {
  let {srcPath, dstPath} = options;
  //
  this.fs.copyFileSync(srcPath, dstPath);
  this.fs.unlinkSync(srcPath);
};


module.exports = PlatformsManager;