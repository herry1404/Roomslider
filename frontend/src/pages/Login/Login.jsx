import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";
import { FaApple, FaFacebookF } from "react-icons/fa";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import heroRoom from "../../assets/images/hero-room.webp";

function Login() {

  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };


  const goAfterLogin = (result) => {

    toast.success(result.message || "Login successful");

    if (result.needsPhone) {

      navigate("/complete-profile", { replace: true });
      return;

    }

    if (result.user?.role === "admin") {

      navigate("/admin/dashboard", { replace: true });

    } else {

      navigate("/", { replace: true });

    }

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    const { identifier, password } = formData;


    if (!identifier.trim()) {

      toast.error("Email or phone number is required");
      return;

    }


    if (!password.trim()) {

      toast.error("Password is required");
      return;

    }



    try {

      setLoading(true);


      const result = await login({
        identifier: identifier.trim(),
        password,
      });


      if (result.success) {

        goAfterLogin(result);

      }



    } catch (error) {


      console.error(
        "❌ Login Error:",
        error
      );


      toast.error(
        error.response?.data?.message ||
        "Login failed"
      );



    } finally {


      setLoading(false);


    }


  };


  const handleGoogleSuccess = async (credentialResponse) => {

    try {

      const result = await googleLogin(credentialResponse.credential);

      if (result.success) {

        goAfterLogin(result);

      }

    } catch (error) {

      console.error("❌ Google Login Error:", error);

      toast.error(
        error.response?.data?.message ||
        "Google login failed"
      );

    }

  };


  const handleSocialLogin = (provider) => {

    toast(`${provider} Login Coming Soon 🚀`);

  };



  return (

    <>

      <Helmet>

        <title>
          Login | RoomSlider
        </title>

      </Helmet>




      <section
        className="login-page"
        style={{
          backgroundImage: `url(${heroRoom})`,
        }}
      >


        <div className="login-overlay">



          <div className="login-card">



            <div className="login-logo">

              <h1>
                RoomSlider
              </h1>


              <p>
                Verified Living
              </p>


            </div>





            <form onSubmit={handleSubmit}>



              <div className="input-box">


                <User size={18} />


                <input

                  type="text"

                  name="identifier"

                  placeholder="Email or Phone Number"

                  value={formData.identifier}

                  onChange={handleChange}

                  autoComplete="username"

                />


              </div>







              <div className="input-box">


                <Lock size={18} />


                <input

                  type={showPassword ? "text" : "password"}

                  name="password"

                  placeholder="Password"

                  value={formData.password}

                  onChange={handleChange}

                  autoComplete="current-password"

                />


                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{ cursor: "pointer" }}
                >

                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}

                </span>


              </div>



              <div style={{ textAlign: "right", marginTop: "-8px", marginBottom: "12px" }}>

                <Link
                  to="/forgot-password"
                  style={{ fontSize: "13px", color: "#6b7280" }}
                >
                  Forgot Password?
                </Link>

              </div>




              <button

                type="submit"

                className="login-btn"

                disabled={loading}

              >

                {
                  loading
                    ? "LOGGING..."
                    : "LOGIN"
                }


              </button>



            </form>







            <div className="login-divider">

              <span>
                OR
              </span>


            </div>




            <div className="social-login-row">

              <div className="social-btn social-btn--google-wrapper">

                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    toast.error("Google login failed");
                  }}
                  size="large"
                  width="100%"
                  text="continue_with"
                />

              </div>

            </div>


            <div className="social-login-row">

              <button
                type="button"
                className="social-btn social-btn--apple"
                onClick={() => handleSocialLogin("Apple")}
              >
                <FaApple size={20} />
                <span>Apple</span>
              </button>

              <button
                type="button"
                className="social-btn social-btn--facebook"
                onClick={() => handleSocialLogin("Facebook")}
              >
                <FaFacebookF size={18} />
                <span>Facebook</span>
              </button>

            </div>








            <div className="signup-area">


              <span>

                New to RoomSlider?

              </span>




              <Link

                to="/register"

                className="signup-btn"

              >


                <UserPlus size={18} />


                Sign Up



              </Link>




            </div>









            <div className="login-footer">


              <p>

                Verified Accommodations

              </p>




              <span>

                Rooms &nbsp; | &nbsp;

                PG &nbsp; | &nbsp;

                Hostels &nbsp; | &nbsp;

                Flats


              </span>



            </div>






          </div>





        </div>





      </section>




    </>

  );

}

export default Login;
