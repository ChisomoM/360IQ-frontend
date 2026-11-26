import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { KpiTile } from '@/components/shared/KpiTile';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate as formatDisplayDate } from '@/lib/format';
import type { Tone } from '@/lib/status';
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
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Download,
  Eye,
  Lock,
} from '@/components/icons';
import { toast } from 'sonner';
import { useAuth } from '@/lib/context/useAuth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

// Statuses the shared map does not cover
const STUDENT_TONES: Record<string, Tone> = {
  graduated: 'positive',
  withdrawn: 'neutral',
};

const RECORD_STATUS: Record<string, { label: string; tone: Tone }> = {
  verified: { label: 'Verified', tone: 'positive' },
  pending: { label: 'Pending', tone: 'caution' },
  rejected: { label: 'Rejected', tone: 'risk' },
  borrowed: { label: 'Borrowed', tone: 'neutral' },
  returned: { label: 'Returned', tone: 'positive' },
  returned_late: { label: 'Returned late', tone: 'caution' },
  overdue: { label: 'Overdue', tone: 'risk' },
};

const MONO_CELL = 'whitespace-nowrap font-mono text-xs text-text-secondary';

/** Status badge for payments, documents and library records. */
function RecordBadge({ status, pendingLabel }: { status: string; pendingLabel?: string }) {
  const mapped = RECORD_STATUS[status];
  const label = status === 'pending' && pendingLabel ? pendingLabel : mapped?.label;
  return <StatusBadge status={status} tone={mapped?.tone} label={label} />;
}

function Detail({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className={`mt-0.5 break-words font-medium text-text-primary ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

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
      <div role="status" aria-busy="true" aria-label="Loading" className="flex flex-col gap-5">
        <div className="skeleton h-9 w-64 rounded-md" />
        <div className="skeleton h-10 w-96 max-w-full rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-40 rounded-lg" />
          <div className="skeleton h-40 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <SectionCard padded={false}>
        <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
          <h1 className="text-xl font-semibold text-text-primary">Student not found</h1>
          <Button asChild variant="secondary">
            <Link to="/admin/students">Back to students</Link>
          </Button>
        </div>
      </SectionCard>
    );
  }

  const formatDate = (dateString?: string) => formatDisplayDate(dateString) || 'N/A';

  const fullName = student.Application
    ? `${student.Application.first_name} ${student.Application.last_name}`
    : student.User
    ? `${student.User.first_name} ${student.User.last_name}`
    : 'Unknown student';

  const paymentTotal = (status: string) =>
    dummyPayments.filter(p => p.status === status).reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="w-full flex flex-col gap-5">
      <PageHeader
        crumb={
          <Link to="/admin/students" className="inline-flex items-center gap-1 hover:text-text-primary">
            <ArrowLeft size={14} /> Students
          </Link>
        }
        title={fullName}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs">{student.student_id}</span>
            <StatusBadge status={student.enrollment_status} tone={STUDENT_TONES[student.enrollment_status]} />
          </span>
        }
        actions={
          <>
            <Button variant="secondary">Suspend student</Button>
            <Button>Edit details</Button>
          </>
        }
      />

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <SectionCard title="Personal information">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Detail label="Full name" value={fullName} />
                <Detail label="Gender" value={<span className="capitalize">{student.Application?.gender || 'N/A'}</span>} />
                <Detail label="Date of birth" mono value={formatDate(student.Application?.date_of_birth)} />
                <Detail label="NRC or passport" mono value={student.Application?.nrc || 'N/A'} />
              </dl>
            </SectionCard>

            <SectionCard title="Contact details">
              <div className="space-y-3 text-sm text-text-primary">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-text-muted shrink-0" />
                  <span className="break-all">{student.User?.email || student.Application?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-text-muted shrink-0" />
                  <span className="font-mono text-xs">{student.Application?.phone_number || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-text-muted shrink-0 mt-0.5" />
                  <span>
                    {student.Application?.residential_address || 'N/A'}
                  </span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Enrolment" className="md:col-span-2">
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <Detail label="Programme" value={student.application?.programme_of_study} />
                <Detail label="Intake" value={student.application?.intake} />
                <Detail label="Current year" value={`Year ${student.current_year}, semester ${student.current_semester}`} />
                <Detail label="Enrolment date" mono value={formatDate(student.enrollment_date)} />
              </dl>
            </SectionCard>
          </div>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic">
          <SectionCard title="Academic history">
            <p className="text-sm text-text-muted">Grades and course records are not available yet.</p>
            <div className="mt-4 p-4 bg-field rounded-md">
              <p className="text-sm font-medium text-text-primary">Previous school</p>
              <p className="text-sm text-text-secondary">{student.application?.school_name} (graduated {student.application?.graduation_year})</p>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiTile label="Books borrowed" value={dummyLibraryRecords.length} />
            <KpiTile label="Currently borrowed" value={dummyLibraryRecords.filter(r => r.status === 'borrowed').length} />
            <KpiTile label="Total fines" unit="ZMW" value={dummyLibraryRecords.reduce((sum, r) => sum + r.fine, 0).toFixed(2)} />
          </div>

          <SectionCard title="Library records" padded={false}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Book title</TableHead>
                  <TableHead scope="col">Author</TableHead>
                  <TableHead scope="col">ISBN</TableHead>
                  <TableHead scope="col">Borrowed</TableHead>
                  <TableHead scope="col">Due</TableHead>
                  <TableHead scope="col">Returned</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col" className="text-right">Fine</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyLibraryRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-semibold">{record.book_title}</TableCell>
                    <TableCell className="text-text-secondary">{record.book_author}</TableCell>
                    <TableCell className="font-mono text-xs text-text-secondary">{record.isbn}</TableCell>
                    <TableCell className={MONO_CELL}>{formatDate(record.borrowed_date)}</TableCell>
                    <TableCell className={MONO_CELL}>{formatDate(record.due_date)}</TableCell>
                    <TableCell className={MONO_CELL}>{record.return_date ? formatDate(record.return_date) : 'N/A'}</TableCell>
                    <TableCell><RecordBadge status={record.status} /></TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {record.fine > 0 ? (
                        <span className="text-risk">ZMW {record.fine.toFixed(2)}</span>
                      ) : (
                        <span className="text-text-muted">None</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          {!canViewDocuments ? (
            <SectionCard padded={false}>
              <EmptyState
                icon={<Lock size={24} />}
                title="Hidden by your access level"
                description="You cannot view student documents. Ask an administrator for access."
              />
            </SectionCard>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiTile label="Documents" value={dummyDocuments.length} />
                <KpiTile label="Verified" value={dummyDocuments.filter(d => d.status === 'verified').length} />
                <KpiTile label="Pending" value={dummyDocuments.filter(d => d.status === 'pending').length} />
              </div>

              <SectionCard
                title="Student documents"
                padded={false}
                actions={
                  <Button variant="secondary" size="sm">
                    <Download />
                    Download all
                  </Button>
                }
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Document name</TableHead>
                      <TableHead scope="col">Type</TableHead>
                      <TableHead scope="col">Uploaded</TableHead>
                      <TableHead scope="col">Size</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Verified by</TableHead>
                      <TableHead scope="col" className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dummyDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-semibold">{doc.document_name}</TableCell>
                        <TableCell className="text-text-secondary">{doc.document_type}</TableCell>
                        <TableCell className={MONO_CELL}>{formatDate(doc.uploaded_date)}</TableCell>
                        <TableCell className={MONO_CELL}>{doc.file_size}</TableCell>
                        <TableCell><RecordBadge status={doc.status} pendingLabel="Pending review" /></TableCell>
                        <TableCell className="text-text-secondary">
                          {doc.verified_by || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`View ${doc.document_name}`}>
                              <Eye />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Download ${doc.document_name}`}>
                              <Download />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SectionCard>
            </>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="finance" className="space-y-4">
          {!canViewFinance ? (
            <SectionCard padded={false}>
              <EmptyState
                icon={<Lock size={24} />}
                title="Hidden by your access level"
                description="Only finance staff and super admins can view student financial records."
              />
            </SectionCard>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiTile label="Total paid" unit="ZMW" value={paymentTotal('verified').toLocaleString()} />
                <KpiTile label="Pending" unit="ZMW" value={paymentTotal('pending').toLocaleString()} />
                <KpiTile label="Payments" value={dummyPayments.length} />
                <KpiTile label="Outstanding" unit="ZMW" value="2,450" />
              </div>

              <SectionCard
                title="Payment history"
                padded={false}
                actions={
                  <Button variant="secondary" size="sm">
                    <Download />
                    Export payment report
                  </Button>
                }
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Payment type</TableHead>
                      <TableHead scope="col" className="text-right">Amount</TableHead>
                      <TableHead scope="col">Method</TableHead>
                      <TableHead scope="col">Reference</TableHead>
                      <TableHead scope="col">Date</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col">Verified by</TableHead>
                      <TableHead scope="col" className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dummyPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-semibold">{payment.payment_type}</TableCell>
                        <TableCell className="text-right whitespace-nowrap font-mono text-xs">
                          ZMW {payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-text-secondary">{payment.payment_method}</TableCell>
                        <TableCell className={MONO_CELL}>
                          {payment.payment_ref}
                        </TableCell>
                        <TableCell className={MONO_CELL}>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell><RecordBadge status={payment.status} /></TableCell>
                        <TableCell className="text-text-secondary">
                          {payment.verified_by || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`View ${payment.payment_ref}`}>
                            <Eye />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SectionCard>
            </>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
