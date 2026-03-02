import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { retrieve } from '@/lib/api/crud';
import type { Application } from '@/types/application';
import { Loader2, User, Phone, Mail, MapPin, GraduationCap, Clock } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';

export default function MyApplication() {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApplication() {
      try {
        const data = await retrieve('STUDENT_MY_APPLICATION');
        setApplication(data);
      } catch (error) {
        console.error('Error fetching application:', error);
        toast.error('Failed to load application details');
      } finally {
        setLoading(false);
      }
    }
    fetchApplication();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No application found.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Review</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Under Review</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case 'enrolled':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Enrolled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Application</h1>
          <p className="text-gray-500">Submitted on {dayjs(application.application_date).format('MMMM DD, YYYY')}</p>
        </div>
        <div>
          {getStatusBadge(application.status)}
        </div>
      </div>

      {application.review_comments && (
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-1">Feedback from Admissions</h3>
            <p className="text-blue-800 text-sm">{application.review_comments}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Academic Choice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Programme</p>
                <p className="font-medium">{application.programme_of_study}</p>
              </div>
              <div>
                <p className="text-gray-500">Mode of Study</p>
                <p className="font-medium">{application.mode_of_study}</p>
              </div>
              <div>
                <p className="text-gray-500">Intake</p>
                <p className="font-medium">{application.intake}</p>
              </div>
              <div>
                <p className="text-gray-500">Year</p>
                <p className="font-medium">Year {application.year_of_study}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{application.first_name} {application.last_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>{application.gender} • Born {dayjs(application.date_of_birth).format('MMM DD, YYYY')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">NRC:</span>
              <span className="font-mono">{application.nrc}</span>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{application.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{application.phone_number}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-1" />
              <span>{application.residential_address}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
