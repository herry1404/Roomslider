import { Bath, BedDouble, Sofa, Users } from "lucide-react";

function Highlights({ room }) {
  const highlights = [
    room.sharingType && {
      icon: Users,
      title: `${room.sharingType} sharing`,
      detail: "Room sharing type",
    },
    room.gender && {
      icon: Users,
      title: room.gender === "Any" ? "All genders" : `${room.gender} only`,
      detail: "Resident preference",
    },
    room.furnished && {
      icon: Sofa,
      title: "Furnished",
      detail: "Furniture is included",
    },
    room.rooms != null && {
      icon: BedDouble,
      title: `${room.rooms} room${room.rooms === 1 ? "" : "s"}`,
      detail: "Room count",
    },
    room.bathrooms != null && {
      icon: Bath,
      title: `${room.bathrooms} bathroom${room.bathrooms === 1 ? "" : "s"}`,
      detail: "Bathroom count",
    },
  ].filter(Boolean).slice(0, 3);

  if (!highlights.length) return null;

  return (
    <ul className="pd-highlights">
      {highlights.map(({ icon: Icon, title, detail }) => (
        <li key={title}>
          <Icon size={22} aria-hidden="true" />
          <span><strong>{title}</strong><small>{detail}</small></span>
        </li>
      ))}
    </ul>
  );
}

export default Highlights;
