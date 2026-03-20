// Tool: get_bot_info
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MaxClient } from '../max-client.js';

export function registerBotTools(server: McpServer, client: MaxClient): void {
  server.registerTool(
    'get_bot_info',
    {
      title: 'Get Bot Info',
      description:
        'Get information about the MAX bot: name, username, user_id, description. ' +
        'Use this to verify the bot is connected and working.',
      inputSchema: {},
    },
    async () => {
      const bot = await client.getMe();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(bot, null, 2),
          },
        ],
      };
    },
  );
}
