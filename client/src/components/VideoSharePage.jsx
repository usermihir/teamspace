import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { initSocket } from "../Socket";

const VideoSharePage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || "Anonymous";

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socketRef = useRef(null);
  const localStream = useRef(null);

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    document.body.className = theme === "dark" ? "bg-dark text-white" : "bg-light text-dark";
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    socketRef.current = initSocket();
    const socket = socketRef.current;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStream.current = stream;
        localVideoRef.current.srcObject = stream;

        peerConnection.current = new RTCPeerConnection(config);
        stream.getTracks().forEach((track) => peerConnection.current.addTrack(track, stream));

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", { candidate: event.candidate, roomId });
          }
        };

        peerConnection.current.ontrack = (event) => {
          remoteVideoRef.current.srcObject = event.streams[0];
        };

        socket.emit("join-video-room", roomId);

        socket.on("offer", async ({ offer }) => {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit("answer", { answer, roomId });
        });

        socket.on("answer", async ({ answer }) => {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("ice-candidate", ({ candidate }) => {
          peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on("ready", async () => {
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          socket.emit("offer", { offer, roomId });
        });
      });

    return () => {
      localStream.current?.getTracks().forEach((track) => track.stop());
      socket.emit("leave-video-room", roomId);
      socketRef.current.disconnect();
    };
  }, [roomId]);

  const toggleAudio = () => {
    const audioTrack = localStream.current?.getAudioTracks()?.[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStream.current?.getVideoTracks()?.[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(roomId);
    alert("✅ Room ID copied to clipboard!");
  };

  const handleLeaveRoom = () => {
    socketRef.current.emit("leave-video-room", roomId);
    navigate("/");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div
  className={`vh-100 d-flex flex-column`}
  style={{
    fontFamily: "'Fira Code', monospace",
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    color: theme === "dark" ? "#fff" : "#000",
    position: "relative",
    overflow: "hidden",
  }}
>
  {/* 🧠 Glowing Circuit Background */}
  <div
    style={{
      position: "absolute",
      width: "100%",
      height: "100%",
      backgroundImage: "url('/images/circuit.svg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      opacity: 0.04,
      zIndex: 0,
    }}
  />

  {/* 🔝 Navbar */}
  {/* 🔝 Navbar */}
<nav
  className="d-flex justify-content-between align-items-center px-4 py-2"
  style={{
    zIndex: 1000,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  }}
>
  {/* Left side: Copy and Leave */}
  <div className="d-flex gap-2 align-items-center">
    <button className="btn btn-outline-info btn-sm neon-btn" onClick={handleCopyRoom}>
      📋 Copy Room
    </button>
    <button className="btn btn-outline-danger btn-sm neon-btn" onClick={handleLeaveRoom}>
      🚪 Leave
    </button>
  </div>

  {/* Right side: Theme, Mute, Video */}
  <div className="d-flex gap-3 align-items-center">
    {/* 🌓 Theme Toggle */}
    <div
      onClick={toggleTheme}
      style={{
        cursor: "pointer",
        width: "60px",
        height: "30px",
        background: theme === "dark" ? "#343a40" : "#ccc",
        borderRadius: "15px",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "3px",
          left: theme === "dark" ? "32px" : "3px",
          width: "24px",
          height: "24px",
          background: theme === "dark" ? "#f8f9fa" : "#212529",
          borderRadius: "50%",
          transition: "left 0.3s",
        }}
      />
    </div>

    <button className="btn btn-sm btn-warning neon-btn" onClick={toggleAudio}>
      {isAudioMuted ? "🔊 Unmute" : "🔇 Mute"}
    </button>
    <button className="btn btn-sm btn-danger neon-btn" onClick={toggleVideo}>
      {isVideoOff ? "🎥 Video On" : "📴 Video Off"}
    </button>
  </div>
</nav>


  {/* 🎥 Video Section */}
  <div className="container-fluid mt-4 z-1">
    <div className="row">
      <div className="col-md-6 mb-4">
        <div
          className="p-2 rounded-4 border border-info"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 20px rgba(0,255,255,0.1)",
          }}
        >
          <h5 className="mb-2 text-info">{username} (You)</h5>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-100 rounded"
            style={{ border: "1px solid #17c0eb" }}
          />
        </div>
      </div>
      <div className="col-md-6 mb-4">
        <div
          className="p-2 rounded-4 border border-info"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 20px rgba(0,255,255,0.1)",
          }}
        >
          <h5 className="mb-2 text-warning">Peer</h5>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-100 rounded"
            style={{ border: "1px solid #ffdd59" }}
          />
        </div>
      </div>
    </div>
  </div>
</div>

  );
};

export default VideoSharePage;
