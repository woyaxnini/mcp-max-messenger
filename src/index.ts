#!/usr/bin/env node
// Entry point for mcp-max-messenger
// Selects transport based on --transport flag or MCP_TRANSPORT env variable
//
// Usage (stdio, default):
//   MAX_TOKEN=your_token npx @woyax/mcp-max-messenger
//
// Usage (HTTP/remote):
//   MAX_TOKEN=your_token MCP_PORT=3000 npx @woyax/mcp-max-messenger --transport http

import { startStdio } from './transports/stdio.js';
import { startHttp } from './transports/http.js';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main(): Promise<void> {
  // ─── Token ──────────────────────────────────────────────────────────────
  const token = process.env.MAX_TOKEN ?? getArg('--token');
  if (!token) {
    console.error(
      '[mcp-max-messenger] Error: MAX_TOKEN environment variable is required.\n' +
      'Set it before running:\n' +
      '  MAX_TOKEN=your_bot_token npx @woyax/mcp-max-messenger\n\n' +
      'Get your token from Master Bot in MAX: https://max.ru/masterbot',
    );
    process.exit(1);
  }

  // ─── Transport selection ─────────────────────────────────────────────────
  const transportEnv = process.env.MCP_TRANSPORT?.toLowerCase();
  const transportArg = getArg('--transport')?.toLowerCase();
  const transport = transportArg ?? transportEnv ?? 'stdio';

  if (transport === 'stdio') {
    await startStdio(token);
  } else if (transport === 'http' || transport === 'sse') {
    const port = parseInt(
      getArg('--port') ?? process.env.MCP_PORT ?? '3000',
      10,
    );
    const apiKey = process.env.MCP_API_KEY ?? getArg('--api-key');

    await startHttp({ defaultToken: token, port, apiKey });
  } else {
    console.error(
      `[mcp-max-messenger] Unknown transport: "${transport}". Use "stdio" or "http".`,
    );
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error('[mcp-max-messenger] Fatal error:', err);
  process.exit(1);
});
