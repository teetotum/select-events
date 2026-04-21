import { ElementTypeProcessor } from './elementTypeProcessor.js'
import { setupWatcher } from './elementWatcher.js'

const listeners = [];

const setup = () => {
    const processor = new ElementTypeProcessor('select', (element) => {
        const { shutdown } = setupWatcher(element, (element, opened) => {
            listeners.forEach((listener) => listener(element, opened));
        });
    });
    processor.start();
}

const init = () => {
    if (document.readyState === 'loading') {
        document.addEventListener('readystatechange', setup, { once: true });
    } else {
        setup();
    }
}

let initialized = false;

const ensureInit = () => {
    if (initialized) return;

    init();
    initialized = true;
}

export const observeGlobally = (callback) => {
    listeners.push(callback);
    ensureInit();
}
