
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
private key secret. Without VAPID configuration, announcements still appear in
the in-app notification list but browser push is unavailable.
