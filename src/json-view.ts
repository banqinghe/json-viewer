import { JSONNode } from './json-node';
import { TreeOutline } from './tree';

export class JSONView {
    element: HTMLElement;
    private initialized: boolean = false;
    private readonly parsedJSON: ParsedJSON;
    private readonly startCollapsed: boolean;
    private treeOutline?: TreeOutline;
    private errorOverlay?: HTMLElement;
    private onError?: (error: Error) => void;

    constructor(
        parsedJSON: ParsedJSON,
        startCollapsed: boolean = false,
        onError?: (error: Error) => void,
    ) {
        this.parsedJSON = parsedJSON;
        this.startCollapsed = startCollapsed;
        this.onError = onError;

        this.element = document.createElement('div');
        this.element.className = 'json-view';
    }

    static createView(data: unknown, onError?: (error: Error) => void): JSONView {
        const parsedObject = JSONView.parse(data);

        if (parsedObject) {
            const parsedJSON = new ParsedJSON(parsedObject, '', '');
            const view = new JSONView(parsedJSON, false, onError);
            return view;
        } else {
            const error = new Error('Invalid JSON format');
            onError?.(error);
            const view = new JSONView(new ParsedJSON({}, '', ''), false, onError);
            view.showError(error);
            return view;
        }
    }

    update(data: unknown) {
        const parsedObject = JSONView.parse(data);
        if (parsedObject) {
            this.parsedJSON.data = parsedObject;
        } else {
            const error = new Error('Invalid JSON format');
            this.showError(error);
            return;
        }

        if (this.treeOutline) {
            this.treeOutline.dispose();
        }
        this.clearErrorOverlay();

        this.initialized = false;
        this.render();
    }

    render() {
        if (this.initialized) return this.element;

        this.initialized = true;

        const obj = JSONNode.fromLocalObject(this.parsedJSON.data);
        const title = this.parsedJSON.prefix + obj.description + this.parsedJSON.suffix;

        this.treeOutline = new TreeOutline(obj, title, !this.startCollapsed);
        this.element.appendChild(this.treeOutline.element);

        return this.element;
    }

    static parse(data: unknown): Object | null {
        if (typeof data === 'string') {
            try {
                const parsedData = JSON.parse(data);
                return parsedData;
            } catch (e) {
                return null;
            }
        }

        if (typeof data === 'object') {
            return data;
        }

        return null;
    }

    private showError(error: Error) {
        this.onError?.(error);

        if (!this.errorOverlay) {
            this.errorOverlay = document.createElement('div');
            this.errorOverlay.className = 'json-error-overlay';

            const errorContent = document.createElement('div');
            errorContent.className = 'json-error-content';
            this.errorOverlay.appendChild(errorContent);

            this.element.appendChild(this.errorOverlay);
        }

        const errorContent = this.errorOverlay.querySelector('.json-error-content');
        if (errorContent) {
            errorContent.textContent = error.message;
        }

        this.errorOverlay.style.display = 'flex';
    }

    private clearErrorOverlay() {
        if (this.errorOverlay) {
            this.errorOverlay.style.display = 'none';
        }
    }
}

class ParsedJSON {
    data: Object;
    // The prefix and suffix are for compatibility with the jsonp format return,
    // which is not currently being used.
    prefix: string;
    suffix: string;

    constructor(data: Object, prefix: string, suffix: string) {
        this.data = data;
        this.prefix = prefix;
        this.suffix = suffix;
    }
}
