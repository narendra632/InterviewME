import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CSS/Interview.css";

const Interview = () => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [transcribedText, setTranscribedText] = useState("");

  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const socketRef = useRef(null);
  const recognitionRef = useRef(null);

  // Handle camera logic
  React.useEffect(() => {
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

  // Start the WebSocket and recording
  const startRecording = () => {
    setIsRecording(true);

    // Initialize WebSocket connection
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

    // Start audio recording
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

          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(audioBlob);
          }

          audioChunksRef.current = [];
        };

        mediaRecorderRef.current.start();
      })
      .catch((err) => console.error("Error accessing audio:", err));
  };

  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // Stop speech recognition
    }
  
    if (socketRef.current && isConnected) {
      // Send the transcribed text to WebSocket as before
      socketRef.current.send(transcribedText); 
      console.log(transcribedText);
      
      
      // Prepare data for API call
      const apiData = {
        ans: transcribedText, // Transcribed text
        que: messages.join("\n") // Combine all messages into a single string
      };
  
      // Make the API call
      fetch("http://localhost:3000/stats", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch interview stats");
          }
          return response.json();
        })
        .then((data) => {
          console.log("Interview Evaluation Response:", data);
          // Handle the evaluation response as needed, e.g., display in UI
        })
        .catch((error) => {
          console.error("Error during API call:", error);
        });

        navigate("/end");
    }
  };

  return (
    <div className="flex flex-col items-center p-8 space-y-8">
      <div className="grid grid-cols-12 gap-6 w-full">
        {/* Camera Section */}
        <div className="col-span-8 bg-white p-4 rounded-lg shadow-md">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-[480px] object-cover rounded-md"
          />
        </div>

        {/* AI Responses */}
        <div className="col-span-4 bg-white p-4 rounded-lg shadow-md space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">AI Responses</h3>
          <div className="h-60 overflow-y-auto">
            {messages.length ? (
              messages.map((msg, idx) => (
                <p key={idx} className="text-orange-500">
                  {msg}
                  <br />
                  <br />
                </p>
              ))
            ) : (
              <p className="text-gray-400">No responses yet...</p>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex ml-[920px] space-x-4">
        <p
          className={`text-sm font-semibold ${
            isConnected ? "text-green-500" : "text-red-500"
          }`}
        >
          Status: {isConnected ? "Connected to AI" : "Disconnected"}
        </p>
        <button
          onClick={startRecording}
          disabled={isConnected || isRecording}
          className={`px-4 py-2 rounded ${
            isRecording || isConnected
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          Start Interview
        </button>
        <button
          onClick={stopRecording}
          disabled={!isConnected}
          className={`px-6 py-2 rounded ${
            !isConnected
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-red-500 text-white hover:bg-red-600"
          }`}
        >
          Stop Interview
        </button>
      </div>
    </div>
  );
};

export default Interview;
