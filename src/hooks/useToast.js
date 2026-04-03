import { useState, useCallback, useRef } from 'react';

// Global toast state — used across the app
let _showToast = null;

export const showGlobalToast = (message, type = 'info', duration = 3000) => {
  if (_showToast) _showToast(message, type, duration);
};

const useToast = () => {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type, visible: true });
    timerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  // Register global accessor
  _showToast = showToast;

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
};

export default useToast;