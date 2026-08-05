import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, IndianRupee, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

import "../../styles/wishlist.css";


function Wishlist() {

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();



  const fetchWishlist = async () => {

    try {

      if(!user){

        toast.error("Please login first");
        setLoading(false);
        return;

      }


      const res = await api.get("/wishlist",{

        headers:{
          Authorization:
          `Bearer ${localStorage.getItem("token")}`
        }

      });


      setWishlist(
        res.data.wishlist || []
      );


    } catch(error){

      console.error(
        "Wishlist Error:",
        error
      );


      toast.error(
        error.response?.data?.message ||
        "Wishlist load failed"
      );


    } finally{

      setLoading(false);

    }

  };




  const removeWishlist = async(roomId)=>{

    try{


      await api.delete(
        `/wishlist/${roomId}`,
        {
          headers:{
            Authorization:
            `Bearer ${localStorage.getItem("token")}`
          }
        }
      );


      setWishlist(
        wishlist.filter(
          item=>item._id !== roomId
        )
      );


      toast.success(
        "Removed from wishlist"
      );


    }catch{

      toast.error(
        "Remove failed"
      );

    }

  };




  useEffect(()=>{

    fetchWishlist();

  },[]);




  if(loading){

    return (
      <div className="wishlist-loading">
        Loading Wishlist...
      </div>
    );

  }




  return (

    <section className="wishlist-page">


      <div className="container">


        <div className="wishlist-header">

          <h1>
            My Wishlist ❤️
          </h1>


          <p>
            Your favourite rooms saved here
          </p>

        </div>





        {
          wishlist.length === 0 ? (

            <div className="empty-wishlist">

              <Heart size={50}/>

              <h2>
                No rooms added yet
              </h2>


              <Link to="/rooms">
                Explore Rooms
              </Link>


            </div>


          ) : (


            <div className="wishlist-grid">


              {
                wishlist.map((room)=>(


                  <div
                    className="wishlist-card"
                    key={room._id}
                  >


                    <img
                      src={room.images?.[0] || "https://via.placeholder.com/400x250"}
                      alt={room.title}
                    />



                    <div className="wishlist-content">


                      <h2>
                        {room.title}
                      </h2>



                      <p className="location">

                        <MapPin size={16}/>

                        {room.location}

                      </p>




                      <p className="price">

                        <IndianRupee size={16}/>

                        {room.price}/month

                      </p>




                      <button
                        onClick={()=>
                          removeWishlist(room._id)
                        }
                      >

                        <Trash2 size={16}/>

                        Remove

                      </button>



                    </div>



                  </div>


                ))
              }


            </div>


          )
        }



      </div>


    </section>

  );

}


export default Wishlist;