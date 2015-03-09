/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetter(this,
                                  "AutoCompleteResultCache",
                                  "resource://customizable-ldap-autocomplete-modules/AutoCompleteResultCache.jsm");

function AbAutoCompleteSearchProxy() {
  this._internal = Components.classesByID["2f946df9-114c-41fe-8899-81f10daf4f0c"]
                     .QueryInterface(Components.interfaces.nsIAutoCompleteSearch);
}

AbAutoCompleteSearchProxy.prototype = {
  classID: Components.ID("430e45b0-c611-11e4-8830-0800200c9a66"),

  // nsIAutoCompleteSearch

  startSearch: function startSearch(aSearchString, aParam,
                                    aPreviousResult, aListener) {
    this._listener = aListener;
    this._internal.startSearch(aSearchString, aParam, aPreviousResult, this);
    this._searchString = aSearchString;
  },

  stopSearch: function stopSearch() {
    if (this._searchString)
      AutoCompleteResultCache.delete(this._searchString);
    this._internal.stopSearch();
    this._listener = null;
    this._searchString = null;
  },

  // nsIAutoCompleteObserver

  onSearchResult: function onSearchResult(aSearch, aResult) {
    if (this._searchString)
      AutoCompleteResultCache.set('addressbook:' + this._searchString, aResult);
    return this._listener.onSearchResult(aSearch, aResult);
  },

  onUpdateSearchResult: function onUpdateSearchResult(aSearch, aResult) {
    if (this._searchString)
      AutoCompleteResultCache.set('addressbook:' + this._searchString, aResult);
    return this._listener.onUpdateSearchResult(aSearch, aResult);
  },

  // nsISupports

  QueryInterface: XPCOMUtils.generateQI([Components.interfaces
                                                   .nsIAutoCompleteSearch,
                                         Components.interfaces
                                                   .nsIAutoCompleteObserver])
};

// Module

const NSGetFactory = XPCOMUtils.generateNSGetFactory([AbAutoCompleteSearchProxy]);
