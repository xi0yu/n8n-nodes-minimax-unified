#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const iconSrc = path.join(root, 'icons');
const targets = [
  path.join(root, 'dist', 'nodes', 'MiniMax'),
  path.join(root, 'dist', 'credentials'),
];

for (const dir of targets) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(iconSrc)) {
    fs.copyFileSync(path.join(iconSrc, f), path.join(dir, f));
  }
}
console.log('[copy-assets] icons copied to', targets.join(', '));
