# select-events

This package adds open / close events for HTML `<select>` elements.
Script code can then use regular DOM event listeners to run code when a select's picker dropdown is being shown or hidden.

## usage

Import the package into your main script or add it via a `<script>` tag to your HTML document.

```js
import "select-events/non-standard-open-close";
```

This automatically adds support for open and close events. The open event type is `--select-open`. The close event type is `--select-close`. Both events bubble.
The event args object does not have any special properties; only the standard properties that are shared by all DOM events, like `target` etc.

```js
// listening for open events directly at the element
const selectElement = document.querySelector('select');
selectElement.addEventListener('--select-open', () => { console.log('This picker opened!'); });

// listening for bubbling close events at the document root
document.addEventListener('--select-close', () => { console.log('Some picker closed!'); });
```

## using select picker detection without polyfilling anything

If you need to detect opening/closing `<select>` pickers without polyfilling anything automatically (i.e. without side effects) you can use the `select-events/core` package subpath.

The following functions are exposed:
- `observeGlobally()` detect any opening/closing `<select>` pickers document-wide
- `observeElement()` detect an opening/closing picker for a given `<select>` element

### observeGlobally

```js
import { observeGlobally } from "select-events/core";

// start document-wide observation by calling observeGlobally()
const { disconnect } = observeGlobally(
    (select, selectOpened) => {
        if (selectOpened)
            console.log(`element ${select} picker opened`)
        else
            console.log(`element ${select} picker closed`)
    }
);

// end the observation anytime by calling disconnect()
disconnect();
```

To start global observation `observeGlobally()` must be called with a callback, that will receive the HTML `<select>` element reference and a bool flag indicating `pickerOpened` whenever any select's picker opens or closes anywhere in the document. The function returns a handle that allows to control the started observation.
To end observation the `disconnect()` function of the handle must be called.

### observeElement

```js
import { observeElement } from "select-events/core";

// start specific element observation by calling observeElement()
const { disconnect } = observeElement($selectElement,
    (select, selectOpened) => {
        if (selectOpened)
            console.log(`element ${select} picker opened`)
        else
            console.log(`element ${select} picker closed`)
    }
);

// end the observation anytime by calling disconnect()
disconnect();
```

To start element-specific observation `observeElement()` must be called with a reference to the target element and a callback, that will receive the HTML `<select>` element reference and a bool flag indicating `pickerOpened` whenever the target's picker opens or closes. The function returns a handle that allows to control the started observation.
To end observation the `disconnect()` function of the handle must be called.

## Why the weird naming?

You might wonder why the import path must be `select-events/non-standard-open-close` and why the event types are prefixed with two dashes.
The reason is that the open and close events for `<select>` elements are not yet part of the HTML standard and there is an [open discussion](https://github.com/whatwg/html/issues/11564) to clarify how exactly the events will look and feel (what name will they have? what timing? cancelable? will they be paired with other events? how will the event args look?).
The longish import path thus a) makes it perfectly clear that it adds a _non-standard_ feature and b) allows for a future version of this package to use the shorter import path `select-events` to _polyfill_ the officially sanctioned events once the standard has landed.
The two dashes infront of the event types mark them as values that are defined in _userland_ (as opposed to _native_ values which never start with two dashes). This prevents potential future name conflicts (e.g. "SmooshGate") should the standard add _native_ values with the same name.

## What should work? How does it work?

When initialized the package queries and processes all `<select>` elements on the page, including all that are currently in the DOM when the init code runs, but also processing all future `<select>` elements that will be created at any point in time and added to the DOM. It also handles `<select>` elements in _open_ shadow DOM (but not in _closed_ shadow DOM).
Any content of `<iframe>` elements is not processed.
Processed elements are observed by a watcher that utilizes the css feature `select:open` to determine whether the dropdown is open or closed.
A _StyleObserver_ mechanism will be triggered when the css selector matches, and will execute a callback that finally raises the DOM events.

## Feedback

Please don't hesitate to provide feedback by opening an issue or a discussion.
If you find a bug or experience that the package isn't working as expected please let me know.
I can only fix those bugs I am made aware of.
