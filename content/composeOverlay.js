/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
(function(global) {

var { AutoCompleteResultCache } = Components.utils.import('resource://customizable-ldap-autocomplete-modules/AutoCompleteResultCache.jsm', {});

var AbRecipientImagePopup = {
  get popup() {
    return document.getElementById('ab-recipient-image-popup');
  },
  get image() {
    return document.getElementById('ab-recipient-image');
  },

  init: function() {
    window.removeEventListener('load', this, false);
    window.addEventListener('unload', this, false);
    window.addEventListener('select', this, true);
    window.addEventListener('popuphidden', this, true);
  },

  destroy: function() {
    window.removeEventListener('unload', this, false);
    window.removeEventListener('select', this, true);
    window.removeEventListener('popuphidden', this, true);
  },

  findOwnerRecipientField: function(aTarget) {
    var node = aTarget;
    do {
      if (this.isRecipientField(node))
        return node;
      node = node.parentNode;
    } while (node);
    return null;
  },

  isRecipientField: function(aElement) {
    return (
      aElement.localName == 'textbox' &&
      aElement.getAttribute('type') == 'autocomplete' &&
      aElement.classList.contains('textbox-addressingWidget')
    );
  },

  handleSelectionChange: function(aEvent) {
    var field = this.findOwnerRecipientField(aEvent.target);
    if (!field)
      return;

    setTimeout((function() {
      var maybeShown = this.handleSelectionChangeWithDelay(field);
      if (!maybeShown)
        this.hidePopup();
    }).bind(this), 0);
  },
  handleSelectionChangeWithDelay: function(aField) {
    if (!aField.popupOpen)
      return false;

    this.hidePopup();

    var searchString = aField.controller.searchString;
    var address = aField.controller.getValueAt(aField.popup.selectedIndex);

    var ldapResult = AutoCompleteResultCache.get('ldap:' + searchString);
    if (ldapResult) {
      let ldapIndex = this.getIndexOfValueFromAutoCompleteResult(address, ldapResult);
      if (ldapIndex > -1) {
        let card = ldapResult.getCardAt(ldapIndex);
        let book = ldapResult.getBookAt(ldapIndex);
        this.showImageFor({
          card:          card,
          book:          book,
          anchorElement: aField.popup
        });
        return true;
      }
    }

    var localResult = AutoCompleteResultCache.get('addressbook:' + searchString);
    if (localResult) {
      let localIndex = this.getIndexOfValueFromAutoCompleteResult(address, localResult);
      if (localIndex > -1) {
        localResult = localResult.QueryInterface(Components.interfaces.nsIAbAutoCompleteResult);
        let card = localResult.getCardAt(localIndex);
        this.showImageFor({
          card:          card,
          anchorElement: aField.popup
        });
        return true;
      }
    }

    return false;
  },

  getIndexOfValueFromAutoCompleteResult: function(aValue, aResult) {
    for (let i = 0, maxi = aResult.matchCount; i < maxi; i++) {
      if (aResult.getValueAt(i) == aValue)
        return i;
    }
    return -1;
  },

  showImageFor: function(aParams) {
    var card          = aParams.card;
    var book          = aParams.book;
    var anchorElement = aParams.anchorElement;

    if (book &&
        book instanceof Components.interfaces.nsIAbLDAPDirectory &&
        'LDAPContactPhoto' in global) {
      let image = new Image();
      image.addEventListener('load', (function() {
        this.image.src = image.src;
        this.showPopupAt(anchorElement);
      }).bind(this), false);
      LDAPContactPhoto.fetchLDAPPhoto(card, book.URI, image);
      return;
    }

    switch (card.getProperty('PhotoType', null)) {
      case 'file':
      case 'web':
        let uri = card.getProperty('PhotoURI', null);
        if (uri) {
          this.image.src = uri;
          this.showPopupAt(anchorElement);
        }
        return;

      default:
        break;
    }
  },
  showPopupAt: function(aAnchorElement) {
    this.popup.openPopup(aAnchorElement, 'after_start', -1, -1, false, true);
  },

  hidePopup: function() {
    this.popup.hidePopup();
  },

  handleEvent: function(aEvent) {
    switch (aEvent.type) {
      case 'load':
        this.init();
        return;

      case 'unload':
        this.destroy();
        return;

      case 'select':
        this.handleSelectionChange(aEvent);
        return;

      case 'popuphidden':
        if (aEvent.target != this.popup)
          this.hidePopup();
        return;
    }
  }
};

window.addEventListener('load', AbRecipientImagePopup, false);

global.AbRecipientImagePopup = AbRecipientImagePopup;
})(this);
