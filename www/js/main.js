/*
 * Instant Developer Next
 * Copyright Pro Gamma Spa 2000-2014
 * All rights reserved
 */

/* global device, SafeAreaInset */

var Shell = Shell || {};
var PlugMan = PlugMan || {};
var Plugin = Plugin || {};
var AppMan = AppMan || {};
var EacAPI = EacAPI || {};
var cordova = cordova || undefined;

/**
 * Initialize the shell
 */
Shell.init = function ()
{
  PlugMan.init();
  AppMan.init();
  Shell.translate();
  //
  Shell.isOffline = false;
  //
  Shell.initUserInterface();
  //
  Shell.handleSafeArea();
  //
  // Pre-init native dialogs
  //Plugin.Notification.init();
  //
  if (!cordova) {
    // No cordova: no plugin complete event!
    Shell.pluginComplete();
  }
};


/**
 * Handle safe area
 */
Shell.handleSafeArea = function ()
{
  let addListeners = () => {
    window.addEventListener("resize", Shell.setSafeAreaVariables);
    screen.orientation.addEventListener("change", () => Shell.setSafeAreaVariables);
  };
  //
  // env(safe-area-inset-*) always return 0 on android so they need to be fixed using cordova-plugin-insets
  if (!Shell.isIOS()) {
    window.totalpave.Inset.create().then((inset) => {
      SafeAreaInset = inset;
      //
      // Add listener on inset change
      SafeAreaInset.addListener(Shell.setSafeAreaVariables);
      //
      // Add window resize and screen orientation change listeners since not all safe are changes are catched by above listener
      addListeners();
    });
  }
  else
    addListeners();
};


/**
 * Set safe area variables
 */
Shell.setSafeAreaVariables = function ()
{
  let insetValues = {};
  if (!Shell.isIOS()) {
    insetValues = SafeAreaInset.getInset();
    //
    // In case of primary landscape orientation (camera on left side), give right safe area the same value as left one.
    // Do the opposite in case of secondary landscape orientation.
    // In this way app content will be horizontally centered
    if (screen.orientation.type === "landscape-primary")
      insetValues.right = insetValues.left;
    else if (screen.orientation.type === "landscape-secondary")
      insetValues.left = insetValues.right;
    //
    let root = document.querySelector(":root");
    root.style.setProperty("--safe-area-inset-top", insetValues.top + "px");
    root.style.setProperty("--safe-area-inset-bottom", insetValues.bottom + "px");
    root.style.setProperty("--safe-area-inset-left", insetValues.left + "px");
    root.style.setProperty("--safe-area-inset-right", insetValues.right + "px");
  }
  else {
    let documentStyle = getComputedStyle(document.documentElement);
    //
    insetValues.top = parseFloat(documentStyle.getPropertyValue("--safe-area-inset-top"));
    insetValues.bottom = parseFloat(documentStyle.getPropertyValue("--safe-area-inset-bottom"));
    insetValues.left = parseFloat(documentStyle.getPropertyValue("--safe-area-inset-left"));
    insetValues.right = parseFloat(documentStyle.getPropertyValue("--safe-area-inset-right"));
  }
  //
  // Tell app to handle safe area using inset values
  for (let name in AppMan.apps)
    AppMan.apps[name].sendMessage({obj: "device-ui", id: "handleSafeArea", client: true, content: insetValues});
};


/**
 * translate the page
 */
Shell.translate = function ()
{
  document.title = _t("title");
  var all = document.getElementsByTagName("*");
  for (var i = all.length - 1; i >= 0; i--) {
    var obj = all[i];
    if (obj.id && obj.textContent) {
      var s = _t(obj.id);
      if (s)
        obj[obj.id.substr(-4, 4) === "HTML" ? "innerHTML" : "textContent"] = s;
    }
  }
};


/**
 * Initialize button actions and so on
 */
