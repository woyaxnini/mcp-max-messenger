// Tools: get_chats, get_chat_members
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MaxClient } from '../max-client.js';

export function registerChatTools(server: McpServer, client: MaxClient): void {
  // ─── get_chats ─────────────────────────────────────────────────────────────
  server.registerTool(
    'get_chats',
    {
      title: 'Get Chats',
      description:
        'Get the list of all group chats where the bot is a participant. ' +
        'Returns chat_id, title, type, participant count, and last activity time. ' +
        'Use chat_id from results to read or send messages.',
      inputSchema: {
        count: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Number of chats to return (1-100, default: 50)'),
        marker: z
          .number()
          .int()
          .optional()
          .describe('Pagination marker from previous response'),
      },
    },
    async ({ count, marker }) => {
      const result = await client.getChats(count ?? 50, marker);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // ─── get_chat_members ──────────────────────────────────────────────────────
  server.registerTool(
    'get_chat_members',
    {
      title: 'Get Chat Members',
      description:
        'Get the list of participants in a group chat. Returns user_id, name, username for each member.',
      inputSchema: {
        chat_id: z
          .number()
          .int()
          .describe('The chat_id of the group chat'),
        count: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Number of members to return (1-100, default: 50)'),
        marker: z
          .number()
          .int()
          .optional()
          .describe('Pagination marker from previous response'),
      },
    },
    async ({ chat_id, count, marker }) => {
      const result = await client.getChatMembers(chat_id, count ?? 50, marker);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}
