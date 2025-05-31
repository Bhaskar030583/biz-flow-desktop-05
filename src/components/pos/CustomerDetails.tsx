
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  MapPin, 
  IndianRupee,
  CreditCard,
  Plus,
  ChevronRight,
  Receipt,
  FileText,
  BookOpen
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  credit_limit: number;
  created_at: string;
}

interface Bill {
  id: string;
  bill_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  bill_date: string;
}

interface CreditTransaction {
  id: string;
  amount: number;
  description: string;
  status: string;
  transaction_date: string;
  created_at: string;
}

interface CustomerDetailsProps {
  customerId: string;
  onBack: () => void;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customerId, onBack }) => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (customerId && user) {
      fetchCustomerDetails();
    }
  }, [customerId, user]);

  const fetchCustomerDetails = async () => {
    try {
      setIsLoading(true);

      // Fetch customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('user_id', user!.id)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch customer bills
      const { data: billsData, error: billsError } = await supabase
        .from('bills')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', user!.id)
        .order('bill_date', { ascending: false });

      if (billsError) throw billsError;
      setBills(billsData || []);

      // Calculate total sales
      const sales = (billsData || []).reduce((sum, bill) => sum + Number(bill.total_amount), 0);
      setTotalSales(sales);

      // Fetch credit transactions
      const { data: creditData, error: creditError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('user_id', user!.id)
        .order('transaction_date', { ascending: false });

      if (creditError) throw creditError;
      setCreditTransactions(creditData || []);

      // Calculate total pending credit
      const pendingCredit = (creditData || [])
        .filter(transaction => transaction.status === 'pending')
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
      setTotalCredit(pendingCredit);

    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to load customer details");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading customer details...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center">Customer not found</div>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Customer Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-blue-600 uppercase">{customer.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Phone Number</p>
                <p className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {customer.phone}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">GST No</p>
                <p className="font-medium">--</p>
              </div>
            </div>

            {customer.address && (
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {customer.address}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales and Credit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-blue-600 flex items-center">
                <IndianRupee className="h-5 w-5" />
                {totalSales.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Credit Amount</p>
              <p className="text-2xl font-bold text-red-600 flex items-center">
                <IndianRupee className="h-5 w-5" />
                {totalCredit.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" className="h-12 text-blue-600 border-blue-600 hover:bg-blue-50">
          <Plus className="h-4 w-4 mr-2" />
          Add Credit
        </Button>
        <Button variant="outline" className="h-12 text-green-600 border-green-600 hover:bg-green-50">
          <Plus className="h-4 w-4 mr-2" />
          Receive Credit
        </Button>
      </div>

      {/* Navigation Cards */}
      <div className="space-y-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Bills</span>
                <Badge variant="secondary">{bills.length}</Badge>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Credit Details</span>
                <Badge variant="secondary">{creditTransactions.length}</Badge>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Ledger</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bills Preview */}
      {bills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bills.slice(0, 3).map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{bill.bill_number}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(bill.bill_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{Number(bill.total_amount).toFixed(2)}</p>
                    <Badge 
                      variant={bill.payment_status === 'completed' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {bill.payment_status}
                    </Badge>
                  </div>
                </div>
              ))}
              {bills.length > 3 && (
                <Button variant="outline" className="w-full">
                  View All Bills ({bills.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Credit Transactions Preview */}
      {creditTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Credit Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creditTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{Number(transaction.amount).toFixed(2)}</p>
                    <Badge 
                      variant={transaction.status === 'pending' ? 'destructive' : 'default'}
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {creditTransactions.length > 3 && (
                <Button variant="outline" className="w-full">
                  View All Transactions ({creditTransactions.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
