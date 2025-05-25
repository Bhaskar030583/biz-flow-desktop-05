import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UserCheck, User, Phone, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateBill } from "@/services/billService";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface CreditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  cartItems: CartItem[];
  onPaymentComplete: () => void;
}

export const CreditPaymentModal: React.FC<CreditPaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  cartItems,
  onPaymentComplete,
}) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchCustomers();
    }
  }, [isOpen, user]);

  const fetchCustomers = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreditPayment = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }

    if (!user) return;

    setIsProcessing(true);
    try {
      // Generate bill first
      await generateBill({
        customerId: selectedCustomerId,
        totalAmount,
        paymentMethod: 'credit',
        cartItems
      });

      // Create the credit transaction
      const { error } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          customer_id: selectedCustomerId,
          amount: totalAmount,
          description: `Credit sale - ${cartItems.length} items`,
          status: 'pending'
        });

      if (error) throw error;

      const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
      
      toast.success(`Credit sale of ₹${totalAmount.toFixed(2)} recorded for ${selectedCustomer?.name} and bill generated!`);
      onPaymentComplete();
      setSelectedCustomerId("");
    } catch (error) {
      console.error("Error processing credit payment:", error);
      toast.error("Failed to process credit payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Credit Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer-select">Select Customer</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a customer for credit..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                ) : customers.length === 0 ? (
                  <SelectItem value="no-customers" disabled>No customers found</SelectItem>
                ) : (
                  customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.phone}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Customer Details */}
          {selectedCustomer && (
            <div className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Customer Details</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedCustomer.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Order Summary */}
          <div className="space-y-2">
            <h3 className="font-medium">Order Summary</h3>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x {item.quantity}</span>
                  <span>₹{item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="flex justify-between font-medium">
              <span>Total Amount:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleCreditPayment}
              disabled={!selectedCustomerId || isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? "Processing..." : "Record Credit Sale"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
