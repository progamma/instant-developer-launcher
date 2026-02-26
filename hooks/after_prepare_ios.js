var platformsManager = require("../utils/platformsManager.js");
//
// Change permissions to ".sh" files
platformsManager.changePermissions({platform: platformsManager.platforms.ios, ext: "sh", permissions: 0o555});
//
// Fix iPhone tab bar area
platformsManager.replaceTextInFile({
  searchValue: "wkWebView.UIDelegate = self.uiDelegate;\n",
  newValue: "#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000\n        if (@available(iOS 11.0, *)) {\n            [wkWebView.scrollView setContentInsetAdjustmentBehavior:UIScrollViewContentInsetAdjustmentNever];\n        }\n    #endif\n    if (@available(macOS 13.3, iOS 16.4, tvOS 16.4, *))\n                  wkWebView.inspectable = YES;\n    wkWebView.UIDelegate = self.uiDelegate; // Fixed\n",
  filePath: "/CordovaLib/Classes/Private/Plugins/CDVWebViewEngine/CDVWebViewEngine.m",
  platform: platformsManager.platforms.ios
});
//
// Update Pods deployment target to 11.0
platformsManager.replaceTextInFile({
  searchValue: "IPHONEOS_DEPLOYMENT_TARGET = 8.0",
  newValue: "IPHONEOS_DEPLOYMENT_TARGET = 11.0",
  filePath: "/Pods/Pods.xcodeproj/project.pbxproj",
  all: true,
  platform: platformsManager.platforms.ios
});