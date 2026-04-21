export class ElementTypeProcessor {

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
