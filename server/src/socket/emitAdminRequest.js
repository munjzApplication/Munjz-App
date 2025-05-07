import { io } from "../socket/socketController.js";

const emitAdminRequest = (event, customerId, data) => {
  const payload = { ...data };
  // Emit the event to the customer namespace dynamically
  io.of("/customer").to(customerId.toString()).emit(event, payload);
  console.log(`Event "${event}" sent to customer ${customerId}`, payload);
};

export default emitAdminRequest;
