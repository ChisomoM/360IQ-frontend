import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import { Loader2, Eye, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { FirebaseFirestore } from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/context/useAuth';
import type { Partnership, TeacherSubscription } from '@/types/admin';

export default function PartnershipsPage() {
  const { user } = useAuth();
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [subscriptions, setSubscriptions] = useState<TeacherSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Fetch subscribable partnerships
      const partnershipsData = await FirebaseFirestore.getCollection('partnerships', [
        FirebaseFirestore.where('isSubscribable', '==', true),
        FirebaseFirestore.where('status', '==', 'active')
      ]) as Partnership[];

      // Fetch user's subscriptions
      const subscriptionsData = await FirebaseFirestore.getCollection('teacher_subscriptions', [
        FirebaseFirestore.where('teacherId', '==', user.id)
      ]) as TeacherSubscription[];

      setPartnerships(partnershipsData);
      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load partnerships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const getSubscriptionStatus = (partnershipId: string) => {
    const subscription = subscriptions.find(sub => sub.partnershipId === partnershipId);
    return subscription ? subscription.status : null;
  };

  const handleSubscribe = async (partnershipId: string) => {
    if (!user?.id) return;

    try {
      const existingSubscription = subscriptions.find(sub => sub.partnershipId === partnershipId);

      if (existingSubscription) {
        // Update existing subscription
        await FirebaseFirestore.updateDocument('teacher_subscriptions', existingSubscription.id, {
          status: 'subscribed',
          subscribedAt: new Date(),
          unsubscribedAt: null,
        });
        toast.success('Successfully subscribed to partnership');
      } else {
        // Create new subscription
        const newSubscription: Omit<TeacherSubscription, 'id'> = {
          teacherId: String(user.id),
          partnershipId,
          status: 'subscribed',
          subscribedAt: new Date(),
        };
        await FirebaseFirestore.addDocument('teacher_subscriptions', newSubscription);
        toast.success('Successfully subscribed to partnership');
      }

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to subscribe');
    }
  };

  const handleUnsubscribe = async (partnershipId: string) => {
    if (!user?.id) return;

    try {
      const subscription = subscriptions.find(sub => sub.partnershipId === partnershipId);
      if (!subscription) return;

      await FirebaseFirestore.updateDocument('teacher_subscriptions', subscription.id, {
        status: 'unsubscribed',
        unsubscribedAt: new Date(),
      });

      toast.success('Successfully unsubscribed from partnership');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to unsubscribe');
    }
  };

  const openDetails = (partnership: Partnership) => {
    setSelectedPartnership(partnership);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Not Subscribed</Badge>;

    switch (status) {
      case 'subscribed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Subscribed</Badge>;
      case 'unsubscribed':
        return <Badge variant="secondary">Unsubscribed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Partnerships</h1>
        <p className="text-gray-600 mt-1">Exclusive offers and partnerships available to ZUTE teachers</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partnership</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-blue" />
                  </TableCell>
                </TableRow>
              ) : partnerships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No partnerships available at this time
                  </TableCell>
                </TableRow>
              ) : (
                partnerships.map((partnership) => {
                  const subscriptionStatus = getSubscriptionStatus(partnership.id);
                  return (
                    <TableRow key={partnership.id}>
                      <TableCell className="font-medium">{partnership.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {partnership.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{partnership.organization}</TableCell>
                      <TableCell>{getStatusBadge(subscriptionStatus)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetails(partnership)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                          {subscriptionStatus === 'subscribed' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnsubscribe(partnership.id)}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Unsubscribe
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleSubscribe(partnership.id)}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Subscribe
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPartnership?.name}</DialogTitle>
            <DialogDescription>
              Partnership details and subscription information
            </DialogDescription>
          </DialogHeader>

          {selectedPartnership && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Description</h4>
                <p className="text-gray-600 mt-1">{selectedPartnership.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Type</h4>
                  <p className="text-gray-600 mt-1">{selectedPartnership.type.replace('_', ' ').toUpperCase()}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Organization</h4>
                  <p className="text-gray-600 mt-1">{selectedPartnership.organization}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Contact</h4>
                  <p className="text-gray-600 mt-1">{selectedPartnership.contactName}</p>
                  <p className="text-gray-600 text-sm">{selectedPartnership.contactEmail}</p>
                  {selectedPartnership.contactPhone && (
                    <p className="text-gray-600 text-sm">{selectedPartnership.contactPhone}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Region</h4>
                  <p className="text-gray-600 mt-1">{selectedPartnership.region || 'All Regions'}</p>
                </div>
              </div>

              {selectedPartnership.subscriptionDetails && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Subscription Details</h4>
                  <p className="text-gray-600 mt-1">{selectedPartnership.subscriptionDetails}</p>
                </div>
              )}

              {selectedPartnership.paymentAmount && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Payment Required</h4>
                  <p className="text-gray-600 mt-1">
                    K{selectedPartnership.paymentAmount.toLocaleString()}
                    {selectedPartnership.paymentFrequency && selectedPartnership.paymentFrequency !== 'one-time'
                      ? ` per ${selectedPartnership.paymentFrequency.replace('ly', '')}`
                      : selectedPartnership.paymentFrequency === 'one-time' ? ' (one-time payment)' : ''}
                  </p>
                </div>
              )}

              {selectedPartnership.notes && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Additional Notes</h4>
                  <p className="text-gray-600 mt-1">{selectedPartnership.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Start Date</h4>
                  <p className="text-gray-600 mt-1">
                    {selectedPartnership.startDate
                      ? new Date(selectedPartnership.startDate).toLocaleDateString()
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">End Date</h4>
                  <p className="text-gray-600 mt-1">
                    {selectedPartnership.endDate
                      ? new Date(selectedPartnership.endDate).toLocaleDateString()
                      : 'Not specified'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}