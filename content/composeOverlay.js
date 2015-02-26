/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
(function(global) {

var { AutoCompleteResultCache } = Components.utils.import("resource://customizable-ldap-autocomplete-modules/AutoCompleteResultCache.jsm", {});

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
  },

  destroy: function() {
    window.removeEventListener('unload', this, false);
    window.removeEventListener('keypress', this, true);
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

    var result = AutoCompleteResultCache.get(aField.controller.searchString);
    if (!result)
      return false;

    var address = aField.controller.getValueAt(aField.popup.selectedIndex);
    var index = result.indexOfValue(address);
    if (index < 0)
      return false;

    var card = result.getCardAt(index);
    var book = result.getBookAt(index);
    this.showImageFor({
      card:          card,
      book:          book,
      anchorElement: aField.popup
    });
    return true;
  },

  showImageFor: function(aParams) {
    var card          = aParams.card;
    var book          = aParams.book;
    var anchorElement = aParams.anchorElement;

    this.hidePopup();

    if ('LDAPContactPhoto' in global) {
      let image = new Image();
      image.addEventListener('load', (function() {
        this.image.src = image.src;
        this.showPopupAt(anchorElement);
      }).bind(this), false);
      LDAPContactPhoto.fetchLDAPPhoto(card, book.URI, image);
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
    }
  }
};

window.addEventListener('load', AbRecipientImagePopup, false);

global.AbRecipientImagePopup = AbRecipientImagePopup;
})(this);
