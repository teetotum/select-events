declare module "select-events/non-standard-open-close" {}

declare module "select-events/core" {
    interface ObserverCallback {
        (element: HTMLSelectElement, selectOpened: boolean): unknown
    }

    interface ObserverHandle {
        disconnect: () => void
    }

    interface GlobalObserverFunction {
        (callback: ObserverCallback): ObserverHandle
    }

    interface ElementObserverFunction {
        (element: HTMLSelectElement, callback: ObserverCallback): ObserverHandle
    }

    export const observeGlobally: GlobalObserverFunction
    export const observeElement: ElementObserverFunction
}
