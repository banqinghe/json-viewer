export async function copyText(text: string): Promise<boolean> {
    try {
        if (!navigator.clipboard) {
            console.warn('Clipboard API not supported, falling back to execCommand');
            return fallbackCopyText(text);
        }

        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.warn('Clipboard failed:', err);
        return fallbackCopyText(text);
    }
}

function fallbackCopyText(text: string): boolean {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;

        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const success = document.execCommand('copy');

        document.body.removeChild(textArea);

        return success;
    } catch (err) {
        console.warn('Fallback copy method failed:', err);
        return false;
    }
}

export function storeAsGlobalVariable(value: unknown) {
    const global = window as any;
    for (let i = 1; ; i++) {
        if (typeof global[`temp${i}`] === 'undefined') {
            global[`temp${i}`] = value;
            console.log(`%cJSON Viewer:%c temp${i} ⭢`, 'color:#aaa', '', value);
            break;
        }
    }
}
