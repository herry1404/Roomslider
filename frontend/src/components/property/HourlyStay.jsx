import { Clock3 } from "lucide-react";

function HourlyStay({ room }) {
  if (!room.hourlyEnabled) return null;
  const slabs = (room.hourlySlabs || [])
    .filter((slab) => Number(slab.hours) > 0 && Number(slab.price) > 0)
    .sort((first, second) => Number(first.hours) - Number(second.hours));

  return (
    <section className="pd-section pd-hourly-stay">
      <h2>Hourly stay</h2>
      {slabs.length > 0 && (
        <ul className="pd-hourly-slabs">
          {slabs.map((slab) => (
            <li key={slab.hours}>
              <Clock3 size={17} aria-hidden="true" />
              <span>{slab.hours} hrs</span>
              <strong>₹{Number(slab.price).toLocaleString("en-IN")}</strong>
            </li>
          ))}
        </ul>
      )}
      {room.extraHourPrice > 0 && (
        <p className="pd-extra-hour-price">Extra hour: <strong>₹{Number(room.extraHourPrice).toLocaleString("en-IN")}</strong></p>
      )}
      {room.checkIn24x7 && <p className="pd-checkin-tag">24x7 check-in available</p>}
    </section>
  );
}

export default HourlyStay;
