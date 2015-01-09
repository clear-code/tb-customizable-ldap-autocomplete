/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["LDAPAbCardFormatter"];

Components.utils.import("resource:///modules/mailServices.js");
Components.utils.import("resource://gre/modules/Services.jsm");

var parser = MailServices.headerParser;

var LDAPAbCardFormatter = {
  _defaultNameFormat:    "[cn]",
  _defaultAddressFormat: "{mail}",
  _defaultCommentFormat: "[o]",

  valueFromCard: function labelFromCard(aCard, aBook, aDefaultValue) {
    try {
      var nameFormat    = this._getStringValueFromBook("autoComplete.nameFormat",
                                                       aBook,
                                                       this._defaultNameFormat);
      var name          = this._resolveFormat(nameFormat, aCard, aBook);
      var addressFormat = this._getStringValueFromBook("autoComplete.addressFormat",
                                                       aBook,
                                                       this._defaultAddressFormat);
      var address       = this._resolveFormat(addressFormat, aCard, aBook);
      if (address)
        return parser.makeMailboxObject(name, address).toString();
    }
    catch(error) {
      Components.utils.reportError(error);
    }
    return aDefaultValue;
  },

  commentFromCard: function commentFromCard(aCard, aBook, aDefaultValue) {
    try {
      var format = this._getStringValueFromBook("autoComplete.commentFormat",
                                                aBook,
                                                this._defaultCommentFormat);
      return this._resolveFormat(format, aCard, aBook, aDefaultValue);
    }
    catch(error) {
      Components.utils.reportError(error);
    }
    return aDefaultValue;
  },


  _resolveFormat: function resolveFormat(aFormat, aCard, aBook, aDefaultValue) {
    try {
      var formatted = aFormat;

      formatted = formatted.replace(/\{mail\}/g, aCard.primaryEmail);

      var placeHolders = aFormat.match(/\[[^\]]+\]/g);
      if (placeHolders) {
        Array.forEach(placeHolders, function(aPlaceHolder) {
          var matcher = new RegExp(aPlaceHolder.replace(/([\[\]])/g, '\\$1'));
          var attrName = aPlaceHolder.substring(1, aPlaceHolder.length - 1);
          var value = this._getCardPropertyFromLDAPAttr(attrName, aCard, aBook);
          formatted = formatted.replace(matcher, value);
        }, this);
      }
      return formatted;
    }
    catch(error) {
      Components.utils.reportError(error);
    }
    return aDefaultValue;
  },

  _getCardPropertyFromLDAPAttr: function getCardPropertyFromLDAPAttr(aAttrName, aCard, aBook) {
    //TODO: implement me!!
    // See also: http://mxr.mozilla.org/comm-esr24/source/mailnews/addrbook/src/nsAbLDAPAutoCompFormatter.cpp
  },

  _getStringValueFromBook: function getStringValueFromBook(aKey, aBook, aDefaultValue) {
    var globalValue;
    try {
      globalValue = Services.prefs.getCharPref("ldap_2.servers.default." + aKey);
    }
    catch(error) {
    }
    var utf8value = aBook.getStringValue(aKey, globalValue || aDefaultValue);
    var unicodeValue = decodeURIComponent(escape(utf8value));
    return unicodeValue;
  }
};
