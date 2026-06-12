# Telegram setup

JobHunter AI can send job alerts and reports to Telegram. Users connect their account from **Dashboard → Settings → Notifications** — no manual chat ID entry.

---

## What you get

When Telegram is connected and enabled, users receive:

| Notification | When |
|--------------|------|
| High match jobs | Score ≥ threshold (default 80) |
| Interview scheduled | Interview added to pipeline |
| Recruiter responses | Outreach / reply events |
| Weekly report | Monday (via cron) |

Alerts are also stored in-app and sent by email (if Brevo is configured).

---

## 1. Create a Telegram bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Send `/newbot`.
3. Choose a **display name** (e.g. `JobHunter AI Alerts`).
4. Choose a **username** — must end in `bot` (e.g. `JobHunterAI_bot`). Save this username.
5. BotFather replies with a **bot token** like:
   ```
   123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   Keep this secret — anyone with it can control your bot.

Optional BotFather commands:

| Command | Purpose |
|---------|---------|
| `/setdescription` | Short description shown before users tap Start |
| `/setabouttext` | About text in bot profile |
| `/setuserpic` | Bot avatar |

---

## 2. Environment variables

Add to `.env` locally and in **Vercel → Project → Settings → Environment Variables**:

```env
# Required — from BotFather
TELEGRAM_BOT_TOKEN=123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Required for one-click "Open in Telegram" links in Settings
TELEGRAM_BOT_USERNAME=JobHunterAI_bot

# Recommended in production — validates webhook requests
TELEGRAM_WEBHOOK_SECRET=your-long-random-string
```

Generate a webhook secret:

```bash
# macOS / Linux
openssl rand -hex 32

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot API token from BotFather |
| `TELEGRAM_BOT_USERNAME` | Strongly recommended | Username without `@` — enables deep links |
| `TELEGRAM_WEBHOOK_SECRET` | Recommended (prod) | Must match the secret passed to `setWebhook` |

Restart the dev server after changing `.env`.

---

## 3. Database migration

If your database was created before Telegram linking was added, run in **Supabase → SQL Editor**:

```sql
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS telegram_link_code TEXT;
ALTER TABLE notification_settings ADD COLUMN IF NOT EXISTS telegram_link_expires_at TIMESTAMPTZ;
```

New installs: these columns are included in `lib/db/supabase-init.sql`.

---

## 4. Register the webhook

Telegram must know where to POST updates when users message your bot. The app exposes:

```
POST https://YOUR_DOMAIN/api/telegram/webhook
```

Replace `YOUR_DOMAIN` with your production URL (e.g. `job-hunter.vercel.app`).

### Production (Vercel)

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -G \
  --data-urlencode "url=https://YOUR_DOMAIN/api/telegram/webhook" \
  --data-urlencode "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

Verify:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

Expected:

- `"url": "https://YOUR_DOMAIN/api/telegram/webhook"`
- `"pending_update_count": 0` (or low)

### Local development

Telegram cannot reach `localhost`. Use a tunnel:

1. Install [ngrok](https://ngrok.com/) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/).
2. Start your app: `npm run dev`
3. Expose port 3000:
   ```bash
   ngrok http 3000
   ```
4. Register the ngrok HTTPS URL:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
     -G \
     --data-urlencode "url=https://abcd-1234.ngrok-free.app/api/telegram/webhook" \
     --data-urlencode "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
   ```

Re-run `setWebhook` with your production URL before going live.

### Remove webhook (debugging)

```bash
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
```

---

## 5. Connect as a user

1. Deploy (or run locally with ngrok + webhook registered).
2. Log in to JobHunter AI.
3. Go to **Dashboard → Settings → Notifications**.
4. Under **Telegram**, click **Connect Telegram**.
5. Click **Open in Telegram** (or message your bot with `/start YOUR_CODE`).
6. In Telegram, tap **Start**.
7. The bot replies with a personalized welcome, e.g. *Welcome, Alex!*
8. Settings should show **Connected** within a few seconds.
9. Click **Send test** to confirm delivery.
10. Enable **Telegram notifications** toggle.

Link codes expire after **15 minutes**. Generate a new link if needed.

### Disconnect

**Settings → Notifications → Disconnect**, or disable the Telegram notifications toggle.

---

## 6. How linking works (technical)

```
User (Settings)                Your app                         Telegram
      |                            |                                |
      |-- Connect Telegram ------->|                                |
      |                            |-- saves link code (15 min) --->|
      |<-- deep link t.me/bot?start=code                             |
      |----------------------------|-- user taps Start ------------->|
      |                            |<-- POST /api/telegram/webhook -|
      |                            |-- saves chat_id for user       |
      |                            |-- sendMessage "Connected!" ---->|
      |<-- UI polls, shows Connected                                  |
```

- **Link code** → stored in `notification_settings.telegram_link_code`
- **Chat ID** → stored in `notification_settings.telegram_chat_id` after `/start CODE`
- **Outbound alerts** → `sendMessage` via Bot API using `TELEGRAM_BOT_TOKEN`

---

## 7. Troubleshooting

### Settings shows “Telegram is not configured”

- `TELEGRAM_BOT_TOKEN` is missing or empty in the deployment environment.
- Redeploy after adding env vars.

### “Open in Telegram” button missing

- Set `TELEGRAM_BOT_USERNAME` (without `@`).

### Connect link works but account never shows Connected

| Check | Fix |
|-------|-----|
| Webhook not registered | Run `getWebhookInfo` — URL must point to your app |
| Wrong domain | `setWebhook` URL must match deployed app |
| Local dev without tunnel | Use ngrok + register tunnel URL |
| `TELEGRAM_WEBHOOK_SECRET` mismatch | Same value in Vercel env and `setWebhook` call |
| Link expired | Generate a new link (15 min TTL) |
| DB columns missing | Run migration SQL in section 3 |

### Send test fails

- Confirm `TELEGRAM_BOT_TOKEN` is valid:
  ```bash
  curl "https://api.telegram.org/bot<TOKEN>/getMe"
  ```
- User must have started the bot at least once (chat exists).

### No job alerts on Telegram

- Telegram connected **and** toggle enabled in Settings.
- Job must meet **high match threshold** (default 80).
- Cron must run (`search_jobs`) — see [CRON.md](./CRON.md).
- Check `ai_usage_logs` / agent runs in admin dashboard.

### Webhook returns 401

- `TELEGRAM_WEBHOOK_SECRET` is set in env but does not match `secret_token` in `setWebhook`.

### Inspect webhook health

```bash
# App endpoint (no auth)
curl https://YOUR_DOMAIN/api/telegram/webhook

# Telegram side
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## 8. Security notes

- Never commit `TELEGRAM_BOT_TOKEN` to git.
- Always use `TELEGRAM_WEBHOOK_SECRET` in production.
- Link codes are single-use, user-scoped, and expire in 15 minutes.
- Only your server should call the Bot API with the token.

---

## Quick reference

| Item | Value |
|------|--------|
| User settings | `/dashboard/settings` |
| Webhook route | `POST /api/telegram/webhook` |
| Bot API docs | [core.telegram.org/bots/api](https://core.telegram.org/bots/api) |
| BotFather | [@BotFather](https://t.me/BotFather) |
| `/start` (connected) | Welcome back with your profile name |
| `/start` (not connected) | Hi + Telegram first name + connect instructions |
