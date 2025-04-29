import { Server } from "socket.io";
import consultantHandlers from "./consultantSocket.js";
import customerHandlers from "./customerSocket.js";

let io; // Declare io globally

export const setupSocket = (server) => {
  console.log("Setting up socket.io...");

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Initialize consultant and customer socket handlers
    consultantHandlers(io, socket);
    customerHandlers(io, socket);
  });
};

// Export io so that you can use it in other files
export { io };
