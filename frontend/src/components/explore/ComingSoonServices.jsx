import {
  Sparkles,
  Truck,
  Sofa,
  Wifi,
  Wrench,
  Users,
  FileText,
  ShoppingBasket,
  BookOpen,
  Bike,
} from "lucide-react";

const services = [
  { icon: Sparkles, title: "Cleaning & Housekeeping", desc: "Room and bathroom cleaning" },
  { icon: Truck, title: "Packers & Movers", desc: "Easy shifting to your new place" },
  { icon: Sofa, title: "Furniture & Appliance Rental", desc: "Bed, cooler, AC, fridge on rent" },
  { icon: Wifi, title: "WiFi & RO Water", desc: "Broadband and RO purifier service" },
  { icon: Wrench, title: "Appliance Repair", desc: "Cooler, AC and geyser repair" },
  { icon: Users, title: "Roommate Finder", desc: "Find a roommate for shared rooms" },
  { icon: FileText, title: "Rent Agreement & Verification", desc: "Agreement and police verification" },
  { icon: ShoppingBasket, title: "Groceries & Daily Needs", desc: "Order from nearby shops" },
  { icon: BookOpen, title: "Study Support", desc: "Printing, stationery and coaching" },
  { icon: Bike, title: "Bike & Scooty Rental", desc: "Rent a bike or scooty by the day" },
];

function ComingSoonServices() {
  return (
    <div style={{ marginTop: "28px" }}>
      <h3 style={{ marginBottom: "14px" }}>More services coming soon</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "12px",
        }}
      >
        {services.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            style={{
              background: "var(--color-surface-2, #f3f4f6)",
              border: "1px solid var(--color-border, rgba(128,128,128,0.25))",
              borderRadius: "14px",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <Icon size={22} color="var(--color-primary, #16a34a)" />
            <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--color-text)" }}>
              {title}
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--color-text-light)" }}>{desc}</div>
            <span
              style={{
                alignSelf: "flex-start",
                marginTop: "4px",
                fontSize: "11px",
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: "999px",
                background: "var(--color-primary, #16a34a)",
                color: "#fff",
              }}
            >
              Coming Soon
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComingSoonServices;
