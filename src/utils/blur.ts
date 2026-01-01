import type { MouseEvent } from 'react';

/**
 * Wraps a click handler to blur the element after execution.
 * Prevents focus retention that causes highlight on subsequent Shift press.
 */
export function withBlur<T extends () => void>(fn: T) {
  return (e: MouseEvent<HTMLButtonElement>) => {
    fn();
    e.currentTarget.blur();
  };
}
