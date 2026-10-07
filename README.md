
# Capacitor mobile app

The Vite frontend can be built as native Android and iOS apps with Capacitor.
Location permission is requested when a map needs the device's position, and
notification permission is requested from the signed-in app experience; neither
is requested unconditionally at launch. Android declares coarse/fine location,
notifications, vibration, and internet access. iOS explains foreground-only
location access in its permission prompt. The app does not request background
location, contacts, camera, microphone, or other unrelated permissions.

Build and sync the native projects. Production builds use the RoomSlider API by
default; set `VITE_API_URL` only when building against a different backend:

```sh
cd frontend
npm run cap:sync
npm run cap:open:android
# On macOS with Xcode:
npm run cap:open:ios
```

Android builds require Android Studio/SDK; iOS builds require macOS and Xcode.
The native notification permission is wired, but remote native push delivery
still needs Firebase Cloud Messaging/APNs configuration and backend token
delivery; browser push continues to use the existing VAPID setup below.

# Browser push notifications

Admin announcements and hourly-manager announcements are saved to each user's
in-app notifications. Browser push is delivered to users and managers who have
enabled notifications on an HTTPS site.

Configure these server environment variables with a generated VAPID key pair:

```text
VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_SUBJECT=mailto:<support-email>
```

Generate a key pair with `cd backend && npx web-push generate-vapid-keys`, then
set the public and private keys in the backend deployment environment. Keep the
private key secret. The legacy `VAPID_PUBLIC`, `VAPID_PRIVATE`, and
`VAPID_EMAIL` names remain supported. Without VAPID configuration, in-app
notifications remain available but browser push is unavailable. Admins can send
push notifications from `/admin/push`; audience, optional image, delivery history,
and per-user notification preferences are supported. Legacy `VAPID_PUBLIC`,
`VAPID_PRIVATE`, and `VAPID_EMAIL` names remain supported.

# Admin event alerts

The admin alert service stores in-app alerts and delivers browser push, Telegram,
and optional WhatsApp notifications for student loan requests, maintenance
requests, owner creation, and owner-submitted rooms/properties. Alerts contain
only a short summary and an admin link. Contact alerts use the existing
`ListingEngagement` model/controller when a listing call, WhatsApp, or chat action
is first tracked for a visitor that day; the app does not have a separate
contact-form inquiry model.

Copy the alert variables from `backend/.env.example` into the backend deployment.
Generate VAPID values with `cd backend && npx web-push generate-vapid-keys`.
Open **Admin → Settings → Enable instant alerts on this device** to subscribe
the current admin browser. Push requires HTTPS (except localhost). Android
Capacitor/FCM delivery is intentionally not implemented yet.

For Telegram, message your bot once, then run:

```sh
cd backend && node scripts/telegram-get-chat-id.js
```

Put its printed chat ID in `TELEGRAM_ADMIN_CHAT_ID`.

For WhatsApp, first create and get approval for an English utility template in
Meta Business Manager with exactly two body variables. Suggested template body:

```text
RoomSlider admin alert: {{1}}
Details: {{2}}
Please review this alert in the RoomSlider admin dashboard.
```

The first variable is the alert title; the second is the short summary followed
by a `Review:` admin URL. Set `WHATSAPP_ENABLED=true` only after the approved
template and Cloud API credentials are configured. Set `ADMIN_APP_URL` to the
deployed frontend origin if it is not `https://roomslider.in`.

To exercise the alert channels, first subscribe the admin browser for push and
configure the desired provider credentials, then submit a valid maintenance
request as a tenant. This sends one in-app alert and attempts each configured
external channel. Replace the sample shell variables with your backend URL,
tenant token, and room ID:

```sh
curl -X POST "$API_URL/api/maintenance" \
  -H "Authorization: Bearer $TENANT_TOKEN" \
  -F "roomId=$ROOM_ID" \
  -F "title=Test maintenance alert" \
  -F "description=Manual alert channel test" \
  -F "category=other"
```

Inspect in-app alerts (admin token required):

