import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { PageHeader } from '@/components/shared/PageHeader';
import { SectionCard } from '@/components/shared/SectionCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { formatDate as formatDisplayDate } from '@/lib/format';
import type { Tone } from '@/lib/status';
import { list } from '@/lib/api/crud';
import { GraduationCap, Search, MoreVertical, Eye, FileText, RefreshCw, Download } from '@/components/icons';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

// Interface matching the Student model structure from backend
interface Student {
  ID: string;
  student_id: string; // Registration Number
  enrollment_status: string;
  current_year: number;
  current_semester: number;
  enrollment_date: string;
  user_id: string;
  application_id: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  application?: {
    first_name: string;
    last_name: string;
    programme_of_study: string;
    intake: string;
    email: string;
    phone_number: string;
  };
}

// Statuses the shared map does not cover
const STUDENT_TONES: Record<string, Tone> = {
  graduated: 'positive',
  withdrawn: 'neutral',
};

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'graduated' | 'withdrawn'>('all');

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch from API: GET /students
      const data = await list('STUDENTS');
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterStudents = useCallback(() => {
    let filtered = students;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.enrollment_status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => {
        const firstName = student.application?.first_name || student.user?.first_name || '';
        const lastName = student.application?.last_name || student.user?.last_name || '';
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        const studentId = student.student_id.toLowerCase();
        const programme = student.application?.programme_of_study?.toLowerCase() || '';

        return fullName.includes(query) || studentId.includes(query) || programme.includes(query);
      });
    }

    setFilteredStudents(filtered);
  }, [students, searchQuery, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    filterStudents();
  }, [filterStudents]);

  const formatDate = (dateString: string) => formatDisplayDate(dateString) || 'N/A';

  const getName = (student: Student) => {
    if (student.application) {
      return `${student.application.first_name} ${student.application.last_name}`;
    }
    if (student.user) {
      return `${student.user.first_name} ${student.user.last_name}`;
    }
    return 'Unknown';
  };

  return (
    <div className="w-full flex flex-col gap-5">
      <PageHeader
        title="Students"
        description="Records of enrolled students."
        actions={
          <>
            <Button onClick={fetchStudents} variant="secondary">
              <RefreshCw className={loading ? 'animate-spin' : undefined} />
              Refresh
            </Button>
            <Button>
              <Download />
              Export CSV
            </Button>
          </>
        }
      />

      <SectionCard padded={false}>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between p-4 border-b border-line">
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="graduated">Graduated</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative md:w-80">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              aria-label="Search students"
              placeholder="Search by name, ID or programme"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Students Table */}
        {loading ? (
          <TableSkeleton rows={8} columns={6} />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={24} />}
            title="No students found"
            description="Change your search or filter to see more."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Student ID</TableHead>
                <TableHead scope="col">Name</TableHead>
                <TableHead scope="col">Programme</TableHead>
                <TableHead scope="col">Year</TableHead>
                <TableHead scope="col">Enrolled</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.ID}>
                  <TableCell className="font-mono text-xs">{student.student_id}</TableCell>
                  <TableCell className="font-semibold">{getName(student)}</TableCell>
                  <TableCell className="text-text-secondary">{student.application?.programme_of_study || 'N/A'}</TableCell>
                  <TableCell className="text-text-secondary">Year {student.current_year}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary">{formatDate(student.enrollment_date)}</TableCell>
                  <TableCell>
                    <StatusBadge status={student.enrollment_status} tone={STUDENT_TONES[student.enrollment_status]} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${getName(student)}`}>
                          <MoreVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/students/${student.ID}`}>
                            <Eye size={16} className="mr-2" />
                            View profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText size={16} className="mr-2" />
                          Academic record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
