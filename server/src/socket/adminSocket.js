const adminHandlers = (io, socket) => {
    console.log("Admin socket connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Admin disconnected:", socket.id);
    });
  };
  
  export default adminHandlers;


  