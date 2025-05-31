
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Edit, 
  Trash2,
  Calendar,
  CreditCard,
  DollarSign
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
  created_at: string;
  credit_limit: number;
  total_credit?: number;
  available_credit?: number;
}

interface CustomerListProps {
  refreshTrigger: number;
}

export const CustomerList: React.FC<CustomerListProps> = ({ refreshTrigger }) => {
  const { user, userRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = async () => {
    if (!user) return;

    try {
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Fetch credit totals for each customer
      const customersWithCredit = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { data: creditData, error: creditError } = await supabase
            .from('credit_transactions')
            .select('amount, status')
            .eq('customer_id', customer.id)
            .eq('user_id', user.id);

          if (creditError) {
            console.error("Error fetching credit data:", creditError);
            return { 
              ...customer, 
              total_credit: 0,
              available_credit: customer.credit_limit || 0
            };
          }

          // Calculate total pending credit amount
          const totalCredit = creditData
            ?.filter(transaction => transaction.status === 'pending')
            ?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;

          // Calculate available credit
          const availableCredit = Math.max(0, (customer.credit_limit || 0) - totalCredit);

          return { 
            ...customer, 
            total_credit: totalCredit,
            available_credit: availableCredit
          };
        })
      );

      setCustomers(customersWithCredit);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user, refreshTrigger]);

  const handleDeleteCustomer = async (customerId: string) => {
    if (userRole !== "admin") {
      toast.error("Only administrators can delete customers");
      return;
    }

    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading customers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customers ({customers.length})
          </span>
        </CardTitle>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search customers by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchTerm ? "No customers found matching your search" : "No customers added yet"}</p>
              <p className="text-sm">Add your first customer to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-lg">{customer.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(customer.created_at), 'MMM dd')}
                        </Badge>
                        {customer.total_credit && customer.total_credit > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <CreditCard className="h-3 w-3 mr-1" />
                            ₹{customer.total_credit.toFixed(2)} Credit
                          </Badge>
                        )}
                        {customer.credit_limit && customer.credit_limit > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Limit: ₹{customer.credit_limit.toFixed(2)}
                          </Badge>
                        )}
                        {customer.credit_limit && customer.credit_limit > 0 && (
                          <Badge 
                            variant={customer.available_credit && customer.available_credit > 0 ? "default" : "outline"} 
                            className="text-xs"
                          >
                            Available: ₹{customer.available_credit?.toFixed(2) || '0.00'}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{customer.phone}</span>
                        </div>
                        
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        
                        {customer.address && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <MapPin className="h-4 w-4" />
                            <span>{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        title="Edit customer"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {userRole === "admin" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteCustomer(customer.id)}
                          title="Delete customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
