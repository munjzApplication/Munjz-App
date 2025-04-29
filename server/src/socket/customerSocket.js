import Customer from "./../models/Customer/customerModels/customerModel.js";

const customerHandlers = (io, socket) => {
  // When a customer goes online
  socket.on("customer-online", async customerId => {
    try {
      if (!customerId) return;

      const customer = await Customer.findById(customerId);
      if (!customer) {
        socket.emit("error", "Customer not found");
        return;
      }

      socket.customerId = customerId;

      if (!customer.isOnline) {
        await Customer.findByIdAndUpdate(customerId, {
          isOnline: true
        });
      }

      io.emit("customer-status-update", {
        customerId,
        isOnline: true
      });
    } catch (err) {
      console.error("Customer login socket error:", err);
    }
  });

  // When the customer disconnects
  socket.on("disconnect", async reason => {
    try {
      const customerId = socket.customerId;

      if (customerId) {
        const customer = await Customer.findById(customerId);
        if (customer && customer.isOnline) {
          await Customer.findByIdAndUpdate(customerId, {
            isOnline: false,
            lastSeen: new Date()
          });

          io.emit("customer-status-update", {
            customerId,
            isOnline: false
          });
        }
      }

      console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
    } catch (err) {
      console.error("Customer disconnect socket error:", err);
    }
  });
};

export default customerHandlers;
