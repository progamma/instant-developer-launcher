var platformsManager = require("../utils/platformsManager.js");
//
console.log("Handling project.properties");
platformsManager.replaceTextInFile({
  searchValue: [
    "com.android.support:support-v4:+",
    "com.android.support:support-v4:24+",
    "com.android.support:support-v4:24.1.1+",
    "com.android.support:support-v4:26+",
    "com.google.android.gms:play-services-location:+",
    "com.google.android.gms:play-services-location:11+"
  ],
  newValue: [
    "com.android.support:support-v4:11.6.2",
    "com.android.support:support-v4:11.6.2",
    "com.android.support:support-v4:11.6.2",
    "com.android.support:support-v4:11.6.2",
    "com.google.android.gms:play-services-location:11.6.2",
    "com.google.android.gms:play-services-location:11.6.2"
  ],
  filePath: "/project.properties",
  platform: platformsManager.platforms.android,
  all: true
});