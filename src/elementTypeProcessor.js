export class ElementTypeProcessor {

    #elementType;
    #processElement;
    #started = false;
    #processed = new WeakSet();
    #observed = new WeakSet();
    #observers = new Set();
    #registry = new FinalizationRegistry((observer) => {
        observer.disconnect(); // unnecessary, the DOM node was already GC'ed, but it gives me closure
        this.#observers.delete(observer);
    });

    constructor(elementType, callback) {
        this.#elementType = elementType.toLowerCase();
        this.#processElement = callback;
    }

    #handleMatch(matchedElement) {
        if (this.#processed.has(matchedElement)) return;
        this.#processed.add(matchedElement);
        this.#processElement(matchedElement);
    }

    #scanSubtree(root) {
        if (root.matches(this.#elementType)) this.#handleMatch(root);
        root.querySelectorAll(this.#elementType).forEach((match) => this.#handleMatch(match));
    }

    #handleAddedNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            this.#scanSubtree(node);
            this.#checkSubtreeForShadowRoots(node);
        }
    }

    #observeSubtree(root) {
        if (this.#observed.has(root)) return;

        const observer = new MutationObserver((mutationRecords) => {
            mutationRecords.forEach((mutationRecord) => {
                mutationRecord.addedNodes.forEach((node) => this.#handleAddedNode(node));
            });
        });

        observer.observe(root, { childList: true, subtree: true });
        this.#observed.add(root);
        this.#observers.add(observer);
        this.#registry.register(root, observer, observer); // the duplicated 'observer' is no mistake, the observer is used as finalization token AND as unregister token
    }

    #checkShadowRoot(node) {
        if (node.shadowRoot) {
            this.#handleSubtreeRoot(node.shadowRoot);
        }
    }

    #checkSubtreeForShadowRoots(node) {
        this.#checkShadowRoot(node);
        node.querySelectorAll('*').forEach((child) => this.#checkShadowRoot(child));
    }

    #handleSubtreeRoot(rootNode) {
        this.#scanSubtree(rootNode);
        this.#observeSubtree(rootNode);
        this.#checkSubtreeForShadowRoots(rootNode);
    }

    start() {
        if (this.#started) return;
        this.#started = true;

        this.#handleSubtreeRoot(document.documentElement);
    }

    stop() {
        if (!this.#started) return;
        this.#started = false;

        this.#observers.forEach((observer) => {
            observer.disconnect();
            this.#registry.unregister(observer);
        });
        this.#observers.clear();
        this.#observed = new WeakSet();
    }
}

// # Implementation Notes
//
// I was pondering whether I would create a memory leak by creating MutationObservers and keeping their references,
// fearing to thereby prevent all the obseved DOM nodes from getting GC'ed.
// The question I had to answer was:
// Does a MutationObserver have a strong reference to the observed node or only a weak reference?
//
// But luckily my research has turned up that the observed nodes are stored only in a weak list. Yay!
// A fact that is missing on the mdn page and might be a good addition: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
// So the answer is: MutationObserver has only weak references to observed nodes; see https://github.com/whatwg/dom/issues/1159
//
// which has a link to: https://www.w3.org/Bugs/Public/show_bug.cgi?id=16638
// where we find:
// > Anne 2012-04-05 16:46:08 UTC: So MutationObserver has weak references to its nodes?
// > Olli Pettay 2012-04-06 08:07:54 UTC: Yes, and nodes have strong references to the MutationObservers which are observing them
//
// and a link to: https://dom.spec.whatwg.org/#mutationobserver-node-list
// where we find:
// > Each MutationObserver object has these associated concepts:
// > - [...]
// > - A node list (a list of weak references to nodes), which is initially empty.
// > - [...]
// and further down:
// > The observe(target, options) method steps are:
// > [...]
// > 8.2 Append a weak reference to target to this’s node list.
