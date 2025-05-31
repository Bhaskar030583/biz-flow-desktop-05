import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Phone, Mail, MapPin, Calendar, CreditCard, DollarSign } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { CustomerActions } from "./CustomerActions";

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

interface CustomerSelectorProps {
  onCustomerSelect: (customer: Customer) => void;
  selectedCustomerId?: string;
  showTitle?: boolean;
  compact?: boolean;
  refreshTrigger?: number;
  showActions?: boolean;
  onRefresh?: () => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  onCustomerSelect,
  selectedCustomerId,
  showTitle = true,
  compact = false,
  refreshTrigger = 0,
  showActions = false,
  onRefresh
}) => {
  const { user } = useAuth();
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

          const totalCredit = creditData
            ?.filter(transaction => transaction.status === 'pending')
            ?.reduce((sum, transaction) => sum + Number(transaction.amount), 0) || 0;

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

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRefreshList = () => {
    fetchCustomers();
    onRefresh?.();
  };

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
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {compact ? "Select Customer" : `Customers (${customers.length})`}
            </span>
          </CardTitle>
          
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
      )}

      <CardContent>
        <div className={compact ? "max-h-64 overflow-y-auto" : "max-h-96 overflow-y-auto"}>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{searchTerm ? "No customers found matching your search" : "No customers added yet"}</p>
              {!searchTerm && <p className="text-sm">Add your first customer to get started</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map(customer => (
                <div
                  key={customer.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedCustomerId === customer.id 
                      ? "border-blue-500 bg-blue-50 shadow-md" 
                      : "hover:shadow-md hover:border-gray-300"
                  } ${!showActions ? "cursor-pointer" : ""}`}
                  onClick={!showActions ? () => onCustomerSelect(customer) : undefined}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-lg">{customer.name}</h3>
                        {!compact && (
                          <>
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
                          </>
                        )}
                      </div>
                      {showActions && (
                        <CustomerActions 
                          customer={customer} 
                          onRefresh={handleRefreshList}
                          compact={compact}
                        />
                      )}
                    </div>

                    <div className={compact ? "text-sm text-gray-600" : "grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600"}>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{customer.phone}</span>
                      </div>
                      
                      {customer.email && !compact && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      
                      {customer.address && !compact && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <MapPin className="h-4 w-4" />
                          <span>{customer.address}</span>
                        </div>
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
