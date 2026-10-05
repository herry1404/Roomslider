
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

# Error monitoring

Set `SENTRY_DSN` in the backend environment and `VITE_SENTRY_DSN` in the
frontend build environment to enable Sentry error and performance monitoring.
Both integrations remain disabled when their DSN is unset. The backend uptime
health check is available at `GET /api/health`.
