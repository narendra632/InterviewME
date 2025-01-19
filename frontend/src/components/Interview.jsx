import React, { useState, useRef } from "react";
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

  // Stop recording and close the WebSocket
  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
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
