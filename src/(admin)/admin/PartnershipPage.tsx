import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Search, Loader2, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { FirebaseFirestore } from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/context/useAuth';
import { ZAMBIAN_DISTRICTS } from '@/lib/constants';
import type { Partnership } from '@/types/admin';

export default function PartnershipPage() {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPartnership, setEditingPartnership] = useState<Partnership | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'educational' as Partnership['type'],
    description: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    organization: '',
    region: '',
    status: 'proposed' as Partnership['status'],
    isSubscribable: false,
    subscriptionDetails: '',
    paymentAmount: '',
    paymentFrequency: 'monthly' as Partnership['paymentFrequency'],
    startDate: '',
    endDate: '',
    notes: '',
  });

  const fetchPartnerships = async () => {
    try {
      setLoading(true);
      const data = await FirebaseFirestore.getCollection('partnerships') as Partnership[];
      setPartnerships(data);
    } catch (error) {
      console.error('Error fetching partnerships:', error);
      toast.error('Failed to load partnerships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerships();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'educational',
      description: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      organization: '',
      region: '',
      status: 'proposed',
      isSubscribable: false,
      subscriptionDetails: '',
      paymentAmount: '',
      paymentFrequency: 'monthly',
      startDate: '',
      endDate: '',
      notes: '',
    });
  };

  const handleCreatePartnership = async () => {
    if (!formData.name || !formData.description || !formData.contactName || !formData.contactEmail || !formData.organization) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const newPartnership = {
        ...formData,
        id: '', // Will be set by Firestore
        createdBy: user?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentAmount: formData.paymentAmount ? parseFloat(formData.paymentAmount) : undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      };

      await FirebaseFirestore.addDocument('partnerships', newPartnership);
      toast.success('Partnership created successfully');
      setIsAddDialogOpen(false);
      resetForm();
      fetchPartnerships();
    } catch (error) {
      console.error('Error creating partnership:', error);
      toast.error('Failed to create partnership');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPartnership = async () => {
    if (!editingPartnership) return;

    if (!formData.name || !formData.description || !formData.contactName || !formData.contactEmail || !formData.organization) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedPartnership = {
        ...formData,
        updatedAt: new Date(),
        paymentAmount: formData.paymentAmount ? parseFloat(formData.paymentAmount) : undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      };

      await FirebaseFirestore.updateDocument('partnerships', editingPartnership.id, updatedPartnership);
      toast.success('Partnership updated successfully');
      setIsEditDialogOpen(false);
      setEditingPartnership(null);
      resetForm();
      fetchPartnerships();
    } catch (error) {
      console.error('Error updating partnership:', error);
      toast.error('Failed to update partnership');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePartnership = async (id: string) => {
    if (!confirm('Are you sure you want to delete this partnership?')) return;

    try {
      await FirebaseFirestore.deleteDocument('partnerships', id);
      toast.success('Partnership deleted successfully');
      fetchPartnerships();
    } catch (error) {
      console.error('Error deleting partnership:', error);
      toast.error('Failed to delete partnership');
    }
  };

  const openEditDialog = (partnership: Partnership) => {
    setEditingPartnership(partnership);
    setFormData({
      name: partnership.name,
      type: partnership.type,
      description: partnership.description,
      contactName: partnership.contactName,
      contactEmail: partnership.contactEmail,
      contactPhone: partnership.contactPhone || '',
      organization: partnership.organization,
      region: partnership.region || '',
      status: partnership.status,
      isSubscribable: partnership.isSubscribable,
      subscriptionDetails: partnership.subscriptionDetails || '',
      paymentAmount: partnership.paymentAmount ? partnership.paymentAmount.toString() : '',
      paymentFrequency: partnership.paymentFrequency || 'monthly',
      startDate: partnership.startDate ? new Date(partnership.startDate).toISOString().split('T')[0] : '',
      endDate: partnership.endDate ? new Date(partnership.endDate).toISOString().split('T')[0] : '',
      notes: partnership.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const filteredPartnerships = partnerships.filter(partnership =>
    partnership.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partnership.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partnership.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'proposed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'terminated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partnership Management</h1>
          <p className="text-gray-600 mt-1">Manage partnerships and exclusive offers for teachers</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Partnership
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] bg-white overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Partnership</DialogTitle>
              <DialogDescription>
                Create a new partnership or exclusive offer for ZUTE members.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Partnership Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Partnership name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val as Partnership['type'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="capacity_building">Capacity Building</SelectItem>
                      <SelectItem value="impact_investment">Impact Investment</SelectItem>
                      <SelectItem value="exclusive_offer">Exclusive Offer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as Partnership['status'] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proposed">Proposed</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the partnership"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name *</Label>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email *</Label>
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+260 123 456 789"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Organization *</Label>
                  <Input
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Organization name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Region</Label>
                <Select value={formData.region} onValueChange={(val) => setFormData({ ...formData, region: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {ZAMBIAN_DISTRICTS.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isSubscribable"
                  checked={formData.isSubscribable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isSubscribable: !!checked })}
                />
                <Label htmlFor="isSubscribable">Available for teacher subscriptions</Label>
              </div>

              {formData.isSubscribable && (
                <>
                  <div className="space-y-2">
                    <Label>Subscription Details</Label>
                    <Textarea
                      value={formData.subscriptionDetails}
                      onChange={(e) => setFormData({ ...formData, subscriptionDetails: e.target.value })}
                      placeholder="Details for teachers, e.g., Pay K2500 per month for house building"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Payment Amount (K)</Label>
                      <Input
                        type="number"
                        value={formData.paymentAmount}
                        onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                        placeholder="2500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Frequency</Label>
                      <Select value={formData.paymentFrequency} onValueChange={(val) => setFormData({ ...formData, paymentFrequency: val as Partnership['paymentFrequency'] })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="one-time">One-time</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleCreatePartnership} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Partnership
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Partnerships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, organization, or type..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscribable</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-blue" />
                  </TableCell>
                </TableRow>
              ) : filteredPartnerships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No partnerships found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartnerships.map((partnership) => (
                  <TableRow key={partnership.id}>
                    <TableCell className="font-medium">{partnership.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {partnership.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{partnership.organization}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(partnership.status)}>
                        {partnership.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={partnership.isSubscribable ? 'default' : 'secondary'}>
                        {partnership.isSubscribable ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {partnership.paymentAmount ? (
                        <span className="text-sm">
                          K{partnership.paymentAmount.toLocaleString()}
                          {partnership.paymentFrequency && partnership.paymentFrequency !== 'one-time'
                            ? `/${partnership.paymentFrequency.replace('ly', '')}`
                            : partnership.paymentFrequency === 'one-time' ? ' (one-time)' : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(partnership)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePartnership(partnership.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Partnership</DialogTitle>
            <DialogDescription>
              Update partnership details.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Partnership Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Partnership name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val as Partnership['type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="capacity_building">Capacity Building</SelectItem>
                    <SelectItem value="impact_investment">Impact Investment</SelectItem>
                    <SelectItem value="exclusive_offer">Exclusive Offer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val as Partnership['status'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposed">Proposed</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the partnership"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Name *</Label>
                <Input
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email *</Label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+260 123 456 789"
                />
              </div>
              <div className="space-y-2">
                <Label>Organization *</Label>
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="Organization name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={formData.region} onValueChange={(val) => setFormData({ ...formData, region: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {ZAMBIAN_DISTRICTS.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSubscribableEdit"
                checked={formData.isSubscribable}
                onCheckedChange={(checked) => setFormData({ ...formData, isSubscribable: !!checked })}
              />
              <Label htmlFor="isSubscribableEdit">Available for teacher subscriptions</Label>
            </div>

            {formData.isSubscribable && (
              <>
                <div className="space-y-2">
                  <Label>Subscription Details</Label>
                  <Textarea
                    value={formData.subscriptionDetails}
                    onChange={(e) => setFormData({ ...formData, subscriptionDetails: e.target.value })}
                    placeholder="Details for teachers, e.g., Pay K2500 per month for house building"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Amount (K)</Label>
                    <Input
                      type="number"
                      value={formData.paymentAmount}
                      onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                      placeholder="2500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Frequency</Label>
                    <Select value={formData.paymentFrequency} onValueChange={(val) => setFormData({ ...formData, paymentFrequency: val as Partnership['paymentFrequency'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-time">One-time</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingPartnership(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleEditPartnership} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Partnership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}