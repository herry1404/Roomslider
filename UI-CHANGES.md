# Property and Home UI Changes

Step-by-step record of the property discovery interface update.

| Step | From | To |
| --- | --- | --- |
| 1. Home search | The large home search scrolled away with the hero content. | Keep the large search at the top and reveal a smaller floating search after scrolling. The main navigation stays sticky. |
| 2. Homepage property cards | Opening a grouped Rooms, PG, Hostel, or Flat card led to a plain summary and text-only room links. | Show the property title, location, photo gallery, available room choices, starting prices, and owner profile in a responsive layout. |
| 3. Individual room details | Gallery, room facts, amenities, description, owner contact, and nearby rooms had limited visual hierarchy. | Arrange photos, room facts, host card, amenities, description, location, and nearby listings into clear sections. |
| 4. Amenities | Every amenity was visible at once, making details pages long. | Show the first four amenities and let visitors expand or collapse the complete list. |
| 5. Owner profile | Owner information used a basic icon and label inside the price panel. | Show a host-style profile card with the owner's initial, verified status, and a public profile link. |
| 6. Scrolling detail panel | The sticky price/contact panel stopped at the main details grid, before nearby listings. | Keep the desktop panel sticky through nearby listings; switch to a single-column layout on smaller screens. |
| 7. Responsive layout | Gallery, price panel, and property content did not have one consistent responsive hierarchy. | Adapt the gallery, owner card, pricing, and content columns for desktop, tablet, and mobile widths. |

## Notes

- Public owner data currently has no avatar image, so the host card uses the owner's initial.
- Mobile contact actions continue to use the existing bottom action bar.
- Production build and targeted lint checks passed; visual testing on real browsers/devices remains outstanding.
