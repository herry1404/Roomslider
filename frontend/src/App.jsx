import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import MapLayout from "./layouts/MapLayout";
import ScrollToTop from "./components/ScrollToTop";
import BackToTop from "./components/ui/BackToTop";
import InstallPrompt from "./components/InstallPrompt";
import PreferencesModal from "./components/onboarding/PreferencesModal";
import { useAuth } from "./context/AuthContext";

import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Team from "./pages/Team/Team";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import CompleteProfile from "./pages/CompleteProfile/CompleteProfile";
import Settings from "./pages/Settings/Settings";
import Wishlist from "./pages/Wishlist/Wishlist";
import TenantDashboard from "./pages/Tenant/TenantDashboard";
import RecentlyViewed from "./pages/RecentlyViewed/RecentlyViewed";
import PropertyDetails from "./pages/PropertyDetails/PropertyDetails";
import MapView from "./pages/MapView/MapView";
import Explore from "./pages/Explore/Explore";
import VehicleList from "./pages/Vehicles/VehicleList";
import VehicleDetail from "./pages/Vehicles/VehicleDetail";
import ManageVehicles from "./pages/Admin/ManageVehicles";
import AddVehicle from "./pages/Admin/AddVehicle";
import ManageVehicleRequests from "./pages/Admin/ManageVehicleRequests";
import ManageServices from "./pages/Admin/ManageServices";
import ServiceRequests from "./pages/Admin/ServiceRequests";
import ManageHomeLayout from "./pages/Admin/ManageHomeLayout";
import AddService from "./pages/Admin/AddService";
import ManageFurniture from "./pages/Admin/ManageFurniture";
import FurnitureList from "./pages/Furniture/FurnitureList";
import AddFurniture from "./pages/Admin/AddFurniture";
import ManageFurnitureRequests from "./pages/Admin/ManageFurnitureRequests";
import ServiceList from "./pages/Services/ServiceList";
import OwnerProfile from "./pages/OwnerProfile/OwnerProfile";
import PropertyPage from "./pages/PropertyPage/PropertyPage";
import Profile from "./pages/Profile/Profile";
import ProfileEdit from "./pages/Profile/ProfileEdit";
import Terms from "./pages/Terms/Terms";
import Privacy from "./pages/Privacy/Privacy";
import RoommateFinder from "./pages/Roommates/RoommateFinder";
import MyRoommateProfile from "./pages/Roommates/MyRoommateProfile";
import RoommateRequests from "./pages/Roommates/RoommateRequests";
import RoommateMessages from "./pages/Roommates/RoommateMessages";
import RoommateProfilePage from "./pages/Roommates/RoommateProfilePage";
import RoommateChatPage from "./pages/Roommates/RoommateChatPage";
import Notifications from "./pages/Notifications/Notifications";
import Sitemap from "./pages/Sitemap/Sitemap";

import Rooms from "./pages/Rooms/Rooms";
import HourlyRooms from "./pages/Rooms/HourlyRooms";
import HourlyRoomDetail from "./pages/Rooms/HourlyRoomDetail";
import LaundryList from "./pages/Laundry/LaundryList";
import LaundryDetail from "./pages/Laundry/LaundryDetail";
import VillaList from "./pages/Villas/VillaList";
import VillaDetail from "./pages/Villas/VillaDetail";
import MessList from "./pages/Mess/MessList";
import MessDetail from "./pages/Mess/MessDetail";
import PG from "./pages/PG/PG";
import Hostels from "./pages/Hostels/Hostels";
import Flats from "./pages/Flats/Flats";

