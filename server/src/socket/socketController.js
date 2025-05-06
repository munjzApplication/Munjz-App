import { Server } from "socket.io";
import consultantHandlers from "./consultantSocket.js";
import customerHandlers from "./customerSocket.js";
import adminHandlers from "./adminSocket.js"; 

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
  });

  // Customer Namespace
  const customerNamespace = io.of("/customer");
  customerNamespace.on("connection", (socket) => {
    console.log("Customer connected:", socket.id);
    customerHandlers(customerNamespace, socket);
  });

  // Admin Namespace (optional)
  const adminNamespace = io.of("/admin");
  adminNamespace.on("connection", (socket) => {
    console.log("Admin connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Admin disconnected:", socket.id);
    });

    // Debugging: Log when an event is emitted to the admin
    socket.on("consultant-registered", (data) => {
      console.log("Received consultant registration event with data: ", data);
    });

    // Example: Emitting event
    try {
      console.log("Emitting 'consultant-registered' event...");
      adminNamespace.emit("consultant-registered", {
        profile: {
          _id: "12345", // replace with actual data
          ConsultantId: "abc123", // replace with actual data
          Name: "John Doe",
          email: "johndoe@example.com",
          creationDate: "2025-05-06",
          phoneNumber: "1234567890",
          country: "USA",
          profilePicture: "profilePicUrl",
          isBlocked: false,
        },
        documents: {
          _id: "67890", // replace with actual data
          consultantId: "abc123",
          nationalId: "987654321",
          frontsideId: "frontsideIdUrl",
          backsideId: "backsideIdUrl",
          educationalCertificates: "eduCertUrl",
          experienceCertificates: "expCertUrl",
          status: "pending",
          creationDate: "2025-05-06",
          documentStatus: {
            frontsideId: "pending",
            backsideId: "pending",
            educationalCertificates: "pending",
            experienceCertificates: "pending",
          },
        },
      });
    } catch (error) {
      console.error("Error emitting 'consultant-registered' event: ", error);
    }
  });
};

export { io };
