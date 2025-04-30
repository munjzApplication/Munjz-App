const adminHandlers = (io, socket) => {
    console.log("Admin socket initialized:", socket.id);
  
    // Add admin-specific events here
  
    socket.on("disconnect", () => {
      console.log("Admin disconnected:", socket.id);
    });
  };
  
  export default adminHandlers;
  