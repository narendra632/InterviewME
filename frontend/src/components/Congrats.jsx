import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Congrats = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/interview");
    }, 3000); // 3-second loading screen

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Congratulations!</h1>
      <p>You have been shortlisted. Redirecting to the interview details...</p>
    </div>
  );
};

export default Congrats;