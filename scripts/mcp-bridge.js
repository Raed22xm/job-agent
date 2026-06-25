#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const projectRoot = process.cwd();
const services = [
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', 'ruflo@latest', 'mcp', 'start'],
    autoStart: true,
    env: {
      ...process.env,
      // Filesystem operations for job scraping, CV management, etc.
      RUFLO_MCP_MODE: 'filesystem',
      RUFLO_FILESYSTEM_ROOT: projectRoot,
    },
  },
  {
    name: 'github',
    command: 'npx',
    args: ['-y', 'ruflo@latest', 'mcp', 'start'],
    autoStart: false,
    env: {
      ...process.env,
      // GitHub operations for automation
      RUFLO_MCP_MODE: 'github',
      RUFLO_GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    },
  },
  {
    name: 'playwright',
    command: 'npx',
    args: ['-y', 'ruflo@latest', 'mcp', 'start'],
    autoStart: false,
    env: {
      ...process.env,
      // Real browser automation for job scraping, testing, etc.
      RUFLO_MCP_MODE: 'playwright',
      RUFLO_PLAYWRIGHT_BROWSER: 'chromium',
      RUFLO_PLAYWRIGHT_HEADLESS: 'true',
    },
  },
  {
    name: 'sqlite',
    command: 'npx',
    args: ['-y', 'ruflo@latest', 'mcp', 'start'],
    autoStart: false,
    env: {
      ...process.env,
      // Real database operations for persistence
      RUFLO_MCP_MODE: 'sqlite',
      RUFLO_SQLITE_PATH: path.join(projectRoot, 'data', 'applications.sqlite'),
    },
  },
];

console.log('[mcp-bridge] Starting MCP services...');

for (const service of services) {
  if (!service.autoStart) {
    console.log(`[mcp-bridge] Skipping ${service.name} (autoStart: false)`);
    continue;
  }

  console.log(`[mcp-bridge] Starting ${service.name} service`);
  const child = spawn(service.command, service.args, {
    cwd: projectRoot,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, ...service.env },
  });

  child.on('error', (error) => {
    console.error(`[mcp-bridge] ${service.name} error:`, error);
  });

  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[mcp-bridge] ${service.name} exited with ${code}`);
    } else {
      console.log(`[mcp-bridge] ${service.name} completed successfully`);
    }
  });
}

console.log('[mcp-bridge] All MCP services started. Ready for real automation.');

process.on('message', (msg) => {
  console.log('[mcp-bridge] Message:', msg);
});
