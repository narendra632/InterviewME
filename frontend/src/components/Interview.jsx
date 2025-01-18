import React, { useState, useEffect, useRef } from "react";
import "./CSS/Interview.css";

const Interview = () => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);

  const localVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const socketRef = useRef(null);

  // Setup WebSocket connection
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8765");

    ws.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      setMessages((prev) => [...prev, event.data]);
    };

    socketRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  // Camera Setup
  useEffect(() => {
    if (isCameraOn) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("Error accessing the camera:", err));
    } else if (localVideoRef.current) {
      const stream = localVideoRef.current.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      localVideoRef.current.srcObject = null;
    }
  }, [isCameraOn]);

  // Start recording and sending audio to backend
  const startRecording = () => {
    setIsRecording(true);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });

          if (socketRef.current && isConnected) {
            socketRef.current.send(audioBlob);
          }

          audioChunksRef.current = [];
        };

        mediaRecorderRef.current.start();
      })
      .catch((err) => console.error("Error accessing audio:", err));
  };

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  };

  const toggleCamera = () => {
    setIsCameraOn((prev) => !prev);
  };

  return (
    <div className="interview-section">
      {/* Camera Section */}
      <div className="camera-box">
        <video ref={localVideoRef} autoPlay muted className="camera-feed" />
        <button className="camera-toggle" onClick={toggleCamera}>
          {isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
        </button>
      </div>

      {/* AI Responses */}
      <div className="response-box">
        <h3>AI Responses</h3>
        <div className="response-content">
          {messages.length ? (
            messages.map((msg, idx) => <p key={idx}>{msg}</p>)
          ) : (
            <p>No responses yet...</p>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="control-buttons">
        <p className={`status ${isConnected ? "connected" : "disconnected"}`}>
          Status: {isConnected ? "Connected to AI" : "Disconnected"}
        </p>
        <button
          onClick={startRecording}
          disabled={!isConnected || isRecording}
          className={`control-btn ${isRecording || !isConnected ? "disabled" : ""}`}
        >
          Start Interview
        </button>
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className={`control-btn ${!isRecording ? "disabled" : ""}`}
        >
          Stop Interview
        </button>
      </div>
    </div>
  );
};

export default Interview;
