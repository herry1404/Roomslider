# RoomSlider Handoff

## Current state

- Branch: `main`
- HEAD: `ea136a4` (`Services: one card per worker, price list with quantity, service requests, study support and rent agreement categories, seed scripts`), tracking `origin/main`.
- Recent history: `4fd3da3` (public slug URLs, mess reviews, address helper), `2613f46` (student loan workflow).
- The worktree has uncommitted notification-center changes across backend and frontend, including pre-existing notification API/schema/SSE work. No commit was created.

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

### Furniture and vehicle photo upload fix

- Root cause: the shared Axios instance set `Content-Type: application/json` for every request. Axios serialized browser `FormData` as JSON under that header, so Multer/Cloudinary did not receive uploaded files on furniture or vehicle create/edit requests.
- The request interceptor now removes `Content-Type` whenever request data is `FormData`, allowing the browser/Axios adapter to generate multipart content type and boundary. Explicit multipart headers were removed from other FormData callers as well.
- Furniture edit keeps submitted existing `images`, appends new uploads, and can remove selected existing images by submitting the remaining list. Vehicle edit follows the same keep/remove/add pattern with `photos`.
- Furniture and vehicle schema/API/public UI paths already expose their respective image arrays; no backend schema/controller changes were needed for the root fix.
- Verified locally that the interceptor leaves `FormData` intact and Axios sends a multipart body with an automatically generated boundary. An isolated HTTP PUT + public GET test passed for both controllers using simulated Cloudinary URLs; it also verified keeping and removing existing photo URLs. Frontend build, focused lint, backend syntax checks, and `git diff --check` passed.
- Live authenticated Cloudinary upload + database GET remains untested: the running local API returned 404 for `/api/vehicles`, and no admin token was available. Avoided writing test data to configured persistent database/cloud storage. Browser end-to-end checks for furniture/vehicle add/edit and photo removal also remain outstanding.

### Service catalogue and service requests

- Extended the generic `ServiceProvider` categories with `study-support` and `rent-agreement`, plus optional `subType`. Study support supports library, tutor, printing, and exam-help types; rent agreement supports agreement and police-verification types.
- The existing `ServiceBooking` model now handles service requests for all categories. It records the provider, chosen current price-list items, server-calculated estimate, logged-in customer name/phone, structured address/location, preferred date/time, note, category data, and lifecycle status: `new`, `contacted`, `confirmed`, `completed`, or `cancelled`.
- Requests are posted to `/api/service-bookings`, require login, and use the logged-in account’s name and phone. `/mine` is the current customer history endpoint; legacy `/my` remains available. Admins can filter all requests by category/status, update their status, and fetch the `new` request count for the sidebar badge.
- Provider price-list items are revalidated server-side before saving; submitted client prices are not trusted. The request total is calculated from the provider’s current list.
- Rent-agreement requests capture owner/tenant names, rent, deposit, and start date. Their optional ID photo reuses the authenticated Cloudinary upload path. It is omitted from all public/customer responses; the admin listing creates a signed URL only for admins.
- New service requests create an in-app/push notification for all admins when notification infrastructure is available. Notification failures are logged without blocking the already-saved request.
- Public service cards now include provider image/icon, grouped monthly/one-time prices, Request Service, Call, and WhatsApp actions. Request Service opens a mobile bottom sheet or desktop modal with service selection, Indore address/location capture, date/time preference, optional note, and a post-save WhatsApp handoff containing the request ID and map link.
- The Profile Activity tab shows service requests, while `/admin/service-requests` provides a searchable admin table with customer contact, selected items, totals, map links, preferred slot, statuses, rent-agreement data, and secure ID-photo access.
- Explore now treats Study Support and Rent Agreement as live service links. The two matching home teaser tiles remain in the existing mobile-hidden extra-tile group.
- Added idempotent seed scripts for Cleaning and Study Support/Rent Agreement. Both use `updateOne` plus `upsert` and require `MONGODB_URI`.

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
- `backend/scripts/seedCleaning.js`
- `backend/scripts/seedStudySupport.js`
- `frontend/src/pages/Admin/ServiceRequests.jsx`

### Updated files

