
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  Search, 
  Calendar,
  User,
  CreditCard,
  Eye,
  Download
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Bill {
  id: string;
  bill_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  bill_date: string;
  customer: {
    name: string;
  } | null;
}

export const BillHistory: React.FC = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchBills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          id,
          bill_number,
          total_amount,
          payment_method,
          payment_status,
          bill_date,
          customers (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('bill_date', { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to load bill history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [user]);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'credit': return '📋';
      default: return '💰';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBills = bills.filter(bill =>
    bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bill.customer?.name && bill.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading bill history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Bill History ({bills.length})
        </CardTitle>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by bill number or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          {filteredBills.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchTerm ? "No bills found matching your search" : "No bills generated yet"}</p>
              <p className="text-sm">Bills will appear here after completing sales</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBills.map(bill => (
                <div
                  key={bill.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-lg">{bill.bill_number}</h3>
                        <Badge className={getStatusColor(bill.payment_status)}>
                          {bill.payment_status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(bill.bill_date), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                        
                        {bill.customer && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{bill.customer.name}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span>{getPaymentMethodIcon(bill.payment_method)}</span>
                          <span className="capitalize">{bill.payment_method}</span>
                        </div>

                        <div className="flex items-center gap-2 font-semibold text-green-600">
                          <span>₹{Number(bill.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        title="View bill details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        title="Download bill"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
