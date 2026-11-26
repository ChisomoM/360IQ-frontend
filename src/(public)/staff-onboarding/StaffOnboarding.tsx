import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { Field } from '@/components/profiles/formParts';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from '@/components/icons';
import { submitApplication } from '@/lib/api/hr';
import { formatDate } from '@/lib/format';
import type { EmploymentType } from '@/types/hr';
import { PublicHeader, Stepper } from '../PublicParts';

const STEPS = [
  { label: 'Personal details' },
  { label: 'Employment' },
  { label: 'Background' },
  { label: 'Review' },
];

interface ApplicationForm {
  first_name: string;
  last_name: string;
  email: string;
  national_id: string;
  contact_number: string;
  gender: string;
  date_of_birth: string;
  position: string;
  employment_type: EmploymentType | '';
  employment_number: string;
  salary_scale: string;
  reason_for_joining: string;
  qualifications: string;
}

const EMPTY_FORM: ApplicationForm = {
  first_name: '',
  last_name: '',
  email: '',
  national_id: '',
  contact_number: '',
  gender: '',
  date_of_birth: '',
  position: '',
  employment_type: '',
  employment_number: '',
  salary_scale: '',
  reason_for_joining: '',
  qualifications: '',
};

export default function StaffOnboarding() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof ApplicationForm, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.first_name.trim() || !form.last_name.trim()) {
        toast.error('First name and last name are required');
        return false;
      }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        toast.error('A valid email address is required');
        return false;
      }
    }
    if (step === 1) {
      if (!form.position.trim()) {
        toast.error('Position is required');
        return false;
      }
      if (!form.employment_type) {
        toast.error('Employment type is required');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        employment_type: form.employment_type as EmploymentType,
        date_of_birth: form.date_of_birth || undefined,
      };
      await submitApplication(payload as Parameters<typeof submitApplication>[0]);
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-0 text-text-primary">
        <PublicHeader />
        <main className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-10 sm:px-6">
          <PageHeader title="Application submitted" />
          <SectionCard>
            <div className="flex flex-col items-center gap-4 py-4 text-center" role="status">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-positive-tint text-positive">
                <CheckCircle2 size={24} />
              </div>
              <p className="max-w-[44ch] text-sm text-text-secondary">
                An HR officer will review your application and contact you at{' '}
                <strong className="break-all text-text-primary">{form.email}</strong> once a decision has been made.
              </p>
              <Button variant="secondary" onClick={() => { setForm(EMPTY_FORM); setSubmitted(false); setStep(0); }}>
                Submit another application
              </Button>
            </div>
          </SectionCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-0 text-text-primary">
      <PublicHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6">
        <PageHeader title="Staff application" description="Submit your application to join the team." />

        <Stepper steps={STEPS.map(s => s.label)} current={step} />

        {/* Step 0: Personal Info */}
        {step === 0 && (
          <SectionCard title="Personal details">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="First name (required)" htmlFor="first_name">
                  <Input id="first_name" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Natasha" />
                </Field>
                <Field label="Last name (required)" htmlFor="last_name">
                  <Input id="last_name" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Lungu" />
                </Field>
              </div>
              <Field label="Email address (required)" htmlFor="email">
                <Input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="name@company.co.zm" />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Phone number" htmlFor="contact_number">
                  <Input id="contact_number" value={form.contact_number} onChange={e => set('contact_number', e.target.value)} placeholder="+260 97 123 4567" />
                </Field>
                <Field label="National ID" htmlFor="national_id">
                  <Input id="national_id" value={form.national_id} onChange={e => set('national_id', e.target.value)} placeholder="123456/78/1" className="font-mono" />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Gender" htmlFor="gender">
                  <Select value={form.gender} onValueChange={v => set('gender', v)}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Choose a gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Date of birth" htmlFor="date_of_birth">
                  <Input id="date_of_birth" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                </Field>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Step 1: Employment */}
        {step === 1 && (
          <SectionCard title="Employment details">
            <div className="space-y-4">
              <Field label="Position or job title (required)" htmlFor="position">
                <Input id="position" value={form.position} onChange={e => set('position', e.target.value)} placeholder="Account manager" />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Employment type (required)" htmlFor="employment_type">
                  <Select value={form.employment_type} onValueChange={v => set('employment_type', v)}>
                    <SelectTrigger id="employment_type"><SelectValue placeholder="Choose a type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Staff or employment number" htmlFor="employment_number">
                  <Input id="employment_number" value={form.employment_number} onChange={e => set('employment_number', e.target.value)} className="font-mono" />
                </Field>
              </div>
              <Field label="Salary scale" htmlFor="salary_scale">
                <Input id="salary_scale" value={form.salary_scale} onChange={e => set('salary_scale', e.target.value)} placeholder="SS-7" />
              </Field>
            </div>
          </SectionCard>
        )}

        {/* Step 2: Background */}
        {step === 2 && (
          <SectionCard title="Background and reason">
            <div className="space-y-4">
              <Field label="Qualifications" htmlFor="qualifications">
                <Textarea
                  id="qualifications"
                  value={form.qualifications}
                  onChange={e => set('qualifications', e.target.value)}
                  placeholder="Your academic qualifications and certifications"
                  rows={4}
                />
              </Field>
              <Field label="Reason for joining" htmlFor="reason_for_joining">
                <Textarea
                  id="reason_for_joining"
                  value={form.reason_for_joining}
                  onChange={e => set('reason_for_joining', e.target.value)}
                  placeholder="Why you want to join the team"
                  rows={4}
                />
              </Field>
            </div>
          </SectionCard>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <SectionCard title="Review your application">
            <div className="space-y-4">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ReviewItem label="Name" value={`${form.first_name} ${form.last_name}`} />
                <ReviewItem label="Email" value={form.email} />
                <ReviewItem label="Phone" value={form.contact_number || 'Not provided'} />
                <ReviewItem label="National ID" value={form.national_id || 'Not provided'} />
                {form.date_of_birth && <ReviewItem label="Date of birth" value={formatDate(form.date_of_birth)} />}
                <ReviewItem label="Position" value={form.position} />
                <ReviewItem label="Employment type" value={form.employment_type.replace('_', ' ')} className="capitalize" />
                {form.employment_number && <ReviewItem label="Staff number" value={form.employment_number} />}
                {form.salary_scale && <ReviewItem label="Salary scale" value={form.salary_scale} />}
              </dl>
              {form.reason_for_joining && (
                <div>
                  <p className="mb-1 text-xs font-medium text-text-muted">Reason for joining</p>
                  <p className="whitespace-pre-wrap break-words rounded-md bg-field p-3 text-sm text-text-primary">{form.reason_for_joining}</p>
                </div>
              )}
              <p className="text-xs text-text-muted">
                By submitting this application you confirm that all information provided is accurate and complete.
              </p>
            </div>
          </SectionCard>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-2">
          <Button variant="secondary" onClick={handleBack} disabled={step === 0}>
            <ChevronLeft /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Continue <ChevronRight />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Submit application
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function ReviewItem({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-text-muted">{label}</dt>
      <dd className={`mt-0.5 break-words text-sm font-semibold text-text-primary ${className ?? ''}`}>{value}</dd>
    </div>
  );
}
