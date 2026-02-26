#!/bin/bash

# Load properties file
. cordovaLauncher.properties

# Update plugins (TO DO)
echo "Start plugins update"
echo "Remove old plugins"
echo "Add new plugins"


echo "Plugins updated"

# Update platforms
. updateAndroid.sh
. updateIOS.sh