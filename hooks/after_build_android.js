var platformsManager = require("../utils/platformsManager.js");
//
let subFolders = ["release", "debug"];
for (let f = 0; f < subFolders.length; f++) {
  let subFolder = subFolders[f];
  let files = platformsManager.findFiles({dirPath: "/build/outputs/apk/" + subFolder, ext: "apk", platform: platformsManager.platforms.android});
  files.forEach(f => platformsManager.moveFile(f, f.replace("/" + subFolder + "/", "/")));
}