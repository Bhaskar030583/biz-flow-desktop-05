
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
  requesting_store_id: string;
  fulfilling_store_id: string;
  product_id: string;
  requested_quantity: number;
  status: string;
  request_date: string;
  response_date?: string;
  notes?: string;
  requesting_store: { name: string };
  fulfilling_store: { name: string };
  product: { name: string; category: string };
}

interface IncomingRequestsListProps {
  onRequestUpdated: () => void;
}

export const IncomingRequestsList = ({ onRequestUpdated }: IncomingRequestsListProps) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      fetchIncomingRequests();
    }
  }, [user]);

  const fetchIncomingRequests = async () => {
    try {
      // Get all requests where user owns the fulfilling store
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', user?.id);

      if (shopError) throw shopError;

      const shopIds = shopData.map(shop => shop.id);

      if (shopIds.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('stock_requests')
        .select(`
          *,
          requesting_store:shops!stock_requests_requesting_store_id_fkey(name),
          fulfilling_store:shops!stock_requests_fulfilling_store_id_fkey(name),
          product:products(name, category)
        `)
        .in('fulfilling_store_id', shopIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching incoming requests:', error);
      toast.error('Failed to fetch incoming requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequests(prev => ({ ...prev, [requestId]: true }));

    try {
      // Call the database function to handle stock movement
      const { data, error } = await supabase.rpc('handle_stock_movement', {
        request_id: requestId,
        approving_user_id: user?.id
      });

      if (error) throw error;

      toast.success('Request approved and stock transferred successfully');
      fetchIncomingRequests();
      onRequestUpdated();
    } catch (error: any) {
      console.error('Error approving request:', error);
      if (error.message.includes('Insufficient stock')) {
        toast.error('Insufficient stock available in the fulfilling store');
      } else {
        toast.error('Failed to approve request');
      }
    } finally {
      setProcessingRequests(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequests(prev => ({ ...prev, [requestId]: true }));

    try {
      const { error } = await supabase
        .from('stock_requests')
        .update({ 
          status: 'rejected',
          response_date: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request rejected successfully');
      fetchIncomingRequests();
      onRequestUpdated();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessingRequests(prev => ({ ...prev, [requestId]: false }));
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

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No incoming requests found</p>
        <p className="text-sm text-gray-500">Requests from other stores will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <Card key={request.id} className="border-l-4 border-l-green-500">
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
                    disabled={processingRequests[request.id]}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={processingRequests[request.id]}
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
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">{request.requesting_store.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Store className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium">{request.fulfilling_store.name}</span>
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
