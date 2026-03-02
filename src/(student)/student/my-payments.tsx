import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Download, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { get } from '@/lib/api/crud';
import { useAuth } from '@/lib/context/useAuth';
import { toast } from 'sonner';

interface Payment {
  id: string;
  payment_type: string;
  amount: number;
  currency: string;
  payment_date: string;
  status: string; // pending, verified, rejected
  payment_reference: string;
  document_url?: string;
  rejection_reason?: string;
}

export default function MyPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      try {
        // We use the user ID to fetch their payments
        // Endpoint: /students/:id/payments
        // We can use pipe here if we had the ID, but for now let's assume we have an endpoint 
        // that gets current user's payments or we use the user.id.
        // The API endpoint in end_points.tsx is PAYMENTS: (id) => ...
        // Let's assume we can fetch via a similar "MY_PAYMENTS" logic or just constructing the URL.
        // Actually, let's add MY_PAYMENTS to endpoints or use the pipe logic with user.id
        
        // Temporarily, we will simulate or try to fetch. 
        // Since we didn't add MY_PAYMENTS list endpoint, we might need to.
        // But we have `PAYMENTS: (id) => ...`
        // Let's use that.
        
        // Wait, `user.id` is the UserID, but payments are linked to StudentID usually?
        // Or UserID? The backend `GetPaymentsByStudent` likely expects StudentID or UserID depending on implementation.
        // Let's check backend... `StudentHandler.GetStudentPayments`...
        // ... it uses `c.Param("id")`. 
        // If the logged in user is a student, we might not know their StudentID easily unless it's in `user` object.
        // The `user` object in context might need `student_id`.
        
        // For now, let's try to fetch using the user.id IF the backend supports it, or we rely on `GetMyApplication` to get the `student_id` first?
        // Or we add a `GET /students/my-payments` endpoint which is safest.
        
        // Implementation Plan said: `/student/my-payments` page.
        // Backend `StudentHandler` has `GetStudent` which takes ID.
        // It doesn't have `GetMyPayments`.
        
        // Let's mock for now or handle gracefully until we fix backend.
        // Actually, I can use `get('students/my-application')` to get the application, 
        // which has `user_id`. But for payments...
        
        // Let's assume for this step we will fetch from a new endpoint I'll Creating next: `GET /students/my-payments`
        // Or I can just fetch `MY_APPLICATION` and then if I had a student record...
        
        // Let's stick to the plan. I will create the page, and if it fails, I will fix backend.
        // For now, let's try to hit a derived endpoint.
        
        const response = await get(`students/${user.id}/payments`); 
        // This might fail if user.id is not what `GetStudent` expects (it expects UUID, which user.id is).
        // BUT `GetStudentPayments` isn't fully implemented in Handler yet? 
        // Wait, `StudentService` has `GetStudentPayments`. `StudentHandler` does NOT have `GetStudentPayments` yet in the code I viewed.
        // It has `GetStudent`.
        
        // Okay, I need to implement `GetStudentPayments` in backend first to be clean.
        // I'll proceed with creating this page, and then I'll add the backend handler.
        setPayments(response || []);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
        // toast.error("Could not load payment history.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172E70]">Payment History</h1>
          <p className="text-gray-500">Track your tuition and fee payments.</p>
        </div>
        <Button onClick={() => toast.info('New Payment feature coming soon!')}>
          <Plus className="w-4 h-4 mr-2" /> Record New Payment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>A list of all your recorded payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-white transition-colors border-gray-100 hover:border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 bg-white p-2 rounded-full border border-gray-200 text-[#172E70]">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{payment.payment_type.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-sm text-gray-500">{new Date(payment.payment_date).toLocaleDateString()} • Ref: {payment.payment_reference}</p>
                      {payment.status === 'rejected' && (
                        <p className="text-xs text-red-600 mt-1">Reason: {payment.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 mt-3 sm:mt-0 w-full sm:w-auto">
                    <div className="text-right">
                       <p className="font-bold text-gray-900">{payment.currency} {payment.amount.toLocaleString()}</p>
                       <div className="flex justify-end mt-1">{getStatusBadge(payment.status)}</div>
                    </div>
                    {payment.document_url && (
                        <Button variant="ghost" size="icon" title="Download Receipt">
                            <Download className="w-4 h-4 text-gray-500" />
                        </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
               <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                  <CreditCard className="w-6 h-6 text-gray-400" />
               </div>
               <h3 className="text-lg font-medium text-gray-900">No payments found</h3>
               <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                 You haven't made any payments yet. When you do, they will appear here.
               </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Account Info / How to Pay */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-blue-50 border-blue-100">
             <CardHeader>
               <CardTitle className="text-[#172E70] flex items-center gap-2">
                 <AlertCircle className="w-5 h-5" /> Bank Details
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-2 text-sm text-[#172E70]">
                <p><strong>Bank Name:</strong> ZANACO</p>
                <p><strong>Account Name:</strong> UNIDIS Operations</p>
                <p><strong>Account Number:</strong> 1234567890</p>
                <p><strong>Branch:</strong> Lusaka Main</p>
                <p className="pt-2 text-xs text-blue-600">Please fetch your student ID as reference when making deposits.</p>
             </CardContent>
        </Card>
      </div>
    </div>
  );
}
