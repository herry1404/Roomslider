import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Settings from "./pages/Settings/Settings";
import Wishlist from "./pages/Wishlist/Wishlist";
import TenantDashboard from "./pages/Tenant/TenantDashboard";
import RecentlyViewed from "./pages/RecentlyViewed/RecentlyViewed";
import PropertyDetails from "./pages/PropertyDetails/PropertyDetails";

import Rooms from "./pages/Rooms/Rooms";
import PG from "./pages/PG/PG";
import Hostels from "./pages/Hostels/Hostels";
import Flats from "./pages/Flats/Flats";

import AdminLogin from "./pages/Admin/AdminLogin";
import OwnerLogin from "./pages/Owner/OwnerLogin";
import OwnerDashboard from "./pages/Owner/OwnerDashboard";
import OwnerAddRoom from "./pages/Owner/OwnerAddRoom";
import OwnerRoomDetail from "./pages/Owner/OwnerRoomDetail";
import OwnerElectricity from "./pages/Owner/OwnerElectricity";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AddRoom from "./pages/Admin/AddRoom";
import EditRoom from "./pages/Admin/EditRoom";
import ManageRooms from "./pages/Admin/ManageRooms";
import ManageUsers from "./pages/Admin/ManageUsers";
import ManageOwners from "./pages/Admin/ManageOwners";
import OwnerDetail from "./pages/Admin/OwnerDetail";

import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import OwnerRoute from "./components/OwnerRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout><Home /></MainLayout>} />
      <Route path="/about" element={<MainLayout><About /></MainLayout>} />
      <Route path="/rooms" element={<MainLayout><Rooms /></MainLayout>} />
      <Route path="/rooms/:id" element={<MainLayout><PropertyDetails /></MainLayout>} />
      <Route path="/pg/:id" element={<MainLayout><PropertyDetails /></MainLayout>} />
      <Route path="/hostels/:id" element={<MainLayout><PropertyDetails /></MainLayout>} />
      <Route path="/flats/:id" element={<MainLayout><PropertyDetails /></MainLayout>} />
      <Route path="/pg" element={<MainLayout><PG /></MainLayout>} />
      <Route path="/hostels" element={<MainLayout><Hostels /></MainLayout>} />
      <Route path="/flats" element={<MainLayout><Flats /></MainLayout>} />
      <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
      <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
      <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
      <Route path="/wishlist" element={<MainLayout><Wishlist /></MainLayout>} />
      <Route path="/my-place" element={<MainLayout><TenantDashboard /></MainLayout>} />
      <Route path="/recently-viewed" element={<MainLayout><RecentlyViewed /></MainLayout>} />

      <Route path="/owner/login" element={<OwnerLogin />} />
        <Route path="/owner/dashboard" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
        <Route path="/owner/rooms/add" element={<OwnerRoute><OwnerAddRoom /></OwnerRoute>} />
        <Route path="/owner/rooms/:id" element={<OwnerRoute><OwnerRoomDetail /></OwnerRoute>} />
        <Route path="/owner/electricity" element={<OwnerRoute><OwnerElectricity /></OwnerRoute>} />

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/rooms" element={<AdminRoute><ManageRooms /></AdminRoute>} />
      <Route path="/admin/rooms/add" element={<AdminRoute><AddRoom /></AdminRoute>} />
      <Route path="/admin/rooms/edit/:id" element={<AdminRoute><EditRoom /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
      <Route path="/admin/owners" element={<AdminRoute><ManageOwners /></AdminRoute>} />
      <Route path="/admin/owners/:id" element={<AdminRoute><OwnerDetail /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminLayout><Settings /></AdminLayout></AdminRoute>} />

      <Route
        path="/admin/wishlist"
        element={<AdminRoute><div style={{ padding: "2rem" }}>Wishlist Analytics Coming Soon</div></AdminRoute>}
      />
      <Route
        path="/admin/recent"
        element={<AdminRoute><div style={{ padding: "2rem" }}>Recently Viewed Analytics Coming Soon</div></AdminRoute>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
