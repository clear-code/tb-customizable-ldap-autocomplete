/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

Components.utils.import("resource:///modules/mailServices.js");
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

//======BEGINNING OF INSERTED SECTION======
XPCOMUtils.defineLazyModuleGetter(this,
                                  "LDAPAbCardFormatter",
                                  "resource://customizable-ldap-autocomplete-modules/formatter.jsm");
XPCOMUtils.defineLazyModuleGetter(this,
                                  "prefs",
                                  "resource://customizable-ldap-autocomplete-modules/prefs.js");
XPCOMUtils.defineLazyModuleGetter(this,
                                  "AutoCompleteResultCache",
                                  "resource://customizable-ldap-autocomplete-modules/AutoCompleteResultCache.jsm");
XPCOMUtils.defineLazyModuleGetter(this,
                                  "log",
                                  "resource://customizable-ldap-autocomplete-modules/log.jsm");
XPCOMUtils.defineLazyModuleGetter(this,
                                  "reportStatus",
                                  "resource://customizable-ldap-autocomplete-modules/reportStatus.jsm");
//======END OF INSERTED SECTION======

const ACR = Components.interfaces.nsIAutoCompleteResult;
const nsIAbAutoCompleteResult = Components.interfaces.nsIAbAutoCompleteResult;
const nsIAbDirectoryQueryResultListener =
  Components.interfaces.nsIAbDirectoryQueryResultListener;

// nsAbLDAPAutoCompleteResult
// Derived from nsIAbAutoCompleteResult, provides a LDAP specific result
// implementation.

function nsAbLDAPAutoCompleteResult(aSearchString) {
  // Can't create this in the prototype as we'd get the same array for
  // all instances
  this._searchResults = [];
  this.searchString = aSearchString;
}

nsAbLDAPAutoCompleteResult.prototype = {
  _searchResults: null,
  _commentColumn: "",

//======BEGINNING OF INSERTED SECTION======
  getBookAt: function getBookAt(aIndex) {
    return this._searchResults[aIndex].book;
  },

  get matchCountPerBook() {
    var report = {};
    this._searchResults.forEach(function(aResult) {
      if (!(aResult.book.URI in report)) {
        report[aResult.book.URI] = {
          book:  aResult.book.dirName,
          count: 0
        };
      }
      report[aResult.book.URI].count++;
    });
    return report;
  },
//======END OF INSERTED SECTION======

  // nsIAutoCompleteResult

  searchString: null,
  searchResult: ACR.RESULT_NOMATCH,
  defaultIndex: -1,
  errorDescription: null,

  get matchCount() {
    return this._searchResults.length;
  },

  getLabelAt: function getLabelAt(aIndex) {
    return this.getValueAt(aIndex);
  },

  getValueAt: function getValueAt(aIndex) {
    // return this._searchResults[aIndex].value;
//======BEGINNING OF INSERTED SECTION======
    var item = this._searchResults[aIndex];
    return LDAPAbCardFormatter.valueFromCard(item.card, item.book, item.value);
//======END OF INSERTED SECTION======
  },

  getCommentAt: function getCommentAt(aIndex) {
    // return this._commentColumn;
//======BEGINNING OF INSERTED SECTION======
    var item = this._searchResults[aIndex];
    return LDAPAbCardFormatter.commentFromCard(item.card, item.book, this._commentColumn);
//======END OF INSERTED SECTION======
  },

  getStyleAt: function getStyleAt(aIndex) {
    return this.searchResult == ACR.RESULT_FAILURE ? "remote-err" :
                                                     "remote-abook";
  },

  getImageAt: function getImageAt(aIndex) {
    return "";
  },

  getFinalCompleteValueAt: function(aIndex) {
    return this.getValueAt(aIndex);
  },

  removeValueAt: function removeValueAt(aRowIndex, aRemoveFromDB) {
  },

  // nsIAbAutoCompleteResult

  getCardAt: function getCardAt(aIndex) {
    return this._searchResults[aIndex].card;
  },

  // nsISupports

  QueryInterface: XPCOMUtils.generateQI([ACR, nsIAbAutoCompleteResult])
}

function nsAbLDAPAutoCompleteSearch() {
  Services.obs.addObserver(this, "quit-application", false);
  this._timer = Components.classes["@mozilla.org/timer;1"]
                          .createInstance(Components.interfaces.nsITimer);
}

