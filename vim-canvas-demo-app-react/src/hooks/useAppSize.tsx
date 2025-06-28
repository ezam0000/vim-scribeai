import { useState, useEffect } from "react";
import { useVimOsContext } from "./useVimOsContext";

export type ApplicationSize = "CLASSIC" | "LARGE" | "EXTRA_LARGE";

export interface AppSizeState {
  currentSize: ApplicationSize;
  isMobile: boolean; // CLASSIC size
  isDesktop: boolean; // LARGE or EXTRA_LARGE
  dimensions: { width: number; height: number };
}

export const useAppSize = (): AppSizeState => {
  const vimOS = useVimOsContext();
  const [currentSize, setCurrentSize] = useState<ApplicationSize>("CLASSIC");
  const [dimensions, setDimensions] = useState({ width: 365, height: 600 });

  useEffect(() => {
    if (!vimOS?.hub) return;

    // Set initial size based on current app state
    // Note: VIM OS doesn't expose current size directly, so we'll track changes
    const handleSizeChange = (newSize: ApplicationSize) => {
      setCurrentSize(newSize);

      // Update dimensions based on size
      const dimensionMap = {
        CLASSIC: { width: 365, height: 600 },
        LARGE: { width: 800, height: 600 },
        EXTRA_LARGE: { width: 1350, height: 600 },
      };

      setDimensions(dimensionMap[newSize]);
    };

    // Since VIM OS doesn't expose size change events yet,
    // we'll implement this as a manual tracking system
    // This can be enhanced when VIM OS SDK adds size change listeners

    return () => {
      // Cleanup if needed
    };
  }, [vimOS]);

  const isMobile = currentSize === "CLASSIC";
  const isDesktop = currentSize === "LARGE" || currentSize === "EXTRA_LARGE";

  return {
    currentSize,
    isMobile,
    isDesktop,
    dimensions,
  };
};
