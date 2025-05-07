// emitAdminRequest.js
import { customerNamespace } from "../socket/socketController.js";

const emitAdminRequest = (event, customerId, data) => {
    const payload = { ...data };
    customerNamespace.to(customerId.toString()).emit(event, payload);
    console.log(`Event "${event}" sent to customer ${customerId}`, payload);
  };
  
  export default emitAdminRequest;