// Helper function to format a date
export const formatDate = (isoDate) => {
  // Create a new Date object from the ISO string (assumed to be in UTC)
  const date = new Date(isoDate);

  // Convert to local time (timezone of the machine/server)
  const day = date.getDate();
  const month = date.getMonth() + 1; // Months are zero-indexed, so add 1
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");   // Always show 2-digit hours (e.g., 08)
  const minutes = date.getMinutes().toString().padStart(2, "0"); // Always show 2-digit minutes (e.g., 09)

  // Return the formatted date in the local timezone
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};



  
  export const formatMinutesToHM = (minutes) => {
    const totalMinutes = Number(minutes); // Ensure it's a number
    if (isNaN(totalMinutes)) return "00:00"; // Handle invalid values
    
    const hours = Math.floor(totalMinutes / 60); // Get hours
    const remainingMinutes = totalMinutes % 60; // Get remaining minutes
    
    return `${hours.toString().padStart(2, "0")}:${remainingMinutes.toString().padStart(2, "0")}`; // HH:MM format
  };

  export const formatMinutesToFixed = (minutes) => {
    const totalMinutes = Number(minutes); // Ensure it's a number
    if (isNaN(totalMinutes)) return "00:00"; // Handle invalid values
  
    return `${totalMinutes}:00`; // Format as MM:00
  };
  
  