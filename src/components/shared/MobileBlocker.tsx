import type { ReactNode } from 'react';

import { Monitor } from 'lucide-react';

import { useDeviceType } from '@hooks/useDeviceType';

interface MobileBlockerProps {
  children: ReactNode;
}

/**
 * Blocks mobile devices from accessing the application.
 * Displays a full-screen overlay with a message on screens < 768px.
 * Passes through children on larger screens.
 */
export default function MobileBlocker({ children }: MobileBlockerProps) {
  const { deviceType } = useDeviceType();

  if (deviceType === 'mobile') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-8 text-center">
        <Monitor className="mb-6 h-16 w-16 text-cyan-400" />
        <h1 className="mb-3 text-xl font-semibold text-zinc-100">
          Desktop or Tablet Required
        </h1>
        <p className="max-w-sm text-sm text-zinc-400">
          This orbital visualization application requires a larger screen for
          precise trajectory planning. Please use a tablet or desktop browser.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
