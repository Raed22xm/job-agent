#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const projectRoot = process.cwd();
const services = [
  {
    name: 'filesystem',
    command: 'node',
    args: ['-e', "console.log('filesystem bridge ready')"],
  },
  {
    name: 'github',
    command: 'node',
    args: ['-e', "console.log('github bridge ready')"],
  },
  {
    name: 'playwright',
    command: 'node',
    args: ['-e', "console.log('playwright bridge ready')"],
  },
  {
    name: 'sqlite',
    command: 'node',
    args: ['-e', "console.log('sqlite bridge ready')"],
  },
];

for (const service of services) {
  const child = spawn(service.command, service.args, {
    cwd: projectRoot,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, PROJECT_ROOT: projectRoot },
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[mcp-bridge] ${service.name} exited with ${code}`);
    }
  });
}

console.log('[mcp-bridge] local MCP bridge services started');
