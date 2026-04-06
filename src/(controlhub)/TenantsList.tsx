import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Search, ExternalLink, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Tenant } from "@/types/tenant";
import CreateTenantModal from "@/(controlhub)/CreateTenantModal";
import { chGet } from "@/lib/api/controlhub";
import { toast } from "sonner";

export default function TenantsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    active: { bg: "bg-green-100", text: "text-green-700", icon: "✓", label: "Active" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-700", icon: "○", label: "Pending" },
    inactive: { bg: "bg-gray-100", text: "text-gray-700", icon: "–", label: "Inactive" },
  };

  const fetchTenants = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await chGet("CH_CLIENTS") as Tenant[];
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load tenants");
      console.error("[ControlHub] Failed to fetch clients:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Tenants</h1>
        <p className="text-gray-600 text-lg mt-2">Manage and configure your tenant ecosystem</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search tenants..." 
            className="pl-9 border-gray-200 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={fetchTenants} 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-ch-primary text-white hover:bg-ch-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" /> New Tenant
        </Button>
      </div>

      {/* Tenants Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/40">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">All Tenants</h3>
            <span className="text-sm text-gray-500">{filteredTenants.length} organization{filteredTenants.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-gray-500">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading tenants…
          </div>
        ) : filteredTenants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-xs text-gray-600 uppercase tracking-tight">Tenant</th>
                  <th className="text-left py-3 px-6 font-semibold text-xs text-gray-600 uppercase tracking-tight">Type</th>
                  <th className="text-left py-3 px-6 font-semibold text-xs text-gray-600 uppercase tracking-tight">Status</th>
                  <th className="text-left py-3 px-6 font-semibold text-xs text-gray-600 uppercase tracking-tight">Created</th>
                  <th className="text-right py-3 px-6 font-semibold text-xs text-gray-600 uppercase tracking-tight">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTenants.map((tenant) => {
                  const status = statusConfig[tenant.status] || statusConfig.inactive;
                  return (
                    <tr
                      key={tenant.id}
                      onClick={() => navigate(`/controlhub/tenants/${tenant.id}`)}
                      className="hover:bg-gray-50/60 transition-colors duration-150 cursor-pointer group"
                    >
                      {/* Tenant Name + DB */}
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900 text-sm">{tenant.name}</div>
                        <div className="text-xs text-gray-400 mt-1 font-mono">{tenant.id}</div>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600 capitalize">{tenant.type.replace("-", " ")}</span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            status.label === 'Active' ? 'bg-green-500' :
                            status.label === 'Pending' ? 'bg-yellow-500' :
                            'bg-gray-400'
                          }`} />
                          <span className="text-sm font-medium text-gray-700">{status.label}</span>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{new Date(tenant.created_at).toLocaleDateString()}</span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/controlhub/tenants/${tenant.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-ch-primary opacity-0 group-hover:opacity-100 bg-ch-primary/5 group-hover:bg-ch-primary/10 transition-all duration-200"
                        >
                          View <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            No tenants found matching your search.
          </div>
        )}
      </div>

      <CreateTenantModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchTenants();
        }}
      />
    </div>
  );
}
