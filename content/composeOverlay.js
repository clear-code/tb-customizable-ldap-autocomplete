/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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
      this.handleUserOperationWithDelay(field);
    }).bind(this), 0);
  },
  handleUserOperationWithDelay: function(aField) {
    if (!aField.popupOpen)
      return;

    var selectedIndex = aField.popup.selectedIndex;
    var value = aField.controller.getValueAt(selectedIndex);
    dump('HANDLED: '+value+'\n');
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
