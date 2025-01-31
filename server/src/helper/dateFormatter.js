// Helper function to format a date
export const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-indexed
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };
  
export const formatMinutesToHM = (minutes) => {
  const totalMinutes = Number(minutes); // Ensure it's a number
  if (isNaN(totalMinutes)) return "00.00"; // Handle invalid values
  
  const hours = Math.floor(totalMinutes / 60); // Get hours
  const remainingMinutes = totalMinutes % 60; // Get remaining minutes
  
  return `${hours.toString().padStart(2, "0")}.${remainingMinutes.toString().padStart(2, "0")}`; // HH.MM format
};
