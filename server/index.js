require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./Actions");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const fileMeta = {
    id: Date.now().toString(),
    name: req.file.originalname,
    url: `http://localhost:5000/uploads/${req.file.filename}`,
    comments: [],
  };
  const roomId = req.body.roomId;
  io.to(roomId).emit("file-uploaded", fileMeta);
  console.log("📁 File uploaded:", req.file.filename, "to room:", roomId);
  res.status(200).json(fileMeta);
});

const languageConfig = { python3: { versionIndex: "3" }, java: { versionIndex: "3" }, cpp: { versionIndex: "4" }, nodejs: { versionIndex: "3" }, c: { versionIndex: "4" }, ruby: { versionIndex: "3" }, go: { versionIndex: "3" }, scala: { versionIndex: "3" }, bash: { versionIndex: "3" }, sql: { versionIndex: "3" }, pascal: { versionIndex: "2" }, csharp: { versionIndex: "3" }, php: { versionIndex: "3" }, swift: { versionIndex: "3" }, rust: { versionIndex: "3" }, r: { versionIndex: "3" } };

app.post("/compile", async (req, res) => {
  const { code, language } = req.body;
  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      script: code,
      language: language,
      versionIndex: languageConfig[language].versionIndex,
      clientId: process.env.jDoodle_clientId,
      clientSecret: process.env.jDoodle_clientSecret,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to compile code" });
  }
});

const userSocketMap = {};
const roomUserActivity = {};
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => ({
    socketId,
    username: userSocketMap[socketId],
    activity: roomUserActivity[roomId]?.[socketId]?.activity || "idle",
  }));
};

const videoRooms = {}; // roomId -> [socketId]

io.on("connection", (socket) => {
  console.log("⚡ New client connected:", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    if (!roomUserActivity[roomId]) roomUserActivity[roomId] = {};
    roomUserActivity[roomId][socket.id] = { username, activity: "idle" };

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
    io.to(roomId).emit("room-users", clients);
  });

  socket.on("user-activity", ({ roomId, activity }) => {
    if (roomUserActivity[roomId] && roomUserActivity[roomId][socket.id]) {
      roomUserActivity[roomId][socket.id].activity = activity;
      io.to(roomId).emit("room-users", getAllConnectedClients(roomId));
    }
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on("join-drawing-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("draw-line", ({ roomId, x0, y0, x1, y1, color, tool, text }) => {
    socket.to(roomId).emit("draw-line", { x0, y0, x1, y1, color, tool, text });
  });

  socket.on("join-chat-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("send-message", ({ roomId, username, message }) => {
    socket.to(roomId).emit("receive-message", { username, message });
  });

  socket.on("voice-start", (roomId) => {
    console.log("🎤 Voice stream started in room", roomId);
  });

  socket.on("voice-chunk", ({ roomId, chunk }) => {
    socket.to(roomId).emit("receive-voice-chunk", chunk);
  });

  socket.on("voice-end", (roomId) => {
    console.log("🛑 Voice stream ended in room", roomId);
  });

  socket.on("join-file-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("file-upload", (file) => {
    const fileData = {
      id: Date.now().toString(),
      name: file.filename,
      url: `http://localhost:5000${file.path}`,
      comments: [],
    };
    io.to(file.roomId).emit("file-uploaded", fileData);
  });

  socket.on("add-comment", ({ fileId, comment }) => {
    io.emit("new-comment", { fileId, comment });
  });

  socket.on("leave-file-room", (roomId) => {
    socket.leave(roomId);
  });

  // === Mesh WebRTC Signaling ===
  const getPeersInRoom = (roomId) => Array.from(io.sockets.adapter.rooms.get(roomId) || []);

  socket.on("join-video-room", (roomId) => {
    socket.join(roomId);
    const peers = getPeersInRoom(roomId).filter((id) => id !== socket.id);
    io.to(socket.id).emit("all-users", peers);
    peers.forEach((peerId) => io.to(peerId).emit("user-joined", socket.id));
  });

  socket.on("send-offer", ({ targetSocketId, offer }) => {
    io.to(targetSocketId).emit("receive-offer", {
      from: socket.id,
      offer,
    });
  });

  socket.on("send-answer", ({ targetSocketId, answer }) => {
    io.to(targetSocketId).emit("receive-answer", {
      from: socket.id,
      answer,
    });
  });

  socket.on("send-ice-candidate", ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit("receive-ice-candidate", {
      from: socket.id,
      candidate,
    });
  });

  socket.on("leave-video-room", (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", socket.id);
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
      if (roomUserActivity[roomId]) {
        delete roomUserActivity[roomId][socket.id];
        io.to(roomId).emit("room-users", getAllConnectedClients(roomId));
      }
      socket.to(roomId).emit("user-left", socket.id);
    });
    delete userSocketMap[socket.id];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});