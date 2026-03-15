import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, UserCircle } from 'lucide-react';
import { submitApplication } from '@/lib/api/hr';
import type { EmploymentType } from '@/types/hr';

const STEPS = [
  { label: 'Personal Info' },
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900">Application Submitted!</h2>
            <p className="text-gray-600">
              Thank you for applying. An HR officer will review your application and contact you at{' '}
              <strong>{form.email}</strong> once a decision has been made.
            </p>
            <Button variant="outline" onClick={() => { setForm(EMPTY_FORM); setSubmitted(false); setStep(0); }}>
              Submit another application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <UserCircle className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Staff Onboarding Portal</h1>
            <p className="text-xs text-gray-500">Submit your application to join our team</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                    i < step
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : i === step
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-gray-300 text-gray-400 bg-white'
                  }`}
                >
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Personal Info */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Tell us about yourself</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="first_name">First Name <span className="text-red-500">*</span></Label>
                  <Input id="first_name" value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="John" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="last_name">Last Name <span className="text-red-500">*</span></Label>
                  <Input id="last_name" value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                <Input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john.doe@example.com" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="contact_number">Phone Number</Label>
                  <Input id="contact_number" value={form.contact_number} onChange={e => set('contact_number', e.target.value)} placeholder="+260 97x xxx xxx" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="national_id">National ID</Label>
                  <Input id="national_id" value={form.national_id} onChange={e => set('national_id', e.target.value)} placeholder="123456/78/1" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={form.gender} onValueChange={v => set('gender', v)}>
                    <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input id="date_of_birth" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Employment */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
              <CardDescription>Information about the role you are applying for</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="position">Position / Job Title <span className="text-red-500">*</span></Label>
                <Input id="position" value={form.position} onChange={e => set('position', e.target.value)} placeholder="e.g. Lecturer, Registrar" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="employment_type">Employment Type <span className="text-red-500">*</span></Label>
                  <Select value={form.employment_type} onValueChange={v => set('employment_type', v)}>
                    <SelectTrigger id="employment_type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="part_time">Part-Time</SelectItem>
                      <SelectItem value="probation">Probation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="employment_number">Staff / Employment Number</Label>
                  <Input id="employment_number" value={form.employment_number} onChange={e => set('employment_number', e.target.value)} placeholder="e.g. UNILUS/S/2024/001" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="salary_scale">Salary Scale</Label>
                <Input id="salary_scale" value={form.salary_scale} onChange={e => set('salary_scale', e.target.value)} placeholder="e.g. SS-7" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Background */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Background &amp; Reason</CardTitle>
              <CardDescription>Help us understand your qualifications and motivation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="qualifications">Qualifications</Label>
                <Textarea
                  id="qualifications"
                  value={form.qualifications}
                  onChange={e => set('qualifications', e.target.value)}
                  placeholder="List your academic qualifications and certifications..."
                  rows={4}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reason_for_joining">Reason for Joining</Label>
                <Textarea
                  id="reason_for_joining"
                  value={form.reason_for_joining}
                  onChange={e => set('reason_for_joining', e.target.value)}
                  placeholder="Why do you want to join our institution?"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review Your Application</CardTitle>
              <CardDescription>Please confirm the details below before submitting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-gray-50 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Name:</span> <span className="font-medium">{form.first_name} {form.last_name}</span></div>
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{form.email}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{form.contact_number || 'N/A'}</span></div>
                <div><span className="text-gray-500">National ID:</span> <span className="font-medium">{form.national_id || 'N/A'}</span></div>
                <div><span className="text-gray-500">Position:</span> <span className="font-medium">{form.position}</span></div>
                <div><span className="text-gray-500">Employment Type:</span> <span className="font-medium capitalize">{form.employment_type.replace('_', ' ')}</span></div>
                {form.employment_number && <div><span className="text-gray-500">Staff No.:</span> <span className="font-medium">{form.employment_number}</span></div>}
                {form.salary_scale && <div><span className="text-gray-500">Salary Scale:</span> <span className="font-medium">{form.salary_scale}</span></div>}
              </div>
              {form.reason_for_joining && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Reason for Joining:</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded border p-3">{form.reason_for_joining}</p>
                </div>
              )}
              <p className="text-xs text-gray-500">
                By submitting this application you confirm that all information provided is accurate and complete.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleBack} disabled={step === 0} className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} className="flex items-center gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