Shell.initUserInterface = function ()
{
  // Changes colors
  if (Shell.config.theme.accentColor !== "#45A94B")
    setColor("rgb(69, 169, 75)", Shell.config.theme.accentColor);
  if (Shell.config.theme.activeColor !== "#237131")
    setColor("rgb(35, 113, 49)", Shell.config.theme.activeColor);
  //
  Shell.page = "main";
  //
  // Kill 300ms delay (ios only)
  if (Shell.isIOS())
    TH.init(document.getElementById("wrapper"));
  //
  // Init main buttons
  Shell.setLoginMode(Shell.config.eacLogin);
  Shell.setSignupMode(Shell.config.eacSignup);
  Shell.setDeveloperMode(Shell.config.developerMode);
  ac(this.getPrimaryButton(), "btn-primary");
  //
  // Init global back button
  var backBtn = document.getElementById("btn-back");
  backBtn.onclick = function () {
    if (Shell.profileData)
      Shell.showPage("apps");
    else
      Shell.showPage("main");
  };
  //
  // Init qr code button
  var qrBtn = document.getElementById("btn-qrcode");
  qrBtn.onclick = function () {
    var req = {};
    req.setError = function () {
    };
    req.setResult = function (text) {
      try {
        var blob = JSON.parse(text);
        document.getElementById("connect-username").value = blob.userName;
        document.getElementById("connect-server").value = blob.server;
        //
        // Store the IDE session id if present
        Shell.idesid = blob.sid;
        //
        document.getElementById("btn-connect").click();
      }
      catch (ex) {
      }
    };
    Plugin.BarcodeScanner.scan(req);
  };
  qrBtn.parentNode.style.display = "none";
  //
  // Init apps page
  var searchFld = document.getElementById("search-field");
  if (Shell.config.appFilter) {
    searchFld.oninput = function () {
      AppMan.filterApps(searchFld.value);
    };
  }
  else {
    searchFld.parentNode.style.display = "none";
  }
};


/**
 * Returns the primary button on the main page
 */
Shell.getPrimaryButton = function ()
{
  if (Shell.config.primaryButton)
    return Shell.config.primaryButton;
  //
  if (Shell.config.developerMode)
    return "btn-connect";
  if (Shell.config.eacLogin)
    return "btn-login";
  if (Shell.config.eacSignup)
    return "btn-signup";
  //
  return "btn-connect";
};


/**
 * Set the developer mode active or not
 * @param {boolean} mode
 */
Shell.setDeveloperMode = function (mode)
{
  var connectBtn = document.getElementById("btn-connect");
  var closeConnectBtn = document.getElementById("btn-connect-close");
  var connectIcon = document.getElementById("icon-connect");
  //
  var cs = localStorage.getItem("connect-server");
  if (cs)
    document.getElementById("connect-server").value = cs;
  //
  var cu = localStorage.getItem("connect-username");
  if (cu)
    document.getElementById("connect-username").value = cu;
  //
  var cd = localStorage.getItem("connect-devicename");
  if (cd)
    document.getElementById("connect-devicename").value = cd;
  //
  if (mode) {
    connectBtn.parentNode.style.display = "";
    //
    connectBtn.onclick = function () {
      // if I were on the connect page, open the connection
      if (Shell.page === "connect") {
        if (Shell.verifyConnectionData())
          Shell.openConnection();
      }
      else {
        // go to the connect page
        Shell.showPage("connect");
      }
    };
    closeConnectBtn.onclick = function () {
      Shell.closeConnection();
    };
    connectIcon.style.display = "";
    connectIcon.onclick = function () {
      Shell.showPage("connect");
    };
  }
  else {
    connectBtn.parentNode.style.display = "none";
    connectIcon.style.display = "none";
  }
};


/**
 * Set the login mode active or not
 * @param {boolean} mode
 */
Shell.setLoginMode = function (mode)
{
  var loginBtn = document.getElementById("btn-login");
  var logoutBtn = document.getElementById("icon-logout");
  var refreshBtn = document.getElementById("icon-refresh");
  var loginUsername = document.getElementById("login-username");
  var fpwdBtn = document.getElementById("btn-recover-open");
  var recBtn = document.getElementById("btn-recover");
  var recClose = document.getElementById("recovery-close");
  var logClose = document.getElementById("logout-close");
  var logConfirm = document.getElementById("logout-confirm");
  //
  if (mode) {
    loginBtn.parentNode.style.display = "";
    if (Shell.profileData)
      loginUsername.value = Shell.profileData.username;
    loginBtn.onclick = function () {
      // if I were on the login page, try the login
      if (Shell.page === "login") {
        if (Shell.verifyLoginData()) {
          EacAPI.tryLogin(Shell.loginData, function (field, error) {
            if (error)
              Shell.setError(field, error);
            else
              Shell.loadApps();
          });
        }
      }
      else {
        // go to the login page
        Shell.showPage("login");
      }
    };
    fpwdBtn.onclick = function () {
      Shell.showPage("getpwd");
    };
    recBtn.onclick = function () {
      if (Shell.verifyRecoverData()) {
        EacAPI.recoverPassword(Shell.recoverData, function (field, msg) {
          if (msg && field)
            Shell.setError(field, msg);
          else {
            if (msg)
              document.getElementById("message-recovery-HTML").innerHTML = msg;
            Shell.openPopup("popup-recovery");
            setTimeout(Shell.showPage("main"), 1000);
          }
        });
      }
    };
    recClose.onclick = function () {
      Shell.closePopups();
    };
    logClose.onclick = function () {
      Shell.closePopups();
    };
    logConfirm.onclick = function () {
      Shell.closePopups();
      Shell.doLogout();
    };
  }
  else {
    loginBtn.parentNode.style.display = "none";
  }
  //
  // Configuring logout
  if (!Shell.config.eacLogout)
    logoutBtn.style.display = "none";
  else {
    logoutBtn.onclick = function () {
      if (Shell.isOffline)
        Shell.openPopup("popup-confirmlogout");
      else
        Shell.doLogout();
    };
  }
  //
  refreshBtn.onclick = function () {
    EacAPI.refreshApps(true);
  };
};


/**
 * Execute logout
 */
Shell.doLogout = function ()
{
  Shell.showPage("main");
  //
  // Clear any stored profile...
  EacAPI.setProfileData();
};


/**
 * Set the signup mode active or not
 * @param {boolean} mode
 */
Shell.setSignupMode = function (mode)
{
  var signupBtn = document.getElementById("btn-signup");
  var termsLink = document.getElementById("termsLink");
  var termsClose = document.getElementById("terms-close");
  var signupClose = document.getElementById("signup-close");
  //
  if (mode) {
    signupBtn.parentNode.style.display = "";
    signupBtn.onclick = function () {
      // if I were on the login page, try the login
      if (Shell.page === "signup") {
        if (Shell.verifySignupData()) {
          EacAPI.trySignup(Shell.loginData, function (field, error) {
            if (error)
              Shell.setError(field, error);
            else {
              var txt = _t("signup-confirmation-HTML");
              txt = txt.replace(/@username/g, Shell.loginData.username);
              txt = txt.replace(/@email/g, Shell.loginData.email);
              if (txt) {
                document.getElementById("signup-confirmation-HTML").innerHTML = txt;
                Shell.openPopup("popup-signup-confirmation");
              }
              //
              setTimeout(function () {
                Shell.showPage("login");
                if (Shell.config.loginAfterSignup) {
                  EacAPI.tryLogin(Shell.loginData, function (field, error) {
                    if (error)
                      Shell.setError(field, error);
                    else
                      Shell.loadApps();
                  });
                }
              }, 1000);
            }
          });
        }
      }
      else {
        // go to the signup page
        Shell.showPage("signup");
      }
    };
    //
    termsLink.onclick = function (e) {
      e.preventDefault();
      EacAPI.signTerms(function (txt) {
        if (txt)
          document.getElementById("terms_text_HTML").innerHTML = txt;
        Shell.openPopup("popup-terms");
      });
    };
    termsClose.onclick = function (e) {
      Shell.closePopups();
    };
    signupClose.onclick = function (e) {
      Shell.closePopups();
    };
  }
  else {
    signupBtn.parentNode.style.display = "none";
  }
};


