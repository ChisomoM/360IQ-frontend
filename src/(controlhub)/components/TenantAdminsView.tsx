import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Loader2, Plus, Search, Users } from "@/components/icons";
import { toast } from "sonner";
import { chPost } from "@/lib/api/controlhub";

interface TenantAdminsViewProps {
  tenantId: string;
  admins: any[];
  loading?: boolean;
  onUpdate: (admins: any[]) => void;
}

const formatRole = (role: string) => {
  const words = role.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const TenantAdminsView: React.FC<TenantAdminsViewProps> = ({ tenantId, admins, loading = false, onUpdate }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "super_admin",
  });

  const handleAddAdmin = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error("Enter a first name, last name, email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await chPost(
        "CH_CLIENT_ADMINS",
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          identifier: formData.email,
          password: formData.password,
          role_slug: formData.role,
        },
        { id: tenantId }
      );
      onUpdate([...admins, created]);
      setIsAddDialogOpen(false);
      setFormData({ firstName: "", lastName: "", email: "", password: "", role: "super_admin" });
      toast.success("Administrator created");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create administrator");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      (a.first_name || "").toLowerCase().includes(q) ||
      (a.last_name || "").toLowerCase().includes(q) ||
      (a.email || "").toLowerCase().includes(q)
    );
  });

  const addDialog = (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          Add administrator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add administrator</DialogTitle>
          <DialogDescription>
            Create an administrator account for this tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-first-name">First name</Label>
              <Input
                id="admin-first-name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Mutinta"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-last-name">Last name</Label>
              <Input
                id="admin-last-name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Banda"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Email address</Label>
            <Input
              id="admin-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="name@company.co.zm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(val) => setFormData({ ...formData, role: val })}
            >
              <SelectTrigger id="admin-role">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super administrator</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="secondary" onClick={() => setIsAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddAdmin} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Create account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <SectionCard title="Administrators" actions={addDialog} padded={false}>
      <div className="px-4 pb-4 border-b border-line">
        <div className="relative max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            aria-label="Search administrators"
            placeholder="Search by name or email"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : filteredAdmins.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="No administrators found"
          description="Administrators manage this tenant. Add one or change your search."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Name</TableHead>
              <TableHead scope="col">Role</TableHead>
              <TableHead scope="col">Email</TableHead>
              <TableHead scope="col">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdmins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="font-semibold">
                  {admin.first_name} {admin.last_name}
                </TableCell>
                <TableCell>
                  <StatusBadge tone="neutral" label={formatRole(admin.role?.name || admin.role_slug || "N/A")} />
                </TableCell>
                <TableCell className="text-text-secondary">{admin.email}</TableCell>
                <TableCell>
                  <StatusBadge status={admin.is_active ? "active" : "inactive"} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionCard>
  );
};

export default TenantAdminsView;
