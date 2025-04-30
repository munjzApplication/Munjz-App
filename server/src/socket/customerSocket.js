import Customer from "../models/Customer/customerModels/customerModel.js";

const customerHandlers = (io, socket) => {
  socket.on("customer-online", async (customerId) => {
    try {
      if (!customerId) return;

      const customer = await Customer.findById(customerId);
      if (!customer) {
        socket.emit("error", "Customer not found");
        return;
      }

      socket.customerId = customerId;
      socket.join(customerId.toString());

      if (!customer.isOnline) {
        await Customer.findByIdAndUpdate(customerId, {
          isOnline: true,
        });
      }

      io.emit("customer-status-update", {
        customerId,
        isOnline: true,
      });
    } catch (err) {
      console.error("Customer online error:", err);
    }
  });

  socket.on("disconnect", async (reason) => {
    try {
      const customerId = socket.customerId;
      if (!customerId) return;

      const customer = await Customer.findById(customerId);
      if (customer?.isOnline) {
        await Customer.findByIdAndUpdate(customerId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("customer-status-update", {
          customerId,
          isOnline: false,
        });
      }

      console.log(`Customer disconnected: ${socket.id}, Reason: ${reason}`);
    } catch (err) {
      console.error("Customer disconnect error:", err);
    }
  });
};

export default customerHandlers;
