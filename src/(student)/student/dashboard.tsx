import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { get } from '@/lib/api/crud';
import { useAuth } from '@/lib/context/useAuth';

interface Application {
  id: string;
  status: string;
  programme_of_study: string;
  created_at: string;
  reviewed_at?: string;
  review_comments?: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const data = await get('MY_APPLICATION');
        setApplication(data);
      } catch (error) {
        console.error("Failed to fetch application:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'under_review': return <Clock className="w-5 h-5 text-blue-600" />;
      default: return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#172E70]">
            Welcome, {user?.first_name}!
          </h1>
          <p className="text-gray-500 mt-1">Manage your application and student journey.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/student/my-payments">
              <CreditCard className="w-4 h-4 mr-2" /> Make Payment
            </Link>
          </Button>
          <Button className="bg-[#172E70] hover:bg-[#1a3580]" asChild>
            <Link to="/student/my-application">
              <FileText className="w-4 h-4 mr-2" /> View Application
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Application Status Card */}
        <Card className="md:col-span-2 border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
              Application Status
              {application && (
                <Badge variant="outline" className={getStatusColor(application.status)}>
                  {application.status.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Track the progress of your admission.</CardDescription>
          </CardHeader>
          <CardContent>
            {application ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="mt-1">{getStatusIcon(application.status)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {application.programme_of_study}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Submitted on {new Date(application.created_at).toLocaleDateString()}
                    </p>
                    
                    {application.status === 'rejected' && application.review_comments && (
                      <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100">
                        <strong>Reason:</strong> {application.review_comments}
                      </div>
                    )}
                     {application.status === 'under_review' && (
                      <p className="text-sm text-blue-600 mt-2">
                        Your application is currently being reviewed by the admissions team.
                      </p>
                    )}
                  </div>
                   <Button variant="ghost" size="sm" asChild>
                    <Link to="/student/my-application">
                      View Details <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>

                {/* Stepper / Timeline Placeholder */}
                <div className="relative pl-4 space-y-6 border-l-2 border-gray-100 ml-2">
                   <div className="relative">
                    <div className="absolute -left-[21px] bg-green-500 h-3 w-3 rounded-full ring-4 ring-white"></div>
                    <p className="text-sm font-medium text-gray-900">Application Submitted</p>
                    <p className="text-xs text-gray-500">{new Date(application.created_at).toLocaleDateString()}</p>
                  </div>
                   <div className="relative">
                    <div className={`absolute -left-[21px] h-3 w-3 rounded-full ring-4 ring-white ${
                        ['under_review', 'approved', 'rejected'].includes(application.status) ? 'bg-blue-500' : 'bg-gray-200'
                    }`}></div>
                    <p className={`text-sm font-medium ${
                         ['under_review', 'approved', 'rejected'].includes(application.status) ? 'text-gray-900' : 'text-gray-400'
                    }`}>Under Review</p>
                  </div>
                   <div className="relative">
                    <div className={`absolute -left-[21px] h-3 w-3 rounded-full ring-4 ring-white ${
                        ['approved', 'rejected'].includes(application.status) ? (application.status === 'approved' ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-200'
                    }`}></div>
                    <p className={`text-sm font-medium ${
                        ['approved', 'rejected'].includes(application.status) ? 'text-gray-900' : 'text-gray-400'
                    }`}>Final Decision</p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No active application found.</p>
                <Button variant="link" asChild className="mt-2 text-[#172E70]">
                   <Link to="/join">Start New Application</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions / Notifications */}
        <div className="space-y-6">
           <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Notifications</CardTitle>
            </CardHeader>
            <CardContent>
               {application?.status === 'pending' ? (
                 <div className="flex gap-3 text-sm text-gray-600">
                   <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                   <p>Your application is pending review. Please ensure all documents are uploaded.</p>
                 </div>
               ) : (
                 <p className="text-sm text-gray-500 italic">No new notifications.</p>
               )}
            </CardContent>
          </Card>

           <Card className="bg-[#172E70] text-white border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
              <CardDescription className="text-blue-200">
                Contact the admissions office for support.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-sm mb-4">Email: admissions@unidis.edu.zm</p>
               <p className="text-sm">Phone: +260 211 123456</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
