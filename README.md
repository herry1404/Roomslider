
# Browser push notifications

Admin announcements and hourly-manager announcements are saved to each user's
in-app notifications. Browser push is delivered to users and managers who have
enabled notifications on an HTTPS site.

Configure these server environment variables with a generated VAPID key pair:

```text
VAPID_PUBLIC=<public-key>
VAPID_PRIVATE=<private-key>
VAPID_EMAIL=<support-email>
```

Generate a key pair with `cd backend && npx web-push generate-vapid-keys`, then
set the public and private keys in the backend deployment environment. Keep the
private key secret. The legacy `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and
`VAPID_SUBJECT` names remain supported. Without VAPID configuration, in-app
notifications remain available but browser push is unavailable. Admins can send
push notifications from `/admin/push`; audience, optional image, delivery history,
and per-user notification preferences are supported.

# Error monitoring

Set `SENTRY_DSN` in the backend environment and `VITE_SENTRY_DSN` in the
frontend build environment to enable Sentry error and performance monitoring.
Both integrations remain disabled when their DSN is unset. The backend uptime
health check is available at `GET /api/health`.
