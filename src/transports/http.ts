// Transport: Streamable HTTP (remote/hosted mode)
// Used for monetization: users connect via URL to your VPS
// Start: MCP_TRANSPORT=http MAX_TOKEN=... npx @woyax/mcp-max-messenger --transport http
//
// Each request can carry its own token via X-Max-Token header,
// enabling multi-bot support in the hosted version.

import express from 'express';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createServer } from '../server.js';

interface Session {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  createdAt: number;
}

export async function startHttp(options: {
  defaultToken: string;
  port: number;
  apiKey?: string;       // Optional: require X-API-Key for access control
  sessionTtlMs?: number; // Session TTL (default: 1 hour)
}): Promise<void> {
  const { defaultToken, port, apiKey, sessionTtlMs = 60 * 60 * 1000 } = options;
  const sessions = new Map<string, Session>();

  // Clean up stale sessions
  setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.createdAt > sessionTtlMs) {
        session.transport.close().catch(() => {});
        sessions.delete(id);
      }
    }
  }, 10 * 60 * 1000); // every 10 min

  const app = express();
  app.use(express.json());

  // ─── Auth middleware (optional) ──────────────────────────────────────────
  if (apiKey) {
    app.use('/mcp', (req, res, next) => {
      const key = req.headers['x-api-key'];
      if (key !== apiKey) {
        res.status(401).json({ error: 'Invalid API key' });
        return;
      }
      next();
    });
  }

  // ─── Health check ─────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', sessions: sessions.size });
  });

  // ─── MCP endpoint (Streamable HTTP) ───────────────────────────────────────
  app.all('/mcp', async (req, res) => {
    try {
      // Per-request token override (for multi-bot hosted mode)
      const token = (req.headers['x-max-token'] as string | undefined) ?? defaultToken;

      const sessionId = req.headers['mcp-session-id'] as string | undefined;

      // Existing session
      if (sessionId && sessions.has(sessionId)) {
        const { transport } = sessions.get(sessionId)!;
        await transport.handleRequest(req, res);
        return;
      }

      // New session — must be an Initialize request
      if (!sessionId && req.method === 'POST' && isInitializeRequest(req.body)) {
        const newSessionId = randomUUID();
        const server = createServer({ token });
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId,
          onsessioninitialized: (id) => {
            sessions.set(id, { server, transport, createdAt: Date.now() });
          },
        });

        // Clean up when client disconnects
        transport.onclose = () => {
          sessions.delete(newSessionId);
        };

        await server.connect(transport);
        await transport.handleRequest(req, res);
        return;
      }

      // Bad request
      res.status(400).json({
        error: 'Bad request: missing or invalid session',
      });
    } catch (err) {
      console.error('[MCP HTTP] Error handling request:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // ─── Start ────────────────────────────────────────────────────────────────
  app.listen(port, () => {
    console.error(`[mcp-max-messenger] HTTP server listening on port ${port}`);
    console.error(`[mcp-max-messenger] MCP endpoint: http://localhost:${port}/mcp`);
    if (apiKey) {
      console.error('[mcp-max-messenger] API key authentication: enabled');
    }
  });

  // Keep process alive
  await new Promise<never>(() => {});
}
