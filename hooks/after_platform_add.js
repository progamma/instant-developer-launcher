const fs = require('fs');
const path = require('path');

module.exports = (context) => {
  // Make sure android platform is part of build
  let isAndroid = false;
  for (var i = 0; i < context.opts.platforms.length; i++) {
    if (context.opts.platforms[i].indexOf("android") !== -1)
      isAndroid = true;
  }
  //
  if (!isAndroid)
    return;
  //
  // Replace target sdk 29 references with target sdk 31
  const platformRoot = path.join(context.opts.projectRoot, 'platforms/android');
  const buildGradleFile = path.join(platformRoot, 'build.gradle');
  const androidAppBuildGradleFile = path.join(platformRoot, 'app/build.gradle');
  const projectPropertiesFile = path.join(platformRoot, 'project.properties');
  const cordovaProjectPropertiesFile = path.join(platformRoot, 'CordovaLib/project.properties');
  const cordovaLibProjectBuilderFile = path.join(platformRoot, 'cordova/lib/builders/ProjectBuilder.js');
  const cordovaLibCheckReqsFile = path.join(platformRoot, "cordova/lib/check_reqs.js");
  //
  let buildGradleFileContent = fs.readFileSync(buildGradleFile).toString('utf8');
  buildGradleFileContent = buildGradleFileContent.replace(/defaultBuildToolsVersion="29.0.2"/g, 'defaultBuildToolsVersion="31.0.0"')
          .replace(/defaultTargetSdkVersion=29/g, 'defaultTargetSdkVersion=31')
          .replace(/defaultCompileSdkVersion=29/g, 'defaultCompileSdkVersion=31')
          .replace(/classpath 'com.android.tools.build:gradle:4.0.0'/g, "classpath 'com.android.tools.build:gradle:4.2.2'");
  fs.writeFileSync(buildGradleFile, buildGradleFileContent);
  //
  let projectPropertiesFileContent = fs.readFileSync(projectPropertiesFile).toString('utf8');
  projectPropertiesFileContent = projectPropertiesFileContent.replace(/target=android-29/g, 'target=android-31');
  fs.writeFileSync(projectPropertiesFile, projectPropertiesFileContent);
  //
  let cordovaProjectPropertiesFileContent = fs.readFileSync(cordovaProjectPropertiesFile).toString('utf8');
  cordovaProjectPropertiesFileContent = cordovaProjectPropertiesFileContent.replace(/target=android-29/g, 'target=android-31');
  fs.writeFileSync(cordovaProjectPropertiesFile, cordovaProjectPropertiesFileContent);
  //
  let androidAppBuildGradleFileContent = fs.readFileSync(androidAppBuildGradleFile).toString('utf-8');
  androidAppBuildGradleFileContent = androidAppBuildGradleFileContent.replace(/gradleVersion = '6.5'/g, "gradleVersion = '6.7.1'");
  fs.writeFileSync(androidAppBuildGradleFile, androidAppBuildGradleFileContent);
  //
  let cordovaLibProjectBuilderFileContent = fs.readFileSync(cordovaLibProjectBuilderFile).toString('utf-8');
  cordovaLibProjectBuilderFileContent = cordovaLibProjectBuilderFileContent.replace("https://services.gradle.org/distributions/gradle-6.5-all.zip", "https://services.gradle.org/distributions/gradle-6.7.1-all.zip");
  fs.writeFileSync(cordovaLibProjectBuilderFile, cordovaLibProjectBuilderFileContent);
  //
  let cordovaLibCheckReqsFileContent = fs.readFileSync(cordovaLibCheckReqsFile).toString('utf-8');
  cordovaLibCheckReqsFileContent = cordovaLibCheckReqsFileContent.replace("const EXPECTED_JAVA_VERSION = '1.8.x';", "const EXPECTED_JAVA_VERSION = '11.x';");
  fs.writeFileSync(cordovaLibCheckReqsFile, cordovaLibCheckReqsFileContent);
  //
  return Promise.resolve().then(() => console.log('Project modified to match target SDK 31'));
};

