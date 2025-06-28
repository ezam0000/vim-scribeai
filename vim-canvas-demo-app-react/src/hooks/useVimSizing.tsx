import { useCallback } from "react";
import { useVimOsContext } from "./useVimOsContext";
import { ApplicationSize } from "./useAppSize";

export const useVimSizing = () => {
  const vimOS = useVimOsContext();

  const requestSize = useCallback(
    (size: ApplicationSize) => {
      if (!vimOS?.hub?.setDynamicAppSize) {
        console.warn("VIM OS setDynamicAppSize not available");
        return;
      }

      try {
        vimOS.hub.setDynamicAppSize(size);
        console.log(`Requested app size change to: ${size}`);
      } catch (error) {
        console.error("Failed to change app size:", error);
      }
    },
    [vimOS]
  );

  const requestSizeForContent = useCallback(
    (contentType: "patient_list" | "encounter" | "detailed_view") => {
      // Smart size suggestions based on content type
      const sizeMap = {
        patient_list: "LARGE" as ApplicationSize, // Better for tables
        encounter: "CLASSIC" as ApplicationSize, // Standard workflow
        detailed_view: "EXTRA_LARGE" as ApplicationSize, // Maximum space
      };

      requestSize(sizeMap[contentType]);
    },
    [requestSize]
  );

  return {
    requestSize,
    requestSizeForContent,
  };
};
