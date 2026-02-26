var fs = require("fs"),
  path = require('path'),
  rootdir = process.cwd(),
  ios_dir = rootdir + "/platforms/ios";
//
function findFiles(base,ext,files,result)
{
  files = files || fs.readdirSync(base);
  result = result || [];
  files.forEach(
    function (file) {
      var newbase = path.join(base,file);
      if (fs.statSync(newbase).isDirectory()) {
        result = findFiles(newbase,ext,fs.readdirSync(newbase),result);
      }
      else {
        if (file.substr(-1 * (ext.length+1)) === '.' + ext)
          result.push(newbase);
      }
    }
  );
  return result;
}
//
ext_file_list = findFiles(ios_dir, 'sh');
for (let i = 0; i < ext_file_list.length; i++) {
  if (ext_file_list[i].toLowerCase().indexOf("pods") >= 0 || 
       ext_file_list[i].toLowerCase().indexOf("scripts") >= 0) {
    console.log("cambio i permessi per: " + ext_file_list[i]);
    fs.chmodSync(ext_file_list[i], 0o555);
  }
}
//
// Replaced text in file
let replaceTextInFile = function (searchValue, newValue, filePath) {
  let pathToUse = ios_dir + (filePath);
  //
  // If it exists, remove text from it
  if (!!filePath && fs.existsSync(pathToUse)) {
    let fileContent = fs.readFileSync(pathToUse).toString("utf-8");
    //
    // If text doesn't exists, do nothing
    console.log("searchFor", pathToUse);
    if (fileContent.indexOf(searchValue) === -1)
      return;
    //
    fileContent = fileContent.replace(searchValue, newValue);
    //
    console.log("wrote", pathToUse);
    fs.writeFileSync(pathToUse, fileContent);
  }
  else {
    console.log("missing", pathToUse);
  }
}
//
// Fix iPhone tab bar area
replaceTextInFile("wkWebView.UIDelegate = self.uiDelegate;\n", 
                  "#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000\n        if (@available(iOS 11.0, *)) {\n            [wkWebView.scrollView setContentInsetAdjustmentBehavior:UIScrollViewContentInsetAdjustmentNever];\n        }\n    #endif\n    if (@available(macOS 13.3, iOS 16.4, tvOS 16.4, *))\n                  wkWebView.inspectable = YES;\n    wkWebView.UIDelegate = self.uiDelegate; // Fixed\n", 
                  "/CordovaLib/Classes/Private/Plugins/CDVWebViewEngine/CDVWebViewEngine.m");