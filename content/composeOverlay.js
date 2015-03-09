/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
(function(global) {

var { AutoCompleteResultCache } = Components.utils.import('resource://customizable-ldap-autocomplete-modules/AutoCompleteResultCache.jsm', {});

var AbRecipientImagePopupAutocomplete = {
  init: function() {
    window.removeEventListener('load', this, false);
    window.addEventListener('unload', this, false);
    window.addEventListener('select', this, true);
  },

  destroy: function() {
    window.removeEventListener('unload', this, false);
    window.removeEventListener('select', this, true);
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
        AbRecipientImagePopup.hide();
    }).bind(this), 0);
  },
  handleSelectionChangeWithDelay: function(aField) {
    if (!aField.popupOpen)
      return false;

    AbRecipientImagePopup.hide();

    var searchString = aField.controller.searchString;
    var address = aField.controller.getValueAt(aField.popup.selectedIndex);

    var ldapResult = AutoCompleteResultCache.get('ldap:' + searchString);
    if (ldapResult) {
      let ldapIndex = this.getIndexOfValueFromAutoCompleteResult(address, ldapResult);
      if (ldapIndex > -1) {
        let card = ldapResult.getCardAt(ldapIndex);
        let book = ldapResult.getBookAt(ldapIndex);
        AbRecipientImagePopup.show({
          card:          card,
          book:          book,
          anchorElement: aField.popup,
          position:      'below'
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
        AbRecipientImagePopup.show({
          card:          card,
          anchorElement: aField.popup,
          position:      'below'
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
    }
  }
};

window.addEventListener('load', AbRecipientImagePopupAutocomplete, false);

global.AbRecipientImagePopupAutocomplete = AbRecipientImagePopupAutocomplete;
})(this);
