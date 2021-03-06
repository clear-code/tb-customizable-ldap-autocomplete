/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["reportStatus", "STATUS_REPORTED"];

var STATUS_REPORTED = "customizable-ldap-autocomplete-status-reported";

Components.utils.import("resource://gre/modules/Services.jsm");

function reportStatus(aStatus, aSubject) {
  Services.obs.notifyObservers(aSubject, STATUS_REPORTED, aStatus);
}
