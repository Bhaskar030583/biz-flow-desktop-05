
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Package, Store, Calendar, Hash, X } from "lucide-react";

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

interface StockRequestsListProps {
  onRequestUpdated: () => void;
}

export const StockRequestsList = ({ onRequestUpdated }: StockRequestsListProps) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_requests')
        .select(`
          *,
          requesting_store:hr_stores!stock_requests_requesting_hr_store_id_fkey(store_name),
          fulfilling_store:hr_stores!stock_requests_fulfilling_hr_store_id_fkey(store_name),
          product:products(name, category)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
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
      console.error('Error fetching stock requests:', error);
      toast.error('Failed to fetch stock requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('stock_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Request cancelled successfully');
      fetchRequests();
      onRequestUpdated();
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error('Failed to cancel request');
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
        <p className="mt-2 text-gray-600">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">No stock requests found</p>
        <p className="text-sm text-gray-500">Create a request to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map(request => (
        <Card key={request.id} className="border-l-4 border-l-blue-500">
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelRequest(request.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Store className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">{request.requesting_store.store_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Store className="h-4 w-4 text-green-600" />
                  <span className="text-gray-600">To:</span>
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
