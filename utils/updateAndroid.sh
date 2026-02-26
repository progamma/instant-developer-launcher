#!/bin/bash

# Load properties file
. cordovaLauncher.properties

# Update Android platform
echo "Start Android platform update (version $androidPlatformVersion)"
echo "Remove old Android platform"
cordova platform remove android

echo "Add new Android platform"
cordova platform add android@$androidPlatformVersion

echo "Android platform updated"