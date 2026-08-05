import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import "../../styles/admin/dashboard.css";


function AdminDashboard() {

  const navigate = useNavigate();


  return (
    <AdminLayout>

      <div className="dashboard">


        <div className="dashboard-top">

          <div>

            <h2>
              Dashboard Overview
            </h2>


            <p>
              Welcome to the RoomSlider Super Admin Panel 🚀
            </p>


          </div>

        </div>




        {/* Stats Cards */}

        <div className="stats-grid">


          <div className="dashboard-card">

            <span>
              Total Rooms
            </span>

            <h2>
              0
            </h2>

          </div>



          <div className="dashboard-card">

            <span>
              Total Users
            </span>

            <h2>
              0
            </h2>

          </div>




          <div className="dashboard-card">

            <span>
              Wishlist
            </span>

            <h2>
              0
            </h2>

          </div>




          <div className="dashboard-card">

            <span>
              Admins
            </span>

            <h2>
              1
            </h2>

          </div>



        </div>






        {/* Recent Activity */}


        <div className="dashboard-section">


          <h3>
            Recent Activity
          </h3>



          <div className="activity-box">


            <p>
              No recent activity found.
            </p>


          </div>


        </div>






        {/* Quick Actions */}


        <div className="dashboard-section">


          <h3>
            Quick Actions
          </h3>



          <div className="quick-actions">



            <button
              onClick={() =>
                navigate("/admin/add-room")
              }
            >
              Add Room
            </button>





            <button
              onClick={() =>
                navigate("/admin/manage-rooms")
              }
            >
              Manage Rooms
            </button>





            <button
              onClick={() =>
                navigate("/admin/manage-users")
              }
            >
              Manage Users
            </button>





            <button
              onClick={() =>
                alert("Analytics Coming Soon")
              }
            >
              Analytics
            </button>



          </div>


        </div>




      </div>


    </AdminLayout>
  );
}


export default AdminDashboard;