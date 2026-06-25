#!/usr/bin/env node
/**
 * Starts a single Ruflo MCP service over stdio (for Cursor / Claude MCP clients).
 * Usage: node scripts/mcp-launcher.js <filesystem|playwright|github|sqlite>
 */
const { spawn } = require("child_process");
const path = require("path");

const projectRoot = process.cwd();
const service = process.argv[2];

const configs = {
  filesystem: {
    RUFLO_MCP_MODE: "filesystem",
    RUFLO_FILESYSTEM_ROOT: projectRoot,
  },
  playwright: {
    RUFLO_MCP_MODE: "playwright",
    RUFLO_PLAYWRIGHT_BROWSER: "chromium",
    RUFLO_PLAYWRIGHT_HEADLESS: "true",
  },
  github: {
    RUFLO_MCP_MODE: "github",
    RUFLO_GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  },
  sqlite: {
    RUFLO_MCP_MODE: "sqlite",
    RUFLO_SQLITE_PATH: path.join(projectRoot, "data", "applications.sqlite"),
  },
};

if (!service || !configs[service]) {
  console.error(
    "Usage: node scripts/mcp-launcher.js <filesystem|playwright|github|sqlite>"
  );
  process.exit(1);
}

const child = spawn("npx", ["-y", "ruflo@latest", "mcp", "start"], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    npm_config_update_notifier: "false",
    ...configs[service],
  },
});

child.on("error", (error) => {
  console.error(`[mcp-launcher:${service}]`, error);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
