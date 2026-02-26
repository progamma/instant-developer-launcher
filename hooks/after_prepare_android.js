var platformsManager = require("../utils/platformsManager.js");
//
module.exports = function (context) {
  // Copy build-extras.gradle to platform directory
  platformsManager.copyFileFromRootToPlatform({
    srcPath: "/build-extras.gradle",
    platform: platformsManager.platforms.android
  });
  //
  // Copy google-services.json to platform directory
  platformsManager.copyFileFromRootToPlatform({
    srcPath: "/google-services.json",
    dstPath: "/app/google-services.json",
    platform: platformsManager.platforms.android
  });
  //
  // Add "android.speech.RecognitionService" to manifest
  platformsManager.appendTagToQueries({
    tag: "\t\t<intent>\n\t\t\t<action android:name=\"android.speech.RecognitionService\"/>\n\t\t</intent>",
    name: "android.speech.RecognitionService",
    pluginPath: "/plugins/cordova-plugin-speechrecognition"
  });
  //
  // Add "android.intent.action.TTS_SERVICE" to manifest
  platformsManager.appendTagToQueries({
    tag: "\t\t<intent>\n\t\t\t<action android:name=\"android.intent.action.TTS_SERVICE\"/>\n\t\t</intent>",
    name: "android.intent.action.TTS_SERVICE",
    pluginPath: "/plugins/cordova-plugin-tts"
  });
  //
  // Fix missing android:exported="true" - NoActionBar
  platformsManager.replaceTextInFile({
    searchValue: "<activity android:configChanges=\"orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode\" android:label=\"@string/activity_name\" android:launchMode=\"singleTop\" android:name=\"MainActivity\" android:theme=\"@android:style/Theme.DeviceDefault.NoActionBar\" android:windowSoftInputMode=\"adjustResize\">",
    newValue: "<activity android:exported=\"true\" android:configChanges=\"orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode\" android:label=\"@string/activity_name\" android:launchMode=\"singleTop\" android:name=\"MainActivity\" android:theme=\"@android:style/Theme.DeviceDefault.NoActionBar\" android:windowSoftInputMode=\"adjustResize\">",
    platform: platformsManager.platforms.android
  });
  //
  // Fix missing android:exported="true" mauron85/background-geolocation-android
  platformsManager.replaceTextInFile({
    searchValue: "<service android:name=\"com.marianhello.bgloc.sync.AuthenticatorService\">",
    newValue: "<service android:exported=\"true\" android:name=\"com.marianhello.bgloc.sync.AuthenticatorService\">",
    platform: platformsManager.platforms.android
  });
  //
  // Fix FLAG_MUTABLE - NFC
  platformsManager.replaceTextInFile({
    searchValue: "            pendingIntent = PendingIntent.getActivity(activity, 0, intent, 0);",
    newValue: "if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {\n                pendingIntent = PendingIntent.getActivity(activity, 0, intent, PendingIntent.FLAG_MUTABLE);\n            } else {\n                pendingIntent = PendingIntent.getActivity(activity, 0, intent, 0);\n            }",
    filePath: "/app/src/main/java/com/chariotsolutions/nfc/plugin/NfcPlugin.java",
    platform: platformsManager.platforms.android
  });
  //
  // Fix missing android:exported="true" mauron85/background-geolocation-android
  platformsManager.replaceTextInFile({
    searchValue: "<uses-permission android:name=\"android.permission.WRITE_EXTERNAL_STORAGE\" />",
    newValue: "",
    platform: platformsManager.platforms.android,
    skipCondition: {type: "includes", not: true, text: "<uses-permission android:maxSdkVersion=\"32\" android:name=\"android.permission.WRITE_EXTERNAL_STORAGE\" />"},
    all: true
  });
  //
  // Fix plugins replacing "jcenter" with "mavenCentral" in their gradle file (change required by gradle 8.13)
  platformsManager.replaceTextInFile({
    searchValue: "jcenter",
    newValue: "mavenCentral",
    filePath: "/com.unarin.cordova.beacon/instantdeveloper-cordova-plugin-ibeacon.gradle",
    platform: platformsManager.platforms.android
  });
  //
  platformsManager.replaceTextInFile({
    searchValue: "jcenter",
    newValue: "//jcenter",
    filePath: "/@moodlehq/cordova-plugin-local-notification/instantdeveloper-localnotification.gradle",
    platform: platformsManager.platforms.android,
    skipCondition: {type: "includes", text: "//jcenter"}
  });
  //
  platformsManager.replaceTextInFile({
    searchValue: "jcenter",
    newValue: "mavenCentral",
    filePath: "/phonegap-plugin-barcodescanner/instantdeveloper-barcodescanner.gradle",
    platform: platformsManager.platforms.android
  });
};