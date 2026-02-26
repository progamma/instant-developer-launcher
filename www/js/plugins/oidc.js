/*
 * Instant Developer Next
 * Copyright Pro Gamma Spa 2000-2015
 * All rights reserved
 */

/* global cordova */

var Plugin = Plugin || {};

/*
 * Create plugin object
 */
Plugin.Oidc = {};


/*
 * Init plugin
 */
Plugin.Oidc.init = function ()
{
};


/*
 * Authorize
 */
Plugin.Oidc.authorize = async function (req)
{
  let options = req.params.options || {};
  //
  options.additionalParameters = {prompt: options.prompt};
  //
  // Plugin wants authorizationEndpoint wrapped in a "configuration" object
  options.configuration = {authorizationEndpoint: options.authorizationEndpoint};
  delete options.authorizationEndpoint;
  //
  // Initiate authorization request
  cordova.plugins.oidc.basic.presentAuthorizationRequest(options,
          result => req.setResult(result),
          error => {
            let errorMessage = error.oidcDetails ? error.oidcDetails + ". " : "";
            errorMessage += error.oidcResponse ? error.oidcResponse + ". " : "";
            //
            req.setResult({error: {type: error.oidcType, message: errorMessage}});
          }
  );
};
