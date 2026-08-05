import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "../../styles/admin/admin-layout.css";

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">

      <Sidebar
        open={sidebarOpen}
        closeSidebar={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="admin-main">

        <Header
          openSidebar={() => setSidebarOpen(true)}
        />

        <div className="admin-content">
          {children}
        </div>

      </div>

    </div>
  );
}

export default AdminLayout;