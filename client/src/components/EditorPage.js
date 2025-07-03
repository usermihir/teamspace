import React, { useEffect, useRef, useState } from "react";
import Editor from "./Editor";
import { initSocket } from "../Socket";
import { ACTIONS } from "../Actions";
import { useNavigate, useLocation, Navigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

const LANGUAGES = [
  "python3", "java", "cpp", "nodejs", "c", "ruby", "go", "scala", "bash",
  "sql", "pascal", "csharp", "php", "swift", "rust", "r",
];

function EditorPage() {
  const [output, setOutput] = useState("");
  const [isCompileWindowOpen, setIsCompileWindowOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("python3");

  const codeRef = useRef(null);
  const socketRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();

      socketRef.current.on("connect_error", handleErrors);
      socketRef.current.on("connect_failed", handleErrors);

      function handleErrors(err) {
        console.log("Socket Error:", err);
        toast.error("Socket connection failed. Try again.");
        navigate("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on(ACTIONS.JOINED, ({ socketId }) => {
        socketRef.current.emit(ACTIONS.SYNC_CODE, {
          code: codeRef.current,
          socketId,
        });
      });

      return () => {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
      };
    };

    init();
  }, []);

  if (!location.state) return <Navigate to="/" />;

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied!");
    } catch {
      toast.error("Failed to copy Room ID");
    }
  };

  const leaveRoom = () => navigate("/");

  const runCode = async () => {
    setIsCompiling(true);
    try {
      const response = await axios.post("http://localhost:5000/compile", {
        code: codeRef.current,
        language: selectedLanguage,
      });
      setOutput(response.data.output || JSON.stringify(response.data));
    } catch (err) {
      setOutput(err.response?.data?.error || "Compilation error");
    } finally {
      setIsCompiling(false);
    }
  };

  const toggleCompileWindow = () => {
    setIsCompileWindowOpen(!isCompileWindowOpen);
  };

  return (
<div
  className="container-fluid vh-100 d-flex flex-column p-0 m-0 text-white"
  style={{
    background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    fontFamily: "'Fira Code', monospace",
    position: "relative",
    overflow: "hidden",
  }}
>
  {/* Top Navbar */}
  <div
    className="p-2 d-flex justify-content-between align-items-center"
    style={{
      background: "rgba(0,0,0,0.7)",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      backdropFilter: "blur(10px)",
      zIndex: 1041,
    }}
  >
    <div className="ms-3 text-info fw-bold fs-5">
      <i className="bi bi-code-slash me-2"></i>TeamSpace IDE
    </div>
    <select
      className="form-select bg-dark text-white border border-secondary w-auto me-3"
      value={selectedLanguage}
      onChange={(e) => setSelectedLanguage(e.target.value)}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {lang}
        </option>
      ))}
    </select>
  </div>

  {/* Main Code Editor */}
  <div
    className="flex-grow-1 position-relative"
    style={{
      background: "#000",
      borderTop: "2px solid #333",
    }}
  >
    <Editor
      socketRef={socketRef}
      roomId={roomId}
      onCodeChange={(code) => (codeRef.current = code)}
    />
  </div>

  {/* Floating Right Compile Button */}
  <button
    className="btn btn-outline-info position-fixed bottom-0 end-0 m-3 border-2 neon-glow"
    onClick={toggleCompileWindow}
    style={{ zIndex: 1050 }}
  >
    {isCompileWindowOpen ? "Close Compiler" : "Open Compiler"}
  </button>

  {/* Floating Left Buttons */}
  <div
    className="position-fixed bottom-0 start-0 m-3 d-flex flex-column gap-2"
    style={{ zIndex: 1050 }}
  >
    <button className="btn btn-outline-light btn-sm neon-glow" onClick={copyRoomId}>
      📋 Copy Room
    </button>
    <button className="btn btn-danger btn-sm neon-glow" onClick={leaveRoom}>
      🚪 Leave Room
    </button>
  </div>

  {/* Compiler Output Panel */}
  <div
    className={`position-fixed bg-dark text-light p-3 ${
      isCompileWindowOpen ? "d-block" : "d-none"
    }`}
    style={{
      bottom: 0,
      left: 0,
      right: 0,
      height: "30vh",
      transition: "height 0.3s ease-in-out",
      overflowY: "auto",
      zIndex: 1040,
      borderTop: "2px solid #444",
      backdropFilter: "blur(6px)",
    }}
  >
    <div className="d-flex justify-content-between align-items-center mb-2">
      <h5 className="m-0 text-info">⚙ Compiler Output ({selectedLanguage})</h5>
      <div>
        <button
          className="btn btn-success btn-sm me-2 neon-glow"
          onClick={runCode}
          disabled={isCompiling}
        >
          {isCompiling ? "Compiling..." : "Run Code"}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleCompileWindow}
        >
          Close
        </button>
      </div>
    </div>
    <pre className="bg-black p-3 rounded border border-secondary text-white" style={{ minHeight: "10vh" }}>
      {output || "Output will appear here after compilation"}
    </pre>
  </div>
</div>

  );
}

export default EditorPage;
