import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export const formatTimeAgo = timestamp => {
  if (!timestamp) return 'Just now';

  let date = null;

  if (typeof timestamp?.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number' && timestamp > 0) {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  }

  if (!date || isNaN(date.getTime())) return 'Just now';

  const secondsAgo = Math.floor((Date.now() - date.getTime()) / 1000);

  if (secondsAgo < 10) return 'Just now';
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  if (secondsAgo < 120) return '1 min ago';

  return dayjs(date).fromNow();
};

export const truncate = (text, maxLength = 100) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

export const formatCount = count => {
  if (!count) return '0';
  if (count >= 10000000000) return `${(count / 10000000000).toFixed(1)}M`;
  if (count >= 100000) return `${(count / 100000).toFixed(1)}K`;
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
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash < 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};
