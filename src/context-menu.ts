export interface ContextMenuOption {
    type: 'text' | 'hr';
    label?: string;
    action?: () => void;
}

export interface ContextMenuConfig {
    position: { x: number; y: number };
    options: ContextMenuOption[];
    onOpen?: () => void;
    onClose?: () => void;
}

let onClose: (() => void) | undefined;
let overlay: HTMLElement | undefined;

// Event listeners to close the context menu
window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        dispose();
    }
});
window.addEventListener('blur', dispose);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        dispose();
    }
});

export function renderContextMenu({ position, options, onOpen, onClose: onCloseFromParams }: ContextMenuConfig) {
    removeExistingContextMenu();

    createOverlay();

    const menu = document.createElement('div');
    menu.className = 'mac-context-menu';
    menu.style.left = `${position.x}px`;
    menu.style.top = `${position.y}px`;

    menu.addEventListener('contextmenu', e => e.preventDefault());

    for (const option of options) {
        if (option.type === 'hr') {
            const hr = document.createElement('hr');
            menu.appendChild(hr);
        } else if (option.type === 'text') {
            const item = document.createElement('div');
            item.className = 'mac-context-menu-option';
            item.textContent = option.label || '';

            if (option.action) {
                item.addEventListener('click', () => {
                    option.action?.();
                    dispose();
                });
            } else {
                item.classList.add('disabled');
            }

            menu.appendChild(item);
        }
    }
    document.body.appendChild(menu);

    onOpen?.();
    onClose = onCloseFromParams;

    // adjust the position of the menu if it goes out of the viewport
    adjustMenuPosition(menu);

    return menu;
}

function createOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'mac-context-menu-overlay';

    overlay.addEventListener('click', dispose);

    // contextmenu: create a new context menu of the target element under the mouse pointer
    overlay.addEventListener('contextmenu', e => {
        e.preventDefault();

        dispose();

        // get the element under the mouse pointer
        const pointElement = document.elementFromPoint(e.clientX, e.clientY);
        if (pointElement) {
            // dispatch a new context menu event
            const newContextMenuEvent = new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 2,
                buttons: 2,
                clientX: e.clientX,
                clientY: e.clientY,
            });
            pointElement.dispatchEvent(newContextMenuEvent);
        }
    });

    document.body.appendChild(overlay);
}

function dispose() {
    if (onClose) {
        onClose();
        onClose = undefined;
    }
    removeExistingContextMenu();
    if (overlay) {
        overlay.remove();
        overlay = undefined;
    }
}

function removeExistingContextMenu() {
    const existingMenu = document.querySelector('.mac-context-menu');
    if (existingMenu) {
        // fade out animation
        existingMenu.classList.add('closing');

        // wait for the animation to complete before removing the element
        setTimeout(() => {
            if (existingMenu.parentNode) {
                document.body.removeChild(existingMenu);
            }
        }, 100); // match the duration of the animation
    }
}

function adjustMenuPosition(menu: HTMLElement) {
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // right boundary check
    if (rect.right > viewportWidth) {
        menu.style.left = `${viewportWidth - rect.width - 10}px`;
    }

    // bottom boundary check
    if (rect.bottom > viewportHeight) {
        menu.style.top = `${viewportHeight - rect.height - 10}px`;
    }
}
