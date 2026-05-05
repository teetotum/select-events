import { ElementTypeProcessor } from './elementTypeProcessor.js'
import { setupWatcher } from './elementWatcher.js'

const global_listeners = new Set();

const processor = new ElementTypeProcessor('select', (element) => {
    setupWatcher(element, (element, opened) => {
        global_listeners.forEach((listener) => listener(element, opened));
    });
});

let readyStatePromise;

const readyStatePastLoading = () => {
    if (!readyStatePromise) {
        readyStatePromise = new Promise((resolve, reject) => {
            if (document.readyState === 'loading') {
                document.addEventListener('readystatechange', () => resolve(), { once: true });
            } else {
                resolve();
            }
        });
    }
    return readyStatePromise;
}

const asyncCheckStartCondition = async () => {
    await readyStatePastLoading();
    if (global_listeners.size > 0) processor.start();
}

const checkStopCondition = () => {
    if (global_listeners.size === 0) processor.stop();
};

export const observeGlobally = (callback) => {
    global_listeners.add(callback);
    asyncCheckStartCondition();
    const disconnect = () => {
        global_listeners.delete(callback);
        checkStopCondition();
    };
    return { disconnect };
}

export const observeElement = (element, callback) => {
    const { disconnect } = setupWatcher(element, (element, opened) => {
        callback(element, opened);
    });
    return { disconnect };
}
