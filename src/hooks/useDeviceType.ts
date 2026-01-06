import { useCallback, useEffect, useState } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface DeviceInfo {
  deviceType: DeviceType;
  isTouchPrimary: boolean;
  screenWidth: number;
}

const MOBILE_BREAKPOINT = 768;

/**
 * Detects whether the device has touch as its primary input method.
 * Uses pointer: coarse media query which is more reliable than checking for touch events.
 */
function hasPrimaryTouch(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Determines device type based on screen width and touch capability.
 */
function getDeviceType(width: number, isTouchPrimary: boolean): DeviceType {
  if (width < MOBILE_BREAKPOINT) {
    return 'mobile';
  }
  // Tablet: larger screen with touch as primary input
  if (isTouchPrimary) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Hook that detects and tracks device type (mobile/tablet/desktop).
 *
 * - Mobile: screen width < 768px
 * - Tablet: screen width >= 768px with touch as primary input
 * - Desktop: screen width >= 768px without primary touch
 *
 * Listens for resize events with debouncing to update device type dynamically.
 */
export function useDeviceType(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return { deviceType: 'desktop', isTouchPrimary: false, screenWidth: 1024 };
    }
    const isTouchPrimary = hasPrimaryTouch();
    const width = window.innerWidth;
    return {
      deviceType: getDeviceType(width, isTouchPrimary),
      isTouchPrimary: isTouchPrimary,
      screenWidth: width,
    };
  });

  const updateDeviceInfo = useCallback(() => {
    const isTouchPrimary = hasPrimaryTouch();
    const width = window.innerWidth;
    setDeviceInfo({
      deviceType: getDeviceType(width, isTouchPrimary),
      isTouchPrimary: isTouchPrimary,
      screenWidth: width,
    });
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDeviceInfo, 100);
    };

    window.addEventListener('resize', handleResize);

    // Also listen for orientation changes on mobile/tablet
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, [updateDeviceInfo]);

  return deviceInfo;
}
