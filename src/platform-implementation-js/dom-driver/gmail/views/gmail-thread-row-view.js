var _ = require('lodash');
var Bacon = require('baconjs');

var makeMutationObserverStream = require('../../../lib/dom/make-mutation-observer-stream');
var convertForeignInputToBacon = require('../../../lib/convert-foreign-input-to-bacon');
var ThreadRowViewDriver = require('../../../driver-interfaces/thread-row-view-driver');

var GmailThreadRowView = function(element) {
  ThreadRowViewDriver.call(this);

  this._eventStream = new Bacon.Bus();
  this._element = element;
  this._stopper = this._eventStream.filter(false).mapEnd();

  // Stream that emits an event after whenever Gmail replaces the ThreadRow DOM nodes
  this._refresher = makeMutationObserverStream(this._element, {
    childList: true
  }).map(null).takeUntil(this._stopper);
};

GmailThreadRowView.prototype = Object.create(ThreadRowViewDriver.prototype);

_.extend(GmailThreadRowView.prototype, {

  __memberVariables: [
    {name: '_element', destroy: false},
    {name: '_eventStream', destroy: true, get: true, destroyFunction: 'end'},
    {name: '_stopper', destroy: false},
    {name: '_refresher', destroy: false}
  ],

  destroy: function() {
    console.log('destroy threadrowview', this.getSubject());
    _.toArray(this._element.getElementsByClassName('inboxSDKadded')).forEach(function(node) {
      node.remove();
    });
    _.toArray(this._element.getElementsByClassName('inboxSDKhiddenInline')).forEach(function(node) {
      node.style.display = 'inline';
    });
    ThreadRowViewDriver.prototype.destroy.call(this);
  },

  addLabel: function(label) {
    var self = this;
    var labelDiv = document.createElement('div');
    labelDiv.className = 'yi inboxSDKadded inboxSDKlabel';
    labelDiv.innerHTML = '<div class="ar as"><div class="at" title="text" style="background-color: #ddd; border-color: #ddd;"><div class="au" style="border-color:#ddd"><div class="av" style="color: #666">text</div></div></div></div><div class="as">&nbsp;</div>';

    var at = labelDiv.querySelector('div.at');
    var au = labelDiv.querySelector('div.au');
    var av = labelDiv.querySelector('div.av');

    var prop = convertForeignInputToBacon(label).takeUntil(this._stopper).toProperty();
    prop.sampledBy(this._refresher.merge(prop.toEventStream())).onValue(function(label) {
      if (!label) {
        labelDiv.remove();
      } else {
        _.defaults(label, {
          color: '#ddd', textColor: '#666'
        });

        if (at.title != label.text) {
          at.title = av.textContent = label.text;
        }
        if (at.style.backgroundColor != label.color) {
          at.style.backgroundColor = at.style.borderColor = au.style.borderColor = label.color;
        }
        if (av.style.color != label.textColor) {
          av.style.color = label.textColor;
        }

        var labelParentDiv = self._element.querySelector('td.a4W div.xS div.xT');
        if (!labelParentDiv.contains(labelDiv)) {
          labelParentDiv.insertBefore(labelDiv, labelParentDiv.firstChild);
        }
      }
    });
  },

  addButton: function(buttonDescriptor) {
    var self = this;
    var buttonSpan = document.createElement('span');
    buttonSpan.className = 'inboxSDKadded';
    this._element.parentElement.parentElement.querySelector('colgroup > col.y5').style.width = '52px';

    var prop = convertForeignInputToBacon(buttonDescriptor).takeUntil(this._stopper).toProperty();
    prop.sampledBy(this._refresher.merge(prop.toEventStream())).onValue(function(buttonDescriptor) {
      var starGroup = self._element.querySelector('td.apU.xY');
      buttonSpan.textContent = 'blah';
      starGroup.appendChild(buttonSpan);
    });
  },

  addAttachmentIcon: function(opts) {
    var self = this;
    var img = document.createElement('img');
    img.className = 'iP inboxSDKadded inboxSDKattachmentIcon';
    img.src = 'images/cleardot.gif';
    var currentIconUrl;

    var prop = convertForeignInputToBacon(opts).takeUntil(this._stopper).toProperty();
    prop.sampledBy(this._refresher.merge(prop.toEventStream())).onValue(function(opts) {
      if (!opts) {
        img.remove();
      } else {
        if (img.title != opts.title) {
          img.title = opts.title;
        }
        if (currentIconUrl != opts.iconUrl) {
          img.style.background = "url("+opts.iconUrl+") no-repeat 0 0";
          currentIconUrl = opts.iconUrl;
        }

        var attachmentDiv = self._element.querySelector('td.yf.xY');
        if (!attachmentDiv.contains(img)) {
          attachmentDiv.appendChild(img);
        }
      }
    });
  },

  replaceDate: function(opts) {
    var self = this;

    var prop = convertForeignInputToBacon(opts).takeUntil(this._stopper).toProperty();
    prop.sampledBy(this._refresher.merge(prop.toEventStream())).onValue(function(opts) {
      var dateContainer = self._element.querySelector('td.xW');
      var originalDateSpan = dateContainer.firstChild;
      var customDateSpan = originalDateSpan.nextElementSibling;
      if (!customDateSpan) {
        customDateSpan = document.createElement('span');
        customDateSpan.className = 'inboxSDKadded inboxSDKcustomDate';
        dateContainer.appendChild(customDateSpan);

        originalDateSpan.classList.add('inboxSDKhiddenInline');
      }

      if (!opts) {
        customDateSpan.style.display = 'none';
        originalDateSpan.style.display = 'inline';
      } else {
        customDateSpan.textContent = opts.text;
        if (opts.title) {
          customDateSpan.setAttribute('title', opts.title);
          customDateSpan.setAttribute('aria-label', opts.title);
        } else {
          customDateSpan.removeAttribute('title');
          customDateSpan.removeAttribute('aria-label');
        }
        customDateSpan.style.color = opts.textColor || '';

        customDateSpan.style.display = 'inline';
        originalDateSpan.style.display = 'none';
      }
    });
  },

  getSubject: function() {
    return this._element.querySelector('td.a4W div.xS div.xT div.y6 > span[id]').textContent;
  },

  getDateString: function() {
    return this._element.querySelector('td.xW > span').title;
  }

});

module.exports = GmailThreadRowView;
