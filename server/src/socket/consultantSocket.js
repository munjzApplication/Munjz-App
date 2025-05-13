import Consultant from "../models/Consultant/ProfileModel/User.js";

const consultantHandlers = (io, socket) => {
  // Consultant comes online
  socket.on("consultant-online", async (consultantId) => {
    try {
      if (!consultantId) return;

      const consultant = await Consultant.findById(consultantId);
      if (!consultant) {
        socket.emit("error", "Consultant not found");
        return;
      }

      socket.consultantId = consultantId;
      socket.join(consultantId.toString());

      if (!consultant.isOnline) {
        await Consultant.findByIdAndUpdate(consultantId, {
          isOnline: true,
        });
      }

      io.emit("consultant-status-update", {
        consultantId,
        isOnline: true,
      });

       const customerNamespace = io.server.of("/customer");
      customerNamespace.emit("consultant-status-update", {
        consultantId,
        isOnline: true,
      });

    } catch (err) {
      console.error("Consultant online error:", err);
    }
  });

  // Consultant disconnects
  socket.on("disconnect", async (reason) => {
    try {
      const consultantId = socket.consultantId;
      if (!consultantId) return;

      const consultant = await Consultant.findById(consultantId);
      if (consultant?.isOnline) {
        await Consultant.findByIdAndUpdate(consultantId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("consultant-status-update", {
          consultantId,
          isOnline: false,
        });

         const customerNamespace = io.server.of("/customer");
        customerNamespace.emit("consultant-status-update", {
          consultantId,
          isOnline: false,
        });
      }

      console.log(`Consultant disconnected: ${socket.id}, Reason: ${reason}`);
    } catch (err) {
      console.error("Consultant disconnect error:", err);
    }
  });
};

export default consultantHandlers;