nsAbLDAPAutoCompleteSearch.prototype = {
  // For component registration
  // original class ID of Thunderbird's implementation:
  // classID: Components.ID("227e6482-fe9f-441f-9b7d-7b60375e7449"),
  classID: Components.ID("b66c5a40-964d-11e4-b4a9-0800200c9a66"),

  // A short-lived LDAP directory cache.
  // To avoid recreating components as the user completes, we maintain the most
  // recently used address book, nsAbLDAPDirectoryQuery and search context.
  // However the cache is discarded if it has not been used for a minute.
  // This is done to avoid problems with LDAP sessions timing out and hanging.
//  _query: null,
//  _book: null,
//  _attributes: null,
//  _context: -1,
//======BEGINNING OF INSERTED SECTION======
  _contexts: {},
//======END OF INSERTED SECTION======
  _timer: null,

  // The current search result.
  _result: null,
  // The listener to pass back results to.
  _listener: null,

  _parser: MailServices.headerParser,

  applicableHeaders: Set(["addr_to", "addr_cc", "addr_bcc", "addr_reply"]),

  // Private methods

  _checkDuplicate: function _checkDuplicate(card, emailAddress) {
    var lcEmailAddress = emailAddress.toLocaleLowerCase();

    return this._result._searchResults.some(function(result) {
      return result.value.toLocaleLowerCase() == lcEmailAddress;
    });
  },

//  _addToResult: function _addToResult(card) {
//======BEGINNING OF INSERTED SECTION======
  _addToResult: function _addToResult(card, book) {
    log("nsAbLDAPAutoCompleteSearch._addToResult(" +
          card.displayName + " / " + card.primaryEmail + ", " + book.URI + ")");
//======END OF INSERTED SECTION======
    let emailAddress =
      this._parser.makeMailboxObject(card.displayName,
                                     card.isMailList ?
                                     card.getProperty("Notes", "") || card.displayName :
                                     card.primaryEmail).toString();
//======BEGINNING OF INSERTED SECTION======
    if (!emailAddress) {
      log("  => skipped: no email address.");
      return;
    }
//======END OF INSERTED SECTION======

    // If it is a duplicate, then just return and don't add it. The
    // _checkDuplicate function deals with it all for us.
    if (this._checkDuplicate(card, emailAddress))
      return;

    // Find out where to insert the card.
    var insertPosition = 0;

    // Next sort on full address
    while (insertPosition < this._result._searchResults.length &&
           emailAddress > this._result._searchResults[insertPosition].value)
      ++insertPosition;

    this._result._searchResults.splice(insertPosition, 0, {
      value: emailAddress,
      card: card,
//======BEGINNING OF INSERTED SECTION======
      book: book
//======END OF INSERTED SECTION======
    });
  },

  // nsIObserver

  observe: function observer(subject, topic, data) {
    if (topic == "quit-application") {
      Services.obs.removeObserver(this, "quit-application");
    } else if (topic != "timer-callback") {
      return;
    }

    // Force the individual query items to null, so that the memory
    // gets collected straight away.
    this.stopSearch();
//    this._book = null;
//    this._context = -1;
//    this._query = null;
//    this._attributes = null;
//======BEGINNING OF INSERTED SECTION======
    this._contexts = {};
//======END OF INSERTED SECTION======
  },

  // nsIAutoCompleteSearch

  startSearch: function startSearch(aSearchString, aParam,
                                    aPreviousResult, aListener) {
    let params = JSON.parse(aParam);
    let applicable = !params.type || this.applicableHeaders.has(params.type);

    this._result = new nsAbLDAPAutoCompleteResult(aSearchString);
    aSearchString = aSearchString.toLocaleLowerCase();

    // If the search string isn't value, or contains a comma, or the user
    // hasn't enabled autocomplete, then just return no matches / or the
    // result ignored.
    // The comma check is so that we don't autocomplete against the user
    // entering multiple addresses.
    if (!applicable || !aSearchString || aSearchString.contains(",")) {
      this._result.searchResult = ACR.RESULT_IGNORED;
      aListener.onSearchResult(this, this._result);
      return;
    }

    // The rules here: If the current identity has a directoryServer set, then
    // use that, otherwise, try the global preference instead.
    var acDirURI = null;
    var identity;

    if (params.idKey) {
      try {
        identity = MailServices.accounts.getIdentity(params.idKey);
      }
      catch(ex) {
        Components.utils.reportError("Couldn't get specified identity, " +
                                     "falling back to global settings");
      }
    }

    // Does the current identity override the global preference?
    if (identity && identity.overrideGlobalPref)
      acDirURI = identity.directoryServer;
    else {
      // Try the global one
      if (Services.prefs.getBoolPref("ldap_2.autoComplete.useDirectory"))
        acDirURI = Services.prefs.getCharPref("ldap_2.autoComplete.directoryServer");
    }

//======BEGINNING OF INSERTED SECTION======
    var acDirKeys = this.collectLDAPDirectoryKeys(acDirURI);
    if (acDirKeys.length > 0)
      acDirURI = acDirKeys[0];
    log("  acDirKeys = " + acDirKeys);
    log("  acDirURI = " + acDirURI);
//======END OF INSERTED SECTION======

    if (!acDirURI) {
      // No directory to search, send a no match and return.
      aListener.onSearchResult(this, this._result);
      return;
    }

    this.stopSearch();

//    // If we don't already have a cached query for this URI, build a new one.
//    acDirURI = "moz-abldapdirectory://" + acDirURI;
//    if (!this._book || this._book.URI != acDirURI) {
//      this._query =
//        Components.classes["@mozilla.org/addressbook/ldap-directory-query;1"]
//                  .createInstance(Components.interfaces.nsIAbDirectoryQuery);
//      this._book = MailServices.ab.getDirectory(acDirURI)
//                                  .QueryInterface(Components.interfaces.nsIAbLDAPDirectory);
//
//      // Create a minimal map just for the display name and primary email.
//      this._attributes =
//        Components.classes["@mozilla.org/addressbook/ldap-attribute-map;1"]
//                  .createInstance(Components.interfaces.nsIAbLDAPAttributeMap);
//      this._attributes.setAttributeList("DisplayName",
//        this._book.attributeMap.getAttributeList("DisplayName", {}), true);
//      this._attributes.setAttributeList("PrimaryEmail",
//        this._book.attributeMap.getAttributeList("PrimaryEmail", {}), true);
//    }

//    this._result._commentColumn = this._book.dirName;
    this._listener = aListener;
    this._timer.init(this, 60000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);

//    var args =
//      Components.classes["@mozilla.org/addressbook/directory/query-arguments;1"]
//                .createInstance(Components.interfaces.nsIAbDirectoryQueryArguments);
//
//    var filterTemplate = this._book.getStringValue("autoComplete.filterTemplate", "");
//
//    // Use default value when preference is not set or it contains empty string    
//    if (!filterTemplate)
//      filterTemplate = "(|(cn=%v1*%v2-*)(mail=%v1*%v2-*)(sn=%v1*%v2-*))";
//
//    // Create filter from filter template and search string
//    var ldapSvc = Components.classes["@mozilla.org/network/ldap-service;1"]
//                            .getService(Components.interfaces.nsILDAPService);
//    var filter = ldapSvc.createFilter(1024, filterTemplate, "", "", "", aSearchString);
//    if (!filter)
//      throw new Error("Filter string is empty, check if filterTemplate variable is valid in prefs.js.");
//    args.typeSpecificArg = this._attributes;
//    args.querySubDirectories = true;
//    args.filter = filter;
//
//    // Start the actual search
//    this._context =
//      this._query.doQuery(this._book, args, this, this._book.maxHits, 0);

//======BEGINNING OF INSERTED SECTION======
    reportStatus("Searching \"" + aSearchString + "\"...");
    acDirKeys.forEach(function(aAcDirKey) {
      this.startSearchFor(aSearchString, aAcDirKey);
    }, this);
    this._lastSearchString = aSearchString;
    AutoCompleteResultCache.set('ldap:' + this._lastSearchString, this._result);
//======END OF INSERTED SECTION======
  },

//======BEGINNING OF INSERTED SECTION======
  collectLDAPDirectoryKeys: function collectLDAPDirectoryKeys(aPrimaryKey) {
    log("nsAbLDAPAutoCompleteSearch.collectLDAPDirectoryKeys(" + aPrimaryKey + ")");
    var acDirKeys = [];
    if (aPrimaryKey)
      acDirKeys.push(aPrimaryKey);

    if (!prefs.getPref("ldap_2.autoComplete.useDirectory"))
      return acDirKeys;

    var directoryServers = prefs.getPref("extensions.customizable-ldap-autocomplete@clear-code.com.directoryServers");
    if (directoryServers) {
      if (directoryServers == "*")
        directoryServers = prefs.getChildren("ldap_2.servers.");
      else
        directoryServers = directoryServers.split(/\s*[,\|]\s*|\s+/);

      log("  directoryServers = " + directoryServers);
      directoryServers = directoryServers.filter(function(aServer) {
        var isPrimaryServer     = aPrimaryKey && aServer == aPrimaryKey;
        var isDefaultPreference = aServer == "ldap_2.servers.default";
        var isNotLDAPDirectory  = (prefs.getPref(aServer + ".dirType") || 0) !== 0;
        return !isDefaultPreference && !isPrimaryServer && !isNotLDAPDirectory;
      });
      acDirKeys = acDirKeys.concat(directoryServers);
    }
    return acDirKeys;
  },

  startSearchFor: function startSearchFor(aSearchString, aAcDirKey) {
    log("nsAbLDAPAutoCompleteSearch.startSearchFor(" + aSearchString + ", " + aAcDirKey + ")");
    try {
    var uri = "moz-abldapdirectory://" + aAcDirKey;
    var context;
    if (uri in this._contexts) {
      context = this._contexts[uri];
    }
    else {
      context = {};
      context.query =
        Components.classes["@mozilla.org/addressbook/ldap-directory-query;1"]
                  .createInstance(Components.interfaces.nsIAbDirectoryQuery);
      context.book = MailServices.ab.getDirectory(uri)
                                  .QueryInterface(Components.interfaces.nsIAbLDAPDirectory);

      context.attributes =
        Components.classes["@mozilla.org/addressbook/ldap-attribute-map;1"]
                  .createInstance(Components.interfaces.nsIAbLDAPAttributeMap);
      context.attributes.setAttributeList("DisplayName",
        context.book.attributeMap.getAttributeList("DisplayName", {}), true);
      context.attributes.setAttributeList("PrimaryEmail",
        context.book.attributeMap.getAttributeList("PrimaryEmail", {}), true);
      LDAPAbCardFormatter.requiredPropertiesFromBook(context.book).forEach(function(aProperty) {
        var alreadyMapped = context.attributes.getAttributeList(aProperty);
        if (alreadyMapped)
          return;
        context.attributes.setAttributeList(aProperty,
          context.book.attributeMap.getAttributeList(aProperty, {}), true);
      }, this);

      this._contexts[uri] = context;
    }

    let args =
      Components.classes["@mozilla.org/addressbook/directory/query-arguments;1"]
                .createInstance(Components.interfaces.nsIAbDirectoryQueryArguments);

    let filterTemplate = context.book.getStringValue("autoComplete.filterTemplate", "");
    if (!filterTemplate)
      filterTemplate = "(|(cn=%v1*%v2-*)(mail=%v1*%v2-*)(sn=%v1*%v2-*))";

    let ldapSvc = Components.classes["@mozilla.org/network/ldap-service;1"]
                          .getService(Components.interfaces.nsILDAPService);
    let filter = ldapSvc.createFilter(1024, filterTemplate, "", "", "", aSearchString);
    if (!filter)
      throw new Error("Filter string is empty, check if filterTemplate variable is valid in prefs.js.");
    log("  filterTemplate = " + filterTemplate);
    args.typeSpecificArg = context.attributes;
    args.querySubDirectories = true;
    args.filter = filter;

    // nsIAbDirSearchListener
    let listener = {
      onSearchFinished: (function onSearchFinished(aResult, aErrorMsg) {
        if (context.stopped)
          return;

        context.finished = true;
        context.result   = aResult;
        context.errorMsg = aErrorMsg;

        if (Object.keys(this._contexts).some(function(aURI) {
              return !this._contexts[aURI].finished;
            }, this))
          return;

        return this.onSearchFinished(aResult, aErrorMsg);
      }).bind(this),
      onSearchFoundCard: (function onSearchFoundCard(aCard) {
        if (context.stopped)
          return;
        return this.onSearchFoundCard(aCard, context.book);
      }).bind(this)
    };

    context.finished = false;
    context.contextId =
      context.query.doQuery(context.book, args, listener, context.book.maxHits, 0);

    }
    catch(error) {
      Components.utils.reportError(error);
      throw error;
    }
  },
//======END OF INSERTED SECTION======

  stopSearch: function stopSearch() {
//======BEGINNING OF INSERTED SECTION======
    log("nsAbLDAPAutoCompleteSearch.stopSearch for " + this._lastSearchString);
//======END OF INSERTED SECTION======
    if (this._listener) {
//      this._query.stopQuery(this._context);
//======BEGINNING OF INSERTED SECTION======
      Object.keys(this._contexts).forEach(function(aURI) {
        var context = this._contexts[aURI];
        context.query.stopQuery(context.contextId);
        context.query = null;
        context.stopped = true;
        delete this._contexts[aURI]
      }, this);
      if (this._lastSearchString)
        AutoCompleteResultCache.delete('ldap:' + this._lastSearchString);
      this._lastSearchString = null;
//======END OF INSERTED SECTION======
      this._listener = null;
    }
  },

  // nsIAbDirSearchListener

  onSearchFinished: function onSearchFinished(aResult, aErrorMsg) {
//======BEGINNING OF INSERTED SECTION======
    var result = aResult == nsIAbDirectoryQueryResultListener.queryResultMatch ? "match" :
                 aResult == nsIAbDirectoryQueryResultListener.queryResultComplete ? "complete" :
                 aResult == nsIAbDirectoryQueryResultListener.queryResultStopped ? "stopped" :
                 aResult == nsIAbDirectoryQueryResultListener.queryResultError ? "error" :
                 "unknown(" + aResult + ")";
    log("nsAbLDAPAutoCompleteSearch.onSearchFinished(" + result + ", " + aErrorMsg + ")");
    if (aResult == nsIAbDirectoryQueryResultListener.queryResultError &&
        prefs.getPref("extensions.customizable-ldap-autocomplete@clear-code.com.ignoreErrors") &&
        this._result.matchCount > 0)
      aResult = nsIAbDirectoryQueryResultListener.queryResultComplete;
    if (aResult == nsIAbDirectoryQueryResultListener.queryResultComplete) {
      let details = [];
      let countPerBook = this._result.matchCountPerBook;
      Object.keys(countPerBook).forEach(function(aURI) {
        details.push(countPerBook[aURI].book + "=" + countPerBook[aURI].count);
      });
      reportStatus(this._result.matchCount + " results found. (" + details.join(", ") + ")");
    }
    else {
      reportStatus("Stopped. (" + result + ")");
    }
//======END OF INSERTED SECTION======
    if (!this._listener)
      return;

    if (aResult == nsIAbDirectoryQueryResultListener.queryResultComplete) {
      if (this._result.matchCount) {
        this._result.searchResult = ACR.RESULT_SUCCESS;
        this._result.defaultIndex = 0;
      }
      else
        this._result.searchResult = ACR.RESULT_NOMATCH;
    }
    else if (aResult == nsIAbDirectoryQueryResultListener.queryResultError) {
      this._result.searchResult = ACR.RESULT_FAILURE;
      this._result.defaultIndex = 0;
    }
    //    const long queryResultStopped  = 2;
    //    const long queryResultError    = 3;
    this._listener.onSearchResult(this, this._result);
    this._listener = null;
  },

//  onSearchFoundCard: function onSearchFoundCard(aCard) {
//======BEGINNING OF INSERTED SECTION======
  onSearchFoundCard: function onSearchFoundCard(aCard, aBook) {
    log("nsAbLDAPAutoCompleteSearch.onSearchFoundCard(" +
          aCard.displayName + " / " + aCard.primaryEmail + ", " + aBook.URI + ")");
//======END OF INSERTED SECTION======
    if (!this._listener)
      return;

//    this._addToResult(aCard);
//======BEGINNING OF INSERTED SECTION======
    this._addToResult(aCard, aBook);
//======END OF INSERTED SECTION======

    /* XXX autocomplete doesn't expect you to rearrange while searching
    if (this._result.matchCount)
      this._result.searchResult = ACR.RESULT_SUCCESS_ONGOING;
    else
      this._result.searchResult = ACR.RESULT_NOMATCH_ONGOING;

    this._listener.onSearchResult(this, this._result);
    */
  },

  // nsISupports

  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIObserver,
                                         Components.interfaces
                                                   .nsIAutoCompleteSearch,
                                         Components.interfaces
                                                   .nsIAbDirSearchListener])
};

// Module

const NSGetFactory = XPCOMUtils.generateNSGetFactory([nsAbLDAPAutoCompleteSearch]);
