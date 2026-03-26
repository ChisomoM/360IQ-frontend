import React, { useState } from "react";
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { MoreVertical, UserPlus, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { TenantAdmin } from "@/types/tenant";

interface TenantAdminsViewProps {
  admins: TenantAdmin[];
  onUpdate: (admins: TenantAdmin[]) => void;
}

const TenantAdminsView: React.FC<TenantAdminsViewProps> = ({ admins, onUpdate }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAdmin, setNewAdmin] = useState<Partial<TenantAdmin>>({
    role: "admin",
    status: "active"
  });

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const admin: TenantAdmin = {
        id: Math.random().toString(36).substr(2, 9),
        name: newAdmin.name || "",
        email: newAdmin.email || "",
        phone: newAdmin.phone,
        role: newAdmin.role as any,
        status: "active",
        last_login: "Never"
      };
      
      onUpdate([...admins, admin]);
      setLoading(false);
      setIsAddModalOpen(false);
      setNewAdmin({ role: "admin", status: "active" });
      toast.success("Administrator added successfully");
    }, 800);
  };

  const toggleAdminStatus = (id: string) => {
    const updated = admins.map(a => 
      a.id === id ? { ...a, status: (a.status === "active" ? "inactive" : "active") as any } : a
    );
    onUpdate(updated);
    toast.info("Administrator status updated");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Tenant Administrators</h3>
          <p className="text-sm text-muted-foreground">Manage users with administrative access to this tenant.</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-ch-primary hover:bg-ch-tertiary">
              <UserPlus className="mr-2 h-4 w-4" /> Add Administrator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddAdmin}>
              <DialogHeader>
                <DialogTitle>Add Tenant Admin</DialogTitle>
                <DialogDescription>
                  Invite a new user to manage this tenant's resources.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="John Doe" 
                    required 
                    value={newAdmin.name || ""} 
                    onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="john@example.com" 
                    required 
                    value={newAdmin.email || ""} 
                    onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input 
                    id="phone" 
                    placeholder="+260..." 
                    value={newAdmin.phone || ""} 
                    onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">System Role</Label>
                  <Select 
                    value={newAdmin.role} 
                    onValueChange={v => setNewAdmin({...newAdmin, role: v as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super-admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-ch-primary hover:bg-ch-tertiary" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Invite Admin"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Administrator</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No administrators assigned yet.
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{admin.name}</span>
                      <span className="text-xs text-muted-foreground">{admin.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 capitalize text-sm">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      {admin.role.replace("-", " ")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.status === "active" ? "default" : "secondary"}>
                      {admin.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {admin.last_login}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleAdminStatus(admin.id)}>
                          {admin.status === "active" ? "Deactivate" : "Reactivate"} Account
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Remove Access</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TenantAdminsView;
