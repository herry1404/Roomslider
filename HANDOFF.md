# RoomSlider Handoff

## Current state

- Branch: `main`
- Latest pulled commit: `215a054` (`Roommate finder + profile edit updates`)
- Remote: `origin/main` was up to date when pulled before these changes.
- All changes listed below are in the working tree and are **not committed or pushed**.
- Do not discard the working tree: it contains the finished UI, notifications, and hourly booking receipt work.

## Completed work

### Explore, navigation, and profile UI

- Removed the Roommates link from the main navigation to give the remaining links more room.
- Moved Roommate Finder out of the Explore “Coming Soon” list and added it as a live service. Signed-in users go to `/roommates`; other visitors go to login.
- Made Edit Profile a full-screen form. Desktop uses a two-column label/input layout with independently scrollable fields; mobile uses a single-column full-height layout and a persistent save area.
- Made the RoomSlider / SUPER ADMIN logo at the top of the admin sidebar link to `/`. It also closes the sidebar after navigation on mobile.
- Added a **Visit Home** button to the admin dashboard.

### Notifications and hourly booking receipts

- Added `web-push` and persistent `PushSubscription` records for user and hourly-manager browser subscriptions.
- Added push subscription/configuration endpoints and a notification broadcast endpoint. Only admins and hourly managers can broadcast; broadcasts create in-app notifications for all user accounts, with browser push sent to users who subscribed.
- Added an admin Notifications page reachable from the admin sidebar and dashboard quick actions.
- Added an hourly-manager broadcast composer, push opt-in button, and in-dashboard notification list.
- Replaced the navbar’s “Coming soon” bell behavior with browser push opt-in. Users can also enable push in the profile Notifications tab.
- Added a service-worker push handler and notification-click navigation.
- After successful hourly-room payment verification, save the paid timestamp and notify the guest and active hourly managers with a receipt link.
- Added an authenticated receipt page/API. A guest can view their own paid receipt; admin and hourly-manager staff can view paid receipts. The receipt includes booking/payment details and a print action.
- Successful checkout now navigates directly to its receipt.
- Added VAPID deployment setup instructions to `README.md`.

## Important files

### New files

- `HANDOFF.md` — this handoff.
- `backend/src/models/PushSubscription.js`
- `backend/src/utils/notificationDelivery.js`
- `backend/src/utils/pushNotifications.js`
- `frontend/public/push-sw.js`
- `frontend/src/components/notifications/EnablePushButton.jsx`
- `frontend/src/components/notifications/BroadcastComposer.jsx`
- `frontend/src/pages/Admin/ManageNotifications.jsx`
- `frontend/src/pages/Rooms/HourlyBookingReceipt.jsx`
- `frontend/src/styles/notifications.css`
- `frontend/src/styles/hourly-receipt.css`

### Updated files

- `README.md`
- Backend: `package.json`, `package-lock.json`, `src/controllers/hourlyBooking.controller.js`, `src/controllers/notification.controller.js`, `src/models/HourlyBooking.model.js`, `src/models/Notification.js`, `src/routes/hourlyBooking.routes.js`, `src/routes/notification.routes.js`
- Frontend: `vite.config.js`, `src/App.jsx`, `src/components/admin/Sidebar.jsx`, `src/components/explore/ComingSoonServices.jsx`, `src/components/layout/Navbar.jsx`, `src/pages/Admin/AdminDashboard.jsx`, `src/pages/HourlyManager/HourlyManagerDashboard.jsx`, `src/pages/Profile/Profile.jsx`, `src/pages/Rooms/HourlyRoomCheckout.jsx`, `src/styles/admin/sidebar.css`, `src/styles/hourly-manager.css`, `src/styles/profile.css`

## Deployment / operational setup still required

Browser push delivery is implemented, but requires the backend deployment environment to define:

```text
VAPID_PUBLIC_KEY=<public-key>
VAPID_PRIVATE_KEY=<private-key>
VAPID_SUBJECT=mailto:<support-email>
```

Generate a pair with:

```sh
cd backend && npx web-push generate-vapid-keys
```

Keep the private key secret. Deploy the frontend over HTTPS and users/managers must explicitly enable browser notifications. Until VAPID is configured, broadcast messages are still saved as in-app notifications, but browser push is unavailable.

## Validation recorded

- Frontend production build: passed; Vite emitted its existing `__dirname` config and large-chunk warnings.
- Backend syntax checks for the changed notification and booking modules/routes: passed.
- Targeted ESLint checks for the new notification UI, routes, and admin components: passed.
- A broader targeted ESLint invocation including existing profile/checkout/hourly-manager pages reported existing rule violations in those files (for example effect/state and hook-order lint rules, plus unused imports/variables). Those pre-existing areas were not broadly refactored as part of this work.
- `git diff --check`: passed.
