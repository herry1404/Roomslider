function ThingsToKnow({ room }) {
  const items = [
    room.deposit > 0 && { title: "Deposit", detail: `₹${Number(room.deposit).toLocaleString("en-IN")}` },
    room.furnished != null && { title: "Furnishing", detail: room.furnished ? "Furnished" : "Unfurnished" },
    room.gender && { title: "Gender", detail: room.gender === "Any" ? "All genders" : room.gender },
    room.sharingType && { title: "Sharing", detail: room.sharingType },
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <section className="pd-section">
      <h2>Good to know</h2>
      <ul className="pd-good-to-know">
        {items.map(({ title, detail }) => <li key={title}><strong>{title}</strong><span>{detail}</span></li>)}
      </ul>
    </section>
  );
}

export default ThingsToKnow;
