# @bqh/json-viewer

A Chrome DevTools-like JSON viewer that provides an interactive way to explore JSON data.

## Installation

```bash
pnpm add @bqh/json-viewer
```

## Usage

```javascript
import { JSONView } from '@bqh/json-viewer';
import '@bqh/json-viewer/dist/json-viewer.css';

// Create a JSON viewer instance
const jsonData = { name: "John", age: 30, items: [1, 2, 3] };
const jsonView = JSONView.createView(jsonData);

// Add the viewer to the DOM
document.getElementById('container').appendChild(jsonView.render());

// Update data later if needed
jsonView.update({ name: "Jane", age: 28, items: [4, 5, 6] });
```

## Development

```bash
# Start the development server (playground mode)
pnpm dev

# Build the library
pnpm build

# Build the playground
pnpm build:playground
```

## License

MIT
