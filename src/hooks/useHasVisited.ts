import { useEffect } from "react";
import { useUIStore } from "@stores/ui";

const STORAGE_KEY = "koenig-damico-has-visited";

/**
 * Hook that checks localStorage for first-time visitors.
 * - First visit: sets activeTab to "help" and marks as visited
 * - Return visit: leaves activeTab at default "config"
 */
export function useHasVisited(): void {
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  useEffect(() => {
    try {
      const hasVisited = localStorage.getItem(STORAGE_KEY);

      if (!hasVisited) {
        setActiveTab("help");
        localStorage.setItem(STORAGE_KEY, "true");
      }
    } catch {
      // localStorage blocked - default to help for new users
      setActiveTab("help");
    }
  }, [setActiveTab]);
}
