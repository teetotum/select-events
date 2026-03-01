(() => {
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

    const startObserving = (sentinelProperty, observedElement, onChange) => {
        const _callback = (values) => {
            if (sentinelProperty in values) {
                const matches = values[sentinelProperty] === "--true";
                onChange(matches)
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
        observedElement.addEventListener("transitionrun", onTransitionRun);

        // init _previousValues
        const computedStyle = getComputedStyle(observedElement);
        const currentValue = computedStyle.getPropertyValue(sentinelProperty);
        _previousValues[sentinelProperty] = currentValue;
    };

    const getUniqueMarker = () => {
        return `${Date.now()}-${Math.ceil(Math.random() * 100)}`
    }

    const setupWatcher = (element) => {
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

        const onChange = (matches) => matches ? raiseOpen(element) : raiseClose(element)
        startObserving(sentinelProperty, element, onChange);
    }

    class ElementTypeProcessor {

        #elementType
        #process

        constructor(elementType, processCallback) {
            this.#elementType = elementType;
            this.#process = processCallback;
            this.processed = new WeakSet(); // avoid double-processing
            this.observers = new WeakMap(); // track observers per shadow root
        }

        handleElement(foundElement) {
            if (this.processed.has(foundElement)) return;
            this.processed.add(foundElement);
            this.#process(foundElement);
        }

        scanRoot(root) {
            root.querySelectorAll(this.#elementType.toLowerCase()).forEach((foundElement) => this.handleElement(foundElement));
        }

        observeRoot(root) {
            if (this.observers.has(root)) return;

            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType !== Node.ELEMENT_NODE) continue;

                        if (node.tagName === this.#elementType.toUpperCase()) this.handleElement(node);

                        // Check descendants of the added node
                        node.querySelectorAll?.(this.#elementType.toLowerCase()).forEach((foundElement) => this.handleElement(foundElement));

                        // If the added node has or will have a shadow root, observe it too
                        this.attachToShadowRoots(node);
                    }
                }
            });

            observer.observe(root, { childList: true, subtree: true });
            this.observers.set(root, observer);
        }

        // Recursively find and observe all shadow roots within a node
        attachToShadowRoots(node) {
            if (node.shadowRoot) {
                this.scanRoot(node.shadowRoot);
                this.observeRoot(node.shadowRoot);
                // Recurse into the shadow root's subtree
                node.shadowRoot.querySelectorAll('*').forEach((child) => {
                    this.attachToShadowRoots(child);
                });
            }
            // Also check children of the current node
            node.querySelectorAll?.('*').forEach((child) => {
                if (child.shadowRoot) this.attachToShadowRoots(child);
            });
        }

        start() {
            // 1. Process everything currently in the document
            this.scanRoot(document);
            this.attachToShadowRoots(document.documentElement);

            // 2. Observe the document for future additions
            this.observeRoot(document);
        }

        stop() {
            this.observers.forEach(observer => observer.disconnect());
            this.observers = new WeakMap();
        }
    }

    const init = () => {
        const processor = new ElementTypeProcessor('select', setupWatcher);
        processor.start();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('readystatechange', init, { once: true });
    } else {
        init();
    }
})()
