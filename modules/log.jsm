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

function log(aMessage) {
  if (!prefs.getPref("extensions.customizable-ldap-autocomplete@clear-code.com.debug"))
    return;
  Application.console.log(aMessage);
}
