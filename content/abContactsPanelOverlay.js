/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
(function(global) {

var AbRecipientImagePopupSidebar = {
  get tree() {
    return document.getElementById('abResultsTree');
  },

  init: function() {
    window.removeEventListener('load', this, false);
    window.addEventListener('unload', this, false);
    this.tree.addEventListener('select', this, true);
    this.tree.addEventListener('mousemove', this, true);
  },

  destroy: function() {
    window.removeEventListener('unload', this, false);
    this.tree.removeEventListener('select', this, true);
    this.tree.removeEventListener('mousemove', this, true);
  },

  handleSelectionChange: function() {
    var cards = GetSelectedAbCards();
    if (cards.length > 0)
      this.showForCard(cards[0]);
  },

  handleMouseMove: function(aEvent) {
    if (this.delayedHandleMouseMoveTimer)
      window.clearTimeout(this.delayedHandleMouseMoveTimer);

    var row = this.tree.treeBoxObject.getRowAt(aEvent.clientX, aEvent.clientY);
    var card = null;
    if (row) {
      card = gAbView.getCardFromRow(row);
    }

    this.delayedHandleMouseMoveTimer = window.setTimeout((function() {
      this.delayedHandleMouseMoveTimer = null;
      var maybeShown = card && this.showForCard(card);
      if (!maybeShown)
        AbRecipientImagePopup.hide();
    }).bind(this), 100);
  },

  showForCard: function(aCard) {
    AbRecipientImagePopup.hide();

    var directoryURI = GetSelectedDirectory();
    var directory =  GetDirectoryFromURI(directoryURI);

    AbRecipientImagePopup.show({
      card:          aCard,
      book:          directory,
      // Popup always eats click events on the anchor element, so
      // we have to specify other element as the anchor.
      // (The previous element of the tree is <separator/> and 
      // events on the element can be ignored.)
      anchorElement: this.tree.previousSibling,
      position:      'side'
    });
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
        this.handleSelectionChange();
        return;

      case 'mousemove':
        this.handleMouseMove(aEvent);
        return;
    }
  }
};

window.addEventListener('load', AbRecipientImagePopupSidebar, false);

global.AbRecipientImagePopupSidebar = AbRecipientImagePopupSidebar;
})(this);
