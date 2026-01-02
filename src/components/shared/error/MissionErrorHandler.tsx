import { useEffect, useRef } from 'react';

import { useToast } from '@hooks/useToast';
import { useMissionStore } from '@stores/mission';

export default function MissionErrorHandler() {
  const lastError = useMissionStore((s) => s.lastError);
  const clearError = useMissionStore((s) => s.clearError);
  const { addToast } = useToast();

  // Track which error we've already shown to avoid duplicates
  const shownErrorTimestamp = useRef<number | null>(null);

  useEffect(() => {
    if (lastError && lastError.timestamp !== shownErrorTimestamp.current) {
      shownErrorTimestamp.current = lastError.timestamp;

      let message = lastError.message;
      if (lastError.suggestion) {
        message += ` ${lastError.suggestion}`;
      }

      addToast({
        type: 'warning',
        message,
        duration: 6000,
      });

      // Clear the error after showing
      clearError();
    }
  }, [lastError, addToast, clearError]);

  // This component renders nothing - it only handles side effects
  return null;
}
