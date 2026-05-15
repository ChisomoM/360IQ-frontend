import React from "react"
import { motion } from "framer-motion"
import { LoginForm } from "../../components/auth/loginForm"

interface LoginPageProps {
  onSignUpClick?: () => void
}

export const LoginPage: React.FC<LoginPageProps> = () => {

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
      className="min-h-screen w-full flex bg-[#1e3a8a] relative overflow-hidden"
      initial="hidden"
      animate="show"
      variants={container}
    >

      <div className="relative z-10 flex w-full min-h-screen">

        {/* LEFT PANEL */}
        <div
          className="hidden lg:flex flex-col justify-between w-1/2 px-16 py-14 text-white bg-cover bg-center relative"
          style={{ backgroundImage: "url('/campus.jpg')" }}
        >

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1e3a8a]/65 to-[#1e3a8a]/95" />

          <motion.div
            className="relative z-10 flex items-start"
            variants={item}
          >

            <h1 className="text-7xl font-bold text-white tracking-tight transition-transform duration-500 hover:scale-105" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.05em' }}>
              DIMS
            </h1>

          </motion.div>

          <motion.div
            className="relative z-10 max-w-lg"
            variants={item}
          >

            <div className="inline-flex items-center gap-2 bg-[#3b82f6]/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#3b82f6]/40 mb-6">

              <span className="text-[#3b82f6] font-semibold text-xs uppercase tracking-wider">
                DIMS Platform
              </span>

            </div>

            <h1 className="text-4xl font-bold leading-tight mb-5">

              Document Intelligence &{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] via-blue-400 to-[#60a5fa]">
                Management System
              </span>

            </h1>

            <p className="text-base text-white/80 leading-relaxed">

              A powerful multi-tenant platform designed to streamline document
              management, automate workflows, and deliver actionable insights
              for educational institutions and organizations.

            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-white/75">

              <div className="flex items-center gap-2">
                <span className="text-[#3b82f6]">•</span>
                Smart document indexing
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#3b82f6]">•</span>
                Secure digital archives
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#3b82f6]">•</span>
                Analytics & reporting
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#3b82f6]">•</span>
                Real-time insights & dashboards
              </div>

            </div>

            <div className="mt-8 w-16 h-1 bg-[#3b82f6] rounded-full" />

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

              <h1 className="text-6xl font-bold text-[#1e3a8a] tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif", letterSpacing: '0.05em' }}>
                DIMS
              </h1>

            </motion.div>

            <motion.div
              className="bg-white border border-gray-200 rounded-2xl shadow-xl p-10"
              variants={item}
            >

              <motion.h2
                className="text-3xl font-bold text-[#1e3a8a] mb-2"
                variants={item}
              >
                Welcome Back
              </motion.h2>

              <motion.p
                className="text-sm text-gray-500 mb-8"
                variants={item}
              >
                Sign in to access the Document Intelligence &
                Management System.
              </motion.p>

              <motion.div variants={item}>
                <LoginForm onSignUpClick={() => {}} />
              </motion.div>

              <motion.p
                className="mt-8 text-center text-xs text-gray-400"
                variants={item}
              >

                By signing in you agree to the{" "}

                <a
                  href="#"
                  className="underline hover:text-gray-600 transition-colors"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="underline hover:text-gray-600 transition-colors"
                >
                  Privacy Policy
                </a>

              </motion.p>

            </motion.div>

          </motion.div>

        </div>

      </div>

    </motion.div>

  )
}

