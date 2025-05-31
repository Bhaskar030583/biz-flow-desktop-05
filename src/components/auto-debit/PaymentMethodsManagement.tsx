
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard, Trash2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  customer_id: string;
  method_type: string;
  razorpay_token: string;
  is_primary: boolean;
  is_active: boolean;
  customer?: { name: string; phone: string };
}

export const PaymentMethodsManagement: React.FC = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select(`
          *,
          customer:customers(name, phone)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        customer: Array.isArray(item.customer) ? item.customer[0] : item.customer
      }));
      
      setPaymentMethods(transformedData);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to fetch payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (methodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    try {
      const { error } = await supabase
        .from('customer_payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) throw error;

      toast.success('Payment method deleted successfully');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to delete payment method');
    }
  };

  const togglePrimary = async (methodId: string, customerId: string) => {
    try {
      // First, remove primary status from all methods for this customer
      await supabase
        .from('customer_payment_methods')
        .update({ is_primary: false })
        .eq('customer_id', customerId);

      // Then set the selected method as primary
      const { error } = await supabase
        .from('customer_payment_methods')
        .update({ is_primary: true })
        .eq('id', methodId);

      if (error) throw error;

      toast.success('Primary payment method updated');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error updating primary method:', error);
      toast.error('Failed to update primary method');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Customer Payment Methods</h2>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Payment Method
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No payment methods found</p>
            <p className="text-sm text-gray-500 mt-2">
              Add payment methods to enable auto debit functionality
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <CardTitle className="text-lg">
                      {method.customer?.name || 'Unknown Customer'}
                    </CardTitle>
                    {method.is_primary && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Primary
                      </Badge>
                    )}
                    <Badge variant={method.is_active ? "default" : "secondary"}>
                      {method.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {!method.is_primary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePrimary(method.id, method.customer_id)}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(method.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Phone:</span>
                    <p>{method.customer?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Method Type:</span>
                    <p className="capitalize">{method.method_type}</p>
                  </div>
                  <div>
                    <span className="font-medium">Token:</span>
                    <p className="font-mono text-xs bg-gray-100 p-1 rounded">
                      {method.razorpay_token.substring(0, 20)}...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
