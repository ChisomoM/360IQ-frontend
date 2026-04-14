import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { DashboardHeader } from './DashboardHeader';
import { QuickUploadWidget } from './QuickUploadWidget';
import type { UploadMetadata } from './QuickUploadWidget';
import { InboxSection } from './InboxSection';
import { RecentActivityList } from './RecentActivityList';
import { QuickShortcutsGrid } from './QuickShortcutsGrid';
import type { Shortcut } from './QuickShortcutsGrid';
import {
  FileText,
  Search,
  BarChart3,
  Workflow,
  CheckSquare,
  Lock,
  Settings,
  HelpCircle,
  Upload,
} from 'lucide-react';

interface ApprovalItem {
  id: string;
  type: 'deletion' | 'policy_change' | 'signature';
  title: string;
  department?: string;
  requesterName: string;
  requestedAt: Date;
  daysOverdue?: number;
  reason?: string;
}

interface SharedDocument {
  id: string;
  title: string;
  sharedBy: string;
  sharedAt: Date;
  department?: string;
}

type DocumentAction = 'viewed' | 'downloaded' | 'edited' | 'uploaded';

interface RecentDocument {
  id: string;
  title: string;
  department?: string;
  category?: string;
  lastAction: DocumentAction;
  actionAt: Date;
  fileType?: string;
}

interface SearchResult {
  id: string;
  title: string;
  department?: string;
  lastAccessedAt?: Date;
}

