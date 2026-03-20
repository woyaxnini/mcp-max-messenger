// MCP Server setup — registers all tools
// This is transport-agnostic: same tools work in both stdio and HTTP modes

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MaxClient } from './core/max-client.js';
import { registerBotTools } from './core/tools/bot.js';
import { registerChatTools } from './core/tools/chats.js';
import { registerMessageTools } from './core/tools/messages.js';

export interface ServerConfig {
  token: string;
}

export function createServer(config: ServerConfig): McpServer {
  const client = new MaxClient(config.token);

  const server = new McpServer({
    name: 'mcp-max-messenger',
    version: '0.1.0',
  });

  // Register all tools
  registerBotTools(server, client);
  registerChatTools(server, client);
  registerMessageTools(server, client);

  return server;
}
