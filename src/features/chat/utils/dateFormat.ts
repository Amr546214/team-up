/**
 * Format a date for chat display
 * Returns: "Today 1:32 AM", "Yesterday 10:15 PM", "May 2, 2026 1:32 AM"
 */
export function formatChatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const isToday = d.toDateString() === now.toDateString();
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  
  if (isToday) {
    return `Today ${timeStr}`;
  }
  
  if (isYesterday) {
    return `Yesterday ${timeStr}`;
  }
  
  const dateStr = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  return `${dateStr} ${timeStr}`;
}

/**
 * Format time only for messages within the same day
 * Returns: "1:32 AM", "10:15 PM"
 */
export function formatMessageTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format short date for conversation list
 * Returns: "Today", "Yesterday", "May 2", "Jan 15"
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Today';
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  const daysDiff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
