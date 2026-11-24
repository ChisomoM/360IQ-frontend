import React from "react"
import { motion } from "framer-motion"
import { LoginForm } from "../../components/auth/loginForm"
import { DashboardPreviewPanel } from "./DashboardPreviewPanel"

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
  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-white">

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
            <img src="/logos/logo/360IQ-horizontal-transparent-for-light.png" alt="360IQ" style={{ height: "72px", width: "auto" }} />
          </motion.div>

          {/* Login card */}
          <motion.div
            className="bg-white rounded-2xl p-10"
            variants={item}
          >
            {/* Card logo */}
            <motion.div className="mb-8" variants={item}>
              <img src="/logos/logo/360IQ-horizontal-transparent-for-light.png" alt="360IQ" style={{ height: "64px", width: "auto", marginLeft: "-16px" }} />
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
              Sign in to your 360IQ workspace.
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
  )
}

