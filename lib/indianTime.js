/**
 * SSSAM Academy - Indian Standard Time (IST - Asia/Kolkata) Utility
 * Ensures exact Indian Standard Time regardless of whether code runs on Vercel, AWS, or local
 */

export function getIndianDateTime() {
  const now = new Date();
  
  // Date in YYYY-MM-DD IST
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  // Time in HH:MM:SS (24-hr) IST
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);

  // Formatted 12-hr display (e.g. "08:22 PM")
  const displayTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(now);

  return { dateStr, timeStr, displayTime, timestamp: now.toISOString() };
}

export function formatISTTime(timeStr) {
  if (!timeStr) return '--:--:--';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const min = parts[1];
  const sec = parts[2] ? `:${parts[2]}` : '';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${min} ${ampm}`;
}
