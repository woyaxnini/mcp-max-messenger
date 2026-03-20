// Transport: stdio (local mode)
// Used by Claude Desktop, Cursor, and other local MCP clients
// Start: npx @woyax/mcp-max-messenger
//        MAX_TOKEN=your_token npx @woyax/mcp-max-messenger

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from '../server.js';

export async function startStdio(token: string): Promise<void> {
  const server = createServer({ token });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdio server runs until the process is killed
}
