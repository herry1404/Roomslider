# RoomSlider Handoff

## Current state

- Branch: `main`
- Nine-step RoomSlider task status (5 Oct 2026): Steps 1–6 were already present; Step 7 was committed as `5df2b84` (`Owner and admin analytics`) and Step 8 as `ff196f4` (`Performance and monitoring`). Step 9 (Language and Settings) is paused at the user's request and is not complete.
- Step 9 has preliminary, uncommitted work in `frontend/package.json`, `frontend/package-lock.json`, `backend/src/models/user.model.js`, `backend/src/controllers/auth.controller.js`, and `backend/src/middleware/auth.middleware.js`. This adds `i18next`/`react-i18next`, initial user-preference fields, and token-version session scaffolding; it has not been validated as a complete feature.
- No translation initialization/locales, translated UI, settings UI, preference/account-management endpoints, or Step 9 validation/commit have been completed. `NOTES.md` for the original nine-step request is also still outstanding until the work is resumed or finalized.
- The current worktree is intentionally dirty. Preserve the existing Step 9 edits and this handoff update; inspect them before continuing.
- Local HEAD: `ff196f4` (Performance and monitoring), eight commits ahead of `origin/main`; `origin/main` remains at `96a4b26` (Social Work, Donate Old Things, Blood Requests, sitemap and SEO updates). Earlier commits include `d2114b2` (handoff update), `b61dbb9` (Roommate Finder restructure), and `2e99c8c` (notifications).
- Social Work, donation, blood-request and related SEO/sitemap changes are committed and pushed. Vercel is serving the updated frontend; the Render Social Work API and production sitemap both returned HTTP 200 during smoke checks.
- Latest frontend production build, backend JavaScript syntax checks, push-worker syntax check, and `git diff --check` passed. Build output contains existing Vite `__dirname` and large-chunk warnings.
- The worktree was clean after the `96a4b26` feature commit, before later local commits and the current uncommitted Step 9 preparation. Check `git status --short` before continuing.
- Social Work listings have not been seeded; admin must publish verified listings. Live database-backed workflows, Cloudinary uploads, VAPID/browser push, and manual requester/donor/admin scenarios remain unverified.

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

### 4 Oct 2026 — Roommate Finder restructure

- Split roommate discovery, own profile, requests, and accepted-connection messages into `/roommates`, `/roommates/profile`, `/roommates/requests`, and `/roommates/messages`, with shared mobile-first tabs and live pending/unread badges. Public profiles remain at `/roommates/profile/:userId`; private chat keeps its existing polling page.
- Discovery now keeps matching/scoring server-side and provides city, area, budget, and sharing filters. Moved roommate preferences out of the general Edit Profile form; added a compact private profile summary, edit form, and discovery visibility toggle.
- Added authenticated request filtering/cancellation, accepted non-blocked conversation summaries, conversation read, and roommate badge APIs. Message `isRead` is backward-compatible with `readAt`; chat entry marks both messages and matching unread message notifications read. Accept/decline marks the associated interest notification read.
- Aligned roommate notification links with Requests, Messages, and the sender's chat. The existing notification stream/polling context refreshes roommate badges and routes older roommate notifications to the new destinations. Account phone/email are not included in roommate endpoint projections.

**Tested**

- `cd frontend && npm run build` passed; existing Vite `__dirname` and large-chunk warnings remain.
- Targeted ESLint passed for the changed roommate, profile, notification, and routing frontend files.
- `node --check` passed for the changed roommate controller, routes, and message model; `git diff --check` passed.

**Pending**

- Manual two-account flow: create profiles; send interest and verify notification/request badge; accept; message; verify inbox unread count; open chat and verify read state; block and confirm requests/conversations disappear.
- Manual responsive visual check at 360px and dark mode; live SSE/polling behavior against an authenticated backend/database was not exercised.

### 4 Oct 2026 - Phase A: Social Work directory

NEXT: Phase B

- Added SocialPlace and SocialSuggestion models, public category/list/detail endpoints with area, subtype, search, today/open-now/upcoming/nearby filters, validated admin CRUD, and authenticated suggestions. Admin approval creates an unpublished, unverified draft; no helpline/contact data was seeded.
- Added Social Work category, listing, detail and suggestion flows, schedule/event details, hours/verified metadata, maps/call links, blood-category emergency notice, and published-data disclaimers. Added admin listing/suggestion pages and Explore/sidebar links.
- `cd frontend && npm run build`: passed; existing Vite configuration/chunk-size warnings remain.
- `node --check` passed for all five changed backend JavaScript files; `git diff --check` passed.
- Pending: admin/database integration, geospatial index and nearby queries against MongoDB, category filters/open-hours calculations, suggestion moderation, map/call links, 360px/dark-mode/browser accessibility review, and confirming listing content/timings with organizers.

### 4 Oct 2026 - Phase B: Donate Old Things

NEXT: Phase C

