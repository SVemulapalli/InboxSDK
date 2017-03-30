/* @flow */

import ErrorCollector from '../../../../lib/ErrorCollector';
import querySelectorOne from '../../../../lib/dom/querySelectorOne';

import {defn} from 'ud';

function parser(el: HTMLElement) {
  const ec = new ErrorCollector('compose');

  const isInline = el.getAttribute('role') !== 'dialog';

  const sendBtn = ec.run(
    'send button',
    () => querySelectorOne(
      el,
      'div[jstcache] > div[role=button][jsaction$=".send"], '+
      'div[jstcache] > div[role=button][disabled]:not([title]):not([data-tooltip])'
    )
  );
  const attachBtn = ec.run(
    'attach button',
    () => querySelectorOne(el, 'div[role=button][jsaction$=".attach"]')
  );
  const body = ec.run(
    'body',
    () => querySelectorOne(el, 'div[contenteditable][g_editable], div[id][tabindex][aria-label][jsaction*=".quick_compose_handle_input"]')
  );
  const subject = isInline ? null : ec.run(
    'subject',
    () => {
      const subject = querySelectorOne(el, 'div[jstcache][jsan] > div > input[type=text][title][placeholder][jsaction*="input:"]');
      if (!(subject instanceof HTMLInputElement)) throw new Error("Wrong type");
      return subject;
    }
  );
  const popOutBtn = isInline ? ec.run(
    'pop-out button',
    () => querySelectorOne(el, 'button[jsaction$=".quick_compose_popout_mole"]')
  ) : null;

  const discardBtn = ec.run(
    'discard button',
    () => querySelectorOne(el, 'button[jsaction$=".discard_draft"]')
  );

  const toggleFullscreenButton = isInline ? null : ec.run(
    'fullscreen button',
    () => querySelectorOne(el, 'button[jsaction$=".toggle_full_screen"]')
  );
  const toggleFullscreenButtonImage = isInline ? null : ec.run(
    'fullscreen button image',
    () => ((querySelectorOne(el, 'button[jsaction$=".toggle_full_screen"] img'): any): HTMLImageElement)
  );
  const closeBtn = isInline ? null : ec.run(
    'close button',
    () => querySelectorOne(
      el,
      'div[jstcache][jsan][jsaction] > button[jsaction$=".close_mole"]')
  );
  const minimizeBtn = isInline ? null : ec.run(
    'minimize button',
    () => querySelectorOne(
      el,
      'div[jstcache][jsan][jsaction] > button[jsaction$=".minimize_mole"]')
  );
  const minimizeBtnImage = isInline ? null : ec.run(
    'minimize button image',
    () => ((querySelectorOne(
      el,
      'div[jstcache][jsan][jsaction] > button[jsaction$=".minimize_mole"] img'
    ): any): HTMLImageElement)
  );
  const bodyPlaceholder = isInline ? null : ec.run(
    'body placeholder',
    () => {
      const el = body && body.previousElementSibling;
      if (!(el instanceof HTMLElement) || el.nodeName !== 'LABEL')
        throw new Error(`compose body placeholder wrong type ${el ? el.nodeName : 'undefined'}`);
      return el;
    }
  );

  const fromPicker: ?HTMLElement = el.querySelector('div[role=button][jsaction*=toggle_custom_from_menu]');
  const fromPickerEmailSpan = fromPicker ? ec.run(
    'from picker email span',
    () => querySelectorOne(fromPicker, 'span')
  ) : null;

  const recipientFields = isInline ? null : ec.run(
    'recipient fields',
    () => {
      const recipientFields: HTMLInputElement[] = (el.querySelectorAll('input[type=text][role=combobox]'): any);
      if (recipientFields.length != 3)
        throw new Error(`Found ${recipientFields.length} recipient fields, expected 3`);
      return recipientFields;
    }
  );
  const [toInput, ccInput, bccInput] = recipientFields || [];

  const toggleCcBccButton = isInline ? null : ec.run(
    'toggle cc/bcc button',
    () => querySelectorOne(el, 'button[jsaction*=".toggle_cc_bcc"]')
  );

  const elements = {
    sendBtn,
    attachBtn,
    body,
    subject,
    popOutBtn,
    discardBtn,
    toggleFullscreenButton,
    toggleFullscreenButtonImage,
    closeBtn,
    minimizeBtn,
    minimizeBtnImage,
    bodyPlaceholder,
    fromPicker,
    fromPickerEmailSpan,
    toInput, ccInput, bccInput,
    toggleCcBccButton
  };
  const score = 1 - (ec.errorCount() / ec.runCount());
  return {
    elements,
    attributes: {
      isInline
    },
    score,
    errors: ec.getErrorLogs()
  };
}

/*:: const x = parser(({}:any)); */
export type Parsed = typeof x;

export default defn(module, parser);
