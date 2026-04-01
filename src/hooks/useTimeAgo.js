import { useState, useEffect } from 'react';
import { formatTimeAgo } from '../utils/helpers';

const useTimeAgo = (timestamp) => {
  const [timeAgo, setTimeAgo] = useState(() => formatTimeAgo(timestamp));

  useEffect(() => {
    // Update immediately when timestamp changes
    setTimeAgo(formatTimeAgo(timestamp));

    // Then refresh every 30 seconds
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(timestamp));
    }, 30000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return timeAgo;
};

export default useTimeAgo;