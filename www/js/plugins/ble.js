/*
 * Instant Developer Next
 * Copyright Pro Gamma Spa 2000-2015
 * All rights reserved
 */


/* global cordova, bluetoothle */

var Plugin = Plugin || {};
var PlugMan = PlugMan || {};

/*
 * Create plugin object
 */
Plugin.Ble = {};


/*
 * Init plugin
 */
Plugin.Ble.init = function ()
{
};


/*
 * Initialize BLE
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.initialize = function (req)
{
  var first = true;
  bluetoothle.initialize(function (result) {
    if (first) {
      req.setResult(result);
      first = false;
    }
    req.result = result;
    PlugMan.sendEvent(req, "Change");
  }, req.params.params);
};


/*
 * Enable/Disable (Android)
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.enable = function (req)
{
  bluetoothle.enable(function (result) {
    /*req.setResult(result);*/
  }, function (error) {
    req.setError(error);
  });
};


/*
 * Enable/Disable (Android)
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.disable = function (req)
{
  bluetoothle.disable(function (result) {
    /*req.setResult(result);*/
  }, function (error) {
    req.setError(error);
  });
};


/*
 * getAdapterInfo
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.getAdapterInfo = function (req)
{
  bluetoothle.getAdapterInfo(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  });
};


/*
 * startScan
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.startScan = function (req)
{
  var first = true;
  bluetoothle.startScan(function (result) {
    if (first) {
      req.setResult(result);
      first = false;
    }
    req.result = result;
    PlugMan.sendEvent(req, "Scan");
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * stopScan
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.stopScan = function (req)
{
  bluetoothle.stopScan(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  });
};


/*
 * retrieveConnected
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.retrieveConnected = function (req)
{
  bluetoothle.retrieveConnected(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * bond
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.bond = function (req)
{
  var first = true;
  bluetoothle.bond(function (result) {
    if (first) {
      req.setResult(result);
      first = false;
    }
    req.result = result;
    PlugMan.sendEvent(req, "Bond");
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * unbond
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.unbond = function (req)
{
  bluetoothle.unbond(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * connect
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.connect = function (req)
{
  var first = true;
  bluetoothle.connect(function (result) {
    if (first) {
      req.setResult(result);
      first = false;
    }
    req.result = result;
    PlugMan.sendEvent(req, "Connect");
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * reconnect
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.reconnect = function (req)
{
  var first = true;
  bluetoothle.reconnect(function (result) {
    if (first) {
      req.setResult(result);
      first = false;
    }
    req.result = result;
    PlugMan.sendEvent(req, "Connect");
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * disconnect
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.disconnect = function (req)
{
  bluetoothle.disconnect(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * disconnect
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.close = function (req)
{
  bluetoothle.close(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * disconnect
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.discover = function (req)
{
  bluetoothle.discover(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * services
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.services = function (req)
{
  bluetoothle.services(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * characteristics
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.characteristics = function (req)
{
  bluetoothle.characteristics(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * descriptors
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.descriptors = function (req)
{
  bluetoothle.descriptors(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * read
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.read = function (req)
{
  bluetoothle.read(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * subscribe
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.subscribe = function (req)
{
  var first = true;
  bluetoothle.subscribe(function (result) {
    if (first) {
      req.setResult(result);
      first = false;
    }
    req.result = result;
    PlugMan.sendEvent(req, "Subscribe");
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * unsubscribe
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.unsubscribe = function (req)
{
  bluetoothle.unsubscribe(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * write
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.write = function (req)
{
  bluetoothle.write(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * readDescriptor
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.readDescriptor = function (req)
{
  bluetoothle.readDescriptor(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * writeDescriptor
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.writeDescriptor = function (req)
{
  bluetoothle.writeDescriptor(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * rssi
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.rssi = function (req)
{
  bluetoothle.rssi(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * mtu
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.mtu = function (req)
{
  bluetoothle.mtu(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * requestConnectionPriority
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.requestConnectionPriority = function (req)
{
  bluetoothle.requestConnectionPriority(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * isInitialized
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.isInitialized = function (req)
{
  bluetoothle.isInitialized(function (result) {
    req.setResult(result);
  });
};


/*
 * isEnabled
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.isEnabled = function (req)
{
  bluetoothle.isEnabled(function (result) {
    req.setResult(result);
  });
};


/*
 * isScanning
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.isScanning = function (req)
{
  bluetoothle.isScanning(function (result) {
    req.setResult(result);
  });
};


/*
 * isBonded
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.isBonded = function (req)
{
  bluetoothle.isBonded(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * wasConnected
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.wasConnected = function (req)
{
  bluetoothle.wasConnected(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * isConnected
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.isConnected = function (req)
{
  bluetoothle.isConnected(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * isDiscovered
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.isDiscovered = function (req)
{
  bluetoothle.isDiscovered(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  }, req.params.params);
};


/*
 * hasPermission
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.hasPermission = function (req)
{
  let permission = {};
  bluetoothle.hasPermission(function (result) {
    permission.location = result.hasPermission;
    bluetoothle.hasPermissionBtScan(function (result) {
      permission.scan = result.hasPermission;
      bluetoothle.hasPermissionBtConnect(function (result) {
        permission.connect = result.hasPermission;
        bluetoothle.hasPermissionBtAdvertise(function (result) {
          permission.advertise = result.hasPermission;
          req.setResult(permission);
        }, function (error) {
          req.setError(error);
        });
      }, function (error) {
        req.setError(error);
      });
    }, function (error) {
      req.setError(error);
    });
  }, function (error) {
    req.setError(error);
  });
};


/*
 * requestPermission
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.requestPermission = function (req)
{
  let permission = {};
  bluetoothle.requestPermission(function (result) {
    permission.location = result.requestPermission;
    bluetoothle.requestPermissionBtScan(function (result) {
      permission.scan = result.requestPermission;
      bluetoothle.requestPermissionBtConnect(function (result) {
        permission.connect = result.requestPermission;
        bluetoothle.requestPermissionBtAdvertise(function (result) {
          permission.advertise = result.requestPermission;
          req.setResult(permission);
        }, function (error) {
          req.setError(error);
        });
      }, function (error) {
        req.setError(error);
      });
    }, function (error) {
      req.setError(error);
    });
  }, function (error) {
    req.setError(error);
  });
};


/*
 * isLocationEnabled
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.isLocationEnabled = function (req)
{
  bluetoothle.isLocationEnabled(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  });
};


/*
 * requestLocation
 * @param {type} req - pluginmanager.js request obj
 */
Plugin.Ble.requestLocation = function (req)
{
  bluetoothle.requestLocation(function (result) {
    req.setResult(result);
  }, function (error) {
    req.setError(error);
  });
};
