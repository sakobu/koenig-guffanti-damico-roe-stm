import { useEffect } from 'react';

/**
 * Hook that registers a keyboard shortcut.
 * Automatically ignores keypress when user is typing in input fields.
 *
 * @param key - The key to listen for (case-insensitive)
 * @param callback - Function to call when key is pressed
 */
export function useHotkey(key: string, callback: () => void): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key.toLowerCase() === key.toLowerCase()) {
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback]);
}
