/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this,
                                  "AutoCompleteResultCache",
                                  "resource://customizable-ldap-autocomplete-modules/AutoCompleteResultCache.jsm");
XPCOMUtils.defineLazyModuleGetter(this,
                                  "log",
                                  "resource://customizable-ldap-autocomplete-modules/log.jsm");

function AbAutoCompleteSearchProxy() {
  this._internal = Components.classesByID["{2f946df9-114c-41fe-8899-81f10daf4f0c}"]
                     .getService(Components.interfaces.nsIAutoCompleteSearch);
}

AbAutoCompleteSearchProxy.prototype = {
  classID: Components.ID("430e45b0-c611-11e4-8830-0800200c9a66"),

  // nsIAutoCompleteSearch

  startSearch: function startSearch(aSearchString, aParam,
                                    aPreviousResult, aListener) {
    log("AbAutoCompleteSearchProxy.startSearch(" + aSearchString + ")");
    this._searchString = aSearchString;
    this._listener = aListener;
    return this._internal.startSearch(aSearchString, aParam, aPreviousResult, this);
  },

  stopSearch: function stopSearch() {
    log("AbAutoCompleteSearchProxy.stopSearch for " + this._searchString);
    if (this._searchString)
      AutoCompleteResultCache.delete(this._searchString);
    this._listener = null;
    this._searchString = null;
    return this._internal.stopSearch();
  },

  // nsIAutoCompleteObserver

  onSearchResult: function onSearchResult(aSearch, aResult) {
    log("AbAutoCompleteSearchProxy.onSearchResult for " + aSearch + ", " + aResult);
    if (this._searchString)
      AutoCompleteResultCache.set('addressbook:' + this._searchString, aResult);
    return this._listener.onSearchResult(this, aResult);
  },

  onUpdateSearchResult: function onUpdateSearchResult(aSearch, aResult) {
    log("AbAutoCompleteSearchProxy.onUpdateSearchResult for " + aSearch + ", " + aResult);
    if (this._searchString)
      AutoCompleteResultCache.set('addressbook:' + this._searchString, aResult);
    return this._listener.onUpdateSearchResult(this, aResult);
  },

  // nsISupports

  QueryInterface: XPCOMUtils.generateQI([Components.interfaces
                                                   .nsIAutoCompleteSearch,
                                         Components.interfaces
                                                   .nsIAutoCompleteObserver])
};

// Module

const NSGetFactory = XPCOMUtils.generateNSGetFactory([AbAutoCompleteSearchProxy]);
