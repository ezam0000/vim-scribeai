import React, { useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SIGNUP_URL } from "@/config/env";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const popupRef = useRef<Window | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Build the signup URL with query parameters
  const signupUrlWithParams = `${SIGNUP_URL}?source=vim&return_to=${encodeURIComponent(
    window.location.origin
  )}`;

  const openSignupPopup = () => {
    // Calculate centered popup position
    const width = 800;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Open popup window
    popupRef.current = window.open(
      signupUrlWithParams,
      "scribeai-signup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    // Monitor popup for completion
    if (popupRef.current) {
      checkIntervalRef.current = setInterval(() => {
        try {
          // Check if popup is closed (user finished or cancelled)
          if (popupRef.current?.closed) {
            clearInterval(checkIntervalRef.current!);
            onClose();

            // Optional: Show success message or refresh page
            // You could add a toast here to indicate completion
          }
        } catch (error) {
          // Cross-origin error is expected, just continue monitoring
        }
      }, 1000);
    }
  };

  // Open popup when modal becomes visible
  useEffect(() => {
    if (isOpen) {
      openSignupPopup();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, []);

  // Handle modal close
  const handleClose = () => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">
            Opening ScribeAI Signup
          </h3>
          <p className="text-gray-600 mb-4">
            A new window has opened for you to complete your signup and payment.
          </p>
          <p className="text-gray-600 mb-4">
            After account creation is done, close this popup and use the same
            credentials to log in.
          </p>
          <p className="text-sm text-gray-500">
            If the window didn't open, please check your popup blocker settings.
          </p>
          <button
            onClick={openSignupPopup}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Open Signup Window
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupModal;
