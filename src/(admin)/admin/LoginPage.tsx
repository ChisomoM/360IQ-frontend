import React from "react";
import { LoginForm } from "../../components/auth/loginForm";

interface LoginPageProps {
  onSignUpClick?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1e3c21] relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#febb00]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#febb00]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl min-h-[600px] flex rounded-2xl overflow-hidden shadow-2xl mx-4">
        {/* ── Left Panel ── */}
        <div
          className="relative hidden md:flex flex-col justify-between w-1/2 p-10 text-white bg-cover bg-center"
          style={{ backgroundImage: "url('/campus.jpg')" }}
        >
          {/* Dark green overlay */}
          <div className="absolute inset-0 bg-[#1e3c21]/70 rounded-l-2xl" />

          {/* Logo + Back link */}
          <div className="relative z-10 flex items-center justify-between">
            <img
              src="/logos/unilus-logo-3.png"
              alt="University of Lusaka Logo"
              className="h-20 w-auto object-contain drop-shadow-lg"
            />
            <a
              href="/"
              className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Website
            </a>
          </div>

          {/* Tagline */}
          <div className="relative z-10">
            {/* Gold accent badge */}
            <div className="inline-flex items-center gap-2 bg-[#febb00]/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#febb00]/50 mb-4">
              <span className="text-[#febb00] font-semibold text-xs uppercase tracking-wider">
                Admissions Open Now
              </span>
            </div>
            <h1 className="text-3xl font-bold leading-snug mb-3">
              Transform Your{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#febb00] via-yellow-300 to-[#febb00]">
                Future at UNILUS
              </span>
            </h1>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              Accredited degrees, innovative learning, and global recognition —
              all in one institution built for your success.
            </p>
            <div className="mt-6 w-8 h-1 bg-[#febb00]/60 rounded-full" />
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="flex flex-col justify-center w-full md:w-1/2 bg-white px-10 py-12">
          {/* Mobile logo */}
          <div className="flex justify-center mb-6 md:hidden">
            <img
              src="/logos/unilus-logo-3.png"
              alt="University of Lusaka Logo"
              className="h-20 w-auto object-contain"
            />
          </div>

          <h2 className="text-2xl font-bold text-[#1e3c21] mb-1">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Sign in to access your UNILUS dashboard.
          </p>

          <LoginForm onSignUpClick={() => {}} />

          <p className="mt-6 text-center text-xs text-gray-400">
            By signing in, you agree to our{" "}
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
