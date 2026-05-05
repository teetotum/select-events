
const startObserving = (sentinelProperty, observedElement, onChange, abortController) => {
    const _callback = (values) => {
        if (sentinelProperty in values) {
            const matches = values[sentinelProperty] === "--true";
            onChange(observedElement, matches)
        }
    };

    const _previousValues = {};

    observedElement.style.setProperty("transition", `${sentinelProperty} 0.001ms step-start`);
    observedElement.style.setProperty("transition-behavior", "allow-discrete");
    const onTransitionRun = (e) => {
        const targetElement = e.target;

        if (observedElement === targetElement) {
            const computedStyle = getComputedStyle(targetElement);
            const changes = {};
            const currentValue = computedStyle.getPropertyValue(sentinelProperty);
            const previousValue = _previousValues[sentinelProperty];
            const hasChanged = currentValue !== previousValue;

            if (hasChanged) {
                changes[sentinelProperty] = currentValue;
                _previousValues[sentinelProperty] = currentValue;
                _callback(changes);
            }
        }
    };
    observedElement.addEventListener("transitionrun", onTransitionRun, {signal: abortController.signal});

    // init _previousValues
    const computedStyle = getComputedStyle(observedElement);
    const currentValue = computedStyle.getPropertyValue(sentinelProperty);
    _previousValues[sentinelProperty] = currentValue;
};

const getUniqueMarker = () => {
    return `${Date.now()}-${Math.ceil(Math.random() * 100)}`
}

export const setupWatcher = (element, onChange) => {
    const abortController = new AbortController();
    const unique_name = getUniqueMarker();
    const markerAttribute = `data-${unique_name}`;
    element.setAttribute(markerAttribute, "");
    const detectorSheet = new CSSStyleSheet();
    const sentinelProperty = '--select-picker-is-open';
    const css = `
        @property ${sentinelProperty} {
            syntax: '<custom-ident>';
            inherits: false;
            initial-value: --false;
        }
        [${markerAttribute}]:open {
            ${sentinelProperty}: --true;
        }
    `;
    detectorSheet.replaceSync(css);

    // --
    // here we must be aware of shadow DOMs
    // so instead of:
    // document.adoptedStyleSheets = [...document.adoptedStyleSheets, detectorSheet];
    // we do:
    const document_or_shadowRoot = element.getRootNode();
    document_or_shadowRoot.adoptedStyleSheets = [...document_or_shadowRoot.adoptedStyleSheets, detectorSheet];
    // --

    startObserving(sentinelProperty, element, onChange, abortController);

    const disconnect = () => {
        abortController.abort();
    };

    return { disconnect };
}