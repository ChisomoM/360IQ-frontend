import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/context/useAuth";
import { retrieve } from "@/lib/api/crud";
import {
  ShieldAlert,
  Loader2,
  LogOut,
  Building2,
  Clock,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1];

export default function GatedDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res: any = await retrieve("ONBOARDING_STATUS");
      if (res) {
        setOnboardingData(res);
        // If state is active, redirect to dashboard
        if (res.state === "ACTIVE") {
          navigate("/admin/dashboard");
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll onboarding status every 15 seconds
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0d173b]">
        <Loader2 className="h-10 w-10 animate-spin text-[#7c69ff]" />
      </div>
    );
  }

  const state = onboardingData?.state || "REGISTERED";
  const companyName = onboardingData?.company_name || "Your Company";

  return (
    <div className="min-h-screen w-full bg-[#f4f7fe] flex flex-col justify-between py-10 px-6 relative overflow-hidden">
      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-[#1e2e70]" />
          <span className="font-display font-extrabold text-lg text-slate-800 tracking-tight">
            360IQ B2B CRM
          </span>
        </div>
        <Button
          variant="outline"
          onClick={() => logout()}
          className="flex items-center gap-2 border-slate-300 text-slate-600 hover:text-slate-800"
        >
          <LogOut className="h-4 w-4" /> Log Out
        </Button>
      </header>

      {/* Main Lock Card */}
      <main className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 text-center space-y-8 z-10 my-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="space-y-6"
        >
          {/* Visual Status Indicator */}
          <div className="mx-auto h-20 w-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border-2 border-amber-200 animate-pulse">
            {state === "INFO_REQUESTED" ? (
              <ShieldAlert className="h-10 w-10" />
            ) : (
              <Clock className="h-10 w-10" />
            )}
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Onboarding Review Pending
            </h1>
            <p className="text-sm font-semibold text-[#1e2e70] uppercase tracking-wide">
              {companyName}
            </p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Your company registration profile is currently locked and undergoing compliance audits by ControlHub supervisors.
            </p>
          </div>

          {/* Detailed Info Cards based on State */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Review Status</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                state === "INFO_REQUESTED"
                  ? "bg-amber-100 text-amber-700"
                  : state === "SUBMITTED"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-700"
              }`}>
                {state.replace("_", " ")}
              </span>
            </div>

            {state === "INFO_REQUESTED" ? (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-700">
                  Compliance Feedback & Actions Required:
                </p>
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs leading-relaxed">
                  {onboardingData?.info_requested_fields || "Please review NDA signature or incorporation docs."}
                </div>
                <Button
                  onClick={() => navigate("/onboarding/wizard")}
                  className="w-full bg-[#1e2e70] hover:bg-[#25398a] text-white text-xs font-bold mt-2"
                >
                  <ClipboardList className="mr-2 h-4 w-4" /> Update Registration Profile
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-700">Audit Progress</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Our compliance team is verifying your PACRA incorporation details, TAX TPIN certificate, and Standard NDA. You will receive an automated email notification once the CRM workspace is fully provisioned.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 z-10">
        <p>© 2026 360IQ B2B Intelligence CRM. All rights reserved.</p>
      </footer>
    </div>
  );
}
