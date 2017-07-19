/* @flow */

import {defn} from 'ud';
import includes from 'lodash/includes';
import autoHtml from 'auto-html';
import Kefir from 'kefir';
import kefirBus from 'kefir-bus';
import type {Bus} from 'kefir-bus';
import kefirStopper from 'kefir-stopper';
import kefirCast from 'kefir-cast';
import BigNumber from 'bignumber.js';
import delayAsap from '../../../lib/delay-asap';
import idMap from '../../../lib/idMap';
import querySelector from '../../../lib/dom/querySelectorOrFail';
import InboxLabelView from './InboxLabelView';

import type InboxDriver from '../inbox-driver';
import type {Parsed} from '../detection/thread-row/parser';

class InboxThreadRowView {
  _element: HTMLElement;
  _driver: InboxDriver;
  _p: Parsed;
  _userView: ?Object;
  _eventStream: Bus<any> = kefirBus();
  _stopper: Kefir.Observable<null>;
  _isDestroyed: boolean = false;

  constructor(element: HTMLElement, driver: InboxDriver, parsed: Parsed) {
    this._element = element;
    this._driver = driver;
    this._p = parsed;

    this._stopper = this._eventStream.ignoreValues().beforeEnd(()=>null).toProperty();
  }

  getEventStream(): Kefir.Observable<any> {
    return this._eventStream;
  }

  getStopper(): Kefir.Observable<null> {
    return this._stopper;
  }

  // keeping this here for now since the rest of the system expects it.
  // in Gmail it's used to pass a ThreadRowView interface to addButton()
  // onClick callbacks, but not sure if it will be needed in the end.
  setUserView(userView: Object) {
    this._userView = userView;
  }

  isSelected(): boolean {
    if (!this._p.elements.checkbox) {
      throw new Error('Did not find checkbox element');
    }
    return this._p.elements.checkbox.getAttribute('aria-checked') === 'true';
  }

  addAttachmentIcon() {
    throw new Error('Not supported in Inbox');
  }

  addButton() {
    throw new Error('Not supported in Inbox');
  }

  addActionButton() {
    throw new Error('not yet implemented');
  }

  addImage() {
    throw new Error('not yet implemented');
  }

  addLabel(label: Object) {
    if (this._isDestroyed) {
      console.warn('addLabel called on destroyed thread row'); //eslint-disable-line no-console
      return;
    }

    const labelParentDiv = this._p.elements.labelParent;
    if (!labelParentDiv) throw new Error('Could not find label parent element');

    const prop: Kefir.Observable<?Object> = kefirCast(Kefir, label).takeUntilBy(this._stopper).toProperty();
    let labelMod = null;

    prop.onValue((labelDescriptor) => {
      if(!labelDescriptor){
        if (labelMod) {
          labelMod.remove();
          labelMod = null;
        }
      } else {
        if (!labelMod) {
          const inboxLabelView = new InboxLabelView();
          const el = inboxLabelView.getElement();
          labelMod = {
            inboxLabelView,
            remove: el.remove.bind(el)
          };
        }

        labelMod.inboxLabelView.updateLabelDescriptor(labelDescriptor);

        if (!includes(labelParentDiv.children, labelMod.inboxLabelView.getElement())) {
          labelParentDiv.insertBefore(
            labelMod.inboxLabelView.getElement(),
            labelParentDiv.firstChild
          );
        }
      }
    });
  }

  getDateString() {
    throw new Error('Not supported in Inbox');
  }

  getSubject(): string {
    if (!this._p.elements.subject) {
      throw new Error('Failed to find subject');
    }
    return this._p.elements.subject.textContent;
  }

  getThreadID() {
    throw new Error('Not supported in Inbox. Please use getThreadIDAsync() instead');
  }

  async getThreadIDAsync(): Promise<string> {
    const {inboxThreadId} = this._p.attributes;
    if (!inboxThreadId) {
      throw new Error('Failed to find thread id');
    }
    if (/^thread-a:/.test(inboxThreadId)) {
      // Get the inbox message id of any message in the thread, convert it to
      // a gmail message id, and then use that id in a request
      // to a gmail endpoint to get the id of the thread that message is in.
      const inboxMessageId = await this._driver.getInboxMessageIdForInboxThreadId(inboxThreadId);
      const gmailMessageId = await this._driver.getGmailMessageIdForInboxMessageId(inboxMessageId);

      return await this._driver.getThreadIdFromMessageId(gmailMessageId);
    } else {
      const m = /\d+$/.exec(inboxThreadId);
      if (!m) throw new Error('Should not happen');
      return new BigNumber(m[0]).toString(16);
    }
  }

  async getDraftID(): Promise<?string> {
    const {isOnlyDraft, inboxThreadId} = this._p.attributes;

    if (isOnlyDraft && inboxThreadId) {
      const m = /\d+$/.exec(inboxThreadId);
      if (!m) throw new Error('Should not happen');
      return m[0];
    } else {
      return null;
    }
  }

  getVisibleDraftCount(): number {
    const {visibleDraftCount} = this._p.attributes;
    if (typeof visibleDraftCount !== 'number') throw new Error('Failed to find visible draft count');
    return visibleDraftCount;
  }

  getVisibleMessageCount(): number {
    const {visibleMessageCount} = this._p.attributes;
    if (typeof visibleMessageCount !== 'number') throw new Error('Failed to find visible message count');
    return visibleMessageCount;
  }

  getContacts(): Contact[] {
    const {contacts} = this._p.attributes;
    if (!Array.isArray(contacts)) throw new Error('Failed to find contacts');
    return contacts;
  }

  replaceDate() {
    throw new Error('Not supported in Inbox');
  }

  replaceDraftLabel() {
    throw new Error('not yet implemented');
  }

  destroy() {
    this._isDestroyed = true;
    this._eventStream.end();
  }
}

export default defn(module, InboxThreadRowView);
