#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const mustExist = [
  ...pkg.n8n.credentials,
  ...pkg.n8n.nodes,
  'dist/credentials/minimax.svg',
  'dist/credentials/minimax-dark.svg',
  'dist/nodes/MiniMax/minimax.svg',
  'dist/nodes/MiniMax/minimax-dark.svg',
  'index.js',
  'README.md',
  'LICENSE',
];

const missing = [];
for (const rel of mustExist) {
  if (!fs.existsSync(path.join(root, rel))) missing.push(rel);
}

if (missing.length) {
  console.error('[verify-build] missing files:');
  for (const m of missing) console.error('  -', m);
  process.exit(1);
}

// Sanity load: require each compiled node/credential to surface runtime errors.
const toLoad = [
  ...pkg.n8n.credentials,
  ...pkg.n8n.nodes,
];
for (const rel of toLoad) {
  try {
    require(path.join(root, rel));
  } catch (err) {
    console.error('[verify-build] failed to load', rel);
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

console.log('[verify-build] OK (' + mustExist.length + ' files, ' + toLoad.length + ' modules loaded)');
