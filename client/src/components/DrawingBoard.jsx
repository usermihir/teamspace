import React, { useRef, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useLocation, useParams,useNavigate } from "react-router-dom";
import "../DrawingBoard.css";

const socket = io("http://localhost:5000");

const DrawingBoard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("black");
  const [lastPosition, setLastPosition] = useState({ x: null, y: null });
  const [isDark, setIsDark] = useState(true);
  const [roomUsers, setRoomUsers] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
  const username = location.state?.username || "Anonymous";

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineWidth = 5;
    ctx.strokeStyle = color;
    ctxRef.current = ctx;

    socket.emit("join", { roomId, username });
    socket.emit("join-drawing-room", roomId);

    socket.on("draw-line", ({ x0, y0, x1, y1, color, tool, text }) => {
      switch (tool) {
        case "eraser":
          remoteEraseLine(x0, y0, x1, y1);
          break;
        case "rectangle":
          drawRectangle(x0, y0, x1, y1, color);
          break;
        case "circle":
          drawCircle(x0, y0, x1, y1, color);
          break;
        case "arrow":
          drawArrow(x0, y0, x1, y1, color);
          break;
        case "text":
          drawText(x1, y1, text, color);
          break;
        default:
          drawLine(x0, y0, x1, y1, color);
      }
    });

    socket.on("room-users", (users) => {
      setRoomUsers(users);
    });

    return () => {
      socket.off("draw-line");
      socket.off("room-users");
    };
  }, [roomId]);

  const toggleBackground = () => setIsDark(prev => !prev);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    setLastPosition({ x: offsetX, y: offsetY });
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
  };

  const finishDrawing = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const { x, y } = lastPosition;

    if (tool === "rectangle") drawRectangle(x, y, offsetX, offsetY, color);
    else if (tool === "circle") drawCircle(x, y, offsetX, offsetY, color);
    else if (tool === "arrow") drawArrow(x, y, offsetX, offsetY, color);
    else if (tool === "text") {
      const text = prompt("Enter text:");
      if (text) {
        drawText(offsetX, offsetY, text, color);
        socket.emit("draw-line", {
          roomId,
          x0: x,
          y0: y,
          x1: offsetX,
          y1: offsetY,
          color,
          tool: "text",
          text,
        });
      }
    }

    setIsDrawing(false);
    setLastPosition({ x: null, y: null });
    ctxRef.current.closePath();
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || ["rectangle", "circle", "arrow", "text"].includes(tool)) return;
    const { offsetX, offsetY } = nativeEvent;
    const { x, y } = lastPosition;

    if (tool === "eraser") {
      eraseLine(x, y, offsetX, offsetY);
    } else {
      ctxRef.current.strokeStyle = color;
      ctxRef.current.lineTo(offsetX, offsetY);
      ctxRef.current.stroke();
    }

    socket.emit("draw-line", {
      roomId,
      x0: x,
      y0: y,
      x1: offsetX,
      y1: offsetY,
      color,
      tool,
    });

    setLastPosition({ x: offsetX, y: offsetY });
  };

  const drawLine = (x0, y0, x1, y1, strokeColor) => {
    const ctx = ctxRef.current;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = 5;
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  };

  const eraseLine = (x0, y0, x1, y1) => {
    const ctx = ctxRef.current;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  };

  const remoteEraseLine = (x0, y0, x1, y1) => {
    const ctx = ctxRef.current;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.closePath();
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  };

  const drawRectangle = (x0, y0, x1, y1, strokeColor) => {
    const ctx = ctxRef.current;
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.restore();
    socket.emit("draw-line", { roomId, x0, y0, x1, y1, color: strokeColor, tool: "rectangle" });
  };

  const drawCircle = (x0, y0, x1, y1, strokeColor) => {
    const ctx = ctxRef.current;
    const radius = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.arc(x0, y0, radius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
    socket.emit("draw-line", { roomId, x0, y0, x1, y1, color: strokeColor, tool: "circle" });
  };

  const drawArrow = (x0, y0, x1, y1, strokeColor) => {
    const ctx = ctxRef.current;
    const headlen = 10;
    const angle = Math.atan2(y1 - y0, x1 - x0);
    ctx.save();
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1 - headlen * Math.cos(angle - Math.PI / 6), y1 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - headlen * Math.cos(angle + Math.PI / 6), y1 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
    ctx.restore();
    socket.emit("draw-line", { roomId, x0, y0, x1, y1, color: strokeColor, tool: "arrow" });
  };

  const drawText = (x, y, text, strokeColor) => {
    const ctx = ctxRef.current;
    ctx.save();
    ctx.fillStyle = strokeColor;
    ctx.font = "20px Arial";
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };

  const COLORS = ["black", "red", "blue", "green", "purple", "orange", "brown", "gray", "pink", "yellow"];

  const handleCopyRoom = () => {
  navigator.clipboard.writeText(roomId);
  alert("Room ID copied to clipboard!");
};

const handleLeaveRoom = () => {
  socket.disconnect();
  navigate("/");
};

const getTextColor = () => (isDark ? "text-white" : "text-dark");


  return (
<div
  className={`position-relative w-100 vh-100 ${isDark ? "bg-dark text-white" : "bg-white text-dark"}`}
  style={{
    background: isDark
      ? "linear-gradient(135deg, #0f0c29, #302b63, #24243e)"
      : "#fff",
    fontFamily: "'Fira Code', monospace",
    overflow: "hidden",
  }}
>
  {/* Theme Toggle */}
  <div
    className="position-fixed top-0 end-0 m-3 z-3"
    onClick={toggleBackground}
    style={{ cursor: "pointer", zIndex: 1000 }}
  >
    <div
      className={`rounded-pill p-1 d-flex align-items-center ${
        isDark ? "bg-light" : "bg-dark"
      }`}
      style={{
        width: "60px",
        height: "30px",
        position: "relative",
        boxShadow: "0 0 8px #00f2ff",
      }}
    >
      <div
        className="rounded-circle bg-info"
        style={{
          width: "24px",
          height: "24px",
          transition: "all 0.3s",
          transform: isDark ? "translateX(30px)" : "translateX(0)",
        }}
      ></div>
    </div>
  </div>

  {/* Toolbar */}
  <div className="position-fixed top-0 start-50 translate-middle-x mt-3 d-flex flex-column align-items-center z-3">
    <div
      className="d-flex gap-2 mb-3 px-4 py-2 rounded-4 shadow-lg bg-white bg-opacity-10 border border-info backdrop-blur flex-wrap justify-content-center"
      style={{ zIndex: 1000 }}
    >
      {[
  { type: "pen", icon: "bi-pencil" },
  { type: "eraser", icon: "bi-eraser" },
  { type: "rectangle", icon: "bi-square" },
  { type: "circle", icon: "bi-circle" },
  { type: "arrow", icon: "bi-arrow-up-right" },
  { type: "text", icon: "bi-fonts" },
].map(({ type, icon }) => (
  <button
    key={type}
    onClick={() => setTool(type)}
    className={`${getTextColor()} btn btn-sm neon-btn d-flex align-items-center gap-1 ${
      tool === type ? "btn-primary" : "btn-outline-light"
    }`}
  >
    <i className={`bi ${icon}`}></i>
    <span className="d-none d-sm-inline">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
  </button>
))}

      <button onClick={clearCanvas} className="btn btn-warning text-white neon-btn">
        Clear
      </button>
    </div>

    {/* Color Picker */}
    <div className="d-flex justify-content-center gap-2 flex-wrap">
      {COLORS.map((c) => (
        <button
          key={c}
          onClick={() => setColor(c)}
          disabled={tool === "eraser"}
          className={`rounded-circle border ${
            color === c ? "border-3 border-white" : "border-1 border-secondary"
          }`}
          style={{
            backgroundColor: c,
            width: "30px",
            height: "30px",
            cursor: tool === "eraser" ? "not-allowed" : "pointer",
            opacity: tool === "eraser" ? 0.5 : 1,
          }}
        />
      ))}
    </div>
  </div>

  {/* Canvas */}
  <canvas
    ref={canvasRef}
    className="position-absolute top-0 start-0 w-100 h-100"
    onMouseDown={startDrawing}
    onMouseUp={finishDrawing}
    onMouseMove={draw}
  />

  {/* Room Buttons */}
  <div
    className="position-fixed bottom-0 start-0 m-3 d-flex flex-column gap-2"
    style={{ zIndex: 1000 }}
  >
    <button className={`${getTextColor()} btn btn-outline-light btn-sm neon-btn`} onClick={handleCopyRoom}>
      📋 Copy Room
    </button>
    <button className={`${getTextColor()} btn btn-danger btn-sm neon-btn" onClick={handleLeaveRoom}`}>
      🚪 Leave Room
    </button>
  </div>

  {/* Online Users List */}
  <div
    className="position-fixed bottom-0 end-0 m-3 p-3 rounded-4 bg-dark bg-opacity-75 text-white"
    style={{
      maxWidth: "280px",
      boxShadow: "0 0 15px rgba(0, 255, 255, 0.4)",
      zIndex: 999,
    }}
  >
    <h6 className="mb-2">🧑‍🤝‍🧑 {roomUsers.length} online</h6>
    <ul className="list-unstyled mb-0" style={{ fontSize: "14px" }}>
      {roomUsers.map((user) => (
        <li key={user.socketId}>
          <strong>{user.username}</strong>
        </li>
      ))}
    </ul>
  </div>
</div>

  );
};
export default DrawingBoard;