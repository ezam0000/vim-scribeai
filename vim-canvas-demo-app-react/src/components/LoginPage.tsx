import React from "react";
import { LoginForm } from "./LoginForm";
import ScribeAILogo from "@/assets/ScribeAI_SS1H.png";

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <img className="h-12 w-auto" src={ScribeAILogo} alt="ScribeAI" />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm onLoginSuccess={onLoginSuccess} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
