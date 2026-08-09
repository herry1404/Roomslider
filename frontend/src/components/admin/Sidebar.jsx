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
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import "../../styles/admin/sidebar.css";

function Sidebar({ open, closeSidebar }) {

  const { logout } = useAuth();

  const menu = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/admin/dashboard",
    },
    {
      title: "Manage Rooms",
      icon: <Building2 size={20} />,
      path: "/admin/rooms",
    },
    {
      title: "Add Room",
      icon: <HousePlus size={20} />,
      path: "/admin/rooms/add",
    },
    {
      title: "Manage Owners",
      icon: <UserCog size={20} />,
      path: "/admin/owners",
    },
    {
      title: "Laundry Vendors",
      icon: <Shirt size={20} />,
      path: "/admin/laundry-vendors",
    },
    {
      title: "Users",
      icon: <Users size={20} />,
      path: "/admin/users",
    },
    {
      title: "Wishlist",
      icon: <Heart size={20} />,
      path: "/admin/wishlist",
    },
    {
      title: "Settings",
      icon: <Settings size={20} />,
      path: "/admin/settings",
    },
  ];

  return (
    <aside className={`sidebar ${open ? "show-sidebar" : ""}`}>

      <div>

        <div className="sidebar-top">

          <div className="sidebar-logo">

            <h2>
              Room<span>Slider</span>
            </h2>

            <p>SUPER ADMIN</p>

          </div>

          <button
            className="close-sidebar"
            onClick={closeSidebar}
          >
            <X size={24} />
          </button>

        </div>

        <nav>

          {menu.map((item) => (

            <NavLink
              key={item.title}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive
                  ? "side-link active"
                  : "side-link"
              }
            >
              {item.icon}

              <span>{item.title}</span>

            </NavLink>

          ))}

        </nav>

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
