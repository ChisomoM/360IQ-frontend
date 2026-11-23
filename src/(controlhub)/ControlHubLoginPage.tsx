import React from "react"
import { motion } from "framer-motion"
import { ControlHubLoginForm } from "@/components/auth/ControlHubLoginForm"

interface ControlHubLoginPageProps {
  onSignUpClick?: () => void
}

const ControlHubLoginPage: React.FC<ControlHubLoginPageProps> = () => {

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.25
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  }

  return (

    <motion.div
      className="min-h-screen w-full flex bg-brand-ink relative overflow-hidden"
      initial="hidden"
      animate="show"
      variants={container}
    >

      <div className="relative z-10 flex w-full min-h-screen">

        {/* LEFT PANEL */}
        <div
          className="hidden lg:flex flex-col justify-between w-1/2 px-16 py-14 text-white bg-cover bg-center relative"
          style={{ backgroundImage: "url('/controlhub-bg.png')" }}
        >

          <div className="absolute inset-0 bg-brand-ink/85" />

          <motion.div
            className="relative z-10 flex items-start"
            variants={item}
          >

            <img
              src="/logos/logo/360IQ-horizontal-transparent-for-dark.png"
              alt="360IQ"
              className="h-28 object-contain -ml-6 transition-transform duration-500 hover:scale-105"
            />

          </motion.div>

          <motion.div
            className="relative z-10 max-w-lg"
            variants={item}
          >

            <div className="inline-flex items-center gap-2 bg-[#19C3A6]/15 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#19C3A6]/40 mb-6">

              <span className="text-[#19C3A6] font-semibold text-xs uppercase tracking-wider">
                360IQ ControlHub
              </span>

            </div>

            <h1 className="text-4xl font-bold leading-tight mb-5">

              Tenant Management &{" "}
              <span className="text-[#19C3A6]">
                Organization Infrastructure
              </span>

            </h1>

            <p className="text-base text-white/80 leading-relaxed">

              The master control center for 360IQ platform operations. Manage tenants, 
              monitor system health, and oversee global configurations with 
              unparalleled precision.

            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-white/75">

              <div className="flex items-center gap-2">
                <span className="text-[#19C3A6]">•</span>
                Multi-tenant Orchestration
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#19C3A6]">•</span>
                Global Security Controls
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#19C3A6]">•</span>
                Organization Branding
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#19C3A6]">•</span>
                System-wide Analytics
              </div>

            </div>

            <div className="mt-8 w-16 h-1 bg-[#19C3A6] rounded-full" />

          </motion.div>

        </div>


        {/* LOGIN PANEL */}
        <div className="flex items-center justify-center w-full lg:w-1/2 px-8 bg-white border-l border-gray-200">

          <motion.div
            className="w-full max-w-md"
            variants={container}
          >

            <motion.div
              className="lg:hidden flex justify-center mb-10"
              variants={item}
            >

              <img
                src="/logos/logo/360IQ-horizontal-transparent-for-light.png"
                alt="360IQ"
                className="h-24 w-auto"
              />

            </motion.div>

            <motion.div
              className="bg-white border border-gray-200 rounded-2xl shadow-xl p-10"
              variants={item}
            >

              <motion.h2
                className="text-3xl font-bold text-brand-ink mb-2"
                variants={item}
              >
                ControlHub Login
              </motion.h2>

              <motion.p
                className="text-sm text-gray-500 mb-8"
                variants={item}
              >
                Sign in to manage the 360IQ multi-tenant ecosystem.
              </motion.p>

              <motion.div variants={item}>
                <ControlHubLoginForm onSignUpClick={() => {}} />
              </motion.div>

              <motion.p
                className="mt-8 text-center text-xs text-gray-400"
                variants={item}
              >

              Made with <span className="text-red-500">♥</span> by the 360IQ Team

              </motion.p>

            </motion.div>

          </motion.div>

        </div>

      </div>

    </motion.div>

  )
}

export default ControlHubLoginPage;
