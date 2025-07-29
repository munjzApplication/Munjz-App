import { Server } from "socket.io";
import consultantHandlers from "./consultantSocket.js";
import customerHandlers from "./customerSocket.js";
import adminHandlers from "./adminSocket.js"; 
import registerChatHandlers from "./chatSocketHandlers.js"; 

let io;

export const setupSocket = (server) => {
  console.log("Setting up Socket.IO...");

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Consultant Namespace
  const consultantNamespace = io.of("/consultant");
  consultantNamespace.on("connection", (socket) => {
    console.log("Consultant connected:", socket.id);
    consultantHandlers(consultantNamespace, socket);
    registerChatHandlers(consultantNamespace, socket);

  });

  // Customer Namespace
  const customerNamespace = io.of("/customer");
  customerNamespace.on("connection", (socket) => {
    console.log("Customer connected:", socket.id);
    customerHandlers(customerNamespace, socket);
    registerChatHandlers(customerNamespace, socket);
  
  });

  // Admin Namespace (optional)
  const adminNamespace = io.of("/admin");
  adminNamespace.on("connection", (socket) => {
    console.log("Admin connected:", socket.id);
    adminHandlers(adminNamespace, socket);
    registerChatHandlers(adminNamespace, socket);

  });
};

export { io };
