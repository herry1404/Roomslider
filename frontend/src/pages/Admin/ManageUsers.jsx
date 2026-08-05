import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Eye,
  Search,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import "../../styles/manageUsers.css";


function ManageUsers() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);



  // GET ALL USERS

  const fetchUsers = async () => {

    try {

      setLoading(true);


      const res = await api.get("/admin/users");


      setUsers(
        res.data.users || []
      );


    } catch (error) {

      console.log(error);


      toast.error(
        error.response?.data?.message ||
        "Users load nahi ho paye"
      );

    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    fetchUsers();

  }, []);




  // DELETE USER

  const handleDelete = async (id) => {


    const confirm = window.confirm(
      "Kya aap is user ko delete karna chahte ho?"
    );


    if (!confirm) return;



    try {


      await api.delete(
        `/admin/users/${id}`
      );


      toast.success(
        "User deleted successfully"
      );


      fetchUsers();



    } catch (error) {


      toast.error(
        error.response?.data?.message ||
        "Delete failed"
      );


    }


  };




  // SEARCH

  const filteredUsers = users.filter(
    (user) => {

      const value =
      search.toLowerCase();


      return (

        user.name
        ?.toLowerCase()
        .includes(value)

        ||

        user.email
        ?.toLowerCase()
        .includes(value)

        ||

        user.phone
        ?.includes(value)

      );

    }
  );



  return (

    <div className="manage-users-page">


      <div className="users-header">


        <div>

          <h1>
            Manage Users
          </h1>


          <p>
            RoomSlider users ko manage kare
          </p>

        </div>



        <div className="users-search">


          <Search size={20}/>


          <input

            type="text"

            placeholder="Search user..."

            value={search}

            onChange={(e)=>
              setSearch(e.target.value)
            }

          />


        </div>



      </div>



      {loading ? (

        <div className="loading-box">
          Loading Users...
        </div>


      ) : (


        <div className="users-grid">


          {filteredUsers.map(
            (user)=>(


            <div
              className="user-card"
              key={user._id}
            >


              <div className="user-top">


                <div className="avatar">

                  <User size={28}/>

                </div>


                <div>


                  <h3>
                    {user.name}
                  </h3>


                  <span>
                    {user.role || "User"}
                  </span>


                </div>


              </div>

                            <div className="user-details">


                <div className="detail-row">

                  <Mail size={16}/>

                  <p>
                    {user.email}
                  </p>

                </div>



                <div className="detail-row">

                  <Phone size={16}/>

                  <p>
                    {user.phone || "No Phone"}
                  </p>

                </div>



                <div className="detail-row">

                  <Calendar size={16}/>

                  <p>

                    {
                      user.createdAt
                      ?
                      new Date(
                        user.createdAt
                      ).toLocaleDateString()
                      :
                      "N/A"
                    }

                  </p>

                </div>


              </div>





              <div className="user-actions">


                <button

                  className="view-btn"

                  onClick={() =>
                    setSelectedUser(user)
                  }

                >

                  <Eye size={17}/>

                  View Profile

                </button>





                <button

                  className="delete-btn"

                  onClick={() =>
                    handleDelete(user._id)
                  }

                >

                  <Trash2 size={17}/>

                  Delete

                </button>



              </div>



            </div>


          ))}


        </div>


      )}






      {
        filteredUsers.length === 0 &&
        !loading &&

        (

          <div className="empty-users">


            <ShieldCheck size={45}/>


            <h3>
              No Users Found
            </h3>


            <p>
              Koi user available nahi hai.
            </p>


          </div>

        )

      }





      {/* USER PROFILE MODAL */}

      {
        selectedUser &&

        (

          <div className="profile-overlay">


            <div className="profile-modal">


              <button

                className="close-modal"

                onClick={() =>
                  setSelectedUser(null)
                }

              >

                ×

              </button>





              <div className="modal-avatar">


                <User size={40}/>


              </div>





              <h2>

                {selectedUser.name}

              </h2>





              <div className="modal-info">


                <p>

                  <Mail size={17}/>

                  {selectedUser.email}

                </p>





                <p>

                  <Phone size={17}/>

                  {
                    selectedUser.phone ||
                    "Not Available"
                  }

                </p>





                <p>

                  <ShieldCheck size={17}/>

                  Role:
                  {" "}
                  {
                    selectedUser.role ||
                    "User"
                  }

                </p>





                <p>

                  <Calendar size={17}/>

                  Joined:

                  {" "}

                  {
                    selectedUser.createdAt
                    ?
                    new Date(
                      selectedUser.createdAt
                    ).toLocaleDateString()
                    :
                    "N/A"
                  }


                </p>



              </div>



            </div>



          </div>


        )

      }



    </div>

  );

}



export default ManageUsers;