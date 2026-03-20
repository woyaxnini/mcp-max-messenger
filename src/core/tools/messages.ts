// Tools: get_messages, send_message, edit_message, delete_message, pin_message, unpin_message
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MaxClient } from '../max-client.js';

export function registerMessageTools(server: McpServer, client: MaxClient): void {
  // ─── get_messages ──────────────────────────────────────────────────────────
  server.registerTool(
    'get_messages',
    {
      title: 'Get Messages',
      description:
        'Read messages from a MAX chat. Returns message text, sender, and timestamp. ' +
        'Requires chat_id (from get_chats). Optionally filter by time range or specific message IDs.',
      inputSchema: {
        chat_id: z
          .number()
          .int()
          .describe('The chat_id to read messages from'),
        count: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Number of messages to return (1-100, default: 20)'),
        from: z
          .number()
          .optional()
          .describe('Start timestamp in milliseconds (Unix ms) for time range filter'),
        to: z
          .number()
          .optional()
          .describe('End timestamp in milliseconds (Unix ms) for time range filter'),
        message_ids: z
          .array(z.string())
          .optional()
          .describe('List of specific message IDs to retrieve'),
      },
    },
    async ({ chat_id, count, from, to, message_ids }) => {
      const result = await client.getMessages({
        chat_id,
        count: count ?? 20,
        from,
        to,
        message_ids,
      });
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

  // ─── send_message ──────────────────────────────────────────────────────────
  server.registerTool(
    'send_message',
    {
      title: 'Send Message',
      description:
        'Send a text message to a MAX chat or user. ' +
        'You must provide either chat_id (for group chats/channels) or user_id (for direct messages), but not both. ' +
        'Supports markdown and HTML formatting. Use markdown: **bold**, *italic*, `code`, [link](url). ' +
        'To add inline buttons, pass attachments with type "inline_keyboard".',
      inputSchema: {
        chat_id: z
          .number()
          .int()
          .optional()
          .describe('Group chat or channel ID to send to (use get_chats to find)'),
        user_id: z
          .number()
          .int()
          .optional()
          .describe('User ID to send direct message to'),
        text: z
          .string()
          .min(1)
          .describe('Message text to send'),
        format: z
          .enum(['markdown', 'html', 'default'])
          .optional()
          .describe('Text formatting: markdown (default) or html'),
        notify: z
          .boolean()
          .optional()
          .describe('Whether to notify participants (default: true)'),
      },
    },
    async ({ chat_id, user_id, text, format, notify }) => {
      if (!chat_id && !user_id) {
        throw new Error('Either chat_id or user_id must be provided');
      }
      const result = await client.sendMessage({
        chat_id,
        user_id,
        text,
        format: format ?? 'markdown',
        notify: notify ?? true,
      });
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

  // ─── edit_message ──────────────────────────────────────────────────────────
  server.registerTool(
    'edit_message',
    {
      title: 'Edit Message',
      description:
        'Edit the text of an existing message sent by the bot. Requires the message_id.',
      inputSchema: {
        message_id: z
          .string()
          .describe('The ID of the message to edit (from send_message or get_messages)'),
        text: z
          .string()
          .min(1)
          .describe('New message text'),
        format: z
          .enum(['markdown', 'html', 'default'])
          .optional()
          .describe('Text formatting for new text'),
      },
    },
    async ({ message_id, text, format }) => {
      const result = await client.editMessage({ message_id, text, format });
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

  // ─── delete_message ────────────────────────────────────────────────────────
  server.registerTool(
    'delete_message',
    {
      title: 'Delete Message',
      description:
        'Delete a message sent by the bot. Requires the message_id.',
      inputSchema: {
        message_id: z
          .string()
          .describe('The ID of the message to delete'),
      },
    },
    async ({ message_id }) => {
      const result = await client.deleteMessage({ message_id });
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

  // ─── pin_message ───────────────────────────────────────────────────────────
  server.registerTool(
    'pin_message',
    {
      title: 'Pin Message',
      description:
        'Pin a message in a group chat. The bot must have admin rights in the chat.',
      inputSchema: {
        chat_id: z
          .number()
          .int()
          .describe('The chat_id where the message is'),
        message_id: z
          .string()
          .describe('The ID of the message to pin'),
        notify: z
          .boolean()
          .optional()
          .describe('Whether to notify participants about pinned message (default: false)'),
      },
    },
    async ({ chat_id, message_id, notify }) => {
      const result = await client.pinMessage(chat_id, message_id, notify ?? false);
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

  // ─── unpin_message ────────────────────────────────────────────────────────
  server.registerTool(
    'unpin_message',
    {
      title: 'Unpin Message',
      description:
        'Unpin the currently pinned message in a group chat. The bot must have admin rights.',
      inputSchema: {
        chat_id: z
          .number()
          .int()
          .describe('The chat_id where the pinned message is'),
      },
    },
    async ({ chat_id }) => {
      const result = await client.unpinMessage(chat_id);
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
