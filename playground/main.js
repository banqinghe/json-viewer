import { JSONView } from '../src';
import '../src/style.css';

const defaultData = {
    name: 'Test Object',
    numbers: [1, 2, 3, 4],
    nested: {
        a: true,
        b: null,
        c: 'Hello world',
        d: 'https://github.com',
        e: {
            'name': 'To\'m',
            'age': 6,
            'company-id': '1234567890',
        },
    },
};

const view = JSONView.createView(defaultData);
document.getElementById('json-viewer-container').appendChild(view.render());

const input = document.getElementById('json-input');
input.value = JSON.stringify(defaultData, null, 2);

// 添加处理Tab键的事件监听器
input.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
        e.preventDefault(); // 阻止默认Tab行为

        const start = input.selectionStart;
        const end = input.selectionEnd;

        // 在光标位置插入两个空格
        input.value = input.value.substring(0, start) + '  ' + input.value.substring(end);

        // 将光标放置在插入空格之后
        input.selectionStart = input.selectionEnd = start + 2;
    }
});

input.addEventListener('input', e => {
    view.update(e.target.value);
});
