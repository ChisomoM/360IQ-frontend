import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, ShieldAlert, KeyRound } from "@/components/icons";
import { post, retrieve } from "@/lib/api/crud";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionBody } from "@/components/shared/SectionBody";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Field } from "@/components/profiles/formParts";
import { HeroShell } from "../PublicParts";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ClaimInvitation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitePreview, setInvitePreview] = useState<{
    company_name: string;
    email: string;
  } | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      toast.error("Invitation token is missing");
      setIsLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        const res: any = await retrieve("ONBOARDING_PREVIEW", {}, { token });
        if (res) {
          setInvitePreview({
            company_name: res.company_name,
            email: res.email,
          });
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Invalid or expired invitation token");
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsSubmitting(true);
    try {
      await post("ONBOARDING_CLAIM", {
        token,
        password,
        first_name: firstName,
        last_name: lastName,
      });

      toast.success("Your login is set up. Sign in to complete your company details. The workspace opens once 360IQ approves your company.");
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to set up administrator account");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <HeroShell>
        <SectionCard title="Checking your invitation" padded={false}>
          <SectionBody loading>{null}</SectionBody>
        </SectionCard>
      </HeroShell>
    );
  }

  if (!invitePreview) {
    return (
      <HeroShell>
        <SectionCard padded={false}>
          <EmptyState
            icon={<ShieldAlert size={24} />}
            title="This link does not work"
            description="The invitation link is invalid, has expired, or has already been used."
            action={{ label: "Return to sign in", onAction: () => navigate("/login") }}
          />
        </SectionCard>
      </HeroShell>
    );
  }

  return (
    <HeroShell>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
      >
        <SectionCard>
          <div className="space-y-3">
            <StatusBadge tone="neutral" className="h-auto min-h-[1.572rem] max-w-full whitespace-normal py-0.5">
              {invitePreview.company_name}
            </StatusBadge>
            <PageHeader title="Set up your account" description="Create the administrator sign-in for your company's 360IQ workspace." />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="First name" htmlFor="claim-first">
                <Input id="claim-first" placeholder="Natasha" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="h-11" />
              </Field>
              <Field label="Last name" htmlFor="claim-last">
                <Input id="claim-last" placeholder="Lungu" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="h-11" />
              </Field>
            </div>

            <Field label="Administrator email" htmlFor="claim-email">
              <Input id="claim-email" value={invitePreview.email} disabled className="h-11" />
            </Field>

            <Field label="Password" htmlFor="claim-password" hint="At least 8 characters">
              <div className="relative">
                <Input id="claim-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10" />
                <KeyRound size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" />
              </div>
            </Field>

            <Field label="Confirm password" htmlFor="claim-confirm">
              <Input id="claim-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-11" />
            </Field>

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Setting up your account…
                </>
              ) : (
                "Set up account"
              )}
            </Button>
          </form>
        </SectionCard>
      </motion.div>
    </HeroShell>
  );
}
