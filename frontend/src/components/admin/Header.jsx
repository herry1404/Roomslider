import { Search, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AdminAlertBell from "./AdminAlertBell";
import "../../styles/admin/header.css";

function Header({ openSidebar }) {

  const { user } = useAuth();

  return (

    <header className="admin-header">

      <div className="header-left">

        <button
          className="menu-btn"
          onClick={openSidebar}
        >
          <Menu size={24} />
        </button>

        <div>

          <h1>Dashboard</h1>

          <p>
            Welcome back,
            <span>
              {" "}
              {user?.name || "Super Admin"} 👋
            </span>
          </p>

        </div>

      </div>

      <div className="header-right">

        <div className="header-search">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search..."
          />

        </div>

        <AdminAlertBell />

        <div className="admin-profile">

          <div className="avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div>

            <h4>{user?.name}</h4>

            <p>{user?.role}</p>

          </div>

        </div>

      </div>

    </header>

  );
}

export default Header;