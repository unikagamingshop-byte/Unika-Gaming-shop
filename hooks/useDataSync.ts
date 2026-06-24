import { useEffect } from 'react';

export function useDataSync(callback: () => void) {
  useEffect(() => {
    // Initial fetch
    callback();

    // Listen to dataService updates
    window.addEventListener('unika_data_updated', callback);

    return () => {
      window.removeEventListener('unika_data_updated', callback);
    };
  }, [callback]);
}
