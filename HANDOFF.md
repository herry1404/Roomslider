# RoomSlider Handoff

## Current state

- Branch: `main`
- Previous completed work is on `origin/main` in commit `d700ce6` (`Add push notifications and hourly booking receipts`).
- The laundry, villa, and roommate privacy/chat changes in this handoff are in the working tree and are **not committed or pushed**.
- Do not discard the working tree: it contains the new laundry directory, villa reservations, roommate profile/chat updates, and homepage/admin integrations.

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
- Replaced the navbar’s “Coming soon” bell behavior with browser push opt-in. The large opt-in button was removed from the profile Notifications tab; notification history remains there.
- Added a service-worker push handler and notification-click navigation.
- After successful hourly-room payment verification, save the paid timestamp and notify the guest and active hourly managers with a receipt link.
- Added an authenticated receipt page/API. A guest can view their own paid receipt; admin and hourly-manager staff can view paid receipts. The receipt includes booking/payment details and a print action.
- Successful checkout now navigates directly to its receipt.
- Added VAPID deployment setup instructions to `README.md`.

### Public laundry directory

- Replaced owner/building-based laundry matching with public, location-based laundry profiles.
- Admins can manage vendor contact/WhatsApp details, address, map coordinates, visibility, and each vendor's clothing catalog and prices.
- Added public laundry listing and vendor-detail pages. The listing requests browser location when available and otherwise shows all public vendors.
- Customers can select item quantities, see an estimated total, optionally add a pickup address, and send the order details to the vendor through WhatsApp. Final order and price confirmation remains with the vendor.
- The tenant dashboard now links to the public laundry directory instead of showing its former building-specific laundry modal.
- Existing vendor records without coordinates/catalog need to be edited and completed before they can be found nearby or accept a priced WhatsApp order.

### Villa discovery and reservations

- Added villa records with photos, address/map location, capacity/amenities, and separate nightly-stay and event/day rates.
- Added public villa discovery/detail pages and a Villas homepage section after Hourly Rooms. Homepage sections can be reordered or hidden from the existing layout manager; missing built-in sections are added to existing layouts.
- Added an admin Villas & Reservations page to manage listings and review reservations.
- Added date availability checks and server-calculated Razorpay orders for stay/event reservations. A short per-villa lock and pending payment hold protect overlapping date ranges.
- Payment verification checks the Razorpay signature and fetched payment's order, amount, currency, and captured status before confirming the reservation.
- Villa reservation history appears in Profile Activity. Admins can mark ended confirmed bookings complete; villas with reservation history are hidden rather than deleted to preserve booking records.
- If payment is captured after a hold expires or a booking conflict occurs, the guest must contact support for manual follow-up/refund; automated refunds are not implemented.

### Roommate profiles and private chat

- Roommate Finder users can open an active roommate profile on its own page and see its preferences plus available saved rooms. The endpoint only returns curated room/profile fields; email and phone are excluded.
- Accepted matches can chat through RoomSlider. Chat history and sends are allowed only while an accepted connection exists and neither user has blocked the other.
- Removed phone/email from the connections API and UI; accepted matches open a dedicated, full-height chat page instead of an inline panel.
- Added `backend/src/models/roommateMessage.model.js`, authenticated profile/chat endpoints in `roommate.routes.js` and `roommate.controller.js`, and dedicated profile/chat screens under `frontend/src/pages/Roommates/`.
- Chat currently refreshes messages by polling every five seconds; real-time socket delivery and unread push notifications are not implemented.

### Property discovery and detail UI

