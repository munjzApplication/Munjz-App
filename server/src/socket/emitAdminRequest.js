import { io } from "../socket/socketController.js";  // Import the socket instance

// Emits an event to a specific customer in a given namespace
const emitAdminRequest = (namespace, event, customerId, data) => {
    const customerNamespace = io.of(namespace);  // Access the appropriate namespace
    const payload = {
        message: "New admin action on your case",  // Default message
        ...data,  // Spread in the provided data
    };

    // Ensure you're emitting to the correct socket associated with the customerId
    customerNamespace.to(customerId.toString()).emit(event, payload);
};

export default emitAdminRequest;