- Added a private DonationRequest workflow with authenticated pickup submission, account-linked donor identity, up to four Cloudinary photos, pickup address/location, date/time, own-request status and cancellation. Admin notifications go to user accounts with the admin role; donor notifications cover status and catalog transitions.
- Integrated donations into the admin Service Requests filter with donor contact, pickup information, photos, status updates, a Mark collected action, and conversion to unpublished donated FurnitureItem drafts with an admin-set monthly rent.
- Added `isDonated` and admin-only `donatedBy` furniture fields, public donated filtering/badge without donor metadata, a Donated filter chip, `/donate` with exclusions and private request tracking, and Explore tiles.
- Chose a separate DonationRequest model rather than overloading ServiceBooking: pickup addresses/photos and the collection/listing lifecycle are distinct from provider service bookings.
- `cd frontend && npm run build`: passed; existing Vite configuration/chunk-size warnings remain.
- `node --check` passed for all changed backend JavaScript files through Phase B; `git diff --check` passed.
- Pending: authenticated upload/cloud configuration, donor/admin notification delivery, pickup/status/cancel workflows, collected-to-catalog flow, draft/public furniture checks, account phone availability, mobile/dark-mode/browser checks.

### 4 Oct 2026 - Phase C: Blood group and Blood Request flow

NEXT: Planned (later) - Updates section

- Added optional blood group, donor consent timestamp, availability and last-donation date to the account profile. Donor matching requires consent, availability, age 18+, a compatible freshness window, and an active/unblocked account. Turning off consent immediately removes the donor from future matches.
- Added authenticated BloodRequest create/mine/close/detail/help/unavailable APIs, the three-per-day limit, request expiry checks, approval/rejection, recipient estimates, compatible-group and area broadcasts, fulfillment/close actions, admin-only request blocking, and admin-only helper details.
- Contact details are disclosed only after a notified donor taps “I can help” (or to an admin); requester views show helper counts only. Blood notifications exclude patient/contact details, exact-group alerts use high priority and a push action, and notification-center items offer a quick “I can help” action.
- Added `/blood`, `/blood/request`, `/blood/requests/:id`, `/admin/blood-requests`, the admin pending badge, profile donor controls, Explore entry points, and request/profile disclaimers.
- Projection review confirmed blood fields are not included in roommate, chat, owner-public, or other-user projections. The account-owner endpoint and admin-only views are the intended access surfaces; `bloodRequestsBlocked` is omitted from the owner profile response.
- The public furniture ID endpoint now hides inactive donation drafts; donated donor metadata remains admin-only, and donor-submitted descriptions are not copied to public catalog items.
- Final frontend build, backend JavaScript syntax checks, push-worker syntax check, and `git diff --check` passed after the privacy-hardening edits.
- Pending: three-account requester/donor/admin end-to-end verification, MongoDB authorization and expiry checks, real Cloudinary uploads, VAPID/browser push action behavior, donor matching and all compatibility audiences, profile consent/revocation, 360px/dark-mode visual review, plus organizer validation for Social Work listings. No automated test files were found in the repository.
- At the initial Phase C handoff, HEAD was `d2114b2` and the feature work was uncommitted. It was subsequently committed and pushed as `96a4b26`.

### Planned (later) - Updates section

NEXT: Updates section (after Profile page improvements)

- Order of work: 1) Profile page improvements, 2) Updates section.
- Goal: Updates page with college news/events, Indore events and timetable alerts, personalised by the college, course, subject and year saved in the user's profile.
- Profile prerequisite: add college, course, subject and year dropdown fields to the user model, profile edit form and its validation.
- Sources: admin saves a source URL per college (and Indore events sources); backend scraper job fetches pages, skips unchanged content using a hash, and sends only changed text to an AI call that returns structured JSON items (title, type, date, college, subject, year).
- Review: AI-created items are saved as pending; admin approves/rejects/edits before they are published. Admin can also add items manually and upload timetable PDF/image.
- Timetable: first version is admin upload plus a "new timetable" notification with link; automatic PDF parsing is later.
- Delivery: published items go to a For You feed filtered by profile, and matching users get in-app/push notifications through the existing notification system.
- Rules: respect robots.txt, public pages only, show source link on every item, API keys only in env vars, external cron endpoint (Render free tier may sleep). Update sitemap and page metadata for published public items; exclude private or personalised routes from indexing.
- First version: one college plus Indore events only.
- Pending decision: which college to start with.
- Not started.

### 4 Oct 2026 - Deployment and SEO follow-up

- Added Social Work landing, active category, and active listing URLs to the dynamic sitemap. The existing `/sitemap.xml` frontend rewrite and `robots.txt` sitemap declaration remain in place.
- Added page titles, descriptions, and canonical URLs for Social Work pages. Donation and blood-request entry pages are marked `noindex, nofollow`; personalised/private flows are not added to the sitemap.
- Confirmed the pushed commit is on `origin/main`, the live frontend serves the updated bundle, `/api/social` responds successfully, and the deployed sitemap includes `/social-work`.
- Changes were included in commit `96a4b26` and pushed to `main`. Automated production build and syntax/format checks passed; real listing data and end-to-end account flows remain pending.

### 5 Oct 2026 - Nine-step task handoff

- Steps 7 and 8 for the requested feature sequence are committed as `5df2b84` and `ff196f4`. Step 9 is explicitly deferred; do not continue implementing it until the user resumes the work.
- Uncommitted Step 9 preparation currently includes the two frontend i18n dependencies, user-model preference fields (`privacySettings`, `themePreference`, `emergencyContact`, and `savedAddresses`), and token-version checks intended to support logging out all sessions.
- These changes are only scaffolding. No new Step 9 API endpoint or environment key has been added, and the code has not been validated or committed. The token-version session behavior should be reviewed as part of implementation before relying on it.
- When resumed, continue from the current uncommitted changes rather than discarding them; implement the agreed remaining language/settings scope, run relevant validation, and create the requested final `NOTES.md`. The user may also narrow or change the scope before work resumes.
