import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Package, Store, Calendar, Hash, Check, X } from "lucide-react";

interface StockRequest {
  id: string;
  requesting_hr_store_id: string;
  fulfilling_hr_store_id: string;
  product_id: string;
  requested_quantity: number;
  status: string;
  request_date: string;
  response_date?: string;
  notes?: string;
  requesting_store: { store_name: string };
  fulfilling_store: { store_name: string };
  product: { name: string; category: string };
}

interface IncomingRequestsListProps {
  onRequestUpdated: () => void;
}

export const IncomingRequestsList = ({ onRequestUpdated }: IncomingRequestsListProps) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchIncomingRequests();
    }
  }, [user?.id]);

  const fetchIncomingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📨 [IncomingRequestsList] Fetching incoming requests...');

      // Show ALL requests for now - this will show all requests in the system
      // In a production environment, you'd want to filter based on store management or other criteria
      const { data, error } = await supabase
        .from('stock_requests')
        .select(`
          *,
          requesting_store:hr_stores!fk_stock_requests_requesting_hr_store(store_name),
          fulfilling_store:hr_stores!fk_stock_requests_fulfilling_hr_store(store_name),
          product:products!fk_stock_requests_product(name, category)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [IncomingRequestsList] Error fetching requests:', error);
        throw error;
      }
      
      console.log('✅ [IncomingRequestsList] Incoming requests fetched:', data?.length || 0);
      
      // Transform the data to handle potential array responses from joins
      const transformedData = (data || []).map(item => ({
        ...item,
        requesting_store: Array.isArray(item.requesting_store) 
          ? item.requesting_store[0] 
          : item.requesting_store || { store_name: 'Unknown Store' },
        fulfilling_store: Array.isArray(item.fulfilling_store) 
          ? item.fulfilling_store[0] 
          : item.fulfilling_store || { store_name: 'Unknown Store' },
        product: Array.isArray(item.product) 
          ? item.product[0] 
          : item.product || { name: 'Unknown Product', category: 'Unknown' }
      }));
      
      setRequests(transformedData);
    } catch (error) {
      console.error('❌ [IncomingRequestsList] Error fetching incoming requests:', error);
      setError((error as Error).message);
      toast.error('Failed to fetch incoming requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      console.log('✅ [IncomingRequestsList] Approving request:', requestId);

      // Get the request details first
      const request = requests.find(r => r.id === requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      const today = new Date().toISOString().split('T')[0];

      // Check if fulfilling store has enough stock
      const { data: fulfillingStock, error: fulfillingStockError } = await supabase
        .from('stocks')
        .select('*')
        .eq('product_id', request.product_id)
        .eq('hr_shop_id', request.fulfilling_hr_store_id)
        .eq('stock_date', today)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (fulfillingStockError) {
        throw new Error(`Error checking fulfilling store stock: ${fulfillingStockError.message}`);
      }

      if (!fulfillingStock || fulfillingStock.actual_stock < request.requested_quantity) {
        throw new Error(`Insufficient stock in fulfilling store. Available: ${fulfillingStock?.actual_stock || 0}, Requested: ${request.requested_quantity}`);
      }

      console.log('📊 [IncomingRequestsList] Current fulfilling stock:', fulfillingStock.actual_stock);

      // Update fulfilling store stock (decrease)
      const { error: updateFulfillingError } = await supabase
        .from('stocks')
        .update({
          actual_stock: fulfillingStock.actual_stock - request.requested_quantity,
          closing_stock: fulfillingStock.closing_stock - request.requested_quantity
        })
        .eq('id', fulfillingStock.id);

      if (updateFulfillingError) {
        throw new Error(`Error updating fulfilling store stock: ${updateFulfillingError.message}`);
      }

      console.log('✅ [IncomingRequestsList] Reduced stock in fulfilling store by:', request.requested_quantity);

      // Check if requesting store already has stock record for today
      const { data: requestingStock, error: requestingStockError } = await supabase
        .from('stocks')
        .select('*')
        .eq('product_id', request.product_id)
        .eq('hr_shop_id', request.requesting_hr_store_id)
        .eq('stock_date', today)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (requestingStockError) {
        throw new Error(`Error checking requesting store stock: ${requestingStockError.message}`);
      }

      if (requestingStock) {
        // Update existing stock record (increase)
        const { error: updateRequestingError } = await supabase
          .from('stocks')
          .update({
            actual_stock: requestingStock.actual_stock + request.requested_quantity,
            closing_stock: requestingStock.closing_stock + request.requested_quantity,
            stock_added: (requestingStock.stock_added || 0) + request.requested_quantity
          })
          .eq('id', requestingStock.id);

        if (updateRequestingError) {
          throw new Error(`Error updating requesting store stock: ${updateRequestingError.message}`);
        }

        console.log('✅ [IncomingRequestsList] Increased existing stock in requesting store by:', request.requested_quantity);
      } else {
        // Create new stock record for requesting store
        const { error: createRequestingError } = await supabase
          .from('stocks')
          .insert({
            product_id: request.product_id,
            hr_shop_id: request.requesting_hr_store_id,
            stock_date: today,
            opening_stock: request.requested_quantity,
            closing_stock: request.requested_quantity,
            actual_stock: request.requested_quantity,
            stock_added: request.requested_quantity,
            user_id: user?.id
          });

        if (createRequestingError) {
          throw new Error(`Error creating requesting store stock: ${createRequestingError.message}`);
        }

        console.log('✅ [IncomingRequestsList] Created new stock record in requesting store with quantity:', request.requested_quantity);
      }

      // Update request status to approved
      const { error: updateRequestError } = await supabase
        .from('stock_requests')
        .update({ 
          status: 'approved',
          response_date: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateRequestError) {
        throw new Error(`Error updating request status: ${updateRequestError.message}`);
      }

      console.log('✅ [IncomingRequestsList] Request approved and stock transferred successfully');
      toast.success('Request approved and stock transferred successfully');
      
      fetchIncomingRequests();
      onRequestUpdated();
    } catch (error) {
      console.error('❌ [IncomingRequestsList] Error approving request:', error);
      toast.error('Failed to approve request: ' + (error as Error).message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      console.log('❌ [IncomingRequestsList] Rejecting request:', requestId);

      const { error } = await supabase
        .from('stock_requests')
        .update({ 
          status: 'rejected',
          response_date: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('❌ [IncomingRequestsList] Error rejecting request:', error);
        throw error;
      }

      console.log('✅ [IncomingRequestsList] Request rejected successfully');
      toast.success('Request rejected');
      fetchIncomingRequests();
      onRequestUpdated();
    } catch (error) {
      console.error('❌ [IncomingRequestsList] Error rejecting request:', error);
      toast.error('Failed to reject request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading incoming requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <h3 className="text-red-800 font-medium mb-2">Error Loading Incoming Requests</h3>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <Button onClick={fetchIncomingRequests} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No incoming requests found</p>
        <p className="text-sm text-gray-500">All stock requests will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <Card key={request.id} className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">{request.id.slice(0, 8)}</span>
                <Badge className={getStatusColor(request.status)}>
                  {request.status}
                </Badge>
              </div>
              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproveRequest(request.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRequest(request.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Store className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">Requested by:</span>
                  <span className="font-medium">{request.requesting_store.store_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Store className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">From store:</span>
                  <span className="font-medium">{request.fulfilling_store.store_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">{request.product.name}</span>
                  <span className="text-gray-500">({request.product.category})</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-orange-600" />
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{request.requested_quantity}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Calendar className="h-4 w-4" />
              <span>Requested: {format(new Date(request.request_date), 'MMM dd, yyyy HH:mm')}</span>
              {request.response_date && (
                <span>• Responded: {format(new Date(request.response_date), 'MMM dd, yyyy HH:mm')}</span>
              )}
            </div>

            {request.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{request.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