- `README.md`
- Backend: `package.json`, `package-lock.json`, `src/controllers/hourlyBooking.controller.js`, `src/controllers/notification.controller.js`, `src/controllers/homeSection.controller.js`, `src/controllers/laundryVendor.controller.js`, `src/controllers/roommate.controller.js`, `src/models/HourlyBooking.model.js`, `src/models/Notification.js`, `src/models/homeSection.model.js`, `src/models/laundryVendor.model.js`, `src/routes/hourlyBooking.routes.js`, `src/routes/notification.routes.js`, `src/routes/laundryVendor.routes.js`, `src/routes/roommate.routes.js`, `src/app.js`
- Frontend: `vite.config.js`, `src/App.jsx`, `src/components/admin/Sidebar.jsx`, `src/components/explore/ComingSoonServices.jsx`, `src/components/home/ExploreTeaser.jsx`, `src/components/layout/Navbar.jsx`, `src/pages/Admin/AdminDashboard.jsx`, `src/pages/Admin/ManageHomeLayout.jsx`, `src/pages/Admin/ManageLaundryVendors.jsx`, `src/pages/HourlyManager/HourlyManagerDashboard.jsx`, `src/pages/Home/Home.jsx`, `src/pages/Profile/Profile.jsx`, `src/pages/Rooms/HourlyRoomCheckout.jsx`, `src/pages/Roommates/RoommateFinder.jsx`, `src/pages/Tenant/TenantDashboard.jsx`, `src/styles/admin/sidebar.css`, `src/styles/hourly-manager.css`, `src/styles/profile.css`
- Service request work: Backend `package.json`, `src/models/service.model.js`, `src/models/serviceBooking.model.js`, `src/controllers/service.controller.js`, `src/controllers/serviceBooking.controller.js`, `src/routes/serviceBooking.routes.js`; Frontend `src/App.jsx`, `src/components/admin/Sidebar.jsx`, `src/components/explore/ComingSoonServices.jsx`, `src/components/home/ExploreTeaser.jsx`, `src/pages/Admin/AddService.jsx`, `src/pages/Admin/ManageServices.jsx`, `src/pages/Admin/ServiceRequests.jsx`, `src/pages/Profile/Profile.jsx`, `src/pages/Services/ServiceList.jsx`, `src/styles/services.css`

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

### Current service catalogue and request-flow changes

- Frontend production build: passed with Node 24.19.0; Vite emitted its existing `__dirname` config and large-chunk warnings.
- Backend `node --check` passed for the updated service model/controller, service booking model/controller/routes, and both seed scripts.
- `git diff --check`: passed.
- Manual browser validation remains outstanding for login return-to-request, geolocation permission outcomes, service submission, admin status updates, notification delivery, WhatsApp handoff, and authenticated Cloudinary ID-photo upload/viewing.

Run seeds from `backend/`:

```sh
npm run seed:cleaning
npm run seed:study
```

### 4 Oct 2026 — in-app notification system

- Completed the typed, paginated notification center with unread/read/delete actions, SSE stream-token delivery, client reconnect backoff and 30-second unread-count polling fallback. Existing broadcast, push subscription, and hourly-manager notification paths remain supported; Owner recipients are also supported.
- Added roommate interest/acceptance/chat, service booking status, furniture/vehicle request and status, vacate notice, rent/hourly/villa payment, student-loan status, and maintenance request/status notifications. Notification copy avoids contact details and full addresses. Captured payments that cannot confirm an hourly/villa booking alert the payer and staff for follow-up.
- Added the shared frontend notification context, responsive navbar bell/dropdown, `/notifications` filters and actions, browser-alert opt-in in the page header, and a latest-five Profile view with a View all link.

**Tested**

- `cd frontend && npm run build` passed; Vite reported its existing `__dirname` configuration and large-chunk warnings.
- `node --check` passed for all changed backend JavaScript files.
- Targeted ESLint passed for the notification frontend changes; `git diff --check` passed.

**Pending**

- Manual browser/API acceptance for notifications, read/delete/pagination, SSE reconnect/logout, 30-second fallback, mobile layout/dark mode, and browser push.
- Multi-account event tests for roommate, request/status, vacate, payment, loan, and maintenance notifications; live Razorpay/database delivery is not verified.
- Vacate notice delivery requires the legacy room record to have `owner` and `currentTenantUser` references. If either is absent, that recipient cannot be notified.
