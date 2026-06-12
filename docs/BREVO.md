# Brevo email setup

JobHunter AI uses **Brevo** for:

1. **Supabase Auth emails** — signup confirmation, magic links, password reset  
2. **App notifications** — high-match jobs, interviews, recruiter replies, weekly reports  

---

## 1. Brevo account

1. Create an account at [brevo.com](https://www.brevo.com)
2. **Senders & IP** → add and verify your sender email (e.g. `noreply@yourdomain.com`)
3. **SMTP & API** → create an **API key** (for the app)
4. **SMTP & API** → copy your **SMTP key** (for Supabase Auth)

---

## 2. App notifications (API)

Add to `.env`:

```env
BREVO_API_KEY=xkeysib-your-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=JobHunter AI
```

The app sends transactional email via `lib/email/brevo.ts` when:

- A high-match job is found  
- An interview is scheduled  
- A recruiter response is recorded  
- The weekly cron report runs  

---

## 3. Supabase Auth emails (SMTP)

Auth emails are sent by **Supabase**, not the Next.js app. Point Supabase at Brevo SMTP:

1. Supabase Dashboard → **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings** → enable **Custom SMTP**
3. Use these values:

| Field | Value |
|-------|--------|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | Your Brevo login email |
| Password | Brevo **SMTP key** (not the API key) |
| Sender email | Same verified sender as `BREVO_SENDER_EMAIL` |
| Sender name | `JobHunter AI` |

4. Save, then test with **Authentication** → **Email Templates** → send test

Optional `.env` reference (for your notes only — Supabase UI holds the live config):

```env
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-login@email.com
BREVO_SMTP_KEY=your-smtp-key
```

---

## 4. Redirect URLs (auth)

Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `http://localhost:3000` (dev) or your production URL  
- **Redirect URLs:** add `http://localhost:3000/auth/callback` and `https://yourdomain.com/auth/callback`

---

## 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| Auth emails not arriving | Verify sender in Brevo; check Supabase SMTP credentials |
| App notifications not sent | Check `BREVO_API_KEY` + `BREVO_SENDER_EMAIL` in `.env` |
| Brevo rejects sender | Complete domain verification in Brevo |
| Emails in spam | Add SPF/DKIM records Brevo provides for your domain |

---

## Free tier

Brevo free plan includes **300 emails/day**, which is enough for development and early users.
