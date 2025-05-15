import { io } from "../socket/socketController.js";

export const emitAdminRequest = (event, customerId, data) => {
  const payload = { ...data };
  // Emit the event to the customer namespace dynamically
  io.of("/customer").to(customerId.toString()).emit(event, payload);
  console.log(`Event "${event}" sent to customer ${customerId}`, payload);
};



// Emit event to all admins in /admin namespace
export const emitAdminPaymentRequest = (event, paymentData) => {
  const payload = {
    message: "New payment requested successfully.",
    customerId: paymentData.customerId,
    caseId: paymentData.caseId,
    hasPendingPayment: true,
  };
  io.of("/admin").emit(event, payload);
  console.log(`Event "${event}" sent to admin namespace`, payload);
};