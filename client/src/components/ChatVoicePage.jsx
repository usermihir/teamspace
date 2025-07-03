// ChatVoicePage.js
import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { initSocket } from "../Socket.js";

const ChatVoicePage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const username = location.state?.username || "Anonymous";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [roomUsers, setRoomUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);

  const localStream = useRef(null);
  const socketRef = useRef(null);
  const handlersAttached = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    socketRef.current = initSocket();
    const socket = socketRef.current;

    console.log("[Socket] Emitting join-chat-room");
    socket.emit("join-chat-room", roomId);
    socket.emit("join", { roomId, username });

    if (!handlersAttached.current) {
      const handleReceiveMessage = ({ username, message, timestamp }) => {
        console.log(`[Receive Message] from ${username}:`, message);
        setMessages((prev) => [...prev, { username, message, timestamp }]);
      };

      const handleVoiceChunk = (chunk) => {
        console.log("[Voice] Received audio chunk");
        const audioBlob = new Blob([chunk], { type: "audio/webm" });
        const audioURL = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioURL);
        audio.play();
      };

      const handleRoomUsers = (users) => {
        setRoomUsers(users);
      };

      const handleTyping = ({ username: typingName }) => {
        if (typingName !== username) {
          setTypingUser(typingName);
          setTimeout(() => setTypingUser(null), 2000);
        }
      };

      console.log("[Socket] Attaching listeners");
      socket.on("receive-message", handleReceiveMessage);
      socket.on("receive-voice-chunk", handleVoiceChunk);
      socket.on("room-users", handleRoomUsers);
      socket.on("typing", handleTyping);

      handlersAttached.current = true;
    } else {
      console.log("[Socket] Listeners already attached");
    }

    return () => {
      console.log("[Socket] Leaving chat room");
      socket.emit("leave-chat-room", roomId);
    };
  }, [roomId, username]);

  const sendMessage = () => {
    if (input.trim()) {
      const timestamp = Date.now();
      console.log("[Send Message]", input);
      socketRef.current.emit("send-message", {
        roomId,
        username,
        message: input,
        timestamp,
      });
      setMessages((prev) => [...prev, { username: "You", message: input, timestamp }]);
      setInput("");
    }
  };

  const startVoice = async () => {
    try {
      console.log("[Voice] Starting voice capture");
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsSpeaking(true);
      socketRef.current.emit("voice-start", roomId);

      const mediaRecorder = new MediaRecorder(localStream.current, { mimeType: "audio/webm" });

      mediaRecorder.start();
      console.log("[Voice] MediaRecorder started");

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log("[Voice] Sending audio chunk");
          socketRef.current.emit("voice-chunk", { roomId, chunk: e.data });
        }
      };

      mediaRecorder.onstop = () => {
        console.log("[Voice] MediaRecorder stopped");
        socketRef.current.emit("voice-end", roomId);
        setIsSpeaking(false);
      };

      setTimeout(() => {
        mediaRecorder.stop();
        localStream.current.getTracks().forEach((track) => track.stop());
      }, 5000);
    } catch (err) {
      console.error("Mic access denied or error:", err);
    }
  };

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomId);
    alert("✅ Room ID copied to clipboard!");
  };

  const handleLeaveRoom = () => {
    socketRef.current.emit("leave-chat-room", roomId);
    navigate("/");
  };

  return (
    <div
      className="container-fluid py-4 vh-100 d-flex flex-column position-relative"
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        fontFamily: "'Fira Code', monospace",
        color: "white",
        overflow: "hidden",
      }}
    >
      {/* Top Navbar */}
<div
  className="d-flex justify-content-between align-items-center px-4 py-2 mb-3 rounded-bottom-4 shadow"
  style={{
    backgroundColor: "#1a1a2e",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    zIndex: 999,
  }}
>
  {/* Left Section */}
  <div className="d-flex gap-2">
    <button onClick={handleCopyRoom} className="btn btn-outline-light btn-sm neon-btn">
      📋 Copy Room
    </button>
    <button onClick={handleLeaveRoom} className="btn btn-danger btn-sm neon-btn">
      🚪 Leave Room
    </button>
  </div>

  {/* Right Section */}
  <div
    className="p-2 rounded-3 bg-dark bg-opacity-75 text-white"
    style={{
      boxShadow: "0 0 10px rgba(0, 255, 255, 0.2)",
      fontSize: "14px",
    }}
  >
    <h6 className="mb-1 text-info">
      🧑‍🤝‍🧑 {roomUsers.length} {roomUsers.length === 1 ? "user" : "users"} online
    </h6>
    <ul className="list-unstyled mb-0">
      {roomUsers.map((user) => (
        <li key={user.socketId}>
          <strong className="text-light">{user.username}</strong>
        </li>
      ))}
    </ul>
  </div>
</div>

      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          backgroundImage: "url('/images/circuit.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.03,
          zIndex: 0,
        }}
      />

      <div
        className="flex-grow-1 overflow-auto border rounded-4 p-3 bg-white bg-opacity-10 shadow-sm"
        style={{
          maxWidth: "100%",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          zIndex: 1,
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-2">
            <strong className="text-warning">{msg.username}:</strong>{" "}
            <span className="text-white-50">{msg.message}</span>
            <span className="ms-2 text-muted" style={{ fontSize: "0.8rem" }}>
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>

      {typingUser && typingUser !== username && (
        <div className="mt-2 text-info" style={{ fontSize: "0.85rem", zIndex: 1 }}>
          {typingUser} is typing...
        </div>
      )}

      <div className="d-flex mt-3 gap-2" style={{ maxWidth: "100%", zIndex: 1 }}>
        <input
          type="text"
          className="form-control bg-dark text-white border-info neon-input"
          placeholder="Type a message"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            socketRef.current.emit("typing", { roomId, username });
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button className="btn btn-info neon-btn fw-semibold" onClick={sendMessage}>
          Send
        </button>
        <button
          className={`btn fw-semibold neon-btn ${
            isSpeaking ? "btn-danger glow-pulse" : "btn-success"
          }`}
          onClick={startVoice}
        >
          {isSpeaking ? "🔴 Speaking..." : "🎤 Voice"}
        </button>
      </div>
    </div>
  );
};

export default ChatVoicePage;