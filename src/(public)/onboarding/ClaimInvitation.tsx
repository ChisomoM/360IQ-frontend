import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Building2, KeyRound } from "lucide-react";
import { post, retrieve } from "@/lib/api/crud";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1];

export default function ClaimInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitePreview, setInvitePreview] = useState<{
    company_name: string;
    email: string;
  } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      toast.error("Invitation token is missing");
      setIsLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        const res: any = await retrieve("ONBOARDING_PREVIEW", {}, { token });
        if (res) {
          setInvitePreview({
            company_name: res.company_name,
            email: res.email,
          });
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Invalid or expired invitation token");
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      await post("ONBOARDING_CLAIM", {
        token,
        password,
        first_name: firstName,
        last_name: lastName,
      });

      toast.success("Your login is set up. Sign in to complete your company details. The workspace opens once 360IQ approves your company.");
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to set up administrator account");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0d173b]">
        <div className="text-center text-white space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#7c69ff]" />
          <p className="text-sm font-sans tracking-wide text-white/70">
            Verifying invitation credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!invitePreview) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0d173b]">
        <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="h-14 w-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Invalid Link</h2>
          <p className="text-sm text-slate-500">
            This invitation link is invalid, expired, or has already been claimed.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0d173b] px-6 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />

      <motion.div
        className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20 p-8 sm:p-10 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="space-y-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#7c69ff]/10 border border-[#7c69ff]/30 px-4 py-1.5 rounded-full mb-2">
            <Building2 className="h-4 w-4 text-[#7c69ff]" />
            <span className="text-[#7c69ff] font-semibold text-xs uppercase tracking-wide">
              {invitePreview.company_name}
            </span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Configure CRM Account
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Set up your administrative credentials for the 360IQ B2B CRM intelligence portal.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                First Name
              </label>
              <Input
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="h-11 focus:ring-2 focus:ring-[#7c69ff] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Last Name
              </label>
              <Input
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="h-11 focus:ring-2 focus:ring-[#7c69ff] text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Primary Administrator Email
            </label>
            <Input
              value={invitePreview.email}
              disabled
              className="h-11 bg-slate-50 text-slate-400 border-slate-200 text-sm font-medium"
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Input
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 pr-10 focus:ring-2 focus:ring-[#7c69ff] text-sm"
              />
              <KeyRound className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Confirm Password
            </label>
            <Input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11 focus:ring-2 focus:ring-[#7c69ff] text-sm"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-gradient-to-r from-[#1e2e70] to-[#7c69ff] hover:opacity-90 text-white font-medium shadow-lg transition-all duration-300 mt-6 rounded-lg text-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Provisioning Account...
              </>
            ) : (
              "Complete Setup & Activate"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
