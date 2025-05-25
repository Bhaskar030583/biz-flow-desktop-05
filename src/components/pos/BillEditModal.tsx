
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Save, Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BillItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_id: string;
}

interface BillEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  billId: string;
  onBillUpdated: () => void;
}

export const BillEditModal: React.FC<BillEditModalProps> = ({
  isOpen,
  onClose,
  billId,
  onBillUpdated
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [billData, setBillData] = useState<any>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);

  useEffect(() => {
    if (isOpen && billId) {
      fetchBillData();
    }
  }, [isOpen, billId]);

  const fetchBillData = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select(`
          *,
          bill_items (
            id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', billId)
        .single();

      if (error) throw error;

      setBillData(data);
      setBillItems(data.bill_items || []);
      setPaymentMethod(data.payment_method);
      setPaymentStatus(data.payment_status);
    } catch (error) {
      console.error("Error fetching bill data:", error);
      toast.error("Failed to load bill data");
    }
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setBillItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          const newTotal = item.unit_price * newQuantity;
          return {
            ...item,
            quantity: newQuantity,
            total_price: newTotal
          };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: string) => {
    setBillItems(items => items.filter(item => item.id !== itemId));
  };

  const calculateTotalAmount = () => {
    return billItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSave = async () => {
    if (!billData) return;

    setLoading(true);
    try {
      const newTotalAmount = calculateTotalAmount();

      // Update the bill
      const { error: billError } = await supabase
        .from('bills')
        .update({
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          total_amount: newTotalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', billId);

      if (billError) throw billError;

      // Delete all existing bill items
      const { error: deleteError } = await supabase
        .from('bill_items')
        .delete()
        .eq('bill_id', billId);

      if (deleteError) throw deleteError;

      // Insert updated bill items
      if (billItems.length > 0) {
        const itemsToInsert = billItems.map(item => ({
          bill_id: billId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error: insertError } = await supabase
          .from('bill_items')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      toast.success("Bill updated successfully");
      onBillUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating bill:", error);
      toast.error("Failed to update bill");
    } finally {
      setLoading(false);
    }
  };

  if (!billData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Bill - {billData.bill_number}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bill Summary */}
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold text-lg">{billData.bill_number}</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">
              ₹{calculateTotalAmount().toFixed(2)}
            </p>
          </div>

          {/* Bill Items Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Items ({billItems.length})</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {billItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 bg-white dark:bg-gray-800"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg mb-2">{item.product_name}</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-bold text-lg min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-sm text-gray-600">
                          ₹{Number(item.unit_price).toFixed(2)} each
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-600">
                          ₹{Number(item.total_price).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {billItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No items in this bill</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment-status">Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
