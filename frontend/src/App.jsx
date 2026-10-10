import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { GoogleOAuthProvider } from "@react-oauth/google";

import MainLayout from "./layouts/MainLayout";
import MapLayout from "./layouts/MapLayout";
import ScrollToTop from "./components/ScrollToTop";
import BackToTop from "./components/ui/BackToTop";
import InstallPrompt from "./components/InstallPrompt";
import PreferencesModal from "./components/onboarding/PreferencesModal";
import { useAuth } from "./context/AuthContext";

import Home from "./pages/Home/Home";
const About = lazy(() => import("./pages/About/About"));
const Contact = lazy(() => import("./pages/Contact/Contact"));
const Team = lazy(() => import("./pages/Team/Team"));
const Login = lazy(() => import("./pages/Login/Login"));
const Register = lazy(() => import("./pages/Register/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword/ForgotPassword"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile/CompleteProfile"));
const Settings = lazy(() => import("./pages/Settings/Settings"));
const Wishlist = lazy(() => import("./pages/Wishlist/Wishlist"));
const TenantDashboard = lazy(() => import("./pages/Tenant/TenantDashboard"));
const RecentlyViewed = lazy(() => import("./pages/RecentlyViewed/RecentlyViewed"));
const PropertyDetails = lazy(() => import("./pages/PropertyDetails/PropertyDetails"));
const MapView = lazy(() => import("./pages/MapView/MapView"));
const Explore = lazy(() => import("./pages/Explore/Explore"));
const VehicleList = lazy(() => import("./pages/Vehicles/VehicleList"));
const VehicleDetail = lazy(() => import("./pages/Vehicles/VehicleDetail"));
const ManageVehicles = lazy(() => import("./pages/Admin/ManageVehicles"));
const AddVehicle = lazy(() => import("./pages/Admin/AddVehicle"));
const ManageVehicleRequests = lazy(() => import("./pages/Admin/ManageVehicleRequests"));
const ManageServices = lazy(() => import("./pages/Admin/ManageServices"));
const ServiceRequests = lazy(() => import("./pages/Admin/ServiceRequests"));
const ManageHomeLayout = lazy(() => import("./pages/Admin/ManageHomeLayout"));
const AddService = lazy(() => import("./pages/Admin/AddService"));
const ManageFurniture = lazy(() => import("./pages/Admin/ManageFurniture"));
const FurnitureList = lazy(() => import("./pages/Furniture/FurnitureList"));
const AddFurniture = lazy(() => import("./pages/Admin/AddFurniture"));
const ManageFurnitureRequests = lazy(() => import("./pages/Admin/ManageFurnitureRequests"));
const ServiceList = lazy(() => import("./pages/Services/ServiceList"));
const OwnerProfile = lazy(() => import("./pages/OwnerProfile/OwnerProfile"));
const PropertyPage = lazy(() => import("./pages/PropertyPage/PropertyPage"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const ProfileEdit = lazy(() => import("./pages/Profile/ProfileEdit"));
const Terms = lazy(() => import("./pages/Terms/Terms"));
const Privacy = lazy(() => import("./pages/Privacy/Privacy"));
const RoommateFinder = lazy(() => import("./pages/Roommates/RoommateFinder"));
const MyRoommateProfile = lazy(() => import("./pages/Roommates/MyRoommateProfile"));
const RoommateRequests = lazy(() => import("./pages/Roommates/RoommateRequests"));
const RoommateMessages = lazy(() => import("./pages/Roommates/RoommateMessages"));
const RoommateProfilePage = lazy(() => import("./pages/Roommates/RoommateProfilePage"));
const RoommateChatPage = lazy(() => import("./pages/Roommates/RoommateChatPage"));
const Notifications = lazy(() => import("./pages/Notifications/Notifications"));
const Sitemap = lazy(() => import("./pages/Sitemap/Sitemap"));
const Rooms = lazy(() => import("./pages/Rooms/Rooms"));
const HourlyRooms = lazy(() => import("./pages/Rooms/HourlyRooms"));
const HourlyRoomDetail = lazy(() => import("./pages/Rooms/HourlyRoomDetail"));
const LaundryList = lazy(() => import("./pages/Laundry/LaundryList"));
const LaundryDetail = lazy(() => import("./pages/Laundry/LaundryDetail"));
const VillaList = lazy(() => import("./pages/Villas/VillaList"));
const VillaDetail = lazy(() => import("./pages/Villas/VillaDetail"));
const MessList = lazy(() => import("./pages/Mess/MessList"));
const MessDetail = lazy(() => import("./pages/Mess/MessDetail"));
const PG = lazy(() => import("./pages/PG/PG"));
const Hostels = lazy(() => import("./pages/Hostels/Hostels"));
const Flats = lazy(() => import("./pages/Flats/Flats"));
const AdminLogin = lazy(() => import("./pages/Admin/AdminLogin"));
const OwnerLogin = lazy(() => import("./pages/Owner/OwnerLogin"));
const HourlyManagerLogin = lazy(() => import("./pages/HourlyManager/HourlyManagerLogin"));
const HourlyManagerDashboard = lazy(() => import("./pages/HourlyManager/HourlyManagerDashboard"));
const HourlyRoomCheckout = lazy(() => import("./pages/Rooms/HourlyRoomCheckout"));
const OwnerDashboard = lazy(() => import("./pages/Owner/OwnerDashboard"));
const OwnerAddRoom = lazy(() => import("./pages/Owner/OwnerAddRoom"));
const OwnerRoomDetail = lazy(() => import("./pages/Owner/OwnerRoomDetail"));
const OwnerElectricity = lazy(() => import("./pages/Owner/OwnerElectricity"));
const OwnerExpenses = lazy(() => import("./pages/Owner/OwnerExpenses"));
const OwnerReminders = lazy(() => import("./pages/Owner/OwnerReminders"));
const OwnerMaintenance = lazy(() => import("./pages/Owner/OwnerMaintenance"));
const MessLogin = lazy(() => import("./pages/Mess/MessLogin"));
const MessOwnerDashboard = lazy(() => import("./pages/Mess/MessOwnerDashboard"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AddRoom = lazy(() => import("./pages/Admin/AddRoom"));
const EditRoom = lazy(() => import("./pages/Admin/EditRoom"));
const ManageRooms = lazy(() => import("./pages/Admin/ManageRooms"));
const ManageUsers = lazy(() => import("./pages/Admin/ManageUsers"));
const ManageOwners = lazy(() => import("./pages/Admin/ManageOwners"));
const ManageLaundryVendors = lazy(() => import("./pages/Admin/ManageLaundryVendors"));
const ManageLoans = lazy(() => import("./pages/Admin/ManageLoans"));
const ManageMess = lazy(() => import("./pages/Admin/ManageMess"));
const ManageHourlyRooms = lazy(() => import("./pages/Admin/ManageHourlyRooms"));
const ManageVillas = lazy(() => import("./pages/Admin/ManageVillas"));
const ManageNotifications = lazy(() => import("./pages/Admin/ManageNotifications"));
const OwnerDetail = lazy(() => import("./pages/Admin/OwnerDetail"));
const HourlyBookingReceipt = lazy(() => import("./pages/Rooms/HourlyBookingReceipt"));
const SocialWork = lazy(() => import("./pages/SocialWork/SocialWork"));
const ManageSocial = lazy(() => import("./pages/Admin/ManageSocial"));
const AddSocial = lazy(() => import("./pages/Admin/AddSocial"));
const Donate = lazy(() => import("./pages/Donate/Donate"));
const BloodHome = lazy(() => import("./pages/Blood/BloodHome"));
const BloodRequestForm = lazy(() => import("./pages/Blood/BloodRequestForm"));
const BloodRequestDetail = lazy(() => import("./pages/Blood/BloodRequestDetail"));
const ManageBloodRequests = lazy(() => import("./pages/Admin/ManageBloodRequests"));
const ManageRoommateReports = lazy(() => import("./pages/Admin/ManageRoommateReports"));
const PushNotifications = lazy(() => import("./pages/Admin/PushNotifications"));
const AdminAnalytics = lazy(() => import("./pages/Admin/AdminAnalytics"));
const ManageListingReports = lazy(() => import("./pages/Admin/ManageListingReports"));
import PushPermissionPrompt from "./components/notifications/PushPermissionPrompt";

const AdminRoute = lazy(() => import("./components/AdminRoute"));
import OwnerRoute from "./components/OwnerRoute";
import MessRoute from "./components/MessRoute";

const PRIVATE_PATH = /^\/(?:admin(?:\/|$)|owner(?:\/|$)|mess\/(?:login|dashboard)(?:\/|$)|hourly-manager(?:\/|$)|login(?:\/|$)|register(?:\/|$)|complete-profile(?:\/|$)|forgot-password(?:\/|$)|settings(?:\/|$)|wishlist(?:\/|$)|profile(?:\/|$)|my-place(?:\/|$)|recently-viewed(?:\/|$)|notifications(?:\/|$)|hourly-bookings(?:\/|$)|hourly-rooms\/[^/]+\/book(?:\/|$)|roommates(?:\/(?:profile|requests|messages|chat)(?:\/|$))?|roommates\/profile\/[^/]+)$/i;

function PrivateRouteRobots() {
  const { pathname } = useLocation();
  if (!PRIVATE_PATH.test(pathname)) return null;
  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );
}

function App() {

  const { showPreferences, dismissPreferencesPrompt } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const handleLoginRequired = () => setShowLoginModal(true);
    window.addEventListener("roomslider:login-required", handleLoginRequired);
    return () => window.removeEventListener("roomslider:login-required", handleLoginRequired);
  }, []);

  return (
    <>
      <PrivateRouteRobots />
      <ScrollToTop />
      <BackToTop />
      <InstallPrompt />
      <PushPermissionPrompt />
      {showPreferences && (
        <PreferencesModal onClose={dismissPreferencesPrompt} />
      )}
      {showLoginModal && (
        <Suspense fallback={<div className="route-loading" role="status">Loading sign-in…</div>}>
          <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <Login modal onClose={() => setShowLoginModal(false)} />
          </GoogleOAuthProvider>
        </Suspense>
      )}
      <Suspense fallback={<div className="route-loading" role="status">Loading page…</div>}>
      <Routes>
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/about" element={<MainLayout><About /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
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
        <Route path="/login" element={<MainLayout><GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}><Login /></GoogleOAuthProvider></MainLayout>} />
        <Route path="/register" element={<MainLayout><GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}><Register /></GoogleOAuthProvider></MainLayout>} />
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
        <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />

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
      </Suspense>
    </>
  );
}

export default App;
