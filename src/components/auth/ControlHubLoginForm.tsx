import { useAuth } from "@/lib/context/useAuth";
import { Label } from "@radix-ui/react-label";
import { Loader2 } from "@/components/icons";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AUTH_FIELD, PasswordInput } from "./PasswordInput";

interface ControlHubLoginFormProps {
  onSignUpClick: () => void;
}

export const ControlHubLoginForm: React.FC<ControlHubLoginFormProps> = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { controlHubLogin, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      return;
    }

    try {
      await controlHubLogin(email, password);
    } catch (err) {
      // Error toast is handled inside controlHubLogin
      console.error("ControlHub login failed:", err);
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
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn("w-full", AUTH_FIELD)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="block text-[13px] font-medium text-text-secondary">
            Password
          </Label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in
            </>
          ) : (
            "Sign in to ControlHub"
          )}
        </Button>
      </form>
    </div>
  );
};
