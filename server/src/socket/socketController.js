// import { Server } from "socket.io";

// import Consultant from "./../models/Consultant/ProfileModel/User.js";

// export const setupSocket = (server) => {
//     const io = new Server(server, {
//         cors: { origin: "*" },
//     });

//     io.on("connection", (socket) => {
//         console.log("🟢 Socket connected:", socket.id);

//         socket.on("consultant-online", async (consultantId) => {
//             try {
//                 if (!consultantId) return;

//                 const consultant = await Consultant.findById(consultantId);
//                 if (!consultant) {
//                     socket.emit("error", "Consultant not found");
//                     return;
//                 }

//                 // Save to socket memory
//                 socket.consultantId = consultantId;

//                 // Update MongoDB only if the consultant was previously offline
//                 if (!consultant.isOnline) {
//                     await Consultant.findByIdAndUpdate(consultantId, {
//                         isOnline: true,
//                     });
//                 }

//                 // Emit the status update
//                 io.emit("consultant-status-update", {
//                     consultantId,
//                     isOnline: true,
//                 });
//             } catch (err) {
//                 console.error("Login socket error:", err);
//             }
//         });

//         socket.on("disconnect", async (reason) => {
//             try {
//                 const consultantId = socket.consultantId;
//                 if (!consultantId) return;

//                 const consultant = await Consultant.findById(consultantId);
//                 if (consultant && consultant.isOnline) {
//                     // Update MongoDB to set isOnline to false and track lastSeen time
//                     await Consultant.findByIdAndUpdate(consultantId, {
//                         isOnline: false,
//                         lastSeen: new Date(),
//                     });

//                     // Emit the status update
//                     io.emit("consultant-status-update", {
//                         consultantId,
//                         isOnline: false,
//                     });
//                 }

//                 console.log(`🔴 Socket disconnected: ${socket.id}, Reason: ${reason}`);
//             } catch (err) {
//                 console.error("Disconnect socket error:", err);
//             }
//         });
//     });
// };
