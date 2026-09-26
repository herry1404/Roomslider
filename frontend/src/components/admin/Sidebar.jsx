import {
  LayoutDashboard,
  HousePlus,
  Building2,
  Users,
  Heart,
  Settings,
  LogOut,
  X,
  UserCog,
  Shirt,
  DoorOpen,
  UtensilsCrossed,
  Banknote,
  Bike,
  Sparkles,
  Home,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "../../styles/admin/sidebar.css";

function Sidebar({ open, closeSidebar }) {

  const { logout } = useAuth();

  const groups = [
    {
      label: "Housing",
      items: [
        { title: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/admin/dashboard" },
        { title: "Manage Rooms", icon: <Building2 size={18} />, path: "/admin/rooms" },
        { title: "Add Room", icon: <HousePlus size={18} />, path: "/admin/rooms/add" },
        { title: "Hourly Rooms", icon: <DoorOpen size={18} />, path: "/admin/hourly-rooms" },
        { title: "Manage Owners", icon: <UserCog size={18} />, path: "/admin/owners" },
      ],
    },
    {
      label: "Services",
      items: [
        { title: "Vehicles", icon: <Bike size={18} />, path: "/admin/vehicles" },
        { title: "Mess Vendors", icon: <UtensilsCrossed size={18} />, path: "/admin/mess" },
        { title: "Laundry Vendors", icon: <Shirt size={18} />, path: "/admin/laundry-vendors" },
        { title: "Other Services", icon: <Sparkles size={18} />, path: "/admin/services" },
      ],
    },
    {
      label: "Finance",
      items: [
        { title: "Loan Requests", icon: <Banknote size={18} />, path: "/admin/loans" },
      ],
    },
    {
      label: "Users",
      items: [
        { title: "Users", icon: <Users size={18} />, path: "/admin/users" },
        { title: "Wishlist", icon: <Heart size={18} />, path: "/admin/wishlist" },
      ],
    },
    {
      label: "System",
      items: [
        { title: "Settings", icon: <Settings size={18} />, path: "/admin/settings" },
      ],
    },
  ];

  return (
    <aside className={`sidebar ${open ? "show-sidebar" : ""}`}>

      <div className="sidebar-scroll">

        <div className="sidebar-top">

          <div className="sidebar-logo">

            <div className="sidebar-logo-icon">
              <Home size={20} strokeWidth={2.5} />
            </div>

            <div>
              <h2>
                Room<span>Slider</span>
              </h2>
              <p>SUPER ADMIN</p>
            </div>

          </div>

          <button
            className="close-sidebar"
            onClick={closeSidebar}
          >
            <X size={22} />
          </button>

        </div>

        {groups.map((group) => (
          <div className="sidebar-group" key={group.label}>

            <div className="sidebar-group-label">{group.label}</div>

            <nav>
              {group.items.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.path}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    isActive ? "side-link active" : "side-link"
                  }
                >
                  {item.icon}
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </nav>

          </div>
        ))}

      </div>

      <button
        className="logout-btn"
        onClick={logout}
      >
        <LogOut size={18} />
        Logout
      </button>

    </aside>
  );
}

export default Sidebar;
