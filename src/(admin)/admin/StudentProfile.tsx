import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { retrieve } from '@/lib/api/crud';
import type { Student } from '@/types/student';
import {
  Loader2,
  User,
  School,
  FileText,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  BookOpen,
  Download,
  Eye,
  Lock,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useAuth } from '@/lib/context/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  // Permission checks
  const canViewFinance = hasPermission(user, PERMISSIONS['payments.read']);
  const canViewDocuments = hasPermission(user, PERMISSIONS['users.write']) || hasPermission(user, PERMISSIONS['users.read']);

  // Dummy data for demo
  const dummyPayments = [
    {
      id: '1',
      payment_type: 'Application Fee',
      amount: 500,
      payment_method: 'Mobile Money',
      payment_date: '2024-01-15T10:30:00Z',
      payment_ref: 'APP-2024-001',
      status: 'verified',
      verified_at: '2024-01-15T14:20:00Z',
      verified_by: 'Finance Officer'
    },
    {
      id: '2',
      payment_type: 'Tuition Fee - Sem 1',
      amount: 8500,
      payment_method: 'Bank Transfer',
      payment_date: '2024-01-20T09:15:00Z',
      payment_ref: 'TUI-2024-S1-045',
      status: 'verified',
      verified_at: '2024-01-21T11:30:00Z',
      verified_by: 'Finance Manager'
    },
    {
      id: '3',
      payment_type: 'Accommodation Fee',
      amount: 3200,
      payment_method: 'Online Payment',
      payment_date: '2024-01-25T16:45:00Z',
      payment_ref: 'ACC-2024-078',
      status: 'verified',
      verified_at: '2024-01-26T08:00:00Z',
      verified_by: 'Finance Officer'
    },
    {
      id: '4',
      payment_type: 'Library Fee',
      amount: 350,
      payment_method: 'Cash',
      payment_date: '2024-02-01T11:20:00Z',
      payment_ref: 'LIB-2024-234',
      status: 'verified',
      verified_at: '2024-02-01T13:15:00Z',
      verified_by: 'Librarian'
    },
    {
      id: '5',
      payment_type: 'Exam Fee',
      amount: 750,
      payment_method: 'Mobile Money',
      payment_date: '2024-02-10T14:30:00Z',
      payment_ref: 'EXM-2024-156',
      status: 'pending',
    }
  ];

  const dummyLibraryRecords = [
    {
      id: '1',
      book_title: 'Introduction to Computer Science',
      book_author: 'John Smith',
      isbn: '978-0-13-467106-8',
      borrowed_date: '2024-01-15T10:00:00Z',
      due_date: '2024-02-15T10:00:00Z',
      return_date: '2024-02-10T14:30:00Z',
      status: 'returned',
      fine: 0
    },
    {
      id: '2',
      book_title: 'Data Structures and Algorithms',
      book_author: 'Robert Sedgewick',
      isbn: '978-0-321-57351-3',
      borrowed_date: '2024-02-01T09:00:00Z',
      due_date: '2024-03-01T09:00:00Z',
      return_date: null,
      status: 'borrowed',
      fine: 0
    },
    {
      id: '3',
      book_title: 'Database Management Systems',
      book_author: 'Raghu Ramakrishnan',
      isbn: '978-0-07-246563-8',
      borrowed_date: '2024-02-05T11:30:00Z',
      due_date: '2024-03-05T11:30:00Z',
      return_date: null,
      status: 'borrowed',
      fine: 0
    },
    {
      id: '4',
      book_title: 'Operating System Concepts',
      book_author: 'Abraham Silberschatz',
      isbn: '978-1-118-06333-0',
      borrowed_date: '2024-01-20T13:00:00Z',
      due_date: '2024-02-20T13:00:00Z',
      return_date: '2024-03-01T10:00:00Z',
      status: 'returned_late',
      fine: 50
    }
  ];

  const dummyDocuments = [
    {
      id: '1',
      document_name: 'Grade 12 Certificate',
      document_type: 'Academic Record',
      uploaded_date: '2024-01-10T08:00:00Z',
      status: 'verified',
      verified_by: 'Registrar',
      file_size: '2.3 MB'
    },
    {
      id: '2',
      document_name: 'National Registration Card',
      document_type: 'Identification',
      uploaded_date: '2024-01-10T08:05:00Z',
      status: 'verified',
      verified_by: 'Admissions Officer',
      file_size: '1.8 MB'
    },
    {
      id: '3',
      document_name: 'Birth Certificate',
      document_type: 'Identification',
      uploaded_date: '2024-01-10T08:10:00Z',
      status: 'verified',
      verified_by: 'Admissions Officer',
      file_size: '1.5 MB'
    },
    {
      id: '4',
      document_name: 'Medical Report',
      document_type: 'Health Document',
      uploaded_date: '2024-01-12T14:30:00Z',
      status: 'pending',
      verified_by: null,
      file_size: '3.1 MB'
    },
    {
      id: '5',
      document_name: 'Passport Photo',
      document_type: 'Photo ID',
      uploaded_date: '2024-01-10T08:15:00Z',
      status: 'verified',
      verified_by: 'System',
      file_size: '850 KB'
    }
  ];

  const fetchStudent = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      // Fetch from API: GET /students/:id
      const data = await retrieve('STUDENT_DETAIL', { id });
      setStudent(data);
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error('Failed to load student profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Student not found</p>
        <Link to="/admin/students">
            <Button variant="link">Back to Students List</Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary/10 text-primary border-primary/20">Active</Badge>;
      case 'graduated':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Graduated</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Suspended</Badge>;
      case 'withdrawn':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLibraryStatusBadge = (status: string) => {
    switch (status) {
      case 'borrowed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><BookOpen className="h-3 w-3 mr-1" />Borrowed</Badge>;
      case 'returned':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Returned</Badge>;
      case 'returned_late':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><AlertCircle className="h-3 w-3 mr-1" />Returned Late</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('MMM DD, YYYY');
  };

  const fullName = student.Application
    ? `${student.Application.first_name} ${student.Application.last_name}`
    : student.User
    ? `${student.User.first_name} ${student.User.last_name}`
    : 'Unknown Student';

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link to="/admin/students" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Students
        </Link>
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                    {fullName.charAt(0)}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-gray-600">{student.student_id}</span>
                        {getStatusBadge(student.enrollment_status)}
                    </div>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline">Suspend Student</Button>
                <Button variant="tenantPrimary">Edit Details</Button>
            </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" /> Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Full Name</p>
                                <p className="font-medium">{fullName}</p>
                            </div>
                            <div>
                                 <p className="text-gray-500">Gender</p>
                                <p className="font-medium capitalize">{student.Application?.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Date of Birth</p>
                                <p className="font-medium">{formatDate(student.Application?.date_of_birth)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">NRC / Passport</p>
                                <p className="font-medium">{student.Application?.nrc || 'N/A'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" /> Contact Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{student.User?.email || student.Application?.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{student.Application?.phone_number || 'N/A'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                <span>
                                    {student.Application?.residential_address || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Current Enrollment */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <School className="h-5 w-5" /> Enrollment Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                            <div>
                                <p className="text-gray-500">Programme</p>
                                <p className="font-medium">{student.application?.programme_of_study}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Intake</p>
                                <p className="font-medium">{student.application?.intake}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Current Year</p>
                                <p className="font-medium">Year {student.current_year}, Semester {student.current_semester}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Enrollment Date</p>
                                <p className="font-medium">{formatDate(student.enrollment_date)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Academic History</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-sm">Detailed academic records (grades, courses) will be available here.</p>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium">Previous School</p>
                        <p className="text-sm text-gray-600">{student.application?.school_name} (Graduated: {student.application?.graduation_year})</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        {/* Library Tab */}
        <TabsContent value="library" className="mt-6">
            <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" /> Library Records
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Books Borrowed:</span>
                                    <span className="text-blue-600 font-bold">{dummyLibraryRecords.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Currently Borrowed:</span>
                                    <span className="text-blue-600 font-bold">
                                        {dummyLibraryRecords.filter(r => r.status === 'borrowed').length}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">Total Fines:</span>
                                    <span className="text-red-600 font-bold">
                                        K {dummyLibraryRecords.reduce((sum, r) => sum + r.fine, 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead>Book Title</TableHead>
                                    <TableHead>Author</TableHead>
                                    <TableHead>ISBN</TableHead>
                                    <TableHead>Borrowed Date</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Return Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Fine</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dummyLibraryRecords.map((record, index) => (
                                    <TableRow key={record.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <TableCell className="font-medium">{record.book_title}</TableCell>
                                        <TableCell className="text-gray-600">{record.book_author}</TableCell>
                                        <TableCell className="font-mono text-xs text-gray-500">{record.isbn}</TableCell>
                                        <TableCell>{formatDate(record.borrowed_date)}</TableCell>
                                        <TableCell>{formatDate(record.due_date)}</TableCell>
                                        <TableCell>{record.return_date ? formatDate(record.return_date) : '-'}</TableCell>
                                        <TableCell>{getLibraryStatusBadge(record.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {record.fine > 0 ? (
                                                <span className="text-red-600 font-semibold">K {record.fine.toFixed(2)}</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
            <Card>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-purple-600" /> Student Documents
                        </CardTitle>
                        {!canViewDocuments && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                                <Lock className="h-3 w-3 mr-1" /> Restricted Access
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {!canViewDocuments ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <Lock className="h-16 w-16 mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Access Restricted</h3>
                            <p className="text-gray-500 max-w-md">
                                You don't have permission to view student documents. 
                                Contact an administrator if you need access.
                            </p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Total Documents:</span>
                                        <span className="text-purple-600 font-bold">{dummyDocuments.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Verified:</span>
                                        <span className="text-green-600 font-bold">
                                            {dummyDocuments.filter(d => d.status === 'verified').length}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Pending:</span>
                                        <span className="text-yellow-600 font-bold">
                                            {dummyDocuments.filter(d => d.status === 'pending').length}
                                        </span>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download All
                                </Button>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Document Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Upload Date</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Verified By</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dummyDocuments.map((doc, index) => (
                                        <TableRow key={doc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <TableCell className="font-medium">{doc.document_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {doc.document_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(doc.uploaded_date)}</TableCell>
                                            <TableCell className="text-gray-500 text-sm">{doc.file_size}</TableCell>
                                            <TableCell>{getDocumentStatusBadge(doc.status)}</TableCell>
                                            <TableCell className="text-gray-600">
                                                {doc.verified_by || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="finance" className="mt-6">
            <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-green-600" /> Payment History
                        </CardTitle>
                        {!canViewFinance && (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                                <Lock className="h-3 w-3 mr-1" /> Restricted Access
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {!canViewFinance ? (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <Lock className="h-16 w-16 mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">Financial Access Restricted</h3>
                            <p className="text-gray-500 max-w-md">
                                You don't have permission to view student financial records. 
                                Only Finance staff and Super Admins can access this information.
                            </p>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <Card className="bg-green-50 border-green-200">
                                    <CardContent className="p-4">
                                        <p className="text-sm text-gray-600 mb-1">Total Paid</p>
                                        <p className="text-2xl font-bold text-green-700">
                                            K {dummyPayments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-yellow-50 border-yellow-200">
                                    <CardContent className="p-4">
                                        <p className="text-sm text-gray-600 mb-1">Pending</p>
                                        <p className="text-2xl font-bold text-yellow-700">
                                            K {dummyPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardContent className="p-4">
                                        <p className="text-sm text-gray-600 mb-1">Total Payments</p>
                                        <p className="text-2xl font-bold text-blue-700">{dummyPayments.length}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-purple-50 border-purple-200">
                                    <CardContent className="p-4">
                                        <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                                        <p className="text-2xl font-bold text-purple-700">K 2,450</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead>Payment Type</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Verified By</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dummyPayments.map((payment, index) => (
                                        <TableRow key={payment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <TableCell className="font-medium">{payment.payment_type}</TableCell>
                                            <TableCell className="font-bold text-green-600">
                                                K {payment.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {payment.payment_method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-gray-600">
                                                {payment.payment_ref}
                                            </TableCell>
                                            <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                            <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                                            <TableCell className="text-gray-600 text-sm">
                                                {payment.verified_by || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="mt-6 flex justify-end">
                                <Button variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Payment Report
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
