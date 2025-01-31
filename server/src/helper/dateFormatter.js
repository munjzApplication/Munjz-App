export const formatDate = (date) => {
  return new Date(date).toLocaleString("en-AE", { 
      timeZone: "Asia/Dubai", 
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false // 24-hour format
  });
};

export const formatMinutesToFixed = (minutes) => {
  const totalMinutes = Number(minutes); // Ensure it's a number
  if (isNaN(totalMinutes)) return "00:00"; // Handle invalid values

  return `${totalMinutes}:00`; // Format as MM:00
};
