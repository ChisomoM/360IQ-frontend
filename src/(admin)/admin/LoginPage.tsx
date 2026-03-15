
import React from "react"
import { motion } from "framer-motion"
import { LoginForm } from "../../components/auth/loginForm"

interface LoginPageProps {
  onSignUpClick?: () => void
}

export const LoginPage: React.FC<LoginPageProps> = () => {

  const particles = Array.from({ length: 18 })

  return (

    <motion.div
      className="min-h-screen w-full flex bg-[#1e3c21] relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >

      {/* floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        {particles.map((_, i) => (

          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#febb00]/40 rounded-full"
            initial={{
              x: Math.random() * 1400,
              y: Math.random() * 800,
              opacity: 0
            }}
            animate={{
              y: [null, -120],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 12 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5
            }}
          />

        ))}

      </div>

      <div className="relative z-10 flex w-full min-h-screen">

        <div
          className="hidden lg:flex flex-col justify-between w-1/2 px-16 py-14 text-white bg-cover bg-center relative"
          style={{ backgroundImage: "url('/campus.jpg')" }}
        >

          <div className="absolute inset-0 bg-[#1e3c21]/85" />

          <motion.div
            className="relative z-10 flex items-start"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >

            <motion.img
              src="/logos/unilus-logo-3.png"
              alt="UNILUS Logo"
              className="h-36 object-contain"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 200 }}
            />

          </motion.div>

          <motion.div
            className="relative z-10 max-w-lg"
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >

            <div className="inline-flex items-center gap-2 bg-[#febb00]/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#febb00]/40 mb-6">

              <span className="text-[#febb00] font-semibold text-xs uppercase tracking-wider">
                UNILUS DIMS
              </span>

            </div>

            <h1 className="text-4xl font-bold leading-tight mb-5">

              Document Intelligence &{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#febb00] via-yellow-300 to-[#febb00]">
                Management System
              </span>

            </h1>

            <p className="text-base text-white/80 leading-relaxed">

              A centralized digital platform built to manage institutional
              documents, automate administrative processes, and generate
              insights across the University of Lusaka.

            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-white/75">

              <div className="flex items-center gap-2">
                <span className="text-[#febb00]">•</span>
                Smart document indexing
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#febb00]">•</span>
                Secure digital archives
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#febb00]">•</span>
                Analytics & reporting
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#febb00]">•</span>
                Real-time institutional insights
              </div>

            </div>

            <div className="mt-8 w-16 h-1 bg-[#febb00] rounded-full" />

          </motion.div>

        </div>

        <div className="flex items-center justify-center w-full lg:w-1/2 px-8 bg-white border-l border-gray-200">

          <motion.div
            className="w-full max-w-md"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >

            <div className="lg:hidden flex justify-center mb-10">

              <img
                src="/logos/unilus-logo-3.png"
                alt="UNILUS Logo"
                className="h-28"
              />

            </div>

            <motion.div
              className="bg-white border border-gray-200 rounded-2xl shadow-xl p-10"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
            >

              <h2 className="text-3xl font-bold text-[#1e3c21] mb-2">
                Welcome Back
              </h2>

              <p className="text-sm text-gray-500 mb-8">
                Sign in to access the UNILUS Document Intelligence &
                Management System.
              </p>

              <LoginForm onSignUpClick={() => {}} />

              <p className="mt-8 text-center text-xs text-gray-400">

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

              </p>

            </motion.div>

          </motion.div>

        </div>

      </div>

    </motion.div>

  )
}

