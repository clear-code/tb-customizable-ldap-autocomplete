/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["log"];

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this,
                                  "prefs",
                                  "resource://customizable-ldap-autocomplete-modules/prefs.js");
XPCOMUtils.defineLazyServiceGetter(this, "Application",
                                   "@mozilla.org/steel/application;1",
                                   "steelIApplication");

var timer;
var buffer = [];

function log(aMessage) {
  if (!prefs.getPref("extensions.customizable-ldap-autocomplete@clear-code.com.debug"))
    return;

  buffer.push(aMessage);

  if (timer)
    timer.cancel();

  timer = Components.classes["@mozilla.org/timer;1"]
            .createInstance(Components.interfaces.nsITimer);
  timer.init(function() {
    timer = null;
    Application.console.log(buffer.join('\n'));
    buffer = [];
  }, 100, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
}