- Updated the grouped property page used by homepage Rooms, PG, Hostel, and Flat cards, along with individual room detail pages, to use a cleaner responsive layout.
- Amenities show four items initially with an accessible control to expand or collapse the full list.
- Reworked the owner area into a host-style profile card with verified status and a public owner profile link. Owner records do not currently provide an avatar, so the card uses the owner's initial.
- Kept the desktop price/contact panel sticky through property details and nearby listings; smaller screens use a single-column layout and the existing bottom contact bar.
- Added a compact floating search on the home page after scrolling; the large search stays prominent at the top and the main navigation remains sticky.
- Simplified Explore service names and actions (for example, Food, Laundry, Cleaning, and Explore).
- Added `UI-CHANGES.md` with a step-by-step before/after record of the interface changes.

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
- `backend/src/models/Villa.js`, `backend/src/models/VillaBooking.js`
- `backend/src/controllers/villa.controller.js`, `backend/src/controllers/villaBooking.controller.js`
- `backend/src/routes/villa.routes.js`, `backend/src/routes/villaBooking.routes.js`
- `frontend/src/pages/Laundry/LaundryList.jsx`, `LaundryDetail.jsx`
- `frontend/src/pages/Villas/VillaList.jsx`, `VillaDetail.jsx`
- `frontend/src/pages/Admin/ManageVillas.jsx`
- `frontend/src/components/home/HomeRentalSection.jsx`, `VillaCard.jsx`
- `frontend/src/styles/laundry.css`, `villas.css`
- `backend/src/models/roommateMessage.model.js`
- `frontend/src/pages/Roommates/RoommateChat.jsx`, `RoommateChatPage.jsx`, `RoommateProfilePage.jsx`
- `frontend/src/styles/roommate-chat.css`
- `UI-CHANGES.md` — property/home interface before-and-after log.

### Updated files

- `README.md`
- Backend: `package.json`, `package-lock.json`, `src/controllers/hourlyBooking.controller.js`, `src/controllers/notification.controller.js`, `src/controllers/homeSection.controller.js`, `src/controllers/laundryVendor.controller.js`, `src/controllers/roommate.controller.js`, `src/models/HourlyBooking.model.js`, `src/models/Notification.js`, `src/models/homeSection.model.js`, `src/models/laundryVendor.model.js`, `src/routes/hourlyBooking.routes.js`, `src/routes/notification.routes.js`, `src/routes/laundryVendor.routes.js`, `src/routes/roommate.routes.js`, `src/app.js`
- Frontend: `vite.config.js`, `src/App.jsx`, `src/components/admin/Sidebar.jsx`, `src/components/explore/ComingSoonServices.jsx`, `src/components/home/ExploreTeaser.jsx`, `src/components/layout/Navbar.jsx`, `src/pages/Admin/AdminDashboard.jsx`, `src/pages/Admin/ManageHomeLayout.jsx`, `src/pages/Admin/ManageLaundryVendors.jsx`, `src/pages/HourlyManager/HourlyManagerDashboard.jsx`, `src/pages/Home/Home.jsx`, `src/pages/Profile/Profile.jsx`, `src/pages/Rooms/HourlyRoomCheckout.jsx`, `src/pages/Roommates/RoommateFinder.jsx`, `src/pages/Tenant/TenantDashboard.jsx`, `src/styles/admin/sidebar.css`, `src/styles/hourly-manager.css`, `src/styles/profile.css`

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

### Current laundry/villa changes

- Frontend production build: passed; Vite emitted its existing config and large-chunk warnings.
- Backend `node --check` for the added/updated laundry, villa, booking, home-section, and app files: passed.
- Targeted ESLint for the new laundry/villa screens and home components: passed. A wider changed-file lint run still reports existing `react-hooks/set-state-in-effect` issues in `ManageHomeLayout.jsx`, `Profile.jsx`, and `TenantDashboard.jsx`; Profile also has two unused catch variables.
- `git diff --check`: passed.
- Manual/live MongoDB, Cloudinary upload, Razorpay checkout/capture, WhatsApp handoff, mobile layout, and geolocation testing remain outstanding.

### Current roommate profile/chat changes

- Frontend production build: passed; Vite emitted its existing large-chunk warning.
- Backend syntax checks for roommate controller, routes, and message model: passed.
- Targeted ESLint for the Roommate Finder, profile page, and private chat UI: passed.
- Manual multi-account acceptance, block, saved-room visibility, and chat authorization tests remain outstanding.

### Current property UI changes

- Frontend production build: passed; Vite emitted its existing `__dirname` config and large-chunk warnings.
- Targeted ESLint for the property detail page, grouped property page, and home search: passed.
- `git diff --check`: passed.
- Browser/device visual checks on desktop, tablet, and mobile remain outstanding.
