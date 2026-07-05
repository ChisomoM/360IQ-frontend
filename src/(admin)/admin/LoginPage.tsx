import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { LoginForm } from "../../components/auth/loginForm"
import { DashboardPreviewPanel } from "./DashboardPreviewPanel"
import { retrieve } from "../../lib/api/crud"

interface LoginPageProps {
  onSignUpClick?: () => void
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE }
  }
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  const [latestInvitation, setLatestInvitation] = useState<{
    token: string;
    company_name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    const fetchLatestInvite = async () => {
      try {
        const res: any = await retrieve("ONBOARDING_LATEST_DEBUG");
        if (res && res.token) {
          setLatestInvitation(res);
        }
      } catch (err) {
        // Silent catch: ignore in production
      }
    };
    fetchLatestInvite();
  }, []);
  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      {latestInvitation && (
        <a
          href={`/onboarding/claim?token=${latestInvitation.token}`}
          className="bg-[#febb00] text-slate-900 py-3 px-4 text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 hover:opacity-95 transition-all shadow-md z-50 relative border-b border-yellow-600 animate-pulse"
        >
          <span>🚀 DEMO SHORTCUT: Ready to set password for <strong>{latestInvitation.company_name}</strong>? Click here to claim setup token.</span>
        </a>
      )}

      <div className="flex-1 w-full flex overflow-hidden">
        {/* ── LEFT — Dashboard preview panel ─────────────────────────────────── */}
        <DashboardPreviewPanel />

      {/* ── RIGHT — Login form ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center w-full lg:w-1/2 min-h-screen px-8 bg-white">

        <motion.div
          className="w-full max-w-md"
          variants={container}
          initial="hidden"
          animate="show"
        >

          {/* Mobile-only logo */}
          <motion.div className="lg:hidden flex justify-center mb-10" variants={item}>
            <img src="/logos/dims-logo.svg" alt="DIMS" style={{ height: "32px", width: "auto" }} />
          </motion.div>

          {/* Login card */}
          <motion.div
            className="bg-white rounded-2xl p-10"
            variants={item}
          >
            {/* Card logo */}
            <motion.div className="mb-8" variants={item}>
              <img src="/logos/dims-logo.svg" alt="DIMS" style={{ height: "28px", width: "auto" }} />
            </motion.div>

            <motion.h2
              className="font-display text-3xl font-bold text-slate-900 mb-1.5 tracking-tight"
              variants={item}
            >
              Welcome back
            </motion.h2>

            <motion.p
              className="font-sans text-base text-slate-500 mb-8"
              variants={item}
            >
              Sign in to your DIMS workspace.
            </motion.p>

            <motion.div variants={item}>
              <LoginForm onSignUpClick={() => {}} />
            </motion.div>

            <motion.p
              className="mt-8 text-center font-sans text-xs text-slate-400"
              variants={item}
            >
              By signing in you agree to the{" "}
              <a href="#" className="underline hover:text-slate-600 transition-colors">
                Terms of Service
              </a>
              {" "}and{" "}
              <a href="#" className="underline hover:text-slate-600 transition-colors">
                Privacy Policy
              </a>
            </motion.p>
          </motion.div>

        </motion.div>
      </div>

    </div>
  </div>
  )
}

