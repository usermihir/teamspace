// socket.js
import { io } from "socket.io-client";

let socket;

export const initSocket = () => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
  }
  return socket;
};
