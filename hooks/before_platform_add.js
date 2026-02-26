var platformsManager = require("../utils/platformsManager.js");
var fs = require("fs");
rootdir = process.cwd();
//
module.exports = function (context) {
  let i;
  let ios, android;
  //
  // Check which platform I'm going to add
  for (i = 0; i < context.opts.platforms.length; i++) {
    if (!android)
      android = (context.opts.platforms[i].indexOf("android") !== -1);
    //
    if (!ios)
      ios = (context.opts.platforms[i].indexOf("ios") !== -1);
  }
  //
  if (android) {
    // Fix cordova-plugin-background-geolocation
    // 1) This plugin uses default icon resource, that is defined as @mipmap/ic_launcher and not as @mipmap/icon on android.
    // Thus I edit ICON preference from @mipmap/icon to @mipmap/ic_launcher in plugin.xml.
    //
    // 2) Also edit GOOGLE_PLAY_SERVICES_VERSION default version in order to fix error "cannot access zzbfm".
    // (see https://forum.ionicframework.com/t/getting-apk-build-failure-when-using-ionic-native-push-and-ionic-native-background-geolocation/175419/9)
    platformsManager.replaceTextInFile({
      searchValue: [
        "@mipmap/icon",
        "\"GOOGLE_PLAY_SERVICES_VERSION\" default=\"11+\""
      ],
      newValue: [
        "@mipmap/ic_launcher",
        "\"GOOGLE_PLAY_SERVICES_VERSION\" default=\"15.0.1\""
      ],
      filePath: "/plugins/cordova-plugin-background-geolocation/plugin.xml",
      all: true
    });
    //
    // 3) Replace "compile" with "implemetation"
    platformsManager.replaceTextInFile({
      searchValue: "compile",
      newValue: "implementation",
      filePath: "/plugins/cordova-plugin-background-geolocation/android/dependencies.gradle",
      all: true
    });
    //
    // Fix cordova-sms-plugin
    // Edit plugin.xml in order to add SEND.SMS permission inside AndroidManifest.xml, since this permission is required to send SMS
    platformsManager.replaceTextInFile({
      searchValue: "<platform name=\"android\">",
      newValue: "<platform name=\"android\">\n \
            <config-file file=\"AndroidManifest.xml\" target=\"app/src/main/AndroidManifest.xml\" xmlns:android=\"http://schemas.android.com/apk/res/android\" parent=\"/manifest\">\n \
              <uses-permission android:name=\"android.permission.SEND_SMS\" />\n \
            </config-file>",
      filePath: "/plugins/cordova-sms-plugin/plugin.xml",
      skipCondition: {type: "includes", text: "android.permission.SEND_SMS"},
      all: true
    });
    //
    // Fix cordova-plugin-local-notification
    // Comment android-sdk requirement since it's not applied correctly
    platformsManager.replaceTextInFile({
      searchValue: "<engine name=\"android-sdk\"     version=\">=26\" />",
      newValue: "<!-- <engine name=\"android-sdk\"     version=\">=26\" /> -->",
      filePath: "/plugins/cordova-plugin-local-notification/plugin.xml",
      skipCondition: {type: "includes", text: "<!-- <engine name=\"android-sdk\"     version=\">=26\" /> -->"},
      all: true
    });
    //
    // Replace "compile" with "implementation"
    platformsManager.replaceTextInFile({
      searchValue: "compile",
      newValue: "implementation",
      filePath: "/plugins/cordova-plugin-local-notification/src/android/build/localnotification.gradle",
      all: true
    });
    //
    // Fix cordova-plugin-ionic-keyboard
    platformsManager.replaceTextInFile({
      searchValue: [
        "import android.view.ViewTreeObserver.OnGlobalLayoutListener;",
        "frameLayoutParams.height = usableHeightSansKeyboard - heightDifference;",
        "frameLayoutParams.height = usableHeightSansKeyboard;",
        "return (r.bottom - r.top);"
      ],
      newValue: [
        "import android.view.ViewTreeObserver.OnGlobalLayoutListener;\nimport android.view.Window;",
        "frameLayoutParams.height = usableHeightNow - new Rect().top;",
        "frameLayoutParams.height = usableHeightNow;",
        "final Window window = cordova.getActivity().getWindow();\n\
                            boolean isFullScreen = (window.getDecorView().getSystemUiVisibility() & View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN) == View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;\n\
                            return isFullScreen ? r.bottom: r.height();"
      ],
      filePath: "/plugins/cordova-plugin-ionic-keyboard/src/android/CDVIonicKeyboard.java",
      skipCondition: [{type: "includes", text: "import android.view.Window;"}, null, null, null]
    });
    //
    // Fix cordova-plugin-inappbrowser
    platformsManager.replaceTextInFile({
      searchValue: "settings.setPluginState(android.webkit.WebSettings.PluginState.ON);",
      newValue: "settings.setPluginState(android.webkit.WebSettings.PluginState.ON);" + "\n\t\t\t\t\t\t\t\tsettings.setAllowFileAccess(true);\n",
      filePath: "/plugins/cordova-plugin-inappbrowser/src/android/InAppBrowser.java",
      skipCondition: {type: "includes", text: "settings.setAllowFileAccess(true);"}
    });
    //
    // Fix cordova-plugin-ibeacon
    platformsManager.replaceTextInFile({
      searchValue: "compile 'org.altbeacon:android-beacon-library:2.16.1'",
      newValue: "implementation 'org.altbeacon:android-beacon-library:2.19'",
      filePath: "/plugins/com\.unarin\.cordova\.beacon/src/android/cordova-plugin-ibeacon.gradle"
    });
    //
    // Fix phonegap-plugin-barcodescanner
    platformsManager.replaceTextInFile({
      searchValue: ["compile", "repositories{"],
      newValue: ["implementation", "configurations { \n\timplementation.exclude group: 'com.google.zxing'\n}\n\nrepositories{"],
      filePath: "/plugins/phonegap-plugin-barcodescanner/src/android/barcodescanner.gradle",
      skipCondition: [null, {type: "includes", text: "configurations"}]
    });
    //
    // Fix phonegap-nfc (Android Beam removed in API level 34: https://developer.android.com/sdk/api_diff/34/changes )
    platformsManager.replaceTextInFile({
      searchValue: [
        "!nfcAdapter.isNdefPushEnabled()",
        "nfcAdapter.setBeamPushUris",
        "nfcAdapter.setNdefPushMessage",
        "nfcAdapter.setOnNdefPushCompleteCallback"
      ],
      newValue: [
        "/*!nfcAdapter.isNdefPushEnabled()*/false",
        "//nfcAdapter.setBeamPushUris",
        "//nfcAdapter.setNdefPushMessage",
        "//nfcAdapter.setOnNdefPushCompleteCallback"
      ],
      filePath: "/plugins/phonegap-nfc/src/android/src/com/chariotsolutions/nfc/plugin/NfcPlugin.java",
      skipCondition: [
        {type: "includes", text: "/*!nfcAdapter.isNdefPushEnabled()*/false"},
        {type: "includes", text: "//nfcAdapter.setBeamPushUris"},
        {type: "includes", text: "//nfcAdapter.setNdefPushMessage"},
        {type: "includes", text: "//nfcAdapter.setOnNdefPushCompleteCallback"}
      ],
      all: true
    });
    //
    // Fix cordova-plugin-oidc-basic
    platformsManager.replaceTextInFile({
      searchValue: ".put(\"nonce\",                      jsonForNullable(request.nonce))",
      newValue: "//.put(\"nonce\",                      jsonForNullable(request.nonce))",
      filePath: "/plugins/cordova-plugin-oidc-basic/src/android/OIDCBasic.java"
    });
  }
  //
  if (ios) {
    // Fix cordova-media-with-compression
    // Lines 390-393 use an old userAgent interface that is no longer supported and causes build to fail (and it's also useless)
    // So replace it with "nil"
    platformsManager.replaceTextInFile({
      searchValue: "[self.commandDelegate userAgent]",
      newValue: "nil",
      filePath: "/plugins/cordova-media-with-compression/src/ios/CDVSound.m"
    });
    //
    // Fix phonegap-nfc
    // "new" is no longer a valid way to create new object instances in newer XCode version. Use "alloc" instead
    platformsManager.replaceTextInFile({
      searchValue: ["NFCTagReaderSession new", "NFCNDEFReaderSession new"],
      newValue: ["NFCTagReaderSession alloc", "NFCNDEFReaderSession alloc"],
      filePath: "/plugins/phonegap-nfc/src/ios/NfcPlugin.m",
      all: true
    });
    //
    // Fix cordova-plugin-battery-status
    let batteryPlugin = rootdir + "/plugins/cordova-plugin-battery-status/src/ios/CDVBattery.m";
    if (fs.existsSync(batteryPlugin)) {
      let batteryPluginOldContent = fs.readFileSync(batteryPlugin).toString("utf-8");
      let batteryPluginNewContent = "";
      //
      // The battery status event on iOS is not fired at the app start, but just when battery level or plugged status change. (https://github.com/apache/cordova-plugin-battery-status/issues/78)
      // This cause batteryLevel and isPlugged properties to be "undefined" on app start.
      // Thus I add "[self updateBatteryStatus:nil]" to CDVBattery.m file in order to fire battery status event even on app start.
      if (batteryPluginOldContent.indexOf("[self updateBatteryStatus:nil]") === -1) {
        let lines = batteryPluginOldContent.split("\n");
        for (i = 0; i < lines.length; i++) {
          if (i === 113)
            lines[i] += "\n[self updateBatteryStatus:nil];";
          //
          batteryPluginNewContent += lines[i] + "\n";
        }
        //
        fs.writeFileSync(batteryPlugin, batteryPluginNewContent);
      }
    }
    //
    // Fix cordova-plugin-push iOS
    let pushPlugin = rootdir + "/plugins/@havesource/cordova-plugin-push/src/ios/AppDelegate+notification.m";
    if (fs.existsSync(pushPlugin)) {
      let pushPluginOldContent = fs.readFileSync(pushPlugin).toString("utf-8");
      let pushPluginNewContent = "";
      //
      if (pushPluginOldContent.indexOf("// Fix isInline") === -1) {
        // Push notifications have always to be delivered to app, not just in case app is not active
        pushPluginOldContent = pushPluginOldContent.replace("application.applicationState != UIApplicationStateActive", "application.applicationState != UIApplicationStateActive || true");
        //
        // The "notification click" event has to be notified immediately if notification is silent (in case of background) or if app is in foreground
        pushPluginOldContent = pushPluginOldContent.replace("silent == 1", "silent == 1 || application.applicationState == UIApplicationStateActive");
        //
        // Calculate isInline property in order to let app know if state was foreground or background when notification arrived
        let lines = pushPluginOldContent.split("\n");
        for (i = 0; i < lines.length; i++) {
          if (i === 122) {
            lines[i] = "\n            // Fix isInline\n";
            lines[i] += "            if (application.applicationState == UIApplicationStateActive)\n";
            lines[i] += "              pushHandler.isInline = YES;\n";
            lines[i] += "            else\n";
            lines[i] += "              pushHandler.isInline = NO;";
          }
          //
          pushPluginNewContent += lines[i] + "\n";
        }
        //
        fs.writeFileSync(pushPlugin, pushPluginNewContent);
      }
    }
    //
    // Fix cordova-plugin-push (https://github.com/progamma/IndeRT/issues/6991 and https://github.com/progamma/IndeRT/issues/6981)
    platformsManager.replaceTextInFile({
      searchValue: "case UNAuthorizationStatusDenied:",
      newValue: "case UNAuthorizationStatusDenied:\n                [self performSelectorOnMainThread:@selector(registerForRemoteNotifications) withObject:nil waitUntilDone:NO];",
      filePath: "/plugins/@havesource/cordova-plugin-push/src/ios/PushPlugin.m",
      skipCondition: {type: "includes", text: "case UNAuthorizationStatusDenied:\n                [self"}
    });
    //
    // Fix cordova-plugin-oidc-basic
    platformsManager.replaceTextInFile({
      searchValue: ["<framework src=\"net.openid:appauth:0.7+\"/>", "<framework src=\"AppAuth\" type=\"podspec\" spec=\"~> 1.3.0\" />"],
      newValue: ["<framework src=\"net.openid:appauth:0.8+\"/>", "<podspec>\n<config>\n<source url=\"https://cdn.cocoapods.org/\"/>\n</config>\n<pods use-frameworks=\"true\">\n<pod name=\"AppAuth\" spec=\"~> 1.3.0\" />\n</pods>\n</podspec>"],
      filePath: "/plugins/cordova-plugin-oidc-basic/plugin.xml"
    });
  }
};