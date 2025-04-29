import Consultant from "./../models/Consultant/ProfileModel/User.js";

const consultantHandlers = (io, socket) => {
  // When a consultant goes online
  socket.on("consultant-online", async consultantId => {
    try {
      if (!consultantId) return;

      const consultant = await Consultant.findById(consultantId);
      if (!consultant) {
        socket.emit("error", "Consultant not found");
        return;
      }

      socket.consultantId = consultantId;

      if (!consultant.isOnline) {
        await Consultant.findByIdAndUpdate(consultantId, {
          isOnline: true
        });
      }

      io.emit("consultant-status-update", {
        consultantId,
        isOnline: true
      });
    } catch (err) {
      console.error("Login socket error:", err);
    }
  });
  // When the consultant disconnects
  socket.on("disconnect", async (reason) => {
    try {
        const consultantId = socket.consultantId;
        if (!consultantId) return;

        const consultant = await Consultant.findById(consultantId);
        if (consultant && consultant.isOnline) {

            await Consultant.findByIdAndUpdate(consultantId, {
                isOnline: false,
                lastSeen: new Date(),
            });


            io.emit("consultant-status-update", {
                consultantId,
                isOnline: false,
            });
        }

        console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
    } catch (err) {
        console.error("Disconnect socket error:", err);
    }
});
};

export default consultantHandlers;
