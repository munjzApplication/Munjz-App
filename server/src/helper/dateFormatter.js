export const formatDate = date => {
  return new Date(date).toLocaleString("en-AE", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false // 24-hour format
  });
};

export const formatMinutesToMMSS = minutes => {
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export const formatDatewithmonth = dateString => {
  const date = new Date(dateString);
  const options = {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  };
  return date
    .toLocaleString("en-US", options)
    .replace(",", "")
    .replace(" at", "");
};
export const formatDates = (date) => {
  const options = { year: 'numeric', month: 'long', day: '2-digit' };
  return new Date(date).toLocaleDateString("en-US", options);
};


export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  let time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dubai'
  });

  // Convert "AM"/"PM" to lowercase
  return time.replace(/AM|PM/, (match) => match.toLowerCase());
};

