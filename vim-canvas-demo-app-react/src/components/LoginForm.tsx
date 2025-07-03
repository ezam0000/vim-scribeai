import React, { useState } from "react";
import { useAuth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SignupModal } from "./SignupModal";

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const { login, error } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter both email and password",
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        variant: "default",
        title: "Login Successful",
        description: "Welcome to ScribeAI VIM!",
      });
      onLoginSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">Welcome Back!</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            autoFocus
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          style={{ backgroundColor: "#007BFF", borderColor: "#007BFF" }}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>

        {error && (
          <div className="text-red-600 text-sm text-center mt-3">{error}</div>
        )}
      </form>

      {/* Signup Section */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={() => setShowSignupModal(true)}
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Sign up for ScribeAI
          </button>
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Interested in bringing ScribeAI to your team?{" "}
          <a
            href="https://www.getscribeai.co/contact-us"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Contact us here
          </a>
          .
        </p>
      </div>

      {/* Signup Modal */}
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </div>
  );
};

export default LoginForm;
