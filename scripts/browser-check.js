#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const url = process.argv[2] || 'http://localhost:3001';

console.log(`[browser-check] Checking ${url}`);

const curl = spawn('curl', ['-I', url], {
  cwd: projectRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
let error = '';

curl.stdout.on('data', (chunk) => {
  output += chunk.toString();
});

curl.stderr.on('data', (chunk) => {
  error += chunk.toString();
});

curl.on('close', (code) => {
  if (code === 0) {
    console.log(output.trim());
    console.log('[browser-check] app responded successfully');
  } else {
    console.error(error.trim() || `curl exited with ${code}`);
    console.error('[browser-check] app did not respond yet');
    process.exit(code || 1);
  }
});
