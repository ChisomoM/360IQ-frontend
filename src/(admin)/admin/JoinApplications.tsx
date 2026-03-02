import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { list, update } from '@/lib/api/crud';
import type { Application } from '@/types/application';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { exportApplicationToPDF } from '@/lib/pdfExport';
import { Loader2, FileText, Clock, CheckCircle } from 'lucide-react';

export default function JoinApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch from API: GET /students/applications
      // We can pass query params for filtering if getting too large
      const data = await list('APPLICATIONS');
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterApplications = useCallback(() => {
    let filtered = applications;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.first_name.toLowerCase().includes(query) ||
        app.last_name.toLowerCase().includes(query) ||
        app.nrc.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  }, [applications, searchQuery, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    filterApplications();
  }, [filterApplications]);

  const updateApplicationStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      // API call to update status
      // PUT /students/applications/:id/status
      // update(key, data, params)
      await update('APPLICATION_STATUS', { status, comment: `Application ${status} by admin` }, { id });

      // If approved, backend handles user role update and notification.
      // If we need to trigger specific actions, we can do it here, but generally backend should handle logic.

      setApplications(prev =>
        prev.map(app => (app.id === id ? { ...app, status } : app))
      );
      toast.success(`Application ${status} successfully`);
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('MMM DD, YYYY');
  };

  const viewApplication = (application: Application) => {
    setSelectedApplication(application);
    setIsDialogOpen(true);
  };

  const downloadApplicationPDF = async (application: Application) => {
    try {
      await exportApplicationToPDF(application);
      toast.success('Application PDF downloaded successfully');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  // Calculate stats
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Join Applications</h1>
          <p className="text-gray-600 mt-1">Manage membership applications</p>
        </div>
        <Button onClick={fetchApplications} variant="outline">
          <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Applications</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Approved</p>
                <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filter Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, NRC, or school..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('approved')}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle>Applications List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FileText className="h-12 w-12 mb-4" />
              <p>No applications found</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-900">
                <TableRow className="border-b border-gray-700">
                  <TableHead className="text-white font-semibold py-3 px-4">Full Name</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4">NRC</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4">Programme</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4">Intake</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4">Date Applied</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4">Status</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application, index) => (
                  <TableRow
                    key={application.id}
                    className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <TableCell className="font-medium">{application.first_name} {application.last_name}</TableCell>
                    <TableCell>{application.nrc}</TableCell>
                    <TableCell>{application.programme_of_study}</TableCell>
                    <TableCell>{application.intake}</TableCell>
                    <TableCell>{formatDate(application.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem onClick={() => viewApplication(application)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadApplicationPDF(application)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          {application.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => updateApplicationStatus(application.id, 'approved')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Full details of the membership application
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              {/* Status and Date */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedApplication.status)}
                <span className="text-sm text-gray-500">
                  Applied: {formatDate(selectedApplication.created_at)}
                </span>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Full Name</p>
                    <p className="font-medium">{selectedApplication.first_name} {selectedApplication.last_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">NRC / Passport</p>
                    <p className="font-medium">{selectedApplication.nrc}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium">{selectedApplication.phone_number}</p>
                  </div>
                   <div>
                    <p className="text-gray-600">Gender</p>
                    <p className="font-medium">{selectedApplication.gender}</p>
                  </div>
                   <div>
                    <p className="text-gray-600">Date of Birth</p>
                    <p className="font-medium">{formatDate(selectedApplication.date_of_birth)}</p>
                  </div>
                </div>
              </div>

               {/* Address Information */}
               <div>
                <h3 className="font-semibold text-lg mb-3">Contact & Address</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <p className="text-gray-600">Residential Address</p>
                    <p className="font-medium">{selectedApplication.address}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">City</p>
                    <p className="font-medium">{selectedApplication.city}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Province</p>
                    <p className="font-medium">{selectedApplication.province}</p>
                  </div>
                </div>
              </div>


              {/* Academic Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Academic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Previous School</p>
                    <p className="font-medium">{selectedApplication.school_name}</p>
                  </div>
                   <div>
                    <p className="text-gray-600">Graduation Year</p>
                    <p className="font-medium">{selectedApplication.graduation_year}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Programme of Study</p>
                    <p className="font-medium">{selectedApplication.programme_of_study}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Mode of Study</p>
                    <p className="font-medium">{selectedApplication.mode_of_study}</p>
                  </div>
                   <div>
                    <p className="text-gray-600">Intake</p>
                    <p className="font-medium">{selectedApplication.intake}</p>
                  </div>
                </div>
                <div className="mt-2">
                    <p className="text-gray-600 text-sm">Results Summary</p>
                    <p className="font-medium text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded mt-1">{selectedApplication.results_summary}</p>
                </div>
              </div>



              {/* Documents */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Documents</h3>
                <p className="text-sm text-gray-500">Document viewing will be implemented with the DMS integration.</p>
                {/* 
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    View Uploaded Documents
                  </Button>
                </div>
                */}
              </div>

              {/* Action Buttons */}
              {selectedApplication.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      updateApplicationStatus(selectedApplication.id, 'approved');
                      setIsDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      updateApplicationStatus(selectedApplication.id, 'rejected');
                      setIsDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
