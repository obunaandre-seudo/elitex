import { useEffect, useState } from 'react';

export function useMinimumLoadingState(isLoading: boolean, minimumMs = 650) {
  const [showLoading, setShowLoading] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      return;
    }

    const timer = setTimeout(() => {
      setShowLoading(false);
    }, minimumMs);

    return () => clearTimeout(timer);
  }, [isLoading, minimumMs]);

  return showLoading;
}
