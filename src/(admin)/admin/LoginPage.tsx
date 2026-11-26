import React from "react"
import { LoginForm } from "../../components/auth/loginForm"
import { AuthShell } from "../../components/auth/AuthShell"

interface LoginPageProps {
  onSignUpClick?: () => void
}

export const LoginPage: React.FC<LoginPageProps> = () => {
  return (
    <AuthShell
      overline="Commercial intelligence for B2B sales teams"
      summary="360IQ brings your sales pipeline, contracts and account intelligence into one system."
      title="Welcome back"
      description="Sign in to your 360IQ workspace."
    >
      <LoginForm onSignUpClick={() => {}} />

      <p className="mt-6 text-center text-xs text-text-muted">
        By signing in you agree to the{" "}
        <a href="#" className="underline transition-colors hover:text-text-primary">
          terms of service
        </a>
        {" "}and{" "}
        <a href="#" className="underline transition-colors hover:text-text-primary">
          privacy policy
        </a>
        .
      </p>
    </AuthShell>
  )
}
