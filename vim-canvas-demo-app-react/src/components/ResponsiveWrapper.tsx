import React from "react";
import { useAppSize } from "@/hooks/useAppSize";

interface ResponsiveWrapperProps {
  mobileComponent: React.ComponentType<any>;
  desktopComponent: React.ComponentType<any>;
  componentProps?: any;
  children?: React.ReactNode;
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
  mobileComponent: Mobile,
  desktopComponent: Desktop,
  componentProps = {},
  children,
}) => {
  const { isMobile } = useAppSize();

  if (children) {
    // If children are provided, render them with responsive context
    return (
      <div className={`responsive-wrapper ${isMobile ? "mobile" : "desktop"}`}>
        {children}
      </div>
    );
  }

  // Otherwise, switch between mobile and desktop components
  return isMobile ? (
    <Mobile {...componentProps} />
  ) : (
    <Desktop {...componentProps} />
  );
};
