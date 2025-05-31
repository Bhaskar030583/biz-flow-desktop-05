
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface PaymentMethod {
  id: string;
  method_type: string;
  customer_id: string;
}

interface AutoDebitConfig {
  id: string;
  customer_id: string;
  payment_method_id: string;
  trigger_amount: number;
  debit_amount: number;
  is_enabled: boolean;
}

interface AutoDebitConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: AutoDebitConfig | null;
  onSuccess: () => void;
}

export const AutoDebitConfigModal: React.FC<AutoDebitConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [triggerAmount, setTriggerAmount] = useState("");
  const [debitAmount, setDebitAmount] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchCustomers();
      if (config) {
        setSelectedCustomerId(config.customer_id);
        setSelectedPaymentMethodId(config.payment_method_id);
        setTriggerAmount(config.trigger_amount.toString());
        setDebitAmount(config.debit_amount.toString());
        setIsEnabled(config.is_enabled);
      } else {
        resetForm();
      }
    }
  }, [isOpen, config, user]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchPaymentMethods(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const resetForm = () => {
    setSelectedCustomerId("");
    setSelectedPaymentMethodId("");
    setTriggerAmount("");
    setDebitAmount("");
    setIsEnabled(true);
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    }
  };

  const fetchPaymentMethods = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_payment_methods')
        .select('id, method_type, customer_id')
        .eq('customer_id', customerId)
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to fetch payment methods');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedPaymentMethodId || !triggerAmount || !debitAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const configData = {
        customer_id: selectedCustomerId,
        payment_method_id: selectedPaymentMethodId,
        trigger_amount: parseFloat(triggerAmount),
        debit_amount: parseFloat(debitAmount),
        is_enabled: isEnabled,
        user_id: user?.id,
      };

      if (config) {
        const { error } = await supabase
          .from('auto_debit_configs')
          .update(configData)
          .eq('id', config.id);

        if (error) throw error;
        toast.success('Auto debit configuration updated successfully');
      } else {
        const { error } = await supabase
          .from('auto_debit_configs')
          .insert([configData]);

        if (error) throw error;
        toast.success('Auto debit configuration created successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {config ? 'Edit' : 'Create'} Auto Debit Configuration
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <Select 
              value={selectedPaymentMethodId} 
              onValueChange={setSelectedPaymentMethodId}
              disabled={!selectedCustomerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.method_type.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomerId && paymentMethods.length === 0 && (
              <p className="text-sm text-red-600">
                No payment methods found for this customer
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trigger-amount">Trigger Amount (₹)</Label>
            <Input
              id="trigger-amount"
              type="number"
              step="0.01"
              value={triggerAmount}
              onChange={(e) => setTriggerAmount(e.target.value)}
              placeholder="Amount that triggers auto debit"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="debit-amount">Debit Amount (₹)</Label>
            <Input
              id="debit-amount"
              type="number"
              step="0.01"
              value={debitAmount}
              onChange={(e) => setDebitAmount(e.target.value)}
              placeholder="Amount to debit when triggered"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
            <Label htmlFor="is-enabled">Enable auto debit</Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : config ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
