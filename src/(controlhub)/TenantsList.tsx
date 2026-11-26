import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Search, ExternalLink, RefreshCw, Building2 } from "@/components/icons";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { formatDate } from "@/lib/format";
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

  // Anything other than active or pending reads as inactive
  const statusKey = (status: string) =>
    status === "active" || status === "pending" ? status : "inactive";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Tenants"
        description="Manage and configure client organisations."
        actions={
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchTenants}
              disabled={isLoading}
              aria-label="Refresh tenants"
              title="Refresh tenants"
            >
              <RefreshCw className={isLoading ? "animate-spin" : undefined} />
            </Button>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus /> Create tenant
            </Button>
          </>
        }
      />

      {/* Tenants Table */}
      <SectionCard
        title="All tenants"
        padded={false}
        actions={
          <span className="text-xs text-text-muted">
            <span className="font-mono">{filteredTenants.length}</span> {filteredTenants.length === 1 ? "organisation" : "organisations"}
          </span>
        }
      >
        <div className="px-4 pb-4 border-b border-line">
          <div className="relative max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input
              aria-label="Search tenants"
              placeholder="Search by name or type"
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : filteredTenants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Tenant</TableHead>
                <TableHead scope="col">Type</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Created</TableHead>
                <TableHead scope="col" className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  onClick={() => navigate(`/controlhub/tenants/${tenant.id}`)}
                  className="cursor-pointer group"
                >
                  {/* Tenant name + ID */}
                  <TableCell>
                    <div className="font-semibold text-text-primary">{tenant.name}</div>
                    <div className="text-xs text-text-muted mt-1 font-mono">{tenant.id}</div>
                  </TableCell>

                  {/* Type */}
                  <TableCell className="text-text-secondary capitalize">
                    {tenant.type.replace("-", " ")}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusBadge status={statusKey(tenant.status)} />
                  </TableCell>

                  {/* Created */}
                  <TableCell className="whitespace-nowrap font-mono text-xs text-text-secondary">
                    {formatDate(tenant.created_at)}
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/controlhub/tenants/${tenant.id}`)}
                    >
                      View <ExternalLink />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={<Building2 size={24} />}
            title="No tenants found"
            description={searchTerm ? "No tenants match your search." : "Create a tenant to set up a client organisation."}
          />
        )}
      </SectionCard>

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
