# IRAQ EFU MONITOR | Telegram Bot & Mini App System

A real-time **EFU (Equipment / Fiber Unit) Operations & Maintenance Control System** built with **Next.js 14 App Router**, **Supabase PostgreSQL**, **Telegram WebApp SDK**, and a **Telegram Bot Admin Panel**.

---

## 🏗️ System Architecture

```
                    TELEGRAM BOT
                         │
              ┌──────────┴──────────┐
              │                     │
       DEVELOPER ADMIN         NORMAL USERS
              │                     │
              ↓                     ↓
       ADMIN PANEL            TELEGRAM MINI APP
              │                     │
              └──────────┬──────────┘
                         ↓
                    API / SERVER
                         ↓
                    SUPABASE
                         ↓
                  PostgreSQL DB
```

- **Telegram Bot (`Server-side Admin Panel`)**: User management, roles (`DEVELOPER`, `LEADER`, `MEMBER`), permission overrides, single-use linking tokens, audit logs.
- **Telegram Mini App (`Operational UI`)**: Real-time Iraq Threat Map, 4-Hour SLA Timer, Cases Priority Stream, Task Import, Filters.

---

## ⚙️ Environment Variables Setup (`.env.local`)

Create a `.env.local` file in the project root:

```env
# Supabase PostgreSQL Database Credentials
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Telegram Bot & Mini App Configuration
TELEGRAM_BOT_TOKEN="your_bot_token_from_botfather"
TELEGRAM_BOT_USERNAME="efu_maintenance_bot"
TELEGRAM_MINI_APP_URL="https://your-app-domain.com"
TELEGRAM_WEBHOOK_SECRET="your_webhook_secret_key"

# Application Session Security
SESSION_COOKIE_NAME="efu_session"
JWT_SECRET="your_jwt_secret_key"
```

---

## 🗄️ Database Setup (Supabase PostgreSQL)

Execute the migration scripts in your Supabase SQL Editor in the following order:

1. [`database/schema.sql`](file:///c:/Users/alima/OneDrive/Desktop/New%20folder/iraq-efu-monitor/database/schema.sql) – Core database tables & Indexes
2. [`database/telegram-auth.sql`](file:///c:/Users/alima/OneDrive/Desktop/New%20folder/iraq-efu-monitor/database/telegram-auth.sql) – Telegram linking & Bot state tables
3. [`database/permissions.sql`](file:///c:/Users/alima/OneDrive/Desktop/New%20folder/iraq-efu-monitor/database/permissions.sql) – Permissions matrix & user overrides
4. [`database/audit.sql`](file:///c:/Users/alima/OneDrive/Desktop/New%20folder/iraq-efu-monitor/database/audit.sql) – Security audit logs
5. [`database/seed.sql`](file:///c:/Users/alima/OneDrive/Desktop/New%20folder/iraq-efu-monitor/database/seed.sql) – Seed provinces, region mappings, and sample tasks

---

## 🤖 Telegram Bot & Webhook Configuration

### 1. Register Bot with `@BotFather`
- Send `/newbot` to `@BotFather` on Telegram.
- Save the Bot API Token to `TELEGRAM_BOT_TOKEN`.

### 2. Configure Webhook Endpoint
Set your server webhook URL via cURL or browser:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/bot/webhook"
```

### 3. Bind Telegram Mini App
- In `@BotFather`, select `/newapp` or `/setappurl`.
- Set WebApp URL to `https://your-domain.com`.

---

## 🔐 Role-Based Access Control (RBAC)

| Role | Permissions & Access |
| :--- | :--- |
| **`DEVELOPER`** | Full System Access, Bot Admin Keyboard (`👥 Users`, `🔐 Permissions`, `👷 Teams`, `📍 Regions`, `📊 Stats`, `📋 Audit Log`), Web Admin APIs. |
| **`LEADER`** | Team & Region Case Management, Status Updates, Team Assignment, Field Notes. |
| **`MEMBER`** | Operational Dashboard, Cases Stream, Map View, Field Note Logging, Task Creation. |

---

## 🧪 Local Development & Verification

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run production build
npm run build
```
