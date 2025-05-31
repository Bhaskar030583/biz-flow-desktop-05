
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

      // Get all HR stores - for incoming requests, we need to find requests 
      // where the fulfilling store could be any store (since we're showing all incoming)
      const { data: allStores, error: storesError } = await supabase
        .from('hr_stores')
        .select('id');

      if (storesError) {
        console.error('❌ [IncomingRequestsList] Error fetching stores:', storesError);
        throw storesError;
      }

      const storeIds = allStores?.map(store => store.id) || [];

      if (storeIds.length === 0) {
        console.log('⚠️ [IncomingRequestsList] No HR stores found');
        setRequests([]);
        setLoading(false);
        return;
      }

      // Get requests where the current user could potentially fulfill them
      // This shows all requests to HR stores (the user can decide which ones they can fulfill)
      const { data, error } = await supabase
        .from('stock_requests')
        .select(`
          *,
          requesting_store:hr_stores!stock_requests_requesting_hr_store_id_fkey(store_name),
          fulfilling_store:hr_stores!stock_requests_fulfilling_hr_store_id_fkey(store_name),
          product:products(name, category)
        `)
        .in('fulfilling_hr_store_id', storeIds)
        .neq('user_id', user?.id) // Don't show user's own requests
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

      // First check if handle_stock_movement function exists, if not, just update status
      const { error } = await supabase.rpc('handle_stock_movement', {
        request_id: requestId,
        approving_user_id: user?.id
      });

      if (error) {
        // If function doesn't exist, just update the status
        console.log('⚠️ [IncomingRequestsList] Stock movement function not available, updating status only');
        
        const { error: updateError } = await supabase
          .from('stock_requests')
          .update({ 
            status: 'approved',
            response_date: new Date().toISOString()
          })
          .eq('id', requestId);

        if (updateError) {
          throw updateError;
        }

        toast.success('Request approved (manual stock transfer required)');
      } else {
        toast.success('Request approved and stock transferred successfully');
      }

      console.log('✅ [IncomingRequestsList] Request approved successfully');
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
        <p className="text-sm text-gray-500">Requests from other users will appear here</p>
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