/**
 * All plugins has loaded. Adjust user interface
 */
Shell.pluginComplete = function ()
{
  var reconnect = window.sessionStorage.getItem("reconnect");
  //
  if (Plugin.BarcodeScanner) {
    // Can activate qrcode button
    var qrbtn = document.getElementById("btn-qrcode");
    qrbtn.parentNode.style.display = "";
  }
  //
  // We need cordova to load offline apps
  AppMan.loadApps();
  //
  // A root app is configured in the config.js file using a key like this one:
  // "rootApp": {name: "MeetYou", title: "MeetYou", version: "0.7", header: "Pro Gamma S.p.A.", url: "https://prod2-progamma.instantdevelopercloud.com:443/MeetYou?addsid=1", online: true, root: true, visible: true, inplace: "ios"},
  // "rootApp": {name: "draw", inplace: "ios", installed: true, root: true},
  if (Shell.config.rootApp) {
    // Check if the root app has been reconfigured and
    // the original version matches with my version
    // We want to make sure that updating a laucher will invalidate previously reconfigured apps
    if (localStorage.getItem("root")) {
      var lv = Shell.config.rootApp.name + "-" + Shell.config.rootApp.version;
      if (localStorage.getItem("root-lv") !== lv) {
        console.warn("Localstorage root app does not match", localStorage.getItem("root-lv"), lv);
        // Invalidate file system
        localStorage.removeItem("root");
        localStorage.removeItem("root-lv");
      }
    }
    //
    // If the root app has not been reconfigured, use the default values
    if (!localStorage.getItem("root")) {
      //
      // Change the offline root url to "root" to alert the app to not download it
      // Change the dir to undefined to avoid loading from the file system
      var rootConfig = Shell.config.rootApp;
      if (!rootConfig.online && rootConfig.url) {
        rootConfig.url = "root:" + rootConfig.url;
        rootConfig.dir = undefined;
      }
      //
      AppMan.changeApps([rootConfig]);
      console.log("Launching original root app");
    }
    else {
      console.log("Launching updated root app");
    }
    //
    // Start the root apps
    var rootName = localStorage.getItem("root") || Shell.config.rootApp.name;
    AppMan.startApp(rootName);
  }
  else {
    //
    // Here we can retry login
    EacAPI.init();
    //
    if (Shell.profileData)
      Shell.loadApps(true, reconnect);
    //
    // Show container main page
    rc("wrapper", "hidden");
    //
    // Hide splash screen (if no root app should start)
    if (Plugin.SplashScreen)
      Plugin.SplashScreen.hide();
  }
  //
  Shell.updateLauncher();
  Shell.updateParams();
  //
  AppMan.updateApps();
  //
  if (Plugin.Device) {
    var x = document.getElementById("connect-devicename");
    if (!x.value)
      x.value = Plugin.Device.deviceName;
  }
  //
  // If a reconnection was requested, handle it
  if (reconnect) {
    setTimeout(function () {
      window.sessionStorage.removeItem("reconnect");
      Shell.verifyConnectionData();
      if (Shell.connectionData)
        Shell.openConnection();
    }, 200);
  }
};


/**
 * Shows a page
 * @param {string} page
 */
