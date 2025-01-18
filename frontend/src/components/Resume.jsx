import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/Resume.css";

const Resume = () => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      navigate("/interview"); // Navigate to the Interview page on successful upload
    }
  };

  return (
    <div className="resume-upload-container rounded-lg">
      <div className="upload-card">
        <h2 className="upload-heading">Please Upload Your Resume</h2>
        <form onSubmit={handleSubmit}>
          <input type="file" accept=".pdf" onChange={handleFileChange} />
          <button type="submit">{file ? "Submit" : "Upload"}</button>
        </form>
      </div>
    </div>
  );
};

export default Resume;
