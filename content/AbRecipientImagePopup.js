/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
(function(global) {

var AbRecipientImagePopup = {
  get popup() {
    return document.getElementById('ab-recipient-image-popup');
  },

  get image() {
    return document.getElementById('ab-recipient-image');
  },

  get labelElement() {
    return document.getElementById('ab-recipient-label');
  },
  get label() {
    return this.labelElement.value;
  },
  set label(aValue) {
    return this.labelElement.value = aValue;
  },

  init: function() {
    window.removeEventListener('load', this, false);
    window.addEventListener('unload', this, false);
    window.addEventListener('popuphidden', this, true);
  },

  destroy: function() {
    window.removeEventListener('unload', this, false);
    window.removeEventListener('popuphidden', this, true);
  },

  labelForCard: function(aCard) {
    if (aCard.displayName)
      return aCard.displayName + ' <' + aCard.primaryEmail + '>';

    return aCard.primaryEmail;
  },

  show: function(aParams) {
    var card = aParams.card;
    var book = aParams.book;

    if (book &&
        book instanceof Components.interfaces.nsIAbLDAPDirectory &&
        'LDAPContactPhoto' in global) {
      let image = new Image();
      image.addEventListener('load', (function() {
        aParams.image = image;
        this.showPopup(aParams);
      }).bind(this), false);
      LDAPContactPhoto.fetchLDAPPhoto(card, book.URI, image);
      return;
    }

    switch (card.getProperty('PhotoType', null)) {
      case 'file':
      case 'web':
        let uri = card.getProperty('PhotoURI', null);
        if (uri) {
          aParams.image = uri;
          this.showPopup(aParams);
        }
        return;

      default:
        break;
    }
  },
  showPopup: function(aParams) {
    var anchorElement = aParams.anchorElement;
    var position      = aParams.position;
    var image         = aParams.image;
    var label         = aParams.label || this.labelForCard(aParams.card);

    switch (position) {
      case 'below':
        position = 'after_start';
        break;

      case 'side':
        position = 'end_before';
        break;
    }

    if (typeof image == 'string') {
      this.image.style.maxWidth =
        this.image.style.maxHeight = '';
      this.image.src    = image;
    }
    else {
      this.image.style.maxWidth  = image.width + 'px';
      this.image.style.maxHeight = image.height + 'px';
      this.image.src    = image.src;
    }
    this.label    = label;
    this.popup.openPopup(anchorElement, position, -1, -1, false, false);
  },

  hide: function() {
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

      case 'popuphidden':
        if (aEvent.target != this.popup)
          this.hide();
        return;
    }
  }
};

window.addEventListener('load', AbRecipientImagePopup, false);

global.AbRecipientImagePopup = AbRecipientImagePopup;
})(this);