```sh
curl "$API_URL/api/admin/alerts?unread=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Telegram can also be tested directly, independently of event creation:
replace the shell variables with the Telegram values from your backend config.

```sh
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{\"chat_id\":\"$TELEGRAM_ADMIN_CHAT_ID\",\"text\":\"Test admin alert\\nReview: $ADMIN_APP_URL/admin/dashboard\"}"
```

WhatsApp template delivery can likewise be checked directly:
replace the shell variables with the approved Cloud API values.

```sh
curl -X POST "https://graph.facebook.com/v22.0/$WHATSAPP_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer $WHATSAPP_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"messaging_product\":\"whatsapp\",\"to\":\"$WHATSAPP_ADMIN_NUMBER\",\"type\":\"template\",\"template\":{\"name\":\"$WHATSAPP_TEMPLATE_NAME\",\"language\":{\"code\":\"en\"},\"components\":[{\"type\":\"body\",\"parameters\":[{\"type\":\"text\",\"text\":\"Test admin alert\"},{\"type\":\"text\",\"text\":\"Manual template test. Review: $ADMIN_APP_URL/admin/dashboard\"}]}]}}"
```

Telegram and WhatsApp sends are rate-limited in MongoDB to at most one message
per event type per 30 seconds across backend instances. Set WhatsApp enabled to
the exact string `true`; otherwise it is skipped.

# User-facing Telegram bot

The RoomSlider user bot is a separate Telegram bot from the admin-alert bot above.
It uses `TELEGRAM_USER_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET`; the existing
`TELEGRAM_BOT_TOKEN` and `TELEGRAM_ADMIN_CHAT_ID` continue to serve admin alerts.
The user bot browses public vacant Room, PG, Hostel, and Flat listings, searches
by area/text, and links to the matching public RoomSlider listing page. It does
not expose owner contact information or private tenancy data.

1. In Telegram, open **@BotFather**, run `/newbot`, and follow the prompts. Keep
   the resulting token private. Register commands using `/setcommands`:

   ```text
   start - Start browsing RoomSlider
   help - Show bot help and menu
   rooms - Browse latest public listings
   search - Search listings by area or keyword
   support - Open RoomSlider support page
   ```

2. Generate a random webhook secret:

   ```sh
   openssl rand -hex 32
   ```

3. Add these values to the backend environment in Render. `BACKEND_PUBLIC_URL`
   must be the public HTTPS origin of the backend service, without an API path:

   ```text
   TELEGRAM_USER_BOT_TOKEN=<BotFather token>
   TELEGRAM_WEBHOOK_SECRET=<generated random secret>
   BACKEND_PUBLIC_URL=https://your-backend.onrender.com
   SITE_URL=https://roomslider.in
   ```

4. Deploy/restart the backend, then configure the webhook from the backend
   directory where the environment variables are available:

   ```sh
   cd backend
   node scripts/telegram-set-webhook.js
   node scripts/telegram-set-webhook.js --info
   ```

   `--delete` removes the webhook. These commands never print the bot token.

For local end-to-end testing, expose the local backend over HTTPS with a tunnel
such as ngrok or Cloudflare Tunnel, set `BACKEND_PUBLIC_URL` to that temporary
HTTPS origin, and run the same webhook script. Alternatively, POST a sample
Telegram update to `/api/telegram/webhook` with the
`X-Telegram-Bot-Api-Secret-Token` header set to your local secret. Do not commit
real credentials. The webhook only processes `message` and `callback_query`
updates, acknowledges valid updates quickly, and applies per-IP and per-chat
rate limits. Render's free tier may take time to wake after inactivity, so bot
responses can be delayed by cold starts.

# Error monitoring

Set `SENTRY_DSN` in the backend environment and `VITE_SENTRY_DSN` in the
frontend build environment to enable Sentry error and performance monitoring.
Both integrations remain disabled when their DSN is unset. The backend uptime
health check is available at `GET /api/health`.

# AI Room Finder

Set `GEMINI_API_KEY` in the backend environment to enable AI filter extraction.
`GEMINI_MODEL` is optional and defaults to `gemini-2.5-flash`.
Copy both variables from `backend/.env.example`; without the API key, the
assistant endpoint returns a friendly unavailable response. The frontend calls
`/api/assistant` through the existing `VITE_API_URL`-configured API client.
