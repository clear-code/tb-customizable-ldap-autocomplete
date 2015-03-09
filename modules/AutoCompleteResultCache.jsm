/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["AutoCompleteResultCache"];

var AutoCompleteResultCache = {
  set: function(aKey, aResult) {
    this._caches[aKey] = aResult;
  },
  get: function(aKey) {
    return this._caches[aKey] || null;
  },
  delete: function(aKey) {
    delete this._caches[aKey];
  },
  clear: function() {
    this._caches = {};
  }
};

AutoCompleteResultCache.clear();
