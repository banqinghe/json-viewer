import { JSONNode, PropertyDescriptor } from './json-node';
import { renderContextMenu } from './context-menu';
import { copyText, storeAsGlobalVariable } from './util';
import type { ContextMenuOption } from './context-menu';

abstract class TreeNode {
    abstract element: HTMLElement;
    abstract childrenElement?: HTMLOListElement;
    children: TreeElement[] = [];
    expanded: boolean;

    constructor(expanded = true) {
        this.expanded = expanded;
    }

    expand() {
        this.expanded = true;
        this.element.classList.add('expanded');
        if (this.childrenElement) {
            this.childrenElement.style.display = 'block';
        }
    }

    expandRecursively() {
        this.expand();
        for (const child of this.children) {
            child.expandRecursively();
        }
    }

    collapse() {
        this.expanded = false;
        this.element.classList.remove('expanded');
        if (this.childrenElement) {
            this.childrenElement.style.display = 'none';
        }
    }

    collapseChildren() {
        if (!this.expanded) {
            return;
        }
        for (const child of this.children) {
            child.collapse();
        }
    }

    appendChild(child: TreeElement) {
        this.children.push(child);
        this.childrenElement!.appendChild(child.element);
        child.parent = this as unknown as TreeOutline | TreeElement;
        child.init();
        return child;
    }

    abstract onContextMenu(e: MouseEvent): void;
}

export class TreeOutline extends TreeNode {
    element: HTMLOListElement;
    children: TreeElement[] = [];
    childrenElement: HTMLOListElement;
    titleElement: HTMLLIElement;
    expanded: boolean;
    object: JSONNode;

    constructor(object: JSONNode, title?: string, expanded = true) {
        super(expanded);
        this.object = object;
        this.expanded = expanded;

        this.element = document.createElement('ol');
        this.element.className = 'tree-outline';

        this.titleElement = document.createElement('li');
        this.titleElement.className = 'title parent tree-element tree-element-root';
        this.titleElement.innerText = title || object.description;
        this.titleElement.addEventListener('click', this.onTitleClick.bind(this));
        const selectionElement = document.createElement('div');
        selectionElement.className = 'selection';
        this.titleElement.appendChild(selectionElement);
        this.element.appendChild(this.titleElement);

        this.childrenElement = document.createElement('ol');
        this.childrenElement.className = 'tree-children-list';
        this.element.appendChild(this.childrenElement);

        for (const property of object.getOwnProperties()) {
            this.appendChild(new TreeElement(property));
        }

        if (this.expanded) {
            this.expand();
        }

        this.element.addEventListener('contextmenu', this.onContextMenu.bind(this));
    }

    onTitleClick() {
        if (this.expanded) {
            this.collapse();
        } else {
            this.expand();
        }
    }

    onContextMenu(e: MouseEvent) {
        e.preventDefault();

        const value = this.object.value as Object;

        // In Chrome, the difference between `Copy value` and `Copy object` is that
        // the `Copy value` uses 2 spaces for indentation, while the `Copy object` uses 4 spaces.
        const contentMenuOptions: ContextMenuOption[] = [
            { type: 'text', label: 'Copy value', action: () => copyText(JSON.stringify(value, null, 2)) },
            { type: 'text', label: 'Copy object', action: () => copyText(JSON.stringify(value, null, 4)) },
            { type: 'hr' },
            { type: 'text', label: 'Store as global variable', action: () => storeAsGlobalVariable(value) },
            { type: 'hr' },
            { type: 'text', label: 'Expand recursively', action: () => this.expandRecursively() },
            { type: 'text', label: 'Collapse children', action: () => this.collapseChildren() },
        ];

        renderContextMenu({
            position: { x: e.clientX, y: e.clientY },
            options: contentMenuOptions,
            onOpen: () => this.titleElement.classList.add('context-menu-focused'),
            onClose: () => this.titleElement.classList.remove('context-menu-focused'),
        });
    }

    dispose() {
        this.element.remove();
    }
}

export class TreeElement extends TreeNode {
    element: HTMLLIElement;
    childrenElement?: HTMLOListElement | undefined;
    parent!: TreeOutline | TreeElement;
    children: TreeElement[] = [];
    valueElement: HTMLElement;
    nameElement: HTMLElement;
    expanded: boolean;
    property: PropertyDescriptor;

    constructor(property: PropertyDescriptor) {
        super();
        this.property = property;

        this.element = document.createElement('li');
        this.element.className = 'tree-element';
        const selectionElement = document.createElement('div');
        selectionElement.className = 'selection';
        this.element.appendChild(selectionElement);
        this.expanded = true;

        this.element.classList.add('object-property');

        const inlineElement = document.createElement('span');
        inlineElement.className = 'name-and-value';

        this.nameElement = document.createElement('span');
        this.nameElement.className = 'property-name';
        this.nameElement.innerText = this.property.name;

        const separator = document.createElement('span');
        separator.className = 'separator';
        separator.innerText = ': ';

        this.valueElement = document.createElement('span');
        this.valueElement.className = 'property-value';

        inlineElement.appendChild(this.nameElement);
        inlineElement.appendChild(separator);
        inlineElement.appendChild(this.valueElement);
        this.element.appendChild(inlineElement);
    }

