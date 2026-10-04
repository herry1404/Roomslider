import { NavLink } from "react-router-dom";

import { useNotifications } from "../../context/useNotifications";

const tabs = [
  { id: "discover", label: "Discover", to: "/roommates" },
  { id: "requests", label: "Requests", to: "/roommates/requests", badge: "pendingRequests" },
  { id: "messages", label: "Messages", to: "/roommates/messages", badge: "unreadMessages" },
  { id: "profile", label: "My profile", to: "/roommates/profile" },
];

function RoommateSubnav({ active }) {
  const { roommateBadges } = useNotifications();
  return (
    <nav className="roommate-hub-nav" aria-label="Roommate Finder">
      {tabs.map((tab) => {
        const count = tab.badge ? roommateBadges[tab.badge] : 0;
        return (
          <NavLink
            key={tab.id}
            to={tab.to}
            end={tab.id === "discover" || tab.id === "profile"}
            className={`roommate-hub-tab${active === tab.id ? " is-active" : ""}`}
            aria-current={active === tab.id ? "page" : undefined}
          >
            {tab.label}
            {count > 0 && (
              <span className="roommate-hub-badge">{count > 99 ? "99+" : count}</span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default RoommateSubnav;
