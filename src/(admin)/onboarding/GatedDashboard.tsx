import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/context/useAuth";
import { retrieve } from "@/lib/api/crud";
import { LogOut, ClipboardList } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionBody } from "@/components/shared/SectionBody";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PublicHeader } from "@/(public)/PublicParts";
import { onboardingStateBadge } from "@/(public)/onboardingState";

export default function GatedDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      const res: any = await retrieve("ONBOARDING_STATUS");
      if (res) {
        setOnboardingData(res);
        // If state is active, redirect to dashboard
        if (res.state === "ACTIVE") {
          navigate("/admin/dashboard");
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll onboarding status every 15 seconds
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const state = onboardingData?.state || "REGISTERED";
  const companyName = onboardingData?.company_name || "Your company";
  const badge = onboardingStateBadge(state);

  return (
    <div className="flex min-h-screen w-full flex-col bg-surface-0 text-text-primary">
      <PublicHeader
        actions={
          <Button variant="ghost" onClick={() => logout()}>
            <LogOut /> Sign out
          </Button>
        }
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-10 sm:px-6">
        {isLoading ? (
          <SectionCard padded={false}>
            <SectionBody loading>{null}</SectionBody>
          </SectionCard>
        ) : (
          <>
            <PageHeader crumb={companyName} title="Onboarding review pending" description="Your company registration is locked while ControlHub supervisors review it." />

            <SectionCard title="Review status" actions={<StatusBadge tone={badge.tone} label={badge.label} />}>
              {state === "INFO_REQUESTED" ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-text-primary">Changes requested</p>
                  <p className="break-words rounded-md bg-caution-tint p-3 text-sm text-caution">
                    {onboardingData?.info_requested_fields || "Please review NDA signature or incorporation docs."}
                  </p>
                  <Button onClick={() => navigate("/onboarding/wizard")}>
                    <ClipboardList /> Update registration
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-text-primary">What happens next</p>
                  <p className="max-w-[65ch] text-sm text-text-secondary">
                    The compliance team is checking your PACRA incorporation details, TPIN certificate and standard NDA. You will get an email once your workspace is ready.
                  </p>
                </div>
              )}
            </SectionCard>
          </>
        )}
      </main>

      <footer className="pb-6 text-center text-xs text-text-muted">
        <p>© 2026 360IQ</p>
      </footer>
    </div>
  );
}
