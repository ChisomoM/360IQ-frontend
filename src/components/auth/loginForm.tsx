import { useAuth } from "@/lib/context/useAuth";
import { Label } from "@radix-ui/react-label";
import { Loader2 } from "@/components/icons";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AUTH_FIELD, PasswordInput } from "./PasswordInput";
// import { ForgotPasswordModal } from "./forgotPasswordModal";

interface LoginFormProps {
  onSignUpClick: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { login, isLoading } = useAuth();

  // const forgotPassword = async () => {
  //   try{
  //     await post()
  //   }catch(err){

  //   }
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    try {
      await login(email, password);
      // Navigation is handled by the auth context's login method
    } catch (err) {
      // Error is already displayed by useAuth hook via toast
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="block text-[13px] font-medium text-text-secondary">
            Email address
          </Label>
          <Input
            placeholder="name@company.com"
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={cn("w-full", AUTH_FIELD)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="block text-[13px] font-medium text-text-secondary">
            Password
          </Label>
          <PasswordInput
            placeholder="Enter your password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            // onClick={() => setShowForgotPassword(true)}
            className="text-[13px] font-medium text-signal-text transition-colors duration-150 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Forgot Password Modal */}
      {/* <ForgotPasswordModal
        open={showForgotPassword}
        onOpenChange={setShowForgotPassword}
      /> */}
    </div>
  );
};
