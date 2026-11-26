import React from "react"
import { ControlHubLoginForm } from "@/components/auth/ControlHubLoginForm"
import { AuthShell } from "@/components/auth/AuthShell"

interface ControlHubLoginPageProps {
  onSignUpClick?: () => void
}

const ControlHubLoginPage: React.FC<ControlHubLoginPageProps> = () => {
  return (
    <AuthShell
      overline="360IQ ControlHub"
      summary="Manage tenants, organisation branding and platform settings for 360IQ."
      title="ControlHub sign in"
      description="Sign in to manage 360IQ tenants."
    >
      <ControlHubLoginForm onSignUpClick={() => {}} />
    </AuthShell>
  )
}

export default ControlHubLoginPage;
