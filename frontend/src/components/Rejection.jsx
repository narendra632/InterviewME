import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Rejection = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000); // 3-second loading screen

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>We are Sorry to inform!!</h1>
      <p>You have not been shortlisted. Redirecting to the Home page...</p>
    </div>
  );
};

export default Rejection;