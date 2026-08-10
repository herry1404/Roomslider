import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

function ForgotPassword() {

  return (

    <>

      <Helmet>
        <title>Forgot Password | RoomSlider</title>
      </Helmet>

      <section style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        textAlign: "center",
      }}>

        <h2 style={{ marginBottom: "12px", fontSize: "22px", fontWeight: 700 }}>
          Password Reset Coming Soon
        </h2>

        <p style={{ marginBottom: "20px", color: "#6b7280", fontSize: "14px", maxWidth: "360px" }}>
          This feature is being set up. For now, please contact support to reset your password.
        </p>

        <Link to="/login" style={{ color: "#16a34a", fontWeight: 600 }}>
          Back to Login
        </Link>

      </section>

    </>

  );

}

export default ForgotPassword;
