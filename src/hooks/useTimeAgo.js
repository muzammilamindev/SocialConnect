import { useState, useEffect, useRef } from 'react';
import { formatTimeAgo } from '../utils/helpers';

const getSeconds = timestamp => {
  if (!timestamp) return 0;
  if (typeof timestamp?.toDate === 'function') {
    return Math.floor(timestamp.toDate().getTime() / 1000);
  }
  if (timestamp?.seconds) return timestamp.seconds;
  if (timestamp instanceof Date) return Math.floor(timestamp.getTime() / 1000);
  if (typeof timestamp === 'number' && timestamp > 0) {
    return Math.floor(timestamp / 1000);
  }
  return 0;
};

const useTimeAgo = timestamp => {
  const originalSecondsRef = useRef(0);
  const [timeAgo, setTimeAgo] = useState('Just now');

  useEffect(() => {
    const incomingSeconds = getSeconds(timestamp);
    if (incomingSeconds === 0) return;
    if (
      originalSecondsRef.current === 0 ||
      incomingSeconds !== originalSecondsRef.current
    ) {
      originalSecondsRef.current = incomingSeconds;
      const date = new Date(incomingSeconds * 1000);
      setTimeAgo(formatTimeAgo(date));
    }

    const storedSeconds = originalSecondsRef.current;

    const interval = setInterval(() => {
      const date = new Date(storedSeconds * 1000);
      setTimeAgo(formatTimeAgo(date));
    }, 10000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return timeAgo;
};

export default useTimeAgo;