interface Department {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface DashboardProps {
  departments?: Department[];
  categories?: Category[];
}

export function Dashboard({ departments = [], categories = [] }: DashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Mock data - replace with real API calls
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocument[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);

  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with real API calls
        // const approvalsData = await getApprovals();
        // const sharedData = await getSharedDocuments();
        // const recentData = await getRecentDocuments();

        // Mock data for now
        setApprovals([
          {
            id: '1',
            type: 'deletion',
            title: 'Q3_Budget.xlsx',
            department: 'Finance',
            requesterName: 'John Doe',
            requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            reason: 'Deletion request from Finance Department',
          },
          {
            id: '2',
            type: 'policy_change',
            title: 'Retention Policy Update',
            requesterName: 'System Admin',
            requestedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
            reason: 'Change retention window from 14 days to 7 days',
          },
        ]);

        setSharedDocuments([
          {
            id: '1',
            title: 'Finance_Dashboard_Q4.xlsx',
            sharedBy: 'Finance Officer',
            sharedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
            department: 'Finance',
          },
          {
            id: '2',
            title: 'HR_Policies_Update.pdf',
            sharedBy: 'HR Department',
            sharedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            department: 'HR',
          },
        ]);

        setRecentDocuments([
          {
            id: '1',
            title: 'Q3_Budget.xlsx',
            department: 'Finance',
            category: 'Financial',
            lastAction: 'viewed',
            actionAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            id: '2',
            title: 'Annual_Report_Summary.pdf',
            department: 'Legal',
            lastAction: 'downloaded',
            actionAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
          {
            id: '3',
            title: 'Team_Meeting_Notes.docx',
            department: 'Marketing',
            lastAction: 'edited',
            actionAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            id: '4',
            title: 'Payroll_Data_2025.xlsx',
            department: 'HR',
            category: 'Payroll',
            lastAction: 'uploaded',
            actionAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        ]);

        setRecentSearches(['budget 2024', 'Q3 reports', 'payroll data']);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleUpload = async (file: File, metadata: UploadMetadata) => {
    try {
      // TODO: Replace with real API call
      console.log('Uploading file:', file.name, 'Metadata:', metadata);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Add to recent documents
      setRecentDocuments((prev) => [
        {
          id: `doc-${Date.now()}`,
          title: file.name,
          department: departments.find((d) => d.id === metadata.department)?.name,
          category: metadata.category,
          lastAction: 'uploaded',
          actionAt: new Date(),
        },
        ...prev.slice(0, 3),
      ]);

      setUploadModalOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSearch = async (query: string): Promise<SearchResult[]> => {
    try {
      // TODO: Replace with real API call to semantic search
      console.log('Searching for:', query);

      // Mock search results
      return recentDocuments
        .filter(
          (doc) =>
            doc.title.toLowerCase().includes(query.toLowerCase()) ||
            doc.department?.toLowerCase().includes(query.toLowerCase())
        )
        .map((doc) => ({
          id: doc.id,
          title: doc.title,
          department: doc.department,
          lastAccessedAt: doc.actionAt,
        }))
        .slice(0, 5);
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  };

  const shortcuts: Shortcut[] = [
    {
      id: 'documents',
      label: 'All Documents',
      icon: <FileText className="h-5 w-5" />,
      href: '/admin/documents',
      description: 'Browse all documents',
    },
    {
      id: 'search',
      label: 'Advanced Search',
      icon: <Search className="h-5 w-5" />,
      href: '/admin/documents?search=true',
      description: 'Advanced document search',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/admin/analytics',
      description: 'View analytics dashboard',
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: <Workflow className="h-5 w-5" />,
      href: '/admin/workflows',
      description: 'Manage workflows',
    },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: <CheckSquare className="h-5 w-5" />,
      href: '/admin/approvals',
      description: 'Pending approvals',
    },
    {
      id: 'audit',
      label: 'Audit Trail',
      icon: <Lock className="h-5 w-5" />,
      href: '/admin/audit-trail',
      description: 'View audit logs',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      href: '/admin/settings',
      description: 'System settings',
    },
    {
      id: 'help',
      label: 'Help',
      icon: <HelpCircle className="h-5 w-5" />,
      href: '/admin/help',
      description: 'Help & documentation',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <DashboardHeader
        onUploadClick={() => setUploadModalOpen(true)}
        recentSearches={recentSearches}
        onSearch={handleSearch}
      />

      <div className="px-6 sm:px-8 lg:px-10 py-10">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Inbox Section */}
          <div className="animate-fade-in-up">
            <InboxSection
                approvals={approvals}
                sharedDocuments={sharedDocuments}
                isLoading={isLoading}
                onApprove={(id) => console.log('Approve:', id)}
                onReview={(id) => navigate(`/admin/approvals/${id}`)}
                onDocumentClick={(id) => navigate(`/admin/documents/${id}`)}
                onViewAll={(type) => {
                  if (type === 'approvals') navigate('/admin/approvals');
                  else navigate('/admin/documents?filter=shared');
                }}
              />
          </div>

          {/* Recent Activity */}
          <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <RecentActivityList
              documents={recentDocuments}
              isLoading={isLoading}
              onDocumentClick={(id) => navigate(`/admin/documents/${id}`)}
              onViewAll={() => navigate('/admin/documents?sort=recent')}
            />
          </div>

          {/* Quick Shortcuts */}
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Quick Shortcuts</h2>
              <p className="text-sm text-slate-600 mt-1">Access key features instantly</p>
            </div>
            <QuickShortcutsGrid shortcuts={shortcuts} userRole={user?.role} />
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setUploadModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-premium-lg flex items-center justify-center z-40 lg:hidden transition-all hover:scale-110 active:scale-95"
        aria-label="Upload a new document"
        title="Upload document"
      >
        <Upload className="h-6 w-6" />
      </button>

      {/* Upload Modal for Mobile */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden flex items-end animate-fade-in-up">
          <div className="w-full bg-white rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto shadow-premium-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Upload Document</h2>
                <p className="text-sm text-slate-600 mt-1">Add new documents to your workspace</p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-500 hover:text-slate-900 transition-colors p-2 hover:bg-slate-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            <QuickUploadWidget
              onUpload={handleUpload}
              departments={departments}
              categories={categories}
              onSuccess={() => setUploadModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
