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
    window.addEventListener('keypress', this, true);
    window.addEventListener('popuphidden', this, true);
  },

  destroy: function() {
    window.removeEventListener('unload', this, false);
    window.removeEventListener('keypress', this, true);
    window.removeEventListener('popuphidden', this, true);
  },

  isRecipientField: function(aElement) {
    return (
      aElement.localName == 'textbox' &&
      aElement.getAttribute('type') == 'autocomplete' &&
      aElement.classList.contains('textbox-addressingWidget')
    );
  },

  handleUserOperation: function(aEvent) {
    var field = aEvent.target;
    if (!this.isRecipientField(field))
      return;

    setTimeout((function() {
      var maybeShown = this.handleUserOperationWithDelay(field);
      if (!maybeShown)
        this.hidePopup();
    }).bind(this), 0);
  },
  handleUserOperationWithDelay: function(aField) {
    if (!aField.popupOpen)
      return false;

    var searchString = aField.controller.searchString;
    var cacheKey = 'ldap:' + searchString;
    var rawResult = AutoCompleteResultCache.get(searchString);
    var address = aField.controller.getValueAt(aField.popup.selectedIndex);
    if (typeof rawResult.indexOfValue == 'function') {
    let index = rawResult.indexOfValue(address);
    if (index < 0)
      return false;

    let card = result.getCardAt(index);
    let book = result.getBookAt(index);
    this.showImageFor({
      card:          card,
      book:          book,
      anchorElement: aField.popup
    });
    return true;
    }
    else {
      let card = result.getCardAt(index);
      this.showImageFor({
        card:          card,
        anchorElement: aField.popup
      });
    }
  },

  showImageFor: function(aParams) {
    var card          = aParams.card;
    var book          = aParams.book;
    var anchorElement = aParams.anchorElement;

    this.hidePopup();

    if (book &&
        book instanceof Compoments.interfaces.nsIAbLDAPDirectory &&
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
    this.popup.openPopup(aAnchorElement, 'after_start', -1, -1, true, true);
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

      case 'keypress':
        this.handleUserOperation(aEvent);
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
