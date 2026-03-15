import React from "react";
import { LoginForm } from "../../components/auth/loginForm";

interface LoginPageProps {
  onSignUpClick?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {

  return (

    <div className="min-h-screen w-full flex bg-gradient-to-br from-[#1e3c21] via-[#143018] to-[#1e3c21] relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[#febb00]/10 blur-[150px]" />

        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#febb00]/10 blur-[150px]" />

      </div>


      <div className="relative z-10 flex w-full min-h-screen">


        <div
          className="hidden lg:flex flex-col justify-between w-1/2 px-16 py-14 text-white bg-cover bg-center relative"
          style={{ backgroundImage: "url('/campus.jpg')" }}
        >

          <div className="absolute inset-0 bg-[#1e3c21]/85" />

          <div className="relative z-10 flex items-start">

            <img
              src="/logos/unilus-logo-3.png"
              alt="UNILUS Logo"
              className="h-36 object-contain transition-transform duration-700 hover:scale-105"
            />

          </div>


          <div className="relative z-10 max-w-lg">

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
              advanced insights across the University of Lusaka.

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

          </div>

        </div>



        <div className="flex items-center justify-center w-full lg:w-1/2 px-8">

          <div className="w-full max-w-md">

            <div className="lg:hidden flex justify-center mb-10">

              <img
                src="/logos/unilus-logo-3.png"
                alt="UNILUS Logo"
                className="h-28"
              />

            </div>


            <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-2xl p-10">

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

            </div>

          </div>

        </div>


      </div>

    </div>

  );
};