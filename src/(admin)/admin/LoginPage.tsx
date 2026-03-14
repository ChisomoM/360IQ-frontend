import React from "react";
import { LoginForm } from "../../components/auth/loginForm";

interface LoginPageProps {
  onSignUpClick?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e3c21] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#febb00]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#febb00]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl min-h-[600px] flex rounded-2xl overflow-hidden shadow-2xl mx-4">

        <div
          className="relative hidden md:flex flex-col justify-between w-1/2 p-10 text-white bg-cover bg-center"
          style={{ backgroundImage: "url('/campus.jpg')" }}
        >
          <div className="absolute inset-0 bg-[#1e3c21]/80 rounded-l-2xl" />

          <div className="relative z-10">
            <img
              src="/logos/unilus-logo-3.png"
              alt="University of Lusaka Logo"
              className="h-20 w-auto object-contain drop-shadow-lg"
            />
          </div>

          <div className="relative z-10 max-w-sm">
            <div className="inline-flex items-center gap-2 bg-[#febb00]/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#febb00]/50 mb-5">
              <span className="text-[#febb00] font-semibold text-xs uppercase tracking-wider">
                UNILUS DIMS
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-snug mb-4">
              Digital Information{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#febb00] via-yellow-300 to-[#febb00]">
                Management System
              </span>
            </h1>

            <p className="text-sm text-white/80 leading-relaxed">
              Securely manage academic records, documents, and administrative
              workflows through the University of Lusaka’s centralized digital
              management platform.
            </p>

            <p className="text-sm text-white/60 leading-relaxed mt-4">
              Access student records, manage institutional data, and collaborate
              efficiently across departments in one secure system.
            </p>

            <div className="mt-6 w-10 h-1 bg-[#febb00]/70 rounded-full" />
          </div>
        </div>

        <div className="flex flex-col justify-center w-full md:w-1/2 bg-white px-10 py-12">
          <div className="flex justify-center mb-6 md:hidden">
            <img
              src="/logos/unilus-logo-3.png"
              alt="University of Lusaka Logo"
              className="h-20 w-auto object-contain"
            />
          </div>

          <h2 className="text-2xl font-bold text-[#1e3c21] mb-2">
            Welcome Back
          </h2>

          <p className="text-sm text-gray-500 mb-8">
            Sign in to access the UNILUS Digital Information Management System.
          </p>

          <LoginForm onSignUpClick={() => {}} />

          <p className="mt-6 text-center text-xs text-gray-400">
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
            .
          </p>
        </div>

      </div>
    </div>
  );
};