
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign, User, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface AutoDebitTransaction {
  id: string;
  customer_id: string;
  amount: number;
  status: string;
  trigger_balance: number;
  razorpay_payment_id?: string;
  error_message?: string;
  created_at: string;
  customer?: { name: string; phone: string };
}

export const AutoDebitTransactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<AutoDebitTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<AutoDebitTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('auto_debit_transactions')
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
      
      setTransactions(transformedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customer?.phone?.includes(searchTerm) ||
        transaction.razorpay_payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    setFilteredTransactions(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Auto Debit Transactions</h2>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by customer name, phone, or payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No transactions found</p>
            <p className="text-sm text-gray-500 mt-2">
              Auto debit transactions will appear here when they occur
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <CardTitle className="text-lg">
                      {transaction.customer?.name || 'Unknown Customer'}
                    </CardTitle>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">₹{transaction.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Customer Phone:</span>
                    <p>{transaction.customer?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Trigger Balance:</span>
                    <p>₹{transaction.trigger_balance.toFixed(2)}</p>
                  </div>
                  {transaction.razorpay_payment_id && (
                    <div>
                      <span className="font-medium">Payment ID:</span>
                      <p className="font-mono text-xs bg-gray-100 p-1 rounded">
                        {transaction.razorpay_payment_id}
                      </p>
                    </div>
                  )}
                  {transaction.error_message && (
                    <div>
                      <span className="font-medium">Error:</span>
                      <p className="text-red-600 text-xs">{transaction.error_message}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
