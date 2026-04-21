import { observeGlobally } from './coreFunctionality.js'

const OPEN_EVENT = '--select-open';
const CLOSE_EVENT = '--select-close';

const raiseOpen = (select) => {
    const e = new Event(OPEN_EVENT, { bubbles: true, composed: true });
    select.dispatchEvent(e);
}

const raiseClose = (select) => {
    const e = new Event(CLOSE_EVENT, { bubbles: true, composed: true });
    select.dispatchEvent(e);
}

observeGlobally(
    (select, selectOpened) => selectOpened ? raiseOpen(select) : raiseClose(select)
);
