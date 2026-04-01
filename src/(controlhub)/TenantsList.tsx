import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Tenant } from "@/types/tenant";
import CreateTenantModal from "@/(controlhub)/CreateTenantModal";

// Mock Data
const MOCK_TENANTS: Tenant[] = [
  {
    id: "1",
    name: "Ministry of Education",
    db_name: "edu_min_db",
    type: "parastetal",
    status: "active",
    config: {
      branding: { logo_url: "", primary_color: "#7c69ff", short_name: "MoE", long_name: "Ministry of Education", tagline: "Education for all" },
      settings: { allow_public_reg: false, enforce_2fa: true }
    },
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: "2",
    name: "Zambia Open University",
    db_name: "zaou_db",
    type: "higher-academic",
    status: "active",
    config: {
      branding: { logo_url: "", primary_color: "#004a99", short_name: "ZAOU", long_name: "Zambia Open University", tagline: "Knowledge for all" },
      settings: { allow_public_reg: true, enforce_2fa: false }
    },
    created_at: "2024-02-10T14:30:00Z",
    updated_at: "2024-02-10T14:30:00Z"
  },
  {
    id: "3",
    name: "TechCorp Solutions",
    db_name: "techcorp_db",
    type: "company",
    status: "inactive",
    config: {
      branding: { logo_url: "", primary_color: "#ff5500", short_name: "TechCorp", long_name: "TechCorp Solutions Ltd", tagline: "Innovation first" },
      settings: { allow_public_reg: false, enforce_2fa: true }
    },
    created_at: "2024-03-05T09:15:00Z",
    updated_at: "2024-03-05T09:15:00Z"
  }
];

export default function TenantsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTenants = MOCK_TENANTS.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Avec ControlHub</h1>
          <p className="text-muted-foreground mt-1">Manage all organizations on the platform.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-ch-primary hover:bg-ch-tertiary">
          <Plus className="mr-2 h-4 w-4" /> Register Tenant
        </Button>
      </div>

      <div className="flex items-center gap-4 py-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tenants..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Created Date</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.length > 0 ? (
              filteredTenants.map((tenant) => (
                <TableRow key={tenant.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => navigate(`/admin/controlhub/tenants/${tenant.id}`)}>
                  <TableCell className="font-medium text-ch-primary">{tenant.name}</TableCell>
                  <TableCell className="capitalize">{tenant.type.replace("-", " ")}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.status === "active" ? "default" : "secondary"} className={tenant.status === "active" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/controlhub/tenants/${tenant.id}`)}>
                          <ExternalLink className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No tenants found matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CreateTenantModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          // In a real app, we'd refetch data here
        }}
      />
    </div>
  );
}
