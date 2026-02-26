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