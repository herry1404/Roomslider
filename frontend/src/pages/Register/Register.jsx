import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
} from "lucide-react";

import { toast } from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";

import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

import heroRoom from "../../assets/images/hero-room.webp";


function Register() {

  const navigate = useNavigate();

  const { googleLogin } = useAuth();


  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });


  const [loading, setLoading] = useState(false);

  const [agreedToTerms, setAgreedToTerms] = useState(false);



  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };



  const handleSubmit = async (e) => {

    e.preventDefault();


    const {
      name,
      email,
      phone,
      password,
      confirmPassword
    } = formData;



    // Frontend Validation

    if(!name.trim()){
      toast.error("Name is required");
      return;
    }


    if(!email){
      toast.error("Email is required");
      return;
    }


    if(phone.length !== 10){
      toast.error("Enter valid mobile number");
      return;
    }


    if(password.length < 6){
      toast.error("Password must be minimum 6 characters");
      return;
    }


    if(password !== confirmPassword){
      toast.error("Password not matching");
      return;
    }


    if(!agreedToTerms){
      toast.error("Please agree to the Terms of Use and Privacy Policy");
      return;
    }



    try {

      setLoading(true);


      const response = await api.post(
        "/auth/register",
        {
          name,
          email,
          phone,
          password
        }
      );


      toast.success(
        response.data.message || "Account created successfully"
      );


      navigate("/login");


    } 
    catch(error){

      console.log(error);


      toast.error(
        error.response?.data?.message ||
        "Registration failed"
      );

    }
    finally{

      setLoading(false);

    }


  };



  const handleGoogleSuccess = async (credentialResponse) => {

    try {

      const result = await googleLogin(credentialResponse.credential);

      if (result.success) {

        toast.success(result.message || "Account created successfully");

        if (result.needsPhone) {

          navigate("/complete-profile", { replace: true });

        } else {

          navigate("/", { replace: true });

        }

      }

    } catch (error) {

      console.error("❌ Google Signup Error:", error);

      toast.error(
        error.response?.data?.message ||
        "Google signup failed"
      );

    }

  };



  return (
    <>
      <Helmet>
        <title>Create Account | RoomSlider</title>
      </Helmet>


      <section
        className="register-page"
        style={{
          backgroundImage: `url(${heroRoom})`,
        }}
      >

        <div className="register-overlay">

          <div className="register-card">


            <div className="register-logo">

              <h1>RoomSlider</h1>

              <p>Create your account</p>

            </div>



            <form onSubmit={handleSubmit}>


              <div className="input-box">

                <User size={18} />

                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                />

              </div>



              <div className="input-box">

                <Mail size={18} />

                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                />

              </div>



              <div className="input-box">

                <Phone size={18} />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Mobile Number"
                  value={formData.phone}
                  onChange={handleChange}
                />

              </div>



              <div className="input-box">

                <Lock size={18} />

                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                />

                <Eye size={18}/>

              </div>



              <div className="input-box">

                <Lock size={18} />

                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />

                <Eye size={18}/>

              </div>



              <div className="terms-checkbox-row">

                <label>

                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />

                  <span>
                    I agree to the{" "}
                    <Link to="/terms" target="_blank">Terms of Use</Link>
                    {" "}and{" "}
                    <Link to="/privacy" target="_blank">Privacy Policy</Link>
                  </span>

                </label>

              </div>



              <button
                type="submit"
                className="register-btn"
                disabled={loading}
              >

                {
                  loading 
                  ? "CREATING..."
                  : "CREATE ACCOUNT"
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
                    toast.error("Google signup failed");
                  }}
                  size="large"
                  width="100%"
                  text="signup_with"
                />

              </div>

            </div>



            <div className="login-area">


              <div className="login-divider">

                <span>
                  Already have an account?
                </span>

              </div>



              <Link
                to="/login"
                className="login-btn-outline"
              >
                Login
              </Link>


            </div>




            <div className="register-footer">

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


export default Register;