Shell.showPage = function (page)
{
  Shell.oldPage = Shell.page;
  Shell.page = page;
  //
  rc("container-main", Shell.oldPage + "-page");
  ac("container-main", Shell.page + "-page");
  //
  ac("btn-login-cont", "hidden");
  ac("btn-signup-cont", "hidden");
  ac("btn-connect-cont", "hidden");
  ac("btn-qrcode-cont", "hidden");
  ac("btn-recover-cont", "hidden");
  rc("btn-login", "btn-selected");
  rc("btn-signup", "btn-selected");
  rc("btn-connect", "btn-selected");
  rc("btn-qrcode", "btn-selected");
  rc("splash-title-main", "hidden");
  ac("splash-title-connect", "hidden");
  ac("btn-connect-close-cont", "hidden");
  rc("form-connect", "visible");
  rc("form-login", "visible");
  rc("form-signup", "visible");
  rc("form-recoverpassword", "visible");
  if (Shell.isOffline)
    ac("offline-bar", "visible");
  else
    rc("offline-bar", "visible");
  //
  ac("container-main", "form-mode");
  rc("container-main", "closed-mode");
  Shell.clearErrors();
  //
  if (page === "connect") {
    rc("btn-connect-cont", "hidden");
    ac("btn-connect", "btn-selected");
    ac("form-connect", "visible");
    rc("btn-qrcode-cont", "hidden");
  }
  if (page === "main") {
    rc("container-main", "form-mode");
    rc("btn-login-cont", "hidden");
    rc("btn-signup-cont", "hidden");
    rc("btn-connect-cont", "hidden");
  }
  if (page === "connection") {
    rc("container-main", "form-mode");
    ac("splash-title-main", "hidden");
    rc("splash-title-connect", "hidden");
    rc("btn-connect-close-cont", "hidden");
  }
  if (page === "login") {
    rc("btn-login-cont", "hidden");
    ac("btn-login", "btn-selected");
    ac("form-login", "visible");
  }
  if (page === "signup") {
    rc("btn-signup-cont", "hidden");
    ac("btn-signup", "btn-selected");
    ac("form-signup", "visible");
  }
  if (page === "apps") {
    rc("container-main", "form-mode");
    ac("container-main", "closed-mode");
    rc("offline-bar", "visible");
  }
  if (page === "getpwd") {
    rc("form-login", "visible");
    ac("form-recoverpassword", "visible");
    rc("btn-recover-cont", "hidden");
  }
};


/**
 * Opens a popup
 * @param {string} popupID
 */
Shell.openPopup = function (popupID)
{
  document.getElementById("popup-screen").style.display = "block";
  document.getElementById("popup-terms").style.display = (popupID === "popup-terms" ? "block" : "none");
  document.getElementById("popup-recovery").style.display = (popupID === "popup-recovery" ? "block" : "none");
  document.getElementById("popup-signup-confirmation").style.display = (popupID === "popup-signup-confirmation" ? "block" : "none");
  document.getElementById("popup-confirmlogout").style.display = (popupID === "popup-confirmlogout" ? "block" : "none");
  setTimeout(function () {
    ac("popup-screen", "visible");
  }, 100);
};


/**
 * Closes any popup
 */
Shell.closePopups = function ()
{
  rc("popup-screen", "visible");
  setTimeout(function () {
    document.getElementById("popup-screen").style.display = "";
  }, 600);
};


/**
 * Clear all form errors
 */
Shell.clearErrors = function ()
{
  rc("form-signup-errors", "visible");
  rc("form-connect-errors", "visible");
  rc("form-login-errors", "visible");
  //
  rc("connect-server", "error");
  rc("connect-username", "error");
  rc("connect-devicename", "error");
  //
  rc("login-username", "error");
  rc("login-password", "error");
  rc("login-keep", "error");
  //
  rc("signup-username", "error");
  rc("signup-password", "error");
  rc("signup-accept", "error");
  rc("signup-email", "error");
};


/**
 * Show an error
 * @param {string} field
 * @param {string} txt
 */
Shell.setError = function (field, txt)
{
  ac("form-" + Shell.page + "-errors", "visible");
  ac(field, "error");
  document.getElementById("form-" + Shell.page + "-errors").textContent = txt;
};


/**
 * Verify Connection Data
 */
Shell.verifyConnectionData = function ()
{
  Shell.clearErrors();
  //
  var server = document.getElementById("connect-server").value.trim();
  var username = document.getElementById("connect-username").value.trim();
  var devicename = document.getElementById("connect-devicename").value.trim();
  //
  if (!server) {
    Shell.setError("connect-server", _t("err-empty-server"));
    return;
  }
  if (!username) {
    Shell.setError("connect-username", _t("err-empty-username"));
    return;
  }
  if (!devicename) {
    Shell.setError("connect-devicename", _t("err-empty-devicename"));
    return;
  }
  //
  if (server.split(".").length < 3 && isNaN(parseInt(server)))
    server += ".instantdevelopercloud.com";
  //
  if (server.substring(0, 4) !== "http") {
    if (isNaN(parseInt(server)))
      server = "https://" + server;
    else {
      if (server.indexOf(".") === -1)
        server = "192.168.1." + server;
      server = "http://" + server + ":8081";
    }
  }
  document.getElementById("connect-server").value = server;
  //
  // Save values (not if a sid is present, as data refers to another user)
  if (!Shell.idesid) {
    localStorage.setItem("connect-server", server);
    localStorage.setItem("connect-username", username);
  }
  localStorage.setItem("connect-devicename", devicename);
  //
  Shell.connectionData = {server: server, username: username, devicename: devicename};
  //
  return true;
};


/**
 * Verify Signup Data
 */
Shell.verifySignupData = function ()
{
  Shell.clearErrors();
  //
  var username = document.getElementById("signup-username").value.trim();
  var email = document.getElementById("signup-email").value.trim();
  var password = document.getElementById("signup-password").value.trim();
  var accept = document.getElementById("signup-accept").checked;
  var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
  //
  if (!username) {
    Shell.setError("signup-username", _t("err-empty-username"));
    return;
  }
  if (!email || !re.test(email)) {
    Shell.setError("signup-email", _t("err-empty-email"));
    return;
  }
  if (!password) {
    Shell.setError("signup-password", _t("err-empty-password"));
    return;
  }
  if (!accept) {
    Shell.setError("lbl-signup-check", _t("err-not-accepted"));
    return;
  }
  //
  document.getElementById("login-username").value = username;
  document.getElementById("login-password").value = password;
  //
  Shell.loginData = {username: username, password: password, email: email, keep: true, wait: false};
  //
  return true;
};


/**
 * Verify Login Data
 */
Shell.verifyLoginData = function ()
{
  Shell.clearErrors();
  //
  var username = document.getElementById("login-username").value.trim();
  var password = document.getElementById("login-password").value.trim();
  var keep = document.getElementById("login-keep").checked;
  //
  if (!username) {
    Shell.setError("login-username", _t("err-empty-username"));
    return;
  }
  if (!password) {
    Shell.setError("login-password", _t("err-empty-password"));
    return;
  }
  //
  document.getElementById("connect-username").value = username;
  Shell.loginData = {username: username, password: password, keep: keep};
  //
  return true;
};


/**
 * Verify Recover Data
 */
Shell.verifyRecoverData = function ()
{
  Shell.clearErrors();
  //
  var username = document.getElementById("recover-user").value.trim();
  //
  if (!username) {
    Shell.setError("recover-user", _t("err-empty-username-mail"));
    return;
  }
  //
  Shell.recoverData = {username: username};
  //
  return true;
};


/**
 * Open Connection
 */
Shell.openConnection = function ()
{
  Shell.clearErrors();
  //
  // This "packet" is sent on connection to the IDE, it includes useful info used by addDevice
  var deviceUuid = Plugin.Device && Plugin.Device.uuid ? Plugin.Device.uuid : "ID" + (Math.random() + "").substr(2);
  var packet = {userName: Shell.connectionData.username, deviceName: Shell.connectionData.devicename, deviceUuid: deviceUuid, deviceType: Shell.getDeviceType()};
  //
  if (Shell.idesid)
    packet.sid = Shell.idesid;
  //
  var server = Shell.connectionData.server;
  if (server.split(":").length < 3) {
    if (server.substring(0, 5) !== "https")
      server += ":80";
    else
      server += ":443";
  }
  //
  // Show connection page and connecting message
  Shell.showPage("connection");
  document.getElementById("wait-msg").textContent = _t("connect-msg");
  //
  // We start a websocket connection to inde server
  Shell.socket = io(server, {forceNew: true, reconnectionAttempts: 5, transports: ["websocket"]});
  Shell.socket.emit("deviceMessage", {type: "handShake", data: packet});
  //
  // Listen for server messages
  Shell.socket.on("startApp", function (url) {
    document.getElementById("wait-msg").textContent = _t("start-msg");
    var ideapp = {name: "ideapp", url: server + url, ide: true, online: true, inplace: "ios"};
    if (url.indexOf("mode=offline") > -1)
      ideapp.mode = "offline";
    else
      ideapp.mode = "online";
    AppMan.changeApps([ideapp]);
    AppMan.startApp("ideapp");
  });
  //
  Shell.socket.on("stopApp", function () {
    document.getElementById("wait-msg").textContent = _t("wait-msg");
    AppMan.stopApp("ideapp");
  });
  //
  Shell.socket.on("indeError", function (m) {
    Shell.closeConnection();
    Shell.setError("", m.msg);
  });
  //
  // Listen for socket messages
  Shell.socket.on("connect", function () {
    //
    // Confirm connection!
    document.getElementById("wait-msg").textContent = _t("wait-msg");
  });
  //
  Shell.socket.on("disconnect", function () {
    Shell.closeConnection();
  });
  //
  Shell.socket.on("error", function (error) {
    Shell.closeConnection();
    Shell.setError("", error);
  });
  //
  Shell.socket.on("connect_failed", function () {
    Shell.closeConnection();
  });
  //
  Shell.socket.on("reconnect_failed", function () {
    Shell.closeConnection();
  });
};


/**
 * Close Connection Data
 */
Shell.closeConnection = function ()
{
  if (!Shell.socket)
    return;
  //
  var socket = Shell.socket;
  //
  delete Shell.socket;
  delete Shell.connectionData;
  //
  try {
    socket.disconnect();
    socket.destroy();
  }
  catch (ex) {
    console.log(ex);
  }
  //
  AppMan.stopApp("ideapp");
  Shell.showPage("connect");
};


/**
 * Calculate if smartphone or tablet
 * @return {string} type
 */
Shell.getDeviceType = function ()
{
  var type = "smartphone";
  //
  if (/iPad/i.test(navigator.userAgent))
    type = "tablet";
  //
  if (/Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent))
    type = "tablet";
  //
  if (/Crosswalk/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent))
    type = "tablet";
  //
  return type;
};


/**
 * Determine the mobile operating system.
 * @returns {String}
 */
Shell.getMobileOperatingSystem = function ()
{
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)
          || (navigator.userAgent.match(/Macintosh/i) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1)) {
    return "iOS";
  }
  else if (userAgent.match(/Android/i)) {
    return "Android";
  }
  else {
    return "unknown";
  }
};


/**
 * returns true on iOS devices
 */
Shell.isIOS = function ()
{
  return this.getMobileOperatingSystem() === "iOS";
};


/**
 * shows or hides loading spinner
 * @param {bool} mode
 */
Shell.setWaitMode = function (mode, msg)
{
  if (mode) {
    document.getElementById("loading-message").innerHTML = msg || "";
    ac("loading-screen", "visible");
    ac("loading-screen", "onscreen");
  }
  else {
    rc("loading-screen", "visible");
    setTimeout(function () {
      rc("loading-screen", "onscreen");
    }, 1000);
  }
};


/**
 * Show apps
 */
Shell.loadApps = function (noinit, noshow)
{
  if (!noshow)
    Shell.showPage("apps");
  if (!noinit)
    AppMan.changeApps(Shell.profileData.apps, true);
  AppMan.filterApps();
  //
  // Developer mode specified in profileData... applying
  if (Shell.profileData.developerMode !== undefined)
    Shell.setDeveloperMode(Shell.profileData.developerMode);
};


/**
 * sets offline status
 * @param {bool} offline
 */
Shell.setOffline = function (offline)
{
  if (Shell.isOffline !== offline) {
    Shell.isOffline = offline;
    document.getElementById("btn-login").disabled = offline;
    document.getElementById("btn-signup").disabled = offline;
    document.getElementById("btn-connect").disabled = offline;
    document.getElementById("btn-qrcode").disabled = offline;
    document.getElementById("btn-recover").disabled = offline;
    document.getElementById("icon-connect").disabled = offline;
    document.getElementById("icon-refresh").disabled = offline;
    document.getElementById("icon-logout").disabled = offline && !Shell.config.logoutOffline;
    if (Shell.page === "apps")
      Shell.loadApps();
    else
      Shell.showPage(Shell.page);
    //
    // Redo login
    if (!offline)
      EacAPI.init();
  }
};


/**
 * Update launcher using URL
 */
Shell.updateLauncher = function ()
{
  if (!Shell.config.launcherUpdateURL)
    return;
  //
  console.log("Updating launcher...");
  //
  var req = new XMLHttpRequest();
  //
  req.responseType = "json";
  req.open("GET", Shell.config.launcherUpdateURL + "?" + Math.random(), true);
  //
  req.onload = function () {
    //
    if (this.response) {
      var res = [].concat(this.response);
      AppMan.changeApps(res);
    }
  };
  //
  req.send();
};


/**
 * Update launcher params using URL
 */
Shell.updateParams = function ()
{
  //Shell.config.launcherParamsURL = "https://storage.googleapis.com/inde/users/pro-gamma/andreamaioli/__launchers/13c6d697-cf9c-c282-4817-e0dc45ceee36/13c6d697-cf9c-c282-4817-e0dc45ceee36 - params.json";
  //
  if (!Shell.config.launcherParamsURL)
    return;
  //
  console.log("Updating launcher params...");
  //
  var req = new XMLHttpRequest();
  //
  req.responseType = "json";
  req.open("GET", Shell.config.launcherParamsURL + "?" + Math.random(), true);
  //
  req.onload = function () {
    //
    if (this.response) {
      AppMan.updateParams(this.response);
    }
  };
  //
  req.send();
};

/**
 * User press back button on Android, and no apps are open
 */
Shell.onBackButton = function ()
{
  var ok = false;
  var backBtn = document.getElementById("btn-back");
  //
  if (!ok && Shell.page === "connection") {
    Shell.closeConnection();
    ok = true;
  }
  //
  if (!ok && (Shell.page === "connect" || Shell.page === "login" ||
          Shell.page === "getpwd" || Shell.page === "signup")) {
    if (backBtn) {
      backBtn.click();
      ok = true;
    }
  }
  //
  if (!ok && navigator.app && navigator.app.exitApp)
    navigator.app.exitApp();
};


/**
 * changes a style sheet color
 * @param {string} oldvalue
 * @param {string} newvalue
 */
setColor = function (oldvalue, newvalue)
{
  var reg = new RegExp(oldvalue.replace("(", "\\(").replace(")", "\\)"), "g");
  //
  // Search in css style rules
  for (var i = 0; i < document.styleSheets.length; i++) {
    var cs = "";
    if (document.styleSheets[i]["rules"])
      cs = "rules";
    if (document.styleSheets[i]["cssRules"])
      cs = "cssRules";
    var ar = document.styleSheets[i][cs];
    if (!ar)
      continue;
    //
    for (var j = 0; j < ar.length; j++) {
      if (ar[j].style) {
        var s = ar[j].style.cssText;
        if (s.indexOf("background") > -1 || s.indexOf("border")) {
          var ns = s.replace(reg, newvalue);
          if (s !== ns)
            ar[j].style.cssText = ns;
        }
      }
    }
  }
};


/**
 * translate tokens
 * @param {string} tk token id
 */
function t(tk)
{
  tk = tk.replace(/-/g, '_');
  var s = Shell.config.strings[tk];
  if (s)
    return s;
}

var _t = t;

/**
 * add class to object
 * @param {string} id
 * @param {string} cls
 */
function ac(id, cls)
{
  var obj = document.getElementById(id);
  if (obj)
    obj.classList.add(cls);
}

/**
 * remove class from object
 * @param {string} id
 * @param {string} cls
 */
function rc(id, cls)
{
  var obj = document.getElementById(id);
  if (obj)
    obj.classList.remove(cls);
}
