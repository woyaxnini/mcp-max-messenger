# mcp-max-messenger

[![npm version](https://badge.fury.io/js/%40woyax%2Fmcp-max-messenger.svg)](https://www.npmjs.com/package/@woyax/mcp-max-messenger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The first MCP server for MAX Messenger** — Russia's national messenger by VK (75M+ users).

Connect AI clients (Claude Desktop, Cursor, n8n, and any MCP-compatible app) to MAX: send and read messages, manage chats, pin messages — all through the open [Model Context Protocol](https://modelcontextprotocol.io) standard.

---

## Why MAX?

- 🇷🇺 National messenger mandated for pre-installation on all smartphones in Russia (September 2025)
- 📱 75M+ registered users
- 🏢 Recommended by the Ministry of Digital Development for government agencies and large enterprises
- 🤖 Full Bot API with official SDKs: TypeScript, Python, Go, Java, PHP

---

## Quick Start

### Prerequisites

- Node.js 18+
- A MAX bot token (create a bot at [max.ru](https://max.ru))

### Claude Desktop / Cursor (stdio mode)

Add to your Claude Desktop config:

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "max-messenger": {
      "command": "npx",
      "args": ["-y", "@woyax/mcp-max-messenger"],
      "env": {
        "MAX_TOKEN": "YOUR_BOT_TOKEN"
      }
    }
  }
}
```

Restart Claude Desktop. The MAX tools will appear automatically.

### Remote / Hosted mode (HTTP)

```bash
MAX_TOKEN=YOUR_BOT_TOKEN MCP_TRANSPORT=http MCP_PORT=3000 npx @woyax/mcp-max-messenger
```

Connect any MCP client to `http://your-server:3000/mcp`.

---

## Available Tools

| Tool | Description |
|------|-------------|
| `get_bot_info` | Get information about the bot (name, ID, username) |
| `get_chats` | List all group chats the bot participates in |
| `get_messages` | Read messages from a chat |
| `send_message` | Send a text message (supports inline keyboard) |
| `edit_message` | Edit a previously sent message |
| `delete_message` | Delete a message |
| `get_chat_members` | List members of a chat |
| `pin_message` | Pin a message in a chat |
| `unpin_message` | Unpin the currently pinned message |

---

## Usage Examples

Once connected to Claude Desktop, use natural language:

> *"Send a message to chat 123456789: 'The meeting starts in 10 minutes'"*

> *"Show me the last 10 messages from the announcements chat"*

> *"Pin the last message in the dev team chat"*

> *"Who are the members of the sales group?"*

> *"Edit message mid.abc123 in chat 456789 to say 'Updated: meeting moved to 3pm'"*

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MAX_TOKEN` | ✅ | — | Your MAX bot token |
| `MCP_TRANSPORT` | ❌ | `stdio` | Transport: `stdio` or `http` |
| `MCP_PORT` | ❌ | `3000` | Port for HTTP mode |

### Command-line Flags

```bash
# Local stdio mode (default)
npx @woyax/mcp-max-messenger

# Remote HTTP mode
npx @woyax/mcp-max-messenger --transport http --port 3000
```

---

## Architecture

Two independent layers ensure tools work identically in both modes:

```
src/
├── core/               # Business logic — shared between modes
│   ├── max-client.ts   # MAX API HTTP client
│   ├── types.ts        # TypeScript types for MAX API
│   └── tools/
│       ├── bot.ts      # get_bot_info
│       ├── chats.ts    # get_chats, get_chat_members
│       └── messages.ts # send/get/edit/delete/pin/unpin
├── transports/         # Transport layer — selected at runtime
│   ├── stdio.ts        # Local mode (Claude Desktop, Cursor)
│   └── http.ts         # Remote mode (Streamable HTTP)
└── index.ts            # Entry point: transport selection
```

---

## MAX API Notes

- **Authorization**: Token passed as `Authorization: <token>` — **no `Bearer` prefix**
- **Base URL**: `https://platform-api.max.ru`
- **Rate limit**: 30 requests/second
- **Group chats**: `GET /chats` returns group chats only
- **Personal dialogs**: Accessible via `GET /updates` (Long Polling) — use the `chat_id` returned there with all standard tools
- **HTTP transport**: Uses Streamable HTTP (SSE deprecated since MCP SDK 1.10.0)

---

## Roadmap (v1.1.0)

- [ ] `get_updates` — incoming messages, dialogs, callback events
- [ ] Personal dialogs support (dialog type via /updates)
- [ ] `send_file` / `send_photo` / `send_video`
- [ ] `create_chat` — create chats and channels
- [ ] `manage_members` — add/remove members
- [ ] Callback handling — button press events

---

## Links

- [MAX Bot API Documentation](https://dev.max.ru/docs-api)
- [MAX OpenAPI Schema](https://github.com/max-messenger/max-bot-api-schema)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [npm package](https://www.npmjs.com/package/@woyax/mcp-max-messenger)
- [Russian README](./README.ru.md)

---

## License

MIT © [Oleg Alekseev](https://github.com/woyaxnini)
