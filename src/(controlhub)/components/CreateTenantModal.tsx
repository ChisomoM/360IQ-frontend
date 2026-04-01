import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import type { CreateTenantPayload, TenantType } from "@/types/tenant";

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTenantModal({ isOpen, onClose, onSuccess }: CreateTenantModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTenantPayload>({
    name: "",
    db_name: "",
    type: "company",
    admin_email: "",
    admin_password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.db_name || !formData.admin_email || !formData.admin_password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Tenant registered successfully!");
      onSuccess();
      setFormData({
        name: "",
        db_name: "",
        type: "company",
        admin_email: "",
        admin_password: ""
      });
    } catch (error) {
      toast.error("Failed to register tenant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Register New Tenant</DialogTitle>
            <DialogDescription>
              Enter the details for the new organization. This will provision a new database schema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input 
                id="name" 
                placeholder="e.g. University of Southern Africa" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="db_name">Database Name (Schema)</Label>
              <Input 
                id="db_name" 
                placeholder="e.g. unilus_db (lowercase, no spaces)" 
                value={formData.db_name}
                onChange={(e) => setFormData({...formData, db_name: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Organization Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: TenantType) => setFormData({...formData, type: value})}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parastetal">Parastetal</SelectItem>
                  <SelectItem value="higher-academic">Higher Academic</SelectItem>
                  <SelectItem value="company">Private Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-semibold mb-3">Primary Admin Account</h4>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="admin_email">Admin Email</Label>
                  <Input 
                    id="admin_email" 
                    type="email" 
                    placeholder="admin@organization.com" 
                    value={formData.admin_email}
                    onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Initial Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={formData.admin_password}
                    onChange={(e) => setFormData({...formData, admin_password: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-ch-primary hover:bg-ch-tertiary" disabled={loading}>
              {loading ? "Registering..." : "Register Tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
