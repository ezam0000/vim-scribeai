import React from "react";
import { Button } from "./ui/button";
import { useAppSize } from "@/hooks/useAppSize";
import { useVimSizing } from "@/hooks/useVimSizing";
import { Monitor, Maximize2, Eye, Users } from "lucide-react";

interface SizeAwareNotificationProps {
  context: "patients_list" | "encounter" | "notes";
  className?: string;
}

export const SizeAwareNotification: React.FC<SizeAwareNotificationProps> = ({
  context,
  className = "",
}) => {
  const { currentSize, isMobile } = useAppSize();
  const { requestSize } = useVimSizing();

  // Don't show notification for EXTRA_LARGE
  if (currentSize === "EXTRA_LARGE") return null;

  const getNotificationContent = () => {
    switch (context) {
      case "patients_list":
        return {
          icon: <Users className="h-4 w-4" />,
          title: "Limited Patient View",
          message:
            currentSize === "CLASSIC"
              ? "Expand to see patient table with advanced filtering and details"
              : "Expand to EXTRA_LARGE for full patient management experience",
          suggestedSize: currentSize === "CLASSIC" ? "LARGE" : "EXTRA_LARGE",
        };
      case "encounter":
        return {
          icon: <Eye className="h-4 w-4" />,
          title: "Compact Encounter View",
          message:
            "Expand for multi-panel layout with enhanced note generation",
          suggestedSize: "EXTRA_LARGE" as const,
        };
      case "notes":
        return {
          icon: <Monitor className="h-4 w-4" />,
          title: "Limited Notes View",
          message:
            "Expand to see full note history and advanced editing features",
          suggestedSize: "EXTRA_LARGE" as const,
        };
      default:
        return null;
    }
  };

  const content = getNotificationContent();
  if (!content) return null;

  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-blue-600">{content.icon}</div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              {content.title}
            </h4>
            <p className="text-xs text-blue-700">{content.message}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => requestSize(content.suggestedSize)}
          className="border-blue-300 text-blue-700 hover:bg-blue-100 flex items-center space-x-1"
        >
          <Maximize2 className="h-3 w-3" />
          <span>Expand</span>
        </Button>
      </div>
    </div>
  );
};