    init() {
        this.initValueElement();
        this.initElementTitle();

        if (this.property.value.hasChildren()) {
            this.initChildren();
        }

        this.element.addEventListener('contextmenu', this.onContextMenu.bind(this));
    }

    initElementTitle() {
        // name element: property path
        const name = this.property.name;

        // https://github.com/ChromeDevTools/devtools-frontend/blob/f0dda7c63c64f6c152143d4ea6e4a93a56569b65/front_end/ui/legacy/components/object_ui/ObjectPropertiesSection.ts#L1095
        const useDotNotation = /^(?:[$_\p{ID_Start}])(?:[$_\u200C\u200D\p{ID_Continue}])*$/u;
        const isInteger = /^(?:0|[1-9]\d*)$/;

        const parentPath = (this.parent instanceof TreeElement && this.parent.nameElement)
            ? this.parent.nameElement.title
            : '';

        if (useDotNotation.test(name)) {
            this.nameElement.title = parentPath ? `${parentPath}.${name}` : name;
        } else if (isInteger.test(name)) {
            this.nameElement.title = `${parentPath}[${name}]`;
        } else {
            this.nameElement.title = `${parentPath}[${JSON.stringify(name)}]`;
        }

        // value element: property value
        this.valueElement.title = typeof this.property.value.value === 'object'
            ? JSON.stringify(this.property.value.value, null, 2)
            : this.property.value.value!.toString();
    }

    initValueElement() {
        const value = this.property.value;
        this.valueElement.innerText = value.description;

        if (value.type === 'string') {
            this.valueElement.innerText = `"${value.description}"`;
            this.valueElement.dataset.type = 'string';
        } else if (value.type === 'number') {
            this.valueElement.dataset.type = 'number';
        } else if (value.type === 'boolean') {
            this.valueElement.dataset.type = 'boolean';
        } else if (value.type === 'object' && value.subtype === 'null') {
            this.valueElement.dataset.type = 'null';
        } else if (value.type === 'object' && value.subtype === 'array') {
            this.valueElement.dataset.type = 'array';
        } else if (value.type === 'object') {
            this.valueElement.dataset.type = 'object';
        } else {
            console.error('Unexpected value type:', value.type);
        }
    }

    initChildren() {
        this.element.classList.add('parent');
        this.element.addEventListener('click', this.onClick.bind(this));

        this.childrenElement = document.createElement('ol');
        this.childrenElement.className = 'tree-children-list';
        this.childrenElement.style.display = 'none';

        // Create a list for child properties that will be inserted after this element
        setTimeout(() => {
            this.element.parentElement?.insertBefore(this.childrenElement!, this.element.nextElementSibling);

            // recursively add children
            const properties = this.property.value.getOwnProperties();
            for (const property of properties) {
                this.appendChild(new TreeElement(property));
            }

            if (this.expanded) {
                this.expand();
            }
        }, 0);
    }

    onClick() {
        if (!this.property.value.hasChildren()) return;

        if (this.expanded) {
            this.collapse();
        } else {
            this.expand();
        }
    }

    onContextMenu(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        const { type, value } = this.property.value;

        const contentMenuOptions: ContextMenuOption[] = [
            {
                type: 'text',
                label: 'Copy value',
                action: () => copyText(typeof value === 'object' ? JSON.stringify(value, null, 2) : value!.toString()),
            },
            { type: 'text', label: 'Copy property path', action: () => copyText(this.nameElement.title) },
        ];

        if (type === 'string') {
            contentMenuOptions.push(
                { type: 'text', label: 'Copy string content', action: () => copyText(value as string) },
                { type: 'text', label: 'Copy string as JavaScript literal', action: () => copyText(`'${(value as string).replace(/'/g, '\\\'')}'`) },
                { type: 'text', label: 'Copy string as JSON literal', action: () => copyText(JSON.stringify(value)) },
            );
        } else if (type === 'number') {
            contentMenuOptions.push({ type: 'text', label: 'Copy number', action: () => copyText(value!.toString()) });
        } else if (type === 'boolean') {
            contentMenuOptions.push({ type: 'text', label: 'Copy boolean', action: () => copyText(value!.toString()) });
        } else if (type === 'object') {
            contentMenuOptions.push({ type: 'text', label: 'Copy object', action: () => copyText(JSON.stringify(value, null, 4)) });
        } else {
            console.error('Unexpected value type:', type);
            return;
        }

        contentMenuOptions.push(
            { type: 'hr' },
            { type: 'text', label: 'Store as global variable', action: () => storeAsGlobalVariable(value) },
            { type: 'hr' },
            { type: 'text', label: 'Expand recursively', action: () => this.expandRecursively() },
            { type: 'text', label: 'Collapse children', action: () => this.collapseChildren() },
        );

        renderContextMenu({
            position: { x: e.clientX, y: e.clientY },
            options: contentMenuOptions,
            onOpen: () => this.element.classList.add('context-menu-focused'),
            onClose: () => this.element.classList.remove('context-menu-focused'),
        });
    }
}
