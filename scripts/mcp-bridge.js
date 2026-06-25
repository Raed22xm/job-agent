#!/usr/bin/env node
/**
 * Starts background MCP helper processes for npm run mcp:start.
 * Cursor MCP clients should use scripts/mcp-launcher.js per service instead.
 */
const { spawn } = require("child_process");
const path = require("path");

const projectRoot = process.cwd();
const services = [
  {
    name: "filesystem",
    autoStart: true,
    env: {
      RUFLO_MCP_MODE: "filesystem",
      RUFLO_FILESYSTEM_ROOT: projectRoot,
    },
  },
  {
    name: "playwright",
    autoStart: true,
    env: {
      RUFLO_MCP_MODE: "playwright",
      RUFLO_PLAYWRIGHT_BROWSER: "chromium",
      RUFLO_PLAYWRIGHT_HEADLESS: "true",
    },
  },
  {
    name: "github",
    autoStart: false,
    env: {
      RUFLO_MCP_MODE: "github",
      RUFLO_GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    },
  },
  {
    name: "sqlite",
    autoStart: false,
    env: {
      RUFLO_MCP_MODE: "sqlite",
      RUFLO_SQLITE_PATH: path.join(projectRoot, "data", "applications.sqlite"),
    },
  },
];

console.log("[mcp-bridge] Starting MCP services...");

for (const service of services) {
  if (!service.autoStart) {
    console.log(`[mcp-bridge] Skipping ${service.name} (autoStart: false)`);
    continue;
  }

  console.log(`[mcp-bridge] Starting ${service.name} service`);
  const child = spawn("npx", ["-y", "ruflo@latest", "mcp", "start"], {
    cwd: projectRoot,
    stdio: ["ignore", "inherit", "inherit"],
    env: {
      ...process.env,
      npm_config_update_notifier: "false",
      ...service.env,
    },
  });

  child.on("error", (error) => {
    console.error(`[mcp-bridge] ${service.name} error:`, error);
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`[mcp-bridge] ${service.name} exited with ${code}`);
    } else {
      console.log(`[mcp-bridge] ${service.name} completed successfully`);
    }
  });
}

console.log("[mcp-bridge] Filesystem + Playwright ready for job/CV automation.");

process.on("message", (msg) => {
  console.log("[mcp-bridge] Message:", msg);
});
