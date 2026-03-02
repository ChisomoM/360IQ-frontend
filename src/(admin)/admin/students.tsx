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
import { list } from '@/lib/api/crud';
import { GraduationCap, Search, MoreVertical, Eye, FileText, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return dayjs(dateString).format('MMM DD, YYYY');
  };

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
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage enrolled students records</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={fetchStudents} variant="outline">
            <Loader2 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
            </Button>
            <Button variant="default">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
            </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filter Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, ID, or programme..."
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
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'graduated' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('graduated')}
              >
                Graduated
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <CardTitle>Enrolled Students</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <GraduationCap className="h-12 w-12 mb-4" />
              <p>No students found</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-900">
                <TableRow className="border-b border-gray-700">
                  <TableHead className="text-white font-semibold py-3 px-4">Student ID</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4">Name</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4">Programme</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4">Year</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4">Enrollment Date</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4">Status</TableHead>
                  <TableHead className="text-white font-semibold py-3 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <TableRow
                    key={student.ID}
                    className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <TableCell className="font-medium font-mono text-blue-600">{student.student_id}</TableCell>
                    <TableCell className="font-medium">{getName(student)}</TableCell>
                    <TableCell>{student.application?.programme_of_study || 'N/A'}</TableCell>
                    <TableCell>Year {student.current_year}</TableCell>
                    <TableCell>{formatDate(student.enrollment_date)}</TableCell>
                    <TableCell>{getStatusBadge(student.enrollment_status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/students/${student.ID}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Academic Record
                          </DropdownMenuItem>
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
    </div>
  );
}
