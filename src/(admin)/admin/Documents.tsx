import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Plus, Loader2, Filter, Upload, Eye, Download, History, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { fetchData } from '@/lib/api/crud';
import type { Document, Department } from '@/types/dms';
import dayjs from 'dayjs';

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload Form State
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    document_type: 'policy',
    category: 'administrative',
    department_id: '',
    visibility_level: 'department',
    file: null as File | null,
  });

  const fetchDataBatch = async () => {
    try {
      setLoading(true);
      const [docsData, deptsData] = await Promise.all([
        fetchData('DOCUMENTS', 'GET'),
        fetchData('DEPARTMENTS', 'GET'),
      ]);
      // Handle both array and paginated response formats
      const docsList = Array.isArray(docsData) ? docsData : (docsData?.items || []);
      const deptsList = Array.isArray(deptsData) ? deptsData : (deptsData?.items || []);
      setDocuments(docsList);
      setDepartments(deptsList);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataBatch();
  }, []);

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title) {
      toast.error('Please provide a title and select a file');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('document_type', uploadData.document_type);
      formData.append('category', uploadData.category);
      formData.append('department_id', uploadData.department_id);
      formData.append('visibility_level', uploadData.visibility_level);

      await fetchData('DOCUMENTS', 'POST', {}, formData);
      toast.success('Document uploaded successfully');
      setIsUploadDialogOpen(false);
      setUploadData({
        title: '',
        description: '',
        document_type: 'policy',
        category: 'administrative',
        department_id: '',
        visibility_level: 'department',
        file: null,
      });
      fetchDataBatch();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'all' || doc.department_id === deptFilter;
    return matchesSearch && matchesDept;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'archived': return <Badge className="bg-gray-100 text-gray-800">Archived</Badge>;
      case 'approved': return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Explorer</h1>
          <p className="text-gray-600 mt-1">Manage university archives and official records</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#febb00] text-[#1e3c21] hover:bg-[#e8a900] font-bold">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-white overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
              <DialogDescription>
                Upload a file and assign metadata for proper indexing.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>File</Label>
                <Input 
                  type="file"
                  onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})}
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                  placeholder="e.g., Q3 Financial Report 2023"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  placeholder="Brief summary..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={uploadData.document_type} onValueChange={(val) => setUploadData({...uploadData, document_type: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">Policy</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="memo">Memo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={uploadData.category} onValueChange={(val) => setUploadData({...uploadData, category: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={uploadData.department_id} onValueChange={(val) => setUploadData({...uploadData, department_id: val})}>
                  <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                  <SelectContent>
                    {departments.filter(dept => dept.id && dept.id.trim() !== '').map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <Select value={uploadData.visibility_level} onValueChange={(val: any) => setUploadData({...uploadData, visibility_level: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="department">Department Only</SelectItem>
                    <SelectItem value="public">Public (All Staff)</SelectItem>
                    <SelectItem value="restricted">Restricted / Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={isSubmitting} className="bg-primary-blue">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload & Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input 
                placeholder="Title or keywords..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.filter(dept => dept.id && dept.id.trim() !== '').map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-none shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-900">
                <TableRow>
                  <TableHead className="text-white">Document Name</TableHead>
                  <TableHead className="text-white">Dept</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Modified</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-[#E5600B]" />
                    </TableCell>
                  </TableRow>
                ) : filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-10" />
                      No documents found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="py-4">
                         <div className="flex items-center gap-3">
                           <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                             <FileText className="h-5 w-5" />
                           </div>
                           <div>
                             <p className="font-semibold text-gray-900">{doc.title}</p>
                             <p className="text-xs text-gray-500 uppercase font-mono">{doc.file_type} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB</p>
                           </div>
                         </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-gray-200 text-gray-600">
                          {departments.find(d => d.id === doc.department_id)?.code || 'Global'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {dayjs(doc.updated_at).format('MMM DD, YYYY')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Download">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="History">
                            <History className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Start Workflow">
                            <ClipboardList className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
