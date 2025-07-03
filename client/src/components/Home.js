import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [collabType, setCollabType] = useState("code");

  const navigate = useNavigate();

  const generateRoomId = (e) => {
    e.preventDefault();
    const id = uuid();
    setRoomId(id);
    toast.success("Room ID Generated!");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("Room ID and Username are required");
      return;
    }

    let route = "/";
    if (collabType === "code") route = `/editor/${roomId}`;
    else if (collabType === "drawing") route = `/drawing/${roomId}`;
    else if (collabType === "chatvoice") route = `/chatvoice/${roomId}`;
    else if (collabType === "fileshare") route = `/fileshare/${roomId}`;
    else if (collabType === "videoshare") route = `/videoshare/${roomId}`;
    else if (collabType === "kanban") route = `/kanban/${roomId}`;

    navigate(route, { state: { username } });
    toast.success("Joined Room!");
  };

  const handleEnter = (e) => {
    if (e.code === "Enter") joinRoom();
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        className="p-5 rounded-4 shadow-lg text-white position-relative"
        style={{
          maxWidth: "500px",
          width: "100%",
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        {/* Optional background */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            backgroundImage: "url('/images/circuit.svg')",
            opacity: 0.05,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 0,
          }}
        />

        <div className="position-relative z-1">
          <div className="text-center mb-4">
            <img
              src="/images/teamspace.png"
              alt="Logo"
              className="img-fluid mb-2"
              style={{ width: "80px" }}
            />
            <h2 className="fw-bold text-info">Join Collaboration Room</h2>
          </div>

          <div className="mb-3">
            <input
              type="text"
              className="form-control bg-transparent text-white border border-light"
              placeholder="ROOM ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyUp={handleEnter}
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              className="form-control bg-transparent text-white border border-light"
              placeholder="USERNAME"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyUp={handleEnter}
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-light">Select Collaboration Type</label>
            <div className="d-flex flex-wrap gap-2">
              {["code", "drawing", "chatvoice", "fileshare", "videoshare", "kanban"].map((type) => (
                <button
                  key={type}
                  className={`btn btn-sm ${
                    collabType === type ? "btn-warning text-dark" : "btn-outline-light"
                  }`}
                  onClick={() => setCollabType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-info w-100 fw-semibold"
            onClick={joinRoom}
          >
            Join Room
          </button>

          <p className="text-center mt-3">
            Don&apos;t have a Room ID?{" "}
            <span
              className="text-decoration-underline text-primary"
              style={{ cursor: "pointer" }}
              onClick={generateRoomId}
            >
              Generate One
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