import AdminLogin from "./pages/Admin/AdminLogin";
import OwnerLogin from "./pages/Owner/OwnerLogin";
import HourlyManagerLogin from "./pages/HourlyManager/HourlyManagerLogin";
import HourlyManagerDashboard from "./pages/HourlyManager/HourlyManagerDashboard";
import HourlyRoomCheckout from "./pages/Rooms/HourlyRoomCheckout";
import OwnerDashboard from "./pages/Owner/OwnerDashboard";
import OwnerAddRoom from "./pages/Owner/OwnerAddRoom";
import OwnerRoomDetail from "./pages/Owner/OwnerRoomDetail";
import OwnerElectricity from "./pages/Owner/OwnerElectricity";
import OwnerExpenses from "./pages/Owner/OwnerExpenses";
import OwnerReminders from "./pages/Owner/OwnerReminders";
import OwnerMaintenance from "./pages/Owner/OwnerMaintenance";
import MessLogin from "./pages/Mess/MessLogin";
import MessOwnerDashboard from "./pages/Mess/MessOwnerDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AddRoom from "./pages/Admin/AddRoom";
import EditRoom from "./pages/Admin/EditRoom";
import ManageRooms from "./pages/Admin/ManageRooms";
import ManageUsers from "./pages/Admin/ManageUsers";
import ManageOwners from "./pages/Admin/ManageOwners";
import ManageLaundryVendors from "./pages/Admin/ManageLaundryVendors";
import ManageLoans from "./pages/Admin/ManageLoans";
import ManageMess from "./pages/Admin/ManageMess";
import ManageHourlyRooms from "./pages/Admin/ManageHourlyRooms";
import ManageVillas from "./pages/Admin/ManageVillas";
import ManageNotifications from "./pages/Admin/ManageNotifications";
import OwnerDetail from "./pages/Admin/OwnerDetail";
import HourlyBookingReceipt from "./pages/Rooms/HourlyBookingReceipt";
import SocialWork from "./pages/SocialWork/SocialWork";
import ManageSocial from "./pages/Admin/ManageSocial";
import AddSocial from "./pages/Admin/AddSocial";
import Donate from "./pages/Donate/Donate";
import BloodHome from "./pages/Blood/BloodHome";
import BloodRequestForm from "./pages/Blood/BloodRequestForm";
import BloodRequestDetail from "./pages/Blood/BloodRequestDetail";
import ManageBloodRequests from "./pages/Admin/ManageBloodRequests";
import ManageRoommateReports from "./pages/Admin/ManageRoommateReports";
import PushNotifications from "./pages/Admin/PushNotifications";
import AdminAnalytics from "./pages/Admin/AdminAnalytics";
import ManageListingReports from "./pages/Admin/ManageListingReports";
import PushPermissionPrompt from "./components/notifications/PushPermissionPrompt";

import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";
import OwnerRoute from "./components/OwnerRoute";
import MessRoute from "./components/MessRoute";

function App() {

  const { showPreferences, dismissPreferencesPrompt } = useAuth();

  return (
    <>
      <ScrollToTop />
      <BackToTop />
      <InstallPrompt />
      <PushPermissionPrompt />
      {showPreferences && (
        <PreferencesModal onClose={dismissPreferencesPrompt} />
      )}
      <Routes>
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/about" element={<MainLayout><About /></MainLayout>} />
        <Route path="/team" element={<MainLayout><Team /></MainLayout>} />
        <Route path="/rooms" element={<MainLayout><Rooms /></MainLayout>} />
        <Route path="/hourly-rooms" element={<MainLayout><HourlyRooms /></MainLayout>} />
        <Route path="/hourly-rooms/:id" element={<MainLayout><HourlyRoomDetail /></MainLayout>} />
        <Route path="/laundry" element={<MainLayout><LaundryList /></MainLayout>} />
        <Route path="/laundry/:id" element={<MainLayout><LaundryDetail /></MainLayout>} />
        <Route path="/villas" element={<MainLayout><VillaList /></MainLayout>} />
        <Route path="/villas/:id" element={<MainLayout><VillaDetail /></MainLayout>} />
        <Route path="/mess" element={<MainLayout><MessList /></MainLayout>} />
        <Route path="/mess/login" element={<MessLogin />} />
        <Route path="/mess/dashboard" element={<MessRoute><MessOwnerDashboard /></MessRoute>} />
        <Route path="/mess/:id" element={<MainLayout><MessDetail /></MainLayout>} />
        <Route path="/explore" element={<MainLayout><Explore /></MainLayout>} />
        <Route path="/social-work" element={<MainLayout><SocialWork /></MainLayout>} />
        <Route path="/social-work/:category" element={<MainLayout><SocialWork /></MainLayout>} />
        <Route path="/social-work/:category/:slug" element={<MainLayout><SocialWork /></MainLayout>} />
        <Route path="/donate" element={<MainLayout><Donate /></MainLayout>} />
        <Route path="/blood" element={<MainLayout><BloodHome /></MainLayout>} />
        <Route path="/blood/request" element={<MainLayout><BloodRequestForm /></MainLayout>} />
        <Route path="/blood/requests/:id" element={<MainLayout><BloodRequestDetail /></MainLayout>} />
        <Route path="/roommates/chat/:userId" element={<MainLayout><RoommateChatPage /></MainLayout>} />
        <Route path="/roommates/profile/:userId" element={<MainLayout><RoommateProfilePage /></MainLayout>} />
        <Route path="/roommates/profile" element={<MainLayout><MyRoommateProfile /></MainLayout>} />
        <Route path="/roommates/requests" element={<MainLayout><RoommateRequests /></MainLayout>} />
        <Route path="/roommates/messages" element={<MainLayout><RoommateMessages /></MainLayout>} />
        <Route path="/roommates" element={<MainLayout><RoommateFinder /></MainLayout>} />
        <Route path="/vehicles" element={<MainLayout><VehicleList /></MainLayout>} />
        <Route path="/vehicles/:id" element={<MainLayout><VehicleDetail /></MainLayout>} />
        <Route path="/services/:category" element={<MainLayout><ServiceList /></MainLayout>} />
        <Route path="/furniture" element={<MainLayout><FurnitureList /></MainLayout>} />
        <Route path="/map" element={<MapLayout><MapView /></MapLayout>} />
        <Route path="/rooms/:id" element={<MainLayout><PropertyDetails /></MainLayout>} />
        <Route path="/pg/:id" element={<MainLayout><PropertyDetails /></MainLayout>} />
        <Route path="/hostels/:id" element={<MainLayout><PropertyDetails /></MainLayout>} />
        <Route path="/flats/:id" element={<MainLayout><PropertyDetails /></MainLayout>} />
        <Route path="/owners/:id" element={<MainLayout><OwnerProfile /></MainLayout>} />
        <Route path="/property/:id" element={<MainLayout><PropertyPage /></MainLayout>} />
        <Route path="/pg" element={<MainLayout><PG /></MainLayout>} />
        <Route path="/hostels" element={<MainLayout><Hostels /></MainLayout>} />
        <Route path="/flats" element={<MainLayout><Flats /></MainLayout>} />
        <Route path="/login" element={<MainLayout><Login /></MainLayout>} />
        <Route path="/register" element={<MainLayout><Register /></MainLayout>} />
        <Route path="/complete-profile" element={<MainLayout><CompleteProfile /></MainLayout>} />
        <Route path="/forgot-password" element={<MainLayout><ForgotPassword /></MainLayout>} />
        <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
        <Route path="/wishlist" element={<MainLayout><Wishlist /></MainLayout>} />
        <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
        <Route path="/notifications" element={<MainLayout><Notifications /></MainLayout>} />
        <Route path="/profile/edit" element={<MainLayout><ProfileEdit /></MainLayout>} />
        <Route path="/my-place" element={<MainLayout><TenantDashboard /></MainLayout>} />
        <Route path="/recently-viewed" element={<MainLayout><RecentlyViewed /></MainLayout>} />
        <Route path="/terms" element={<MainLayout><Terms /></MainLayout>} />
        <Route path="/privacy" element={<MainLayout><Privacy /></MainLayout>} />
        <Route path="/sitemap" element={<MainLayout><Sitemap /></MainLayout>} />

        <Route path="/owner/login" element={<OwnerLogin />} />
        <Route path="/hourly-manager/login" element={<HourlyManagerLogin />} />
        <Route path="/hourly-manager/dashboard" element={<HourlyManagerDashboard />} />
        <Route path="/hourly-rooms/:id/book" element={<HourlyRoomCheckout />} />
        <Route path="/hourly-bookings/:id/receipt" element={<HourlyBookingReceipt />} />
        <Route path="/owner/dashboard" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
        <Route path="/owner/rooms/add" element={<OwnerRoute><OwnerAddRoom /></OwnerRoute>} />
        <Route path="/owner/rooms/:id" element={<OwnerRoute><OwnerRoomDetail /></OwnerRoute>} />
        <Route path="/owner/electricity" element={<OwnerRoute><OwnerElectricity /></OwnerRoute>} />
        <Route path="/owner/expenses" element={<OwnerRoute><OwnerExpenses /></OwnerRoute>} />
        <Route path="/owner/reminders" element={<OwnerRoute><OwnerReminders /></OwnerRoute>} />
        <Route path="/owner/maintenance" element={<OwnerRoute><OwnerMaintenance /></OwnerRoute>} />

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
        <Route path="/admin/rooms" element={<AdminRoute><ManageRooms /></AdminRoute>} />
        <Route path="/admin/rooms/add" element={<AdminRoute><AddRoom /></AdminRoute>} />
        <Route path="/admin/rooms/edit/:id" element={<AdminRoute><EditRoom /></AdminRoute>} />
        <Route path="/admin/rooms/:id" element={<AdminRoute><OwnerRoomDetail /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
        <Route path="/admin/owners" element={<AdminRoute><ManageOwners /></AdminRoute>} />
        <Route path="/admin/laundry-vendors" element={<AdminRoute><ManageLaundryVendors /></AdminRoute>} />
        <Route path="/admin/loans" element={<AdminRoute><ManageLoans /></AdminRoute>} />
        <Route path="/admin/vehicles" element={<AdminRoute><ManageVehicles /></AdminRoute>} />
        <Route path="/admin/vehicles/add" element={<AdminRoute><AddVehicle /></AdminRoute>} />
        <Route path="/admin/vehicles/edit/:id" element={<AdminRoute><AddVehicle /></AdminRoute>} />
        <Route path="/admin/vehicle-requests" element={<AdminRoute><ManageVehicleRequests /></AdminRoute>} />
        <Route path="/admin/services" element={<AdminRoute><ManageServices /></AdminRoute>} />
        <Route path="/admin/service-requests" element={<AdminRoute><ServiceRequests /></AdminRoute>} />
        <Route path="/admin/social" element={<AdminRoute><ManageSocial /></AdminRoute>} />
        <Route path="/admin/social/add" element={<AdminRoute><AddSocial /></AdminRoute>} />
        <Route path="/admin/social/edit/:id" element={<AdminRoute><AddSocial /></AdminRoute>} />
        <Route path="/admin/blood-requests" element={<AdminRoute><ManageBloodRequests /></AdminRoute>} />
        <Route path="/admin/roommate-reports" element={<AdminRoute><ManageRoommateReports /></AdminRoute>} />
        <Route path="/admin/listing-reports" element={<AdminRoute><ManageListingReports /></AdminRoute>} />
        <Route path="/admin/home-layout" element={<AdminRoute><ManageHomeLayout /></AdminRoute>} />
        <Route path="/admin/services/add" element={<AdminRoute><AddService /></AdminRoute>} />
        <Route path="/admin/furniture" element={<AdminRoute><ManageFurniture /></AdminRoute>} />
        <Route path="/admin/furniture/requests" element={<AdminRoute><ManageFurnitureRequests /></AdminRoute>} />
        <Route path="/admin/furniture/add" element={<AdminRoute><AddFurniture /></AdminRoute>} />
        <Route path="/admin/furniture/edit/:id" element={<AdminRoute><AddFurniture /></AdminRoute>} />

        <Route path="/admin/mess" element={<AdminRoute><ManageMess /></AdminRoute>} />
        <Route path="/admin/hourly-rooms" element={<AdminRoute><ManageHourlyRooms /></AdminRoute>} />
        <Route path="/admin/villas" element={<AdminRoute><ManageVillas /></AdminRoute>} />
        <Route path="/admin/notifications" element={<AdminRoute><ManageNotifications /></AdminRoute>} />
        <Route path="/admin/push" element={<AdminRoute><PushNotifications /></AdminRoute>} />
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
    </>
  );
}

export default App;
