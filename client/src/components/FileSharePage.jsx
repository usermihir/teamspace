// FileSharePage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { initSocket } from "../Socket.js";
import axios from "axios";

const FileSharePage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || "Anonymous";

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [comment, setComment] = useState("");
  const [roomUsers, setRoomUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = initSocket();
    const socket = socketRef.current;

    socket.emit("join-file-room", roomId);
    socket.emit("join", { roomId, username });

    socket.on("file-uploaded", (file) => {
      setFiles((prev) => [...prev, file]);
    });

    socket.on("new-comment", ({ fileId, comment }) => {
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId ? { ...file, comments: [...file.comments, comment] } : file
        )
      );
    });

    socket.on("room-users", (users) => setRoomUsers(users));

    return () => {
      socket.emit("leave-file-room", roomId);
      socket.off("file-uploaded");
      socket.off("new-comment");
      socket.off("room-users");
    };
  }, [roomId]);

  const uploadFile = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("username", username);
    formData.append("roomId", roomId);

    try {
      await axios.post("http://localhost:5000/upload", formData);
      setSelectedFile(null);
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const addComment = (fileId) => {
    if (!comment.trim()) return;
    const newComment = { user: username, text: comment };
    socketRef.current.emit("add-comment", { fileId, comment: newComment });
    setComment("");
  };

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomId);
    alert("✅ Room ID copied to clipboard!");
  };

  const handleLeaveRoom = () => {
    socketRef.current.emit("leave-file-room", roomId);
    navigate("/"); // redirect to homepage
  };

  return (
    <div
  className="vh-100 d-flex flex-column"
  style={{
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    backgroundAttachment: "fixed",
    fontFamily: "'Fira Code', monospace",
    color: "white",
    overflow: "hidden",
    position: "relative",
  }}
>
  {/* 🔝 Navbar */}
  <nav
    className="navbar navbar-dark px-4 py-2"
    style={{
      background: "rgba(0, 0, 0, 0.7)",
      backdropFilter: "blur(8px)",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
    }}
  >
    <span className="navbar-brand fw-bold neon-text">📁 File Room: {roomId}</span>
    <div className="d-flex gap-2">
      <button onClick={handleCopyRoom} className="btn btn-outline-info btn-sm neon-btn">
        📋 Copy Room
      </button>
      <button onClick={handleLeaveRoom} className="btn btn-danger btn-sm neon-btn">
        🚪 Leave Room
      </button>
    </div>
  </nav>

  {/* 🎨 Circuit Background */}
  <div
    style={{
      backgroundImage: "url('/images/circuit.svg')",
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      opacity: 0.05,
      backgroundSize: "cover",
      backgroundPosition: "center",
      zIndex: 0,
    }}
  />

  {/* 🗂 Upload Area */}
  <div className="container mt-4 z-1" style={{ maxWidth: "800px" }}>
    <div
      className="p-4 rounded-4 mb-4"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 0 20px rgba(0,255,255,0.1)",
      }}
    >
      <input
        type="file"
        onChange={(e) => setSelectedFile(e.target.files[0])}
        className="form-control mb-3 bg-dark text-white border-info"
      />
      <button className="btn btn-outline-info w-100 neon-btn fw-bold" onClick={uploadFile}>
        🚀 Upload File
      </button>
    </div>

    {/* 📁 File List */}
    <div className="overflow-auto" style={{ maxHeight: "60vh" }}>
      {files.map((file) => (
        <div
          key={file.id}
          className="card mb-4 border-0 text-light"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div className="card-body">
            <h5 className="text-info">{file.name}</h5>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-warning"
            >
              View File 🔗
            </a>

            {/* 💬 Comments */}
            <div className="mt-3">
              <strong className="text-info">💬 Comments:</strong>
              <ul className="mt-2">
                {file.comments.map((c, i) => (
                  <li key={i}>
                    <strong className="text-light">{c.user}:</strong>{" "}
                    <span className="text-white-50">{c.text}</span>
                  </li>
                ))}
              </ul>

              <div className="input-group mt-2">
                <input
                  type="text"
                  className="form-control bg-dark text-white border-info"
                  placeholder="Add comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  className="btn btn-outline-info"
                  onClick={() => addComment(file.id)}
                >
                  ➕ Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* 👥 Online Users Top Right */}
  <div
    className="position-fixed top-0 end-0 m-3 p-3 rounded-4 text-white"
    style={{
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      boxShadow: "0 0 15px rgba(0, 255, 255, 0.2)",
      zIndex: 1000,
      width: "260px",
    }}
  >
    <h6 className="text-info mb-2">
      🧑‍💻 {roomUsers.length} {roomUsers.length === 1 ? "User" : "Users"} Online
    </h6>
    <ul className="list-unstyled mb-0" style={{ fontSize: "14px" }}>
      {roomUsers.map((user) => (
        <li key={user.socketId}>
          <span className="text-light">{user.username}</span>
        </li>
      ))}
    </ul>
  </div>
</div>

  );
};

export default FileSharePage;
