declare module "select-events/non-standard-open-close" {}

declare module "select-events/core" {
    interface GlobalObserverCallback {
        (element: HTMLSelectElement, selectOpened: boolean): unknown
    }

    interface GlobalObserver {
        (callback: GlobalObserverCallback): void
    }

    export const observeGlobally: GlobalObserver
}
