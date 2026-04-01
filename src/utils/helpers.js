import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

// Handles ALL possible timestamp formats from Firestore
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';

  // Firestore Timestamp object with toDate() method
  if (typeof timestamp?.toDate === 'function') {
    return dayjs(timestamp.toDate()).fromNow();
  }

  // Plain object with seconds { seconds, nanoseconds }
  if (timestamp?.seconds) {
    return dayjs(new Date(timestamp.seconds * 1000)).fromNow();
  }

  // Already a JS Date instance
  if (timestamp instanceof Date) {
    return dayjs(timestamp).fromNow();
  }

  // ✅ Number (milliseconds from toMillis())
  if (typeof timestamp === 'number' && timestamp > 0) {
    return dayjs(timestamp).fromNow();
  }

  // ISO string
  if (typeof timestamp === 'string') {
    return dayjs(timestamp).fromNow();
  }

  return 'Just now';
};

export const truncate = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength
    ? `${text.substring(0, maxLength)}...`
    : text;
};

export const formatCount = (count) => {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
};

export const getInitials = (name = '') =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const stringToColor = (str = '') => {
  const palette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};