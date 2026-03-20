# mcp-max-messenger

[![npm version](https://badge.fury.io/js/%40woyax%2Fmcp-max-messenger.svg)](https://www.npmjs.com/package/@woyax/mcp-max-messenger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Первый MCP-сервер для мессенджера MAX** — национального мессенджера России от VK (75M+ пользователей).

Подключите AI-клиентов (Claude Desktop, Cursor, n8n и любое MCP-совместимое приложение) к MAX: отправляйте и читайте сообщения, управляйте чатами, закрепляйте сообщения — через открытый стандарт [Model Context Protocol](https://modelcontextprotocol.io).

---

## Зачем это нужно?

- 🇷🇺 Обязателен к предустановке на все смартфоны в России с сентября 2025
- 📱 75M+ зарегистрированных пользователей
- 🏢 Рекомендован Минцифры для госорганов и крупных компаний (ноябрь 2025)
- 🤖 Полноценный Bot API с официальными SDK: TypeScript, Python, Go, Java, PHP

---

## Быстрый старт

### Требования

- Node.js 18+
- Токен MAX-бота (создайте бота на [max.ru](https://max.ru))

### Локальный режим — для Claude Desktop / Cursor

Добавьте в конфиг Claude Desktop:

**Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "max-messenger": {
      "command": "npx",
      "args": ["-y", "@woyax/mcp-max-messenger"],
      "env": {
        "MAX_TOKEN": "ВАШ_ТОКЕН_БОТА"
      }
    }
  }
}
```

Перезапустите Claude Desktop. Инструменты MAX появятся автоматически.

### Удалённый режим (HTTP) — для хостинга

```bash
MAX_TOKEN=ВАШ_ТОКЕН MCP_TRANSPORT=http MCP_PORT=3000 npx @woyax/mcp-max-messenger
```

Подключите любой MCP-клиент к `http://ваш-сервер:3000/mcp`.

---

## Доступные инструменты

| Инструмент | Описание |
|------------|----------|
| `get_bot_info` | Информация о боте (имя, ID, username) |
| `get_chats` | Список групповых чатов бота |
| `get_messages` | Чтение сообщений из чата |
| `send_message` | Отправка сообщения (поддерживает inline-клавиатуру) |
| `edit_message` | Редактирование отправленного сообщения |
| `delete_message` | Удаление сообщения |
| `get_chat_members` | Участники чата |
| `pin_message` | Закрепить сообщение в чате |
| `unpin_message` | Открепить закреплённое сообщение |

---

## Примеры использования

После подключения к Claude Desktop используйте обычный язык:

> *«Отправь сообщение в чат 123456789: "Встреча через 10 минут"»*

> *«Покажи последние 10 сообщений из чата отдела продаж»*

> *«Закрепи последнее сообщение в чате announcements»*

> *«Кто участники группы "Разработка"?»*

> *«Отредактируй сообщение mid.abc123 в чате 456789: напиши "Встреча перенесена на 15:00"»*

---

## Конфигурация

### Переменные окружения

| Переменная | Обязательно | По умолчанию | Описание |
|-----------|-------------|--------------|----------|
| `MAX_TOKEN` | ✅ | — | Токен вашего MAX-бота |
| `MCP_TRANSPORT` | ❌ | `stdio` | Транспорт: `stdio` или `http` |
| `MCP_PORT` | ❌ | `3000` | Порт для HTTP-режима |

### Флаги командной строки

```bash
# Локальный режим (по умолчанию)
npx @woyax/mcp-max-messenger

# Удалённый HTTP-режим
npx @woyax/mcp-max-messenger --transport http --port 3000
```

---

## Архитектура

Два независимых слоя — инструменты работают одинаково в обоих режимах:

```
src/
├── core/               # Бизнес-логика — общая для обоих режимов
│   ├── max-client.ts   # HTTP-клиент MAX API
│   ├── types.ts        # TypeScript-типы MAX API
│   └── tools/
│       ├── bot.ts      # get_bot_info
│       ├── chats.ts    # get_chats, get_chat_members
│       └── messages.ts # send/get/edit/delete/pin/unpin
├── transports/         # Транспортный слой — выбирается при запуске
│   ├── stdio.ts        # Локальный режим (Claude Desktop, Cursor)
│   └── http.ts         # Удалённый режим (Streamable HTTP)
└── index.ts            # Точка входа: выбор транспорта
```

---

## Особенности MAX API

- **Авторизация**: токен передаётся как `Authorization: <токен>` — **без слова `Bearer`**
- **Base URL**: `https://platform-api.max.ru`
- **Rate limit**: 30 запросов/сек
- **Групповые чаты**: `GET /chats` возвращает только групповые чаты
- **Личные сообщения**: доступны через `GET /updates` (Long Polling) — используйте полученный `chat_id` с любым стандартным инструментом
- **HTTP-транспорт**: Streamable HTTP (SSE устарел с MCP SDK 1.10.0)

---

## Roadmap (v1.1.0)

- [ ] `get_updates` — входящие сообщения, диалоги, callback-события
- [ ] Поддержка личных диалогов (тип dialog через /updates)
- [ ] `send_file` / `send_photo` / `send_video`
- [ ] `create_chat` — создание чатов и каналов
- [ ] `manage_members` — добавление/удаление участников
- [ ] Callback handling — обработка нажатий на кнопки

---

## Ссылки

- [Документация MAX Bot API](https://dev.max.ru/docs-api)
- [MAX OpenAPI Schema](https://github.com/max-messenger/max-bot-api-schema)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [npm-пакет](https://www.npmjs.com/package/@woyax/mcp-max-messenger)
- [English README](./README.md)

---

## Лицензия

MIT © [Алексеев Олег](https://github.com/woyaxnini)
