import { io } from "../socket/socketController.js";  // Import the socket instance

// Emits an event to a specific customer in a given namespace
const emitAdminRequest = (namespace, event, customerId, data) => {
    const customerNamespace = io.of(namespace); 
    const payload = {
        ...data,  
    };

    customerNamespace.to(customerId.toString()).emit(event, payload);
};

export default emitAdminRequest;
