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
    let pluginXmlBGPath = rootdir + "/plugins/cordova-plugin-background-geolocation/plugin.xml";
    //
    if (fs.existsSync(pluginXmlBGPath)) {
      let pluginXmlContent = fs.readFileSync(pluginXmlBGPath).toString("utf-8");
      //
      // This plugin uses default icon resource, that is defined as @mipmap/ic_launcher and not as @mipmap/icon on android.
      // Thus I edit ICON preference from @mipmap/icon to @mipmap/ic_launcher in plugin.xml.
      pluginXmlContent = pluginXmlContent.replace(/@mipmap\/icon/g, "@mipmap/ic_launcher");
      //
      // Also edit GOOGLE_PLAY_SERVICES_VERSION default version in order to fix error "cannot access zzbfm".
      // (see https://forum.ionicframework.com/t/getting-apk-build-failure-when-using-ionic-native-push-and-ionic-native-background-geolocation/175419/9)
      pluginXmlContent = pluginXmlContent.replace(/\"GOOGLE_PLAY_SERVICES_VERSION\" default=\"11\+\"/g, "\"GOOGLE_PLAY_SERVICES_VERSION\" default=\"15.0.1\"");
      //
      fs.writeFileSync(pluginXmlBGPath, pluginXmlContent);
    }
    //
    // Fix cordova-sms-plugin
    let pluginXmlSMS = rootdir + "/plugins/cordova-sms-plugin/plugin.xml";
    //
    if (fs.existsSync(pluginXmlSMS)) {
      let pluginXmlContent = fs.readFileSync(pluginXmlSMS).toString("utf-8");
      //
      // Edit plugin.xml in order to add SEND.SMS permission inside AndroidManifest.xml, since this permission is required to send SMS
      if (pluginXmlContent.indexOf("android.permission.SEND_SMS") === -1) {
        pluginXmlContent = pluginXmlContent.replace(/<platform name=\"android\">/g,
                '<platform name="android">\n \
            <config-file file="AndroidManifest.xml" target="app/src/main/AndroidManifest.xml" xmlns:android="http://schemas.android.com/apk/res/android" parent="/manifest">\n \
              <uses-permission android:name="android.permission.SEND_SMS" />\n \
            </config-file>');
        //
        fs.writeFileSync(pluginXmlSMS, pluginXmlContent);
      }
    }
    //
    // Fix cordova-plugin-local-notification
    let pluginXmlLocalNotification = rootdir + "/plugins/cordova-plugin-local-notification/plugin.xml";
    //
    if (fs.existsSync(pluginXmlLocalNotification)) {
      let pluginXmlContent = fs.readFileSync(pluginXmlLocalNotification).toString("utf-8");
      //
      // Comment android-sdk requirement since it's not applied correctly
      if (pluginXmlContent.indexOf('<!-- <engine name="android-sdk"     version=">=26" /> -->') === -1) {
        pluginXmlContent = pluginXmlContent.replace(/<engine name="android-sdk"     version=">=26" \/>/g, '<!-- <engine name="android-sdk"     version=">=26" /> -->');
        //
        fs.writeFileSync(pluginXmlLocalNotification, pluginXmlContent);
      }
    }
    //
    // Fix cordova-plugin-ionic-keyboard
    let keyboardJava = rootdir + "/plugins/cordova-plugin-ionic-keyboard/src/android/CDVIonicKeyboard.java";
    //
    if (fs.existsSync(keyboardJava)) {
      let keyboardJavaContent = fs.readFileSync(keyboardJava).toString("utf-8");
      //
      if (keyboardJavaContent.indexOf("import android.view.Window;") === -1)
        keyboardJavaContent = keyboardJavaContent.replace("import android.view.ViewTreeObserver.OnGlobalLayoutListener;", "import android.view.ViewTreeObserver.OnGlobalLayoutListener;\nimport android.view.Window;");
      //
      keyboardJavaContent = keyboardJavaContent.replace("frameLayoutParams.height = usableHeightSansKeyboard - heightDifference;", "frameLayoutParams.height = usableHeightNow - new Rect().top;");
      keyboardJavaContent = keyboardJavaContent.replace("frameLayoutParams.height = usableHeightSansKeyboard;", "frameLayoutParams.height = usableHeightNow;");
      keyboardJavaContent = keyboardJavaContent.replace("return (r.bottom - r.top);", "final Window window = cordova.getActivity().getWindow();\n\
                            boolean isFullScreen = (window.getDecorView().getSystemUiVisibility() & View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN) == View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN;\n\
                            return isFullScreen ? r.bottom: r.height();");
      //
      fs.writeFileSync(keyboardJava, keyboardJavaContent);
    }
    //
    // Fix cordova-plugin-inappbrowser
    let inAppBrowserJava = rootdir + "/plugins/cordova-plugin-inappbrowser/src/android/InAppBrowser.java";
    //
    if (fs.existsSync(inAppBrowserJava)) {
      let inAppBrowserJavaContent = fs.readFileSync(inAppBrowserJava).toString("utf-8");
      //
      if (inAppBrowserJavaContent.indexOf("settings.setAllowFileAccess(true);") === -1) {
        let oldString = "settings.setPluginState(android.webkit.WebSettings.PluginState.ON);";
        //
        let newString = oldString + "\n\t\t\t\t\t\t\t\tsettings.setAllowFileAccess(true);\n";
        //
        inAppBrowserJavaContent = inAppBrowserJavaContent.replace(oldString, newString);
        //
        fs.writeFileSync(inAppBrowserJava, inAppBrowserJavaContent);
      }
    }
  }
  //
  if (ios) {
    // Fix cordova-media-with-compression
    let cdvSound = rootdir + "/plugins/cordova-media-with-compression/src/ios/CDVSound.m";
    if (fs.existsSync(cdvSound)) {
      let cdvSoundContent = fs.readFileSync(cdvSound).toString("utf-8");
      //
      // Lines 390-393 use an old userAgent interface that is no longer supported and causes build to fail (and it's also useless)
      // So replace it with "nil"
      cdvSoundContent = cdvSoundContent.replace("[self.commandDelegate userAgent]", "nil");
      //
      fs.writeFileSync(cdvSound, cdvSoundContent);
    }
    //
    // Fix phonegap-nfc
    let nfcPlugin = rootdir + "/plugins/phonegap-nfc/src/ios/NfcPlugin.m";
    if (fs.existsSync(nfcPlugin)) {
      let nfcPluginContent = fs.readFileSync(nfcPlugin).toString("utf-8");
      //
      // "new" is no longer a valid way to create new object instances in newer XCode version. Use "alloc" instead
      nfcPluginContent = nfcPluginContent.replace(/NFCTagReaderSession new/g, "NFCTagReaderSession alloc");
      nfcPluginContent = nfcPluginContent.replace(/NFCNDEFReaderSession new/g, "NFCNDEFReaderSession alloc");
      //
      fs.writeFileSync(nfcPlugin, nfcPluginContent);
    }
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
    // Fix cordova-plugin-push
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
  }
};