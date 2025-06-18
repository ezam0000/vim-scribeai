import React from "react";
import { useAuth } from "@/auth";
import { LoginPage } from "./LoginPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-gray-300 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-300 rounded"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  // If not authenticated, show login page
  if (!user) {
    return <LoginPage />;
  }

  // If authenticated, render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
