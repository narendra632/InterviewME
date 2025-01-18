import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/Resume.css";

const Resume = () => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
        setError('Please select a file first.');
        return;
    }

    const formData = new FormData();
    formData.append('pdf', file);

    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
        });

        navigate("/interview");

        if (response.ok) {
            const data = await response.text();
            setText(data);
            setError('');
        } else {
            setError('Error uploading file. Please try again.');
        }
    } catch (err) {
        setError('Error: ' + err.message);
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
