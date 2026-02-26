#!/bin/bash

# Load properties file
. cordovaLauncher.properties

# Update iOS platform
echo "Start iOS platform update"
echo "Remove old iOS platform"
cordova platform remove ios

echo "Add new iOS platform"
cordova platform add ios@$iOSPlatformVersion

echo "iOS platform updated"